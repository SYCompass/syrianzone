import { db } from "@/db";
import { polls, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [p] = await db.select().from(polls).where(eq(polls.slug, "best-ministers"));
  if (!p) {
    console.log("Poll not found");
    return;
  }
  const rows = await db.select().from(candidates).where(eq(candidates.pollId, p.id)).orderBy(candidates.sort);
  console.log(rows.map((r) => ({ id: r.id, name: r.name, sort: r.sort })));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


