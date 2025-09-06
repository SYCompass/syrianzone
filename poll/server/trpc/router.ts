import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { db } from "@/db";
import { ballots, ballotItems, candidates, dailyScores, polls } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";
import { verifyTurnstile } from "@/lib/turnstile";
import { sha256 } from "@/lib/hash";
import { v4 as uuidv4 } from "uuid";
import { publish } from "@/server/realtime/broker";

export type Context = {
  ip: string | undefined;
  userAgent: string | undefined;
};

export const createContext = async (opts: { headers: Headers }): Promise<Context> => {
  const ip = opts.headers.get("x-forwarded-for")?.split(",")[0] || undefined;
  const userAgent = opts.headers.get("user-agent") || undefined;
  return { ip, userAgent };
};

const t = initTRPC.context<Context>().create();

const TierItem = z.object({ candidateId: z.string(), pos: z.number().int().nonnegative() });
const Tiers = z.object({ S: z.array(TierItem), A: z.array(TierItem), B: z.array(TierItem), C: z.array(TierItem), D: z.array(TierItem), F: z.array(TierItem) });

export const appRouter = t.router({
  poll: t.router({
    getToday: t.procedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const [poll] = await db.select().from(polls).where(eq(polls.slug, input.slug));
      if (!poll) throw new Error("Poll not found");
      const today = getLocalMidnightUTC(poll.timezone);
      const cand = await db.select().from(candidates).where(eq(candidates.pollId, poll.id)).orderBy(candidates.sort);
      const scores = await db
        .select()
        .from(dailyScores)
        .where(and(eq(dailyScores.pollId, poll.id), eq(dailyScores.day, today)));
      return { poll, candidates: cand, todayScores: scores, voteDay: today };
    }),
  }),
  ballot: t.router({
    submit: t.procedure
      .input(
        z.object({
          pollSlug: z.string(),
          tiers: Tiers,
          cfToken: z.string(),
          deviceId: z.string().min(8),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const [poll] = await db.select().from(polls).where(eq(polls.slug, input.pollSlug));
        if (!poll) throw new Error("Poll not found");

        const ok = await verifyTurnstile(input.cfToken, ctx.ip);
        if (!ok) throw new Error("Turnstile failed");
        // TODO: Add server-side rate limiting and per-device/IP daily caps

        // Enforce minimum selections
        const totalAssigned = (Object.keys(input.tiers) as Array<keyof typeof input.tiers>).reduce(
          (acc, key) => acc + input.tiers[key].length,
          0
        );
        if (totalAssigned < 3) {
          throw new Error("Minimum selection is 3");
        }

        const voteDay = getLocalMidnightUTC(poll.timezone);
        const voterKey = sha256(input.deviceId);
        const ipHash = ctx.ip ? sha256(ctx.ip) : undefined;
        const userAgent = ctx.userAgent;

        const ballotId = uuidv4();

        await db.insert(ballots).values({ id: ballotId, pollId: poll.id, voteDay, voterKey, ipHash, userAgent });

        // New hybrid scoring algorithm: tier minimums + tier-weighted position bonuses
        const tierMinimums: Record<string, number> = { S: 50, A: 40, B: 30, C: 20, D: 10, F: 0 };
        const tierPositionBonuses: Record<string, number[]> = {
          S: [5, 3, 1, 0, 0, 0, 0, 0, 0, 0], // 1st=+5, 2nd=+3, 3rd=+1, 4th+=+0
          A: [4, 2, 1, 0, 0, 0, 0, 0, 0, 0], // 1st=+4, 2nd=+2, 3rd=+1, 4th+=+0
          B: [3, 2, 1, 0, 0, 0, 0, 0, 0, 0], // 1st=+3, 2nd=+2, 3rd=+1, 4th+=+0
          C: [2, 1, 0, 0, 0, 0, 0, 0, 0, 0], // 1st=+2, 2nd=+1, 3rd=+0, 4th+=+0
          D: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1st=+1, 2nd=+0, 3rd=+0, 4th+=+0
          F: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // all positions = +0
        };

        const itemsToInsert: { id: string; ballotId: string; candidateId: string; tier: string; position: number }[] = [];
        const scoreDelta = new Map<string, { votes: number; score: number }>();

        for (const tierKey of ["S", "A", "B", "C", "D", "F"] as const) {
          const arr = input.tiers[tierKey];
          arr.forEach(({ candidateId, pos }, index) => {
            itemsToInsert.push({ id: uuidv4(), ballotId, candidateId, tier: tierKey, position: index });
            const positionBonus = tierPositionBonuses[tierKey][index] || 0;
            const delta = tierMinimums[tierKey] + positionBonus;
            const prev = scoreDelta.get(candidateId) || { votes: 0, score: 0 };
            scoreDelta.set(candidateId, { votes: prev.votes + 1, score: prev.score + delta });
          });
        }

        if (itemsToInsert.length) await db.insert(ballotItems).values(itemsToInsert);

        for (const [candidateId, delta] of scoreDelta.entries()) {
          await db
            .insert(dailyScores)
            .values({ pollId: poll.id, candidateId, day: voteDay, votes: delta.votes, score: delta.score })
            .onConflictDoUpdate({
              target: [dailyScores.pollId, dailyScores.candidateId, dailyScores.day],
              set: {
                votes: sql`${dailyScores.votes} + ${delta.votes}`,
                score: sql`${dailyScores.score} + ${delta.score}`,
                updatedAt: new Date(),
              },
            });
        }

        const channel = `poll:${poll.id}:${voteDay.toISOString()}`;
        publish(channel, { type: "ballot", deltas: Array.from(scoreDelta.entries()) });

        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;


