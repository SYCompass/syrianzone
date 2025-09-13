import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, polls } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const [poll] = await db.select().from(polls).where(eq(polls.slug, "jolani"));
  if (!poll) return NextResponse.json({ ok: false, error: "Poll not found" }, { status: 404 });
  const cand = await db.select().from(candidates).where(eq(candidates.pollId, poll.id)).orderBy(candidates.sort);
  return NextResponse.json({ ok: true, candidates: cand });
}


