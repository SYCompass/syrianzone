import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { db } from "@/db";
import { polls, candidates, dailyScores, dailyRanks } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { getLocalMidnightUTC, getMonthStartUTC } from "@/lib/time";

export const runtime = "nodejs";

async function fetchToday() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) return [] as Array<{ candidateId: string; name: string; imageUrl?: string; votes: number; score: number; rank: number }>;
  const day = getLocalMidnightUTC(p.timezone);
  const rows = await db
    .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
    .from(dailyScores)
    .where(eq(dailyScores.pollId, p.id) as any && eq(dailyScores.day, day) as any)
    .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
  return rows.map((r, idx) => {
    const c = cands.find((cc) => cc.id === r.candidateId)!;
    return { candidateId: r.candidateId, name: c.name, imageUrl: c.imageUrl || undefined, votes: r.votes, score: r.score, rank: idx + 1 };
  });
}

async function fetchMonthExtremes() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) return { best: [], worst: [] } as { best: any[]; worst: any[] };
  const start = getMonthStartUTC(p.timezone);
  const today = getLocalMidnightUTC(p.timezone);
  const rows = await db
    .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score, day: dailyScores.day })
    .from(dailyScores)
    .where(and(eq(dailyScores.pollId, p.id), gte(dailyScores.day, start)))
    .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
  const agg = new Map<string, { votes: number; score: number }>();
  for (const r of rows) {
    const cur = agg.get(r.candidateId) || { votes: 0, score: 0 };
    agg.set(r.candidateId, { votes: cur.votes + r.votes, score: cur.score + r.score });
  }
  const totals = Array.from(agg.entries()).map(([candidateId, v]) => ({ candidateId, ...v }));
  totals.sort((a, b) => (b.score - a.score) || (b.votes - a.votes));
  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
  const best = totals.slice(0, 3).map((t, i) => ({
    candidateId: t.candidateId,
    name: cands.find(c => c.id === t.candidateId)?.name || "",
    imageUrl: cands.find(c => c.id === t.candidateId)?.imageUrl || undefined,
    score: t.score,
    votes: t.votes,
    rank: i + 1,
  }));
  const worst = totals.slice(-3).reverse().map((t, i) => ({
    candidateId: t.candidateId,
    name: cands.find(c => c.id === t.candidateId)?.name || "",
    imageUrl: cands.find(c => c.id === t.candidateId)?.imageUrl || undefined,
    score: t.score,
    votes: t.votes,
    rank: i + 1,
  }));
  return { best, worst };
}

async function fetchAllTimeExtremes() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) return { best: [], worst: [] } as { best: any[]; worst: any[] };
  const rows = await db
    .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
    .from(dailyScores)
    .where(eq(dailyScores.pollId, p.id))
    .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
  const agg = new Map<string, { votes: number; score: number }>();
  for (const r of rows) {
    const cur = agg.get(r.candidateId) || { votes: 0, score: 0 };
    agg.set(r.candidateId, { votes: cur.votes + r.votes, score: cur.score + r.score });
  }
  const totals = Array.from(agg.entries()).map(([candidateId, v]) => ({ candidateId, ...v }));
  totals.sort((a, b) => (b.score - a.score) || (b.votes - a.votes));
  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
  const best = totals.slice(0, 3).map((t, i) => ({
    candidateId: t.candidateId,
    name: cands.find(c => c.id === t.candidateId)?.name || "",
    imageUrl: cands.find(c => c.id === t.candidateId)?.imageUrl || undefined,
    score: t.score,
    votes: t.votes,
    rank: i + 1,
  }));
  const worst = totals.slice(-3).reverse().map((t, i) => ({
    candidateId: t.candidateId,
    name: cands.find(c => c.id === t.candidateId)?.name || "",
    imageUrl: cands.find(c => c.id === t.candidateId)?.imageUrl || undefined,
    score: t.score,
    votes: t.votes,
    rank: i + 1,
  }));
  return { best, worst };
}

export default async function Page() {
  const rows = await fetchToday();
  const month = await fetchMonthExtremes();
  const allTime = await fetchAllTimeExtremes();
  return (
    <main className="container mx-auto px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold mb-4 text-center">لوحة المتصدرين</h1>
      {/* Top 3 of the day */}
      <div className="max-w-screen-md mx-auto mb-6">
        <h2 className="font-semibold mb-2">أفضل 3 اليوم</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rows.slice(0, 3).map((r) => (
            <Card key={r.candidateId}><CardContent className="py-3 flex items-center gap-3"><Avatar src={r.imageUrl || ""} alt={r.name} size={36} /><div><div className="font-medium text-sm">{r.name}</div></div></CardContent></Card>
          ))}
        </div>
      </div>
      <div className="max-w-screen-md mx-auto">
        {/* Daily leaderboard */}
        <h2 className="font-semibold mb-2">ترتيب اليوم</h2>
        <Card>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r) => (
                  <Tr key={r.candidateId}>
                    <Td>#{r.rank}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={r.imageUrl || ""} alt={r.name} size={28} />
                        <span className="text-sm">{r.name}</span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {/* Month extremes */}
      <div className="max-w-screen-md mx-auto mt-8">
        <h2 className="font-semibold mb-2">أفضل الشهر / أسوأ الشهر</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card><CardContent>{month.best.map((r) => (<div key={r.candidateId} className="flex items-center gap-2 py-2"><Avatar src={r.imageUrl || ""} alt={r.name} size={28} /><div className="text-sm">{r.name}</div></div>))}</CardContent></Card>
          <Card><CardContent>{month.worst.map((r) => (<div key={r.candidateId} className="flex items-center gap-2 py-2"><Avatar src={r.imageUrl || ""} alt={r.name} size={28} /><div className="text-sm">{r.name}</div></div>))}</CardContent></Card>
        </div>
      </div>
      {/* All time extremes */}
      <div className="max-w-screen-md mx-auto mt-8">
        <h2 className="font-semibold mb-2">أفضل كل الأوقات / أسوأ كل الأوقات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card><CardContent>{allTime.best.map((r) => (<div key={r.candidateId} className="flex items-center gap-2 py-2"><Avatar src={r.imageUrl || ""} alt={r.name} size={28} /><div className="text-sm">{r.name}</div></div>))}</CardContent></Card>
          <Card><CardContent>{allTime.worst.map((r) => (<div key={r.candidateId} className="flex items-center gap-2 py-2"><Avatar src={r.imageUrl || ""} alt={r.name} size={28} /><div className="text-sm">{r.name}</div></div>))}</CardContent></Card>
        </div>
      </div>
    </main>
  );
}


