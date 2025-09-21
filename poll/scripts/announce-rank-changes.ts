import { db } from "@/db";
import { candidates, dailyRanks, polls } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TwitterApi } from "twitter-api-v2";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

type RankRow = { candidateId: string; day: Date; rank: number; votes: number; score: number };

async function getPoll(slug: string) {
  const [p] = await db.select().from(polls).where(eq(polls.slug, slug));
  if (!p) throw new Error("Poll not found: " + slug);
  return p;
}

async function getLastTwoDaysRanks(pollId: string): Promise<{ days: string[]; rowsByDay: Map<string, RankRow[]> }> {
  const rows = await db
    .select()
    .from(dailyRanks)
    .where(eq(dailyRanks.pollId, pollId))
    .orderBy(desc(dailyRanks.day), dailyRanks.rank);
  const byDay = new Map<string, RankRow[]>();
  for (const r of rows) {
    const key = new Date(r.day as unknown as string).toISOString().slice(0, 10);
    const arr = byDay.get(key) || [];
    arr.push({ candidateId: r.candidateId, day: r.day as unknown as Date, rank: r.rank, votes: r.votes, score: r.score });
    byDay.set(key, arr);
  }
  const days = Array.from(byDay.keys()).sort().slice(-2);
  const rowsByDay = new Map<string, RankRow[]>();
  for (const d of days) rowsByDay.set(d, byDay.get(d) || []);
  return { days, rowsByDay };
}

function diffRanks(prev: RankRow[], curr: RankRow[]) {
  const prevById = new Map(prev.map((r) => [r.candidateId, r] as const));
  const diffs: Array<{ candidateId: string; from?: number; to: number; delta?: number }> = [];
  for (const r of curr) {
    const p = prevById.get(r.candidateId);
    const from = p?.rank;
    const to = r.rank;
    const delta = typeof from === "number" ? from - to : undefined;
    if (typeof from === "number" && from !== to) diffs.push({ candidateId: r.candidateId, from, to, delta });
  }
  diffs.sort((a, b) => (Math.abs(b.delta || 0) - Math.abs(a.delta || 0)) || (a.to - b.to));
  return diffs;
}

function buildTweet(name: string, from: number, to: number, day: string, context?: { overName?: string; belowName?: string }) {
  const arrow = to < from ? "⬆️" : "⬇️";
  const change = Math.abs(from - to);
  const dir = to < from ? "تقدّم" : "تراجع";
  const suffix = change > 1 ? `(${change} مراتب)` : "مرتبة واحدة";
  const over = context?.overName && to < from ? `؛ تجاوز ${context.overName}` : "";
  const fell = context?.belowName && to > from ? `؛ تراجع لصالح ${context.belowName}` : "";
  return `تحديث التصنيف (${day})\n${name} ${arrow} ${dir} من #${from} إلى #${to} ${suffix}\n\nتابع الترتيب الكامل: syrian.zone/tierlist/leaderboard`;
}

async function main() {
  const slug = process.argv[2] || "best-ministers";
  const dry = process.argv.includes("--dry");
  console.log(`[mode] slug=${slug} dry=${dry}`);
  const p = await getPoll(slug);
  if (slug === "jolani") {
    console.log("Skipping non-government poll (jolani).");
    return;
  }
  const { days, rowsByDay } = await getLastTwoDaysRanks(p.id);
  if (days.length < 2) {
    console.log("Not enough daily rank snapshots to compute changes.");
    return;
  }
  const prev = rowsByDay.get(days[0]) || [];
  const curr = rowsByDay.get(days[1]) || [];
  const prevByRank = new Map<number, RankRow>(prev.map((r) => [r.rank, r]));
  const currByRank = new Map<number, RankRow>(curr.map((r) => [r.rank, r]));
  const prevRankById = new Map<string, number>(prev.map((r) => [r.candidateId, r.rank] as const));
  const currRankById = new Map<string, number>(curr.map((r) => [r.candidateId, r.rank] as const));
  const changes = diffRanks(prev, curr);
  if (!changes.length) {
    console.log("No rank changes detected.");
    return;
  }

  const ids = changes.map((c) => c.candidateId);
  const candList = await db.select().from(candidates).where(and(eq(candidates.pollId, p.id), inArray(candidates.id, ids)));
  const byId = new Map(candList.map((c) => [c.id, c] as const));

  let rw: any = null;
  const oauth2Refresh = process.env.TWITTER_OAUTH2_REFRESH_TOKEN;
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (dry) {
    console.log("[auth] dry mode: skipping auth");
  } else if (oauth2Refresh && clientId && clientSecret) {
    try {
      console.log("[auth] using OAuth2 refresh token flow");
      const oauth2Client = new TwitterApi({ clientId, clientSecret });
      const { client: logged, refreshToken: newRefreshToken } = await oauth2Client.refreshOAuth2Token(oauth2Refresh);
      if (newRefreshToken && newRefreshToken !== oauth2Refresh) {
        try {
          const envPath = join(process.cwd(), ".env.local");
          const cur = readFileSync(envPath, "utf8");
          const updated = cur.match(/^TWITTER_OAUTH2_REFRESH_TOKEN=/m)
            ? cur.replace(/^TWITTER_OAUTH2_REFRESH_TOKEN=.*/m, `TWITTER_OAUTH2_REFRESH_TOKEN=${newRefreshToken}`)
            : cur + `\nTWITTER_OAUTH2_REFRESH_TOKEN=${newRefreshToken}\n`;
          writeFileSync(envPath, updated, "utf8");
          console.log("[auth] updated TWITTER_OAUTH2_REFRESH_TOKEN in .env.local");
        } catch (e) {
          console.warn("[auth] could not persist rotated refresh token:", (e as Error).message);
        }
      }
      rw = logged;
      try {
        const me = await rw.v2.me();
        console.log("[auth] authenticated as:", me.data?.username || me.data?.id);
      } catch (e) {
        console.warn("[auth] v2.me() failed:", (e as Error).message);
      }
    } catch (e: any) {
      console.error("[auth] OAuth2 refresh failed:", e?.data || e?.message || e);
      throw e;
    }
  } else {
    console.log("[auth] using legacy keys flow");
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || "",
      appSecret: process.env.TWITTER_API_SECRET || "",
      accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
      accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
    });
    rw = client.readWrite;
    try {
      const me = await rw.v2.me();
      console.log("[auth] authenticated as:", me.data?.username || me.data?.id);
    } catch (e) {
      console.warn("[auth] v2.me() failed:", (e as Error).message);
    }
  }

  // Pick exactly one change to announce: largest absolute delta within current top 20
  const TOP_N = 31;
  const inTop = changes.filter((ch) => (currRankById.get(ch.candidateId) ?? Number.MAX_SAFE_INTEGER) <= TOP_N);
  const pool = inTop.length ? inTop : changes;
  const pick = pool.sort((a, b) => (Math.abs((b.delta ?? (b.from! - b.to))) - Math.abs((a.delta ?? (a.from! - a.to)))) || (a.to - b.to))[0];
  if (!pick) {
    console.log("No change to announce after filtering.");
    return;
  }
  const name = (byId.get(pick.candidateId)?.name as string) || "مرشح";
  const tweet = buildTweet(name, pick.from!, pick.to, days[1]);
  if (dry) {
    console.log("[DRY]", tweet);
  } else {
    try {
      await rw.v2.tweet(tweet);
      console.log("Tweeted:", tweet);
    } catch (e) {
      console.error("Tweet failed:", e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


