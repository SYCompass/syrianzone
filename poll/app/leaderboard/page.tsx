import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import AlgorithmInfo from "@/components/AlgorithmInfo";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { db } from "@/db";
import { polls, candidates, dailyScores, dailyRanks } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { getLocalMidnightUTC, getMonthStartUTC } from "@/lib/time";
import MonthlyLineChart from "@/components/MonthlyLineChart";
import ClientOnly from "@/components/ClientOnly";

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

async function fetchAllTimeTotals() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) return [] as Array<{ candidateId: string; name: string; title?: string; imageUrl?: string; votes: number; score: number; rank: number }>;
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
  return totals.map((t, i) => {
    const c = cands.find((cc) => cc.id === t.candidateId);
    return {
      candidateId: t.candidateId,
      name: c?.name || "",
      title: c?.title || undefined,
      imageUrl: c?.imageUrl || undefined,
      votes: t.votes,
      score: t.score,
      rank: i + 1,
    };
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
  const rows = await fetchAllTimeTotals();
  const month = await fetchMonthExtremes();
  const allTime = await fetchAllTimeExtremes();
  const triad = allTime.best.slice(0, 3);
  const first = triad[0];
  const second = triad[1];
  const third = triad[2];

  // Build monthly series and per-category breakdown
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  let months: string[] = [];
  let series: { name: string; values: number[]; color?: string; imageUrl?: string }[] = [];
  let seriesMinisters: { name: string; values: number[]; color?: string; imageUrl?: string }[] = [];
  let seriesGovernors: { name: string; values: number[]; color?: string; imageUrl?: string }[] = [];
  let rowsGov: Array<{ candidateId: string; name: string; title?: string; imageUrl?: string; votes: number; score: number; rank: number }> = [];
  let monthMinBest: any[] = [], monthMinWorst: any[] = [], monthGovBest: any[] = [], monthGovWorst: any[] = [];
  let rowsMinOnly: Array<{ candidateId: string; name: string; title?: string; imageUrl?: string; votes: number; score: number; rank: number }> = [];
  if (p) {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    months = [`${yyyy}-${mm}`];

    const allRows = await db
      .select({ candidateId: dailyScores.candidateId, day: dailyScores.day, score: dailyScores.score })
      .from(dailyScores)
      .where(eq(dailyScores.pollId, p.id))
      .orderBy(desc(dailyScores.day));
    const byCandidate = new Map<string, Map<string, number>>();
    for (const r of allRows) {
      const d = new Date(r.day as unknown as string);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!months.includes(key)) continue;
      const m = byCandidate.get(r.candidateId) || new Map();
      m.set(key, (m.get(key) || 0) + r.score);
      byCandidate.set(r.candidateId, m);
    }
    const candsAll = await db
      .select()
      .from(candidates)
      .where(eq(candidates.pollId, p.id))
      .orderBy(candidates.sort);

    // Colors
    const GREEN_23 = Array.from({ length: 23 }, (_, i) => {
      const hue = 145;
      const saturation = 65;
      const minLight = 30; // darkest for best
      const maxLight = 78; // lightest for last
      const light = minLight + ((maxLight - minLight) * i) / 22;
      return `hsl(${hue} ${saturation}% ${Math.round(light)}%)`;
    });

    // All-time totals for ranking/colors
    const totalsRows = await db
      .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score })
      .from(dailyScores)
      .where(eq(dailyScores.pollId, p.id));
    const totalsScore = new Map<string, number>();
    const totalsVotes = new Map<string, number>();
    for (const r of totalsRows) {
      totalsScore.set(r.candidateId, (totalsScore.get(r.candidateId) || 0) + r.score);
      totalsVotes.set(r.candidateId, (totalsVotes.get(r.candidateId) || 0) + r.votes);
    }

    function buildSeries(list: typeof candsAll) {
      const ranked = [...list].sort((a, b) => (totalsScore.get(b.id) || 0) - (totalsScore.get(a.id) || 0));
      const colorById = new Map<string, string>();
      ranked.forEach((s, i) => colorById.set(s.id, GREEN_23[Math.min(i, GREEN_23.length - 1)]));
      return ranked.map((c) => ({
        name: c.name,
        values: months.map((m) => byCandidate.get(c.id)?.get(m) || 0),
        color: colorById.get(c.id),
        imageUrl: c.imageUrl || undefined,
      }));
    }

    const ministers = candsAll.filter((c: any) => c.category !== "governor");
    const governors = candsAll.filter((c: any) => c.category === "governor");

    seriesMinisters = buildSeries(ministers);
    seriesGovernors = buildSeries(governors);

    // Also keep combined series (optional)
    const colorById = new Map<string, string>();
    series = buildSeries(candsAll);

    // Build governors table rows by totals
    const govTotals = governors
      .map((c) => ({ candidateId: c.id, name: c.name, title: c.title || undefined, imageUrl: c.imageUrl || undefined, votes: totalsVotes.get(c.id) || 0, score: totalsScore.get(c.id) || 0 }))
      .sort((a, b) => (b.score - a.score) || (b.votes - a.votes));
    rowsGov = govTotals.map((t, i) => ({ ...t, rank: i + 1 }));

    // Build ministers-only rows including zero-score entries
    const minTotals = ministers
      .map((c) => ({
        candidateId: c.id,
        name: c.name,
        title: c.title || undefined,
        imageUrl: c.imageUrl || undefined,
        votes: totalsVotes.get(c.id) || 0,
        score: totalsScore.get(c.id) || 0,
      }))
      .sort((a, b) => (b.score - a.score) || (b.votes - a.votes));
    rowsMinOnly = minTotals.map((t, i) => ({ ...t, rank: i + 1 }));

    // Month extremes per category (best/worst)
    const start = getMonthStartUTC(p.timezone);
    const monthRows = await db
      .select({ candidateId: dailyScores.candidateId, votes: dailyScores.votes, score: dailyScores.score, day: dailyScores.day })
      .from(dailyScores)
      .where(and(eq(dailyScores.pollId, p.id), gte(dailyScores.day, start)))
      .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
    const monthAgg = new Map<string, { votes: number; score: number }>();
    for (const r of monthRows) {
      const cur = monthAgg.get(r.candidateId) || { votes: 0, score: 0 };
      monthAgg.set(r.candidateId, { votes: cur.votes + r.votes, score: cur.score + r.score });
    }
    function pickExtremes(list: typeof candsAll) {
      const totals = list.map((c) => ({ candidateId: c.id, score: monthAgg.get(c.id)?.score || 0, votes: monthAgg.get(c.id)?.votes || 0 }));
      totals.sort((a, b) => (b.score - a.score) || (b.votes - a.votes));
      const best = totals.slice(0, 3).map((t, i) => {
        const c = (candsAll as any[]).find((cc) => cc.id === t.candidateId)!;
        return { candidateId: t.candidateId, name: c.name as string, title: (c.title as string | null) || undefined, imageUrl: (c.imageUrl as string | null) || undefined, score: t.score, votes: t.votes, rank: i + 1 };
      });
      const worst = totals.slice(-3).reverse().map((t, i) => {
        const c = (candsAll as any[]).find((cc) => cc.id === t.candidateId)!;
        return { candidateId: t.candidateId, name: c.name as string, title: (c.title as string | null) || undefined, imageUrl: (c.imageUrl as string | null) || undefined, score: t.score, votes: t.votes, rank: i + 1 };
      });
      return { best, worst };
    }
    const mins = pickExtremes(ministers);
    const govs = pickExtremes(governors);
    monthMinBest = mins.best;
    monthMinWorst = mins.worst;
    monthGovBest = govs.best;
    monthGovWorst = govs.worst;
  }

  return (
    <main className="container mx-auto px-4 pt-8 pb-8">
      <div className="max-w-screen-md mx-auto mb-4">
        <Alert>
          <AlertCircleIcon className="h-5 w-5" />
          <div>
            <AlertTitle>تنويه</AlertTitle>
            <AlertDescription>
              هذه منصّة تصويت مجتمعيّة ذات طابع ساخر، وغايتها الترفيه والمناقشة فحسب. وما يُنشر من نتائج ليس استطلاعاً علميّاً، ولا يُمثّل رأياً رسميّاً، ولا يرتبط بأي جهة حكوميّة. إلخ...
            </AlertDescription>
          </div>
        </Alert>
      </div>
      <h1 className="text-2xl font-bold mb-4 text-center">الإحصائيات</h1>
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

      {months.length && (seriesMinisters.length || seriesGovernors.length) ? (
        <div className="max-w-screen-md mx-auto mb-6 space-y-8">
          <div>
            <h3 className="font-semibold mb-2 text-center">إحصائيات الحكومة ورؤساء الهيئات</h3>
            <ClientOnly>
              <MonthlyLineChart months={months} series={seriesMinisters} />
            </ClientOnly>
          </div>
          {/* Top 3 of the month (Ministers) */}
          <div className="max-w-screen-md mx-auto mt-6">
            <h2 className="font-semibold mb-2">الأعلى تقييماً لهذا الشهر - الحكومة</h2>
            <p className="text-sm text-gray-500 mb-2">{new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long" }).format(new Date())}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {monthMinBest.slice(0, 3).map((r) => (
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
          {/* Worst 3 of the month (Ministers) */}
          <div className="max-w-screen-md mx-auto mt-4">
            <h2 className="font-semibold mb-2">الأقل تقييماً لهذا الشهر - الحكومة</h2>
            <p className="text-sm text-gray-500 mb-2">{new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long" }).format(new Date())}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {monthMinWorst.slice(0, 3).map((r) => (
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

          <div className="max-w-screen-md mx-auto mt-4">
        {/* All-time leaderboard */}
        <h2 className="font-semibold mb-2">قائمة التصنيف التفصيلية</h2>
        <p className="text-sm text-gray-500 mb-2">مجموع النقاط والأصوات الإجمالي</p>
        <Card>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-10 text-right">#</Th>
                  <Th className="w-full text-right">المسؤول</Th>
                  <Th className="w-20 text-right">النقاط</Th>
                  <Th className="w-10 text-right">الأصوات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rowsMinOnly.map((r) => (
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
                    <Td>{r.score}</Td>
                    <Td>{r.votes}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
          <div>
            <h3 className="font-semibold mb-2 text-center">إحصائيات المحافظين</h3>
            <ClientOnly>
              <MonthlyLineChart months={months} series={seriesGovernors} />
            </ClientOnly>
          </div>
          {/* Top 3 of the month (Governors) */}
          <div className="max-w-screen-md mx-auto mt-6">
            <h2 className="font-semibold mb-2">الأعلى تقييماً لهذا الشهر - المحافظون</h2>
            <p className="text-sm text-gray-500 mb-2">{new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long" }).format(new Date())}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {monthGovBest.slice(0, 3).map((r) => (
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
          {/* Worst 3 of the month (Governors) */}
          <div className="max-w-screen-md mx-auto mt-4">
            <h2 className="font-semibold mb-2">الأقل تقييماً لهذا الشهر - المحافظون</h2>
            <p className="text-sm text-gray-500 mb-2">{new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long" }).format(new Date())}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {monthGovWorst.slice(0, 3).map((r) => (
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
        </div>
      ) : null}

      <div className="max-w-screen-md mx-auto mt-4">
        {/* Governors-only leaderboard */}
        <h2 className="font-semibold mb-2">قائمة المحافظين</h2>
        <p className="text-sm text-gray-500 mb-2">مجموع النقاط والأصوات الإجمالي</p>
        <Card>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-10 text-right">#</Th>
                  <Th className="w-full text-right">المسؤول</Th>
                  <Th className="w-20 text-right">النقاط</Th>
                  <Th className="w-10 text-right">الأصوات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rowsGov.map((r) => (
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
                    <Td>{r.score}</Td>
                    <Td>{r.votes}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlgorithmInfo />
    </main>
  );
}


