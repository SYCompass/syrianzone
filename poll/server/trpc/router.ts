import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { db } from "@/db";
import { ballots, ballotItems, candidates, dailyScores, polls } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";
import { verifyTurnstile } from "@/lib/turnstile";
import { sha256 } from "@/lib/hash";
import { v4 as uuidv4 } from "uuid";
import { publish } from "@/server/realtime/broker";
import { TwitterApi } from "twitter-api-v2";

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

        let prevRanks: Array<{ candidateId: string; votes: number; score: number }> | null = null;
        const isGovPoll = poll.slug === "best-ministers";
        if (isGovPoll) {
          prevRanks = await db
            .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
            .from(dailyScores)
            .where(and(eq(dailyScores.pollId, poll.id), eq(dailyScores.day, voteDay)))
            .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
        }

        await db.insert(ballots).values({ id: ballotId, pollId: poll.id, voteDay, voterKey, ipHash, userAgent });

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

        // After updating scores, compute current ranks and tweet changes in real time (for gov poll only)
        if (isGovPoll && prevRanks) {
          const curr = await db
            .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
            .from(dailyScores)
            .where(and(eq(dailyScores.pollId, poll.id), eq(dailyScores.day, voteDay)))
            .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
          const prevRankById = new Map<string, number>();
          prevRanks.forEach((r, i) => prevRankById.set(r.candidateId, i + 1));
          const currRankById = new Map<string, number>();
          curr.forEach((r, i) => currRankById.set(r.candidateId, i + 1));

          const changed: Array<{ id: string; from: number; to: number; overName?: string; belowName?: string }> = [];
          for (const [id, to] of currRankById.entries()) {
            const from = prevRankById.get(id);
            if (typeof from === "number" && from !== to) {
              let overName: string | undefined;
              let belowName: string | undefined;
              if (to < from) {
                const below = curr[to];
                if (below && below.candidateId !== id) {
                  const [cBelow] = await db.select().from(candidates).where(eq(candidates.id, below.candidateId));
                  overName = cBelow?.name as string | undefined;
                }
              } else if (to > from) {
                const above = curr[to - 2]; // array is 0-based
                if (above && above.candidateId !== id) {
                  const [cAbove] = await db.select().from(candidates).where(eq(candidates.id, above.candidateId));
                  belowName = cAbove?.name as string | undefined;
                }
              }
              changed.push({ id, from, to, overName, belowName });
            }
          }

          if (changed.length) {
            try {
              const oauth2Refresh = process.env.TWITTER_OAUTH2_REFRESH_TOKEN;
              const clientId = process.env.TWITTER_CLIENT_ID;
              const clientSecret = process.env.TWITTER_CLIENT_SECRET;
              let tw: any | null = null;
              if (oauth2Refresh && clientId && clientSecret) {
                const oauth2Client = new TwitterApi({ clientId, clientSecret });
                const { client } = await oauth2Client.refreshOAuth2Token(oauth2Refresh);
                tw = client;
              }
              if (tw) {
                for (const ch of changed) {
                  const [c] = await db.select().from(candidates).where(eq(candidates.id, ch.id));
                  const name = (c?.name as string) || "مرشح";
                  const arrow = ch.to < ch.from ? "⬆️" : "⬇️";
                  const change = Math.abs(ch.from - ch.to);
                  const dir = ch.to < ch.from ? "تقدّم" : "تراجع";
                  const suffix = change > 1 ? `(${change} مراتب)` : "مرتبة واحدة";
                  const over = ch.overName && ch.to < ch.from ? `؛ تجاوز ${ch.overName}` : "";
                  const fell = ch.belowName && ch.to > ch.from ? `؛ تراجع لصالح ${ch.belowName}` : "";
                  const dayStr = voteDay.toISOString().slice(0, 10);
                  const text = `تحديث التصنيف (${dayStr})\n${arrow} ${name} ${dir} من #${ch.from} إلى #${ch.to} ${suffix}${over || fell}\n\nتابع الترتيب الكامل: syrian.zone/tierlist/leaderboard`;
                  try {
                    await tw.v2.tweet(text);
                  } catch { }
                }
              }
            } catch { }
          }
        }

        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;


