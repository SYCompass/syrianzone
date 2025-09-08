import { pgTable, text, varchar, boolean, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const polls = pgTable("polls", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Europe/Amsterdam"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  pollId: varchar("poll_id", { length: 36 }).notNull().references(() => polls.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 32 }).notNull().default("minister"),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ballots = pgTable("ballots", {
  id: varchar("id", { length: 36 }).primaryKey(),
  pollId: varchar("poll_id", { length: 36 }).notNull().references(() => polls.id, { onDelete: "cascade" }),
  voteDay: timestamp("vote_day", { withTimezone: true }).notNull(),
  voterKey: varchar("voter_key", { length: 128 }).notNull(),
  ipHash: varchar("ip_hash", { length: 128 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ballotItems = pgTable("ballot_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ballotId: varchar("ballot_id", { length: 36 })
    .notNull()
    .references(() => ballots.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id", { length: 36 })
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  tier: varchar("tier", { length: 1 }).notNull(), // S|A|B|C|D|F
  position: integer("position").notNull().default(0),
});

export const dailyScores = pgTable(
  "daily_scores",
  {
    pollId: varchar("poll_id", { length: 36 })
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    candidateId: varchar("candidate_id", { length: 36 })
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    day: timestamp("day", { withTimezone: true }).notNull(),
    votes: integer("votes").notNull().default(0),
    score: integer("score").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pollId, t.candidateId, t.day] }),
  })
);

export const dailyRanks = pgTable(
  "daily_ranks",
  {
    pollId: varchar("poll_id", { length: 36 })
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    candidateId: varchar("candidate_id", { length: 36 })
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    day: timestamp("day", { withTimezone: true }).notNull(),
    rank: integer("rank").notNull(),
    votes: integer("votes").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pollId, t.candidateId, t.day] }),
  })
);


