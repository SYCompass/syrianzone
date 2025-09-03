import { db } from "@/db";
import { candidates, dailyRanks, dailyScores, polls } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";

export const runtime = "nodejs";

export async function GET() {
  const allPolls = await db.select().from(polls).where(eq(polls.isActive, true));
  for (const p of allPolls) {
    const yesterdayUTC = new Date(getLocalMidnightUTC(p.timezone).getTime() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
      .from(dailyScores)
      .where(and(eq(dailyScores.pollId, p.id), eq(dailyScores.day, yesterdayUTC)))
      .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
    let rank = 1;
    for (const r of rows) {
      await db
        .insert(dailyRanks)
        .values({ pollId: p.id, candidateId: r.candidateId, day: yesterdayUTC, rank, votes: r.votes, score: r.score })
        .onConflictDoUpdate({
          target: [dailyRanks.pollId, dailyRanks.candidateId, dailyRanks.day],
          set: { rank, votes: r.votes, score: r.score },
        });
      rank += 1;
    }
  }
  return Response.json({ ok: true });
}



