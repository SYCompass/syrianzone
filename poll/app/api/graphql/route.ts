import { createYoga, createSchema } from "graphql-yoga";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { polls, candidates, dailyScores, dailyRanks } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getLocalMidnightUTC } from "@/lib/time";

export const runtime = "nodejs";

const typeDefs = /* GraphQL */ `
  type Candidate { id: ID!, name: String!, imageUrl: String }
  type Poll { id: ID!, slug: String!, title: String!, timezone: String!, isActive: Boolean! }
  type LeaderboardRow { candidateId: ID!, name: String!, imageUrl: String, votes: Int!, score: Int!, rank: Int! }
  type Query {
    poll(slug: String!): Poll
    leaderboard(slug: String!, date: String): [LeaderboardRow!]!
  }
`;

const resolvers = {
  Query: {
    poll: async (_: unknown, { slug }: { slug: string }) => {
      const [p] = await db.select().from(polls).where(eq(polls.slug, slug));
      if (!p) return null;
      return p;
    },
    leaderboard: async (
      _: unknown,
      { slug, date }: { slug: string; date?: string }
    ) => {
      const [p] = await db.select().from(polls).where(eq(polls.slug, slug));
      if (!p) return [];
      const tzDay = date ? new Date(date + "T00:00:00Z") : getLocalMidnightUTC(p.timezone);
      const isToday = !date;
      if (isToday) {
        const rows = await db
          .select({
            candidateId: dailyScores.candidateId,
            votes: dailyScores.votes,
            score: dailyScores.score,
          })
          .from(dailyScores)
          .where(and(eq(dailyScores.pollId, p.id), eq(dailyScores.day, tzDay)))
          .orderBy(desc(dailyScores.score), desc(dailyScores.votes));
        const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
        return rows.map((r, idx) => {
          const c = cands.find((cc) => cc.id === r.candidateId)!;
          return { candidateId: r.candidateId, name: c.name, imageUrl: c.imageUrl, votes: r.votes, score: r.score, rank: idx + 1 };
        });
      }
      const rows = await db
        .select()
        .from(dailyRanks)
        .where(and(eq(dailyRanks.pollId, p.id), eq(dailyRanks.day, tzDay)))
        .orderBy(dailyRanks.rank);
      const cands = await db.select().from(candidates).where(eq(candidates.pollId, p.id));
      return rows.map((r) => {
        const c = cands.find((cc) => cc.id === r.candidateId)!;
        return { candidateId: r.candidateId, name: c.name, imageUrl: c.imageUrl, votes: r.votes, score: r.score, rank: r.rank };
      });
    },
  },
};

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  cors: {
    origin: (origin) => {
      const allowed = process.env.NEXT_PUBLIC_BASE_URL || "";
      if (!origin) return true; // server-to-server
      try {
        const u = new URL(allowed);
        return origin === u.origin;
      } catch {
        return false;
      }
    },
    credentials: false,
  },
});

export async function GET(request: NextRequest) {
  return yoga(request);
}

export async function POST(request: NextRequest) {
  return yoga(request);
}


