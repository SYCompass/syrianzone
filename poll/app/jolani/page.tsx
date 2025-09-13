import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { db } from "@/db";
import { candidates, dailyScores, polls } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";
import { formatNumberKM } from "@/lib/utils";
import JolaniConsoleHook from "./console-hook";
import MonthlyLineChart from "@/components/MonthlyLineChart";
import ClientOnly from "@/components/ClientOnly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchAllTimeTotals(slug: string) {
  const [p] = await db.select().from(polls).where(eq(polls.slug, slug));
  if (!p) return [] as Array<{ candidateId: string; name: string; imageUrl?: string; votes: number; score: number; avg: number; rank: number }>;
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
  const totals = Array.from(agg.entries()).map(([candidateId, v]) => ({ candidateId, votes: v.votes, score: v.score, avg: v.votes > 0 ? v.score / v.votes : 0 }));
  totals.sort((a, b) => (b.avg - a.avg) || (b.score - a.score) || (b.votes - a.votes));
  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
  return totals.map((t, i) => {
    const c = cands.find((cc) => cc.id === t.candidateId);
    return { candidateId: t.candidateId, name: c?.name || "", imageUrl: c?.imageUrl || undefined, votes: t.votes, score: t.score, avg: t.avg, rank: i + 1 };
  });
}

async function fetchMonthlySeries(slug: string): Promise<{ months: string[]; series: { name: string; values: number[]; imageUrl?: string }[] }> {
  const [p] = await db.select().from(polls).where(eq(polls.slug, slug));
  if (!p) return { months: [], series: [] };
  const rows = await db
    .select({ candidateId: dailyScores.candidateId, score: dailyScores.score, votes: dailyScores.votes, day: dailyScores.day })
    .from(dailyScores)
    .where(eq(dailyScores.pollId, p.id))
    .orderBy(dailyScores.day);
  const monthSet = new Set<string>();
  const byCandidate = new Map<string, Map<string, { score: number; votes: number }>>();
  for (const r of rows) {
    const d = new Date(r.day as unknown as string);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthSet.add(key);
    const m = byCandidate.get(r.candidateId) || new Map<string, { score: number; votes: number }>();
    const prev = m.get(key) || { score: 0, votes: 0 };
    m.set(key, { score: prev.score + (r.score || 0), votes: prev.votes + (r.votes || 0) });
    byCandidate.set(r.candidateId, m);
  }
  const months = Array.from(monthSet.values()).sort();
  const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id)).orderBy(candidates.sort);
  // Build green palette for all series
  const series = cands.map((c, i) => {
    const n = Math.max(1, cands.length - 1);
    const minL = 30; // darker for top-ranked
    const maxL = 78; // lighter for last
    const light = Math.round(minL + ((maxL - minL) * i) / n);
    const green = `hsl(145 65% ${light}%)`;
    return {
      name: c.name as string,
      values: months.map((m) => {
        const mv = byCandidate.get(c.id)?.get(m);
        if (!mv) return 0;
        return mv.votes > 0 ? mv.score / mv.votes : 0;
      }),
      imageUrl: (c.imageUrl as string | null) || undefined,
      color: green,
    };
  });
  return { months, series };
}

export default async function Page() {
  const slug = "jolani";
  const rows = await fetchAllTimeTotals(slug);
  const top3 = rows.slice(0, 3);
  const { months, series } = await fetchMonthlySeries(slug);
  return (
    <main className="container mx-auto px-4 pt-8 pb-8">
      {/* Inject browser console helpers */}
      <JolaniConsoleHook />
      <h1 className="text-2xl font-bold mb-4 text-center">لوحة تصنيف شخصيات الجولاني</h1>

      {top3.length ? (
        <div className="max-w-screen-md mx-auto mb-8">
          <h2 className="font-semibold mb-3 text-center text-gray-500">أفضل ٣ على الإطلاق</h2>
          <div className="grid grid-cols-3 items-end justify-items-center gap-4">
            <div className="flex flex-col items-center">
              {top3[1] && (
                <div className="relative">
                  <Avatar src={top3[1].imageUrl || ""} alt={top3[1].name} size={48} />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">2</span>
                </div>
              )}
              {top3[1] && <div className="text-sm mt-1 text-center leading-tight mb-2">{top3[1].name}</div>}
            </div>
            <div className="flex flex-col items-center">
              {top3[0] && (
                <div className="relative">
                  <Avatar src={top3[0].imageUrl || ""} alt={top3[0].name} size={64} />
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">1</span>
                </div>
              )}
              {top3[0] && <div className="font-medium mt-1 text-center leading-tight mb-2">{top3[0].name}</div>}
            </div>
            <div className="flex flex-col items-center">
              {top3[2] && (
                <div className="relative">
                  <Avatar src={top3[2].imageUrl || ""} alt={top3[2].name} size={48} />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">3</span>
                </div>
              )}
              {top3[2] && <div className="text-sm mt-1 text-center leading-tight mb-2">{top3[2].name}</div>}
            </div>
          </div>
        </div>
      ) : null}

      {months.length && series.length ? (
        <div className="max-w-screen-md mx-auto mb-6">
          <h3 className="font-semibold mb-2 text-center">إحصائيات شهرية</h3>
          <ClientOnly>
            <MonthlyLineChart months={months} series={series} />
          </ClientOnly>
        </div>
      ) : null}
      <div className="max-w-screen-md mx-auto mt-4">
        <Card>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-10 text-right">#</Th>
                  <Th className="w-full text-right">الشخصية</Th>
                  <Th className="w-20 text-right">النقاط</Th>
                  <Th className="w-16 text-right">الأصوات</Th>
                  <Th className="w-24 text-right">المعدّل</Th>
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
                        </div>
                      </div>
                    </Td>
                    <Td>{formatNumberKM(r.score)}</Td>
                    <Td>{formatNumberKM(r.votes)}</Td>
                    <Td>{r.avg.toFixed(2)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


