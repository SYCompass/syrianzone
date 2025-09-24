import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ballots, ballotItems, candidates, dailyScores, polls } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";
import { v4 as uuidv4 } from "uuid";
import { sha256 } from "@/lib/hash";
import { aj } from "@/lib/arcjet";

export const runtime = "nodejs";

type TierKey = "S" | "A" | "B" | "C" | "D" | "F";

export async function POST(req: NextRequest) {
  try {
    const { tiers, deviceId, date }: { tiers: Record<TierKey, string[]>; deviceId?: string; date?: string } = await req.json();
    const slug = "jolani";

    const [poll] = await db.select().from(polls).where(eq(polls.slug, slug));
    if (!poll) return NextResponse.json({ ok: false, error: "Poll not found" }, { status: 404 });

    const voteDay = date ? getLocalMidnightUTC(poll.timezone, new Date(date)) : getLocalMidnightUTC(poll.timezone);
    const cand = await db.select().from(candidates).where(eq(candidates.pollId, poll.id));
    const known = new Set(cand.map((c) => c.id));

    const keys: TierKey[] = ["S", "A", "B", "C", "D", "F"];
    for (const k of keys) {
      if (!tiers[k]) tiers[k] = [];
      for (const id of tiers[k]) {
        if (!known.has(id)) return NextResponse.json({ ok: false, error: `Unknown candidateId: ${id}` }, { status: 400 });
      }
    }

    const totalAssigned = keys.reduce((acc, k) => acc + (tiers[k]?.length || 0), 0);
    if (totalAssigned < 1) return NextResponse.json({ ok: false, error: "At least 1 selection is required" }, { status: 400 });

    const voterDevice = deviceId || "browser-console";
    const voterKey = sha256(voterDevice);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || undefined;
    const ipHash = ip ? sha256(ip) : undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: 1 submission per minute per device or IP
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Please wait a minute." }, { status: 429 });
    }

    const ballotId = uuidv4();
    await db.insert(ballots).values({ id: ballotId, pollId: poll.id, voteDay, voterKey, ipHash, userAgent });

    const tierMinimums: Record<TierKey, number> = { S: 50, A: 40, B: 30, C: 20, D: 10, F: 0 };
    const tierPositionBonuses: Record<TierKey, number[]> = {
      S: [5, 3, 1, 0, 0, 0, 0, 0, 0, 0],
      A: [4, 2, 1, 0, 0, 0, 0, 0, 0, 0],
      B: [3, 2, 1, 0, 0, 0, 0, 0, 0, 0],
      C: [2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      D: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      F: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    const itemsToInsert: { id: string; ballotId: string; candidateId: string; tier: TierKey; position: number }[] = [];
    const scoreDelta = new Map<string, { votes: number; score: number }>();

    for (const k of keys) {
      const ids = tiers[k] || [];
      ids.forEach((candidateId, index) => {
        itemsToInsert.push({ id: uuidv4(), ballotId, candidateId, tier: k, position: index });
        const positionBonus = tierPositionBonuses[k][index] || 0;
        const delta = tierMinimums[k] + positionBonus;
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}


