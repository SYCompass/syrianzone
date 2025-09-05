import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { db } from "@/db";
import { polls, candidates, dailyScores, dailyRanks } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { getLocalMidnightUTC, getMonthStartUTC } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchToday() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) return [] as Array<{ candidateId: string; name: string; title?: string; imageUrl?: string; votes: number; score: number; rank: number }>;
  const day = getLocalMidnightUTC(p.timezone);
  const rows = await db
    .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
    .from(dailyScores)
    .where(eq(dailyScores.pollId, p.id) as any && eq(dailyScores.day, day) as any)
    .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
  return rows.map((r, idx) => {
    const c = cands.find((cc) => cc.id === r.candidateId)!;
    return { candidateId: r.candidateId, name: c.name, title: c.title || undefined, imageUrl: c.imageUrl || undefined, votes: r.votes, score: r.score, rank: idx + 1 };
  });
}

async function fetchMonthExtremes() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) return { best: [], worst: [] } as { best: any[]; worst: any[] };
  const start = getMonthStartUTC(p.timezone);
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
  const best = totals.slice(0, 3).map((t, i) => {
    const c = cands.find((cc) => cc.id === t.candidateId);
    return {
      candidateId: t.candidateId,
      name: c?.name || "",
      title: c?.title || undefined,
      imageUrl: c?.imageUrl || undefined,
      score: t.score,
      votes: t.votes,
      rank: i + 1,
    };
  });
  const worst = totals.slice(-3).reverse().map((t, i) => {
    const c = cands.find((cc) => cc.id === t.candidateId);
    return {
      candidateId: t.candidateId,
      name: c?.name || "",
      title: c?.title || undefined,
      imageUrl: c?.imageUrl || undefined,
      score: t.score,
      votes: t.votes,
      rank: i + 1,
    };
  });
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
  const best = totals.slice(0, 3).map((t, i) => {
    const c = cands.find((cc) => cc.id === t.candidateId);
    return {
      candidateId: t.candidateId,
      name: c?.name || "",
      title: c?.title || undefined,
      imageUrl: c?.imageUrl || undefined,
      score: t.score,
      votes: t.votes,
      rank: i + 1,
    };
  });
  const worst = totals.slice(-3).reverse().map((t, i) => {
    const c = cands.find((cc) => cc.id === t.candidateId);
    return {
      candidateId: t.candidateId,
      name: c?.name || "",
      title: c?.title || undefined,
      imageUrl: c?.imageUrl || undefined,
      score: t.score,
      votes: t.votes,
      rank: i + 1,
    };
  });
  return { best, worst };
}

export default async function Page() {
  const rows = await fetchToday();
  const month = await fetchMonthExtremes();
  const allTime = await fetchAllTimeExtremes();
  const triad = allTime.best.slice(0, 3);
  const first = triad[0];
  const second = triad[1];
  const third = triad[2];

  return (
    <main className="container mx-auto px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold mb-4 text-center">قائمة الصدارة</h1>
      <h2 className="font-semibold mb-4 text-center text-gray-500">الأفضل على الإطلاق</h2>
      {/* All-time best triad */}
      {first ? (
        <div className="max-w-screen-md mx-auto mb-8">
          <div className="grid grid-cols-3 items-end justify-items-center gap-4">
            {/* 2nd */}
            <div className="flex flex-col items-center">
              {second && (
                <div className="relative">
                  <Avatar src={second.imageUrl || ""} alt={second.name} size={48} />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">2</span>
                </div>
              )}
              {second && <div className="text-sm mt-1 text-center leading-tight mb-2">{second.name}</div>}
              {second?.title && <div className="text-xs text-gray-500 text-center">{second.title}</div>}
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar src={first.imageUrl || ""} alt={first.name} size={64} />
                <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">1</span>
              </div>
              <div className="font-medium mt-1 text-center leading-tight mb-2">{first.name}</div>
              {first.title && <div className="text-xs text-gray-500 text-center">{first.title}</div>}
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center">
              {third && (
                <div className="relative">
                  <Avatar src={third.imageUrl || ""} alt={third.name} size={48} />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">3</span>
                </div>
              )}
              {third && <div className="text-sm mt-1 text-center leading-tight mb-2">{third.name}</div>}
              {third?.title && <div className="text-xs text-gray-500 text-center">{third.title}</div>}
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-w-screen-md mx-auto">
        {/* Daily leaderboard */}
        <h2 className="font-semibold mb-2">ترتيب اليوم</h2>
        <p className="text-sm text-gray-500 mb-2">{new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
        <Card>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-10 text-right">#</Th>
                  <Th className="w-full text-right">الوزير</Th>
                  <Th className="w-10 text-right">الأصوات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r) => (
                  <Tr key={r.candidateId}>
                    <Td>#{r.rank}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={r.imageUrl || ""} alt={r.name} size={28} />
                        <div className="leading-tight">
                          <div className="text-sm">{r.name}</div>
                          {r.title ? (<div className="text-xs text-gray-500">{r.title}</div>) : null}
                        </div>
                      </div>
                    </Td>
                    <Td>{r.votes}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 of the month */}
      <div className="max-w-screen-md mx-auto mt-6">
        <h2 className="font-semibold mb-2">أفضل وزراء الشهر</h2>
        <p className="text-sm text-gray-500 mb-2">{new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {month.best.slice(0, 3).map((r) => (
            <Card key={r.candidateId}>
              <CardContent className="py-3 flex items-center gap-3">
                <Avatar src={r.imageUrl || ""} alt={r.name} size={36} />
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  {r.title ? (<div className="text-xs text-gray-500">{r.title}</div>) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Worst 3 of the month */}
      <div className="max-w-screen-md mx-auto mt-4">
        <h2 className="font-semibold mb-2">أسوأ وزراء الشهر</h2>
        <p className="text-sm text-gray-500 mb-2">{new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {month.worst.slice(0, 3).map((r) => (
            <Card key={r.candidateId}>
              <CardContent className="py-3 flex items-center gap-3">
                <Avatar src={r.imageUrl || ""} alt={r.name} size={36} />
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  {r.title ? (<div className="text-xs text-gray-500">{r.title}</div>) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}


