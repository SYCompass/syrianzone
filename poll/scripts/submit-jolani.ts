import { db } from "@/db";
import { ballots, ballotItems, candidates, dailyScores, polls } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";
import { v4 as uuidv4 } from "uuid";

type TierKey = "S" | "A" | "B" | "C" | "D" | "F";

type Input = {
  tiers: Record<TierKey, Array<{ candidateId: string; pos: number }>>;
  deviceId?: string;
  date?: string; // ISO date (yyyy-mm-dd) to backfill; defaults to today in poll TZ
};

async function main() {
  const slug = process.argv[2] || "jolani";
  const raw = process.argv[3];
  if (!raw) {
    console.error("Usage: pnpm submit:jolani \"{\\\"S\\\":[{\\\"candidateId\\\":\\\"item1\\\",\\\"pos\\\":0}]...}\"");
    process.exit(1);
  }
  const input = JSON.parse(raw) as Input;

  const [poll] = await db.select().from(polls).where(eq(polls.slug, slug));
  if (!poll) throw new Error("Poll not found: " + slug);

  const voteDay = input.date ? getLocalMidnightUTC(poll.timezone, new Date(input.date)) : getLocalMidnightUTC(poll.timezone);
  const deviceId = input.deviceId || "console";

  // Validate candidates exist for this poll
  const cand = await db.select().from(candidates).where(eq(candidates.pollId, poll.id));
  const known = new Set(cand.map((c) => c.id));
  for (const tier of Object.keys(input.tiers) as TierKey[]) {
    for (const { candidateId } of input.tiers[tier]) {
      if (!known.has(candidateId)) {
        throw new Error(`Unknown candidateId for poll ${slug}: ${candidateId}`);
      }
    }
  }

  const totalAssigned = (Object.keys(input.tiers) as TierKey[]).reduce((acc, k) => acc + input.tiers[k].length, 0);
  if (totalAssigned < 1) {
    throw new Error("At least 1 selection is required in console mode");
  }

  const ballotId = uuidv4();
  await db.insert(ballots).values({ id: ballotId, pollId: poll.id, voteDay, voterKey: deviceId, ipHash: null, userAgent: "console" });

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

  (Object.keys(input.tiers) as TierKey[]).forEach((tierKey) => {
    input.tiers[tierKey].forEach(({ candidateId, pos }, index) => {
      itemsToInsert.push({ id: uuidv4(), ballotId, candidateId, tier: tierKey, position: index });
      const positionBonus = tierPositionBonuses[tierKey][index] || 0;
      const delta = tierMinimums[tierKey] + positionBonus;
      const prev = scoreDelta.get(candidateId) || { votes: 0, score: 0 };
      scoreDelta.set(candidateId, { votes: prev.votes + 1, score: prev.score + delta });
    });
  });

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

  console.log("Submitted console ballot for", slug, "on", voteDay.toISOString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


