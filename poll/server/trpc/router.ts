import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { db } from "@/db";
import { ballots, ballotItems, candidates, dailyScores, dailyRanks, polls } from "@/db/schema";
import { and, eq, sql, desc, asc } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";
import { verifyTurnstile } from "@/lib/turnstile";
import { sha256 } from "@/lib/hash";
import { v4 as uuidv4 } from "uuid";
import { publish } from "@/server/realtime/broker";
import { TwitterApi } from "twitter-api-v2";
import { getReadWriteClient } from "@/lib/xAuth";
import { Redis } from "@upstash/redis";

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

        // Rate limiting enforced at route layer via Arcjet

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

        const isGovPoll = poll.slug === "best-ministers";

        // 1) Snapshot current GENERAL leaderboard (all-time aggregated, ministers-only) BEFORE this vote
        if (isGovPoll) {
          type Agg = { candidateId: string; votes: number; score: number };
          const beforeAgg: Agg[] = (await db
            .select({
              candidateId: dailyScores.candidateId,
              votes: sql<number>`sum(${dailyScores.votes})`,
              score: sql<number>`sum(${dailyScores.score})`,
            })
            .from(dailyScores)
            .innerJoin(candidates, eq(candidates.id, dailyScores.candidateId))
            .where(and(eq(dailyScores.pollId, poll.id), sql`${candidates.category} <> 'governor'`))
            .groupBy(dailyScores.candidateId)) as any;
          const beforeSorted = [...beforeAgg].sort((a, b) => {
            const aAvg = a.votes > 0 ? a.score / a.votes : 0;
            const bAvg = b.votes > 0 ? b.score / b.votes : 0;
            return (bAvg - aAvg) || (b.score - a.score) || (b.votes - a.votes) || a.candidateId.localeCompare(b.candidateId);
          });
          for (let i = 0; i < beforeSorted.length; i++) {
            const r = beforeSorted[i];
            await db
              .insert(dailyRanks)
              .values({ pollId: poll.id, candidateId: r.candidateId, day: voteDay, rank: i + 1, votes: r.votes, score: r.score })
              .onConflictDoUpdate({ target: [dailyRanks.pollId, dailyRanks.candidateId, dailyRanks.day], set: { rank: i + 1, votes: r.votes, score: r.score } });
          }
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

        // 3-4) After updates, compare current GENERAL leaderboard vs the snapshot, tweet if changed, then persist new snapshot
        if (isGovPoll) {
          type Agg = { candidateId: string; votes: number; score: number };
          const currAgg: Agg[] = (await db
            .select({
              candidateId: dailyScores.candidateId,
              votes: sql<number>`sum(${dailyScores.votes})`,
              score: sql<number>`sum(${dailyScores.score})`,
            })
            .from(dailyScores)
            .innerJoin(candidates, eq(candidates.id, dailyScores.candidateId))
            .where(and(eq(dailyScores.pollId, poll.id), sql`${candidates.category} <> 'governor'`))
            .groupBy(dailyScores.candidateId)) as any;
          const currSorted = [...currAgg].sort((a, b) => {
            const aAvg = a.votes > 0 ? a.score / a.votes : 0;
            const bAvg = b.votes > 0 ? b.score / b.votes : 0;
            return (bAvg - aAvg) || (b.score - a.score) || (b.votes - a.votes) || a.candidateId.localeCompare(b.candidateId);
          });
          const currRanksMap = new Map<string, number>();
          currSorted.forEach((r, i) => currRanksMap.set(r.candidateId, i + 1));

          // Previous snapshot: last persisted aggregated leaderboard for today
          const prevSnap = await db
            .select({ candidateId: dailyRanks.candidateId, rank: dailyRanks.rank })
            .from(dailyRanks)
            .where(and(eq(dailyRanks.pollId, poll.id), eq(dailyRanks.day, voteDay)));
          const prevRanksMap = new Map<string, number>(prevSnap.map((r) => [r.candidateId, r.rank] as const));

          const changed: Array<{ id: string; from: number; to: number }> = [];
          for (const [id, to] of currRanksMap.entries()) {
            const from = prevRanksMap.get(id);
            if (typeof from === "number" && from !== to) changed.push({ id, from, to });
          }

          if (changed.length) {
            // Coalesce to a single message: pick the largest absolute delta within top N
            const TOP_N = 10;
            const filtered = changed.filter((c) => (currRanksMap.get(c.id) || 999) <= TOP_N);
            const pick = (filtered.length ? filtered : changed).sort((a, b) => Math.abs((b.from - b.to)) - Math.abs((a.from - a.to)))[0];
            try {
              const oauth2Refresh = process.env.TWITTER_OAUTH2_REFRESH_TOKEN;
              const clientId = process.env.TWITTER_CLIENT_ID;
              const clientSecret = process.env.TWITTER_CLIENT_SECRET;
              const tweetDry = (process.env.TWITTER_DRY || "").toLowerCase() === "true" || process.env.TWITTER_DRY === "1";
              let tw: any | null = null;
              try { tw = await getReadWriteClient(); } catch (e: any) { console.error("[tweet] client init failed:", e?.message || e); }
              if (!tw) console.warn("[tweet] missing client (no refresh token stored); visit /api/x/init to authorize.");

              // Simple global rate-limit: max 1 tweet per 90s
              const redis = Redis.fromEnv();
              const lockKey = `tweet:lock:${poll.id}`;
              const locked = await redis.set(lockKey, "1", { nx: true, ex: 90 });
              if (!locked) {
                console.log("[tweet:skip] rate-limited (lock held)");
                return;
              }
              // Aggregated view is the source of truth; use 'pick' as-is
              const ch = pick;
              const [c] = await db.select().from(candidates).where(eq(candidates.id, ch.id));
                const name = (c?.name as string) || "مرشح";
                const arrow = ch.to < ch.from ? "⬆️" : "⬇️";
                const change = Math.abs(ch.from - ch.to);
                const dir = ch.to < ch.from ? "تقدّم" : "تراجع";
                const suffix = change > 1 ? `(${change} مراتب)` : "مرتبة واحدة";
                const dayStr = voteDay.toISOString().slice(0, 10);
                const text = `تحديث التصنيف (${dayStr})\n${name} ${arrow} ${dir} من #${ch.from} إلى #${ch.to} ${suffix}\n\nتابع الترتيب الكامل: syrian.zone/tierlist/leaderboard`;
                if (tweetDry || !tw) {
                  console.log("[tweet:dry]", text);
                } else {
                  try { await tw.v2.tweet(text); console.log("[tweet:sent]", name, ch.from, "->", ch.to); }
                  catch (e: any) {
                    console.error("[tweet:error]", e?.data || e?.message || e);
                    // If rate-limited, extend lock a bit to avoid hammering
                    try { await Redis.fromEnv().expire(lockKey, 180); } catch {}
                  }
                }
              // Persist NEW snapshot for next comparisons (aggregated)
              for (let i = 0; i < currSorted.length; i++) {
                const r = currSorted[i];
                await db
                  .insert(dailyRanks)
                  .values({ pollId: poll.id, candidateId: r.candidateId, day: voteDay, rank: i + 1, votes: r.votes, score: r.score })
                  .onConflictDoUpdate({ target: [dailyRanks.pollId, dailyRanks.candidateId, dailyRanks.day], set: { rank: i + 1, votes: r.votes, score: r.score } });
              }
            } catch (e: any) {
              console.error("[tweet] unexpected error:", e?.message || e);
            }
          }
        }

        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;



