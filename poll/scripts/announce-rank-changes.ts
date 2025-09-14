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
  return `تحديث التصنيف (${day})\n${arrow} ${name} ${dir} من #${from} إلى #${to} ${suffix}${over || fell}\n\nتابع الترتيب الكامل: syrian.zone/tierlist/leaderboard`;
}

async function main() {
  const slug = process.argv[2] || "best-ministers";
  const dry = process.argv.includes("--dry");
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
  const changes = diffRanks(prev, curr);
  if (!changes.length) {
    console.log("No rank changes detected.");
    return;
  }

  const ids = changes.map((c) => c.candidateId);
  const candList = await db.select().from(candidates).where(and(eq(candidates.pollId, p.id), inArray(candidates.id, ids)));
  const byId = new Map(candList.map((c) => [c.id, c] as const));

  let rw: any;
  const oauth2Refresh = process.env.TWITTER_OAUTH2_REFRESH_TOKEN;
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (oauth2Refresh && clientId && clientSecret) {
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
        console.log("Updated TWITTER_OAUTH2_REFRESH_TOKEN in .env.local");
      } catch (e) {
        console.warn("Could not persist rotated refresh token:", e);
      }
    }
    rw = logged;
  } else {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || "",
      appSecret: process.env.TWITTER_API_SECRET || "",
      accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
      accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
    });
    rw = client.readWrite;
  }

  for (const c of changes) {
    const name = (byId.get(c.candidateId)?.name as string) || "مرشح";
    let overName: string | undefined;
    let belowName: string | undefined;
    if (c.delta && c.delta > 0) {
      const below = currByRank.get(c.to + 1);
      if (below) {
        const belowCand = byId.get(below.candidateId);
        overName = (belowCand?.name as string) || undefined;
      }
    } else if (c.delta && c.delta < 0) {
      const above = currByRank.get(c.to - 1);
      if (above) {
        const aboveCand = byId.get(above.candidateId);
        belowName = (aboveCand?.name as string) || undefined;
      }
    }
    const tweet = buildTweet(name, c.from!, c.to, days[1], { overName, belowName });
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


