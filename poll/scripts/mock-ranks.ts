import { db } from "@/db";
import { candidates, dailyRanks, dailyScores, polls } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";

async function main() {
  const slug = process.argv[2] || "jolani";
  const [p] = await db.select().from(polls).where(eq(polls.slug, slug));
  if (!p) throw new Error("Poll not found: " + slug);

  const today = getLocalMidnightUTC(p.timezone);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id)).orderBy(candidates.sort);

  // Use all-time totals as a base order
  const rows = await db
    .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
    .from(dailyScores)
    .where(eq(dailyScores.pollId, p.id));
  const totals = new Map<string, { votes: number; score: number }>();
  for (const r of rows) {
    const cur = totals.get(r.candidateId) || { votes: 0, score: 0 };
    totals.set(r.candidateId, { votes: cur.votes + r.votes, score: cur.score + r.score });
  }
  const ordered = [...cands].sort((a, b) => (totals.get(b.id)?.score || 0) - (totals.get(a.id)?.score || 0));

  // Yesterday ranks = base order
  const yRanks = ordered.map((c, i) => ({ pollId: p.id, candidateId: c.id, day: yesterday, rank: i + 1, votes: totals.get(c.id)?.votes || 0, score: totals.get(c.id)?.score || 0 }));

  // Today: simulate a swap between #2 and #3 if possible to create a change
  const tOrder = [...ordered];
  if (tOrder.length >= 3) {
    const tmp = tOrder[1];
    tOrder[1] = tOrder[2];
    tOrder[2] = tmp;
  }
  const tRanks = tOrder.map((c, i) => ({ pollId: p.id, candidateId: c.id, day: today, rank: i + 1, votes: totals.get(c.id)?.votes || 0, score: totals.get(c.id)?.score || 0 }));

  // Clear any existing snapshots for the two days
  await db.delete(dailyRanks).where(and(eq(dailyRanks.pollId, p.id), eq(dailyRanks.day, yesterday)));
  await db.delete(dailyRanks).where(and(eq(dailyRanks.pollId, p.id), eq(dailyRanks.day, today)));

  await db.insert(dailyRanks).values(yRanks);
  await db.insert(dailyRanks).values(tRanks);

  console.log(`Mocked daily_ranks for ${slug} on ${yesterday.toISOString().slice(0, 10)} and ${today.toISOString().slice(0, 10)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


