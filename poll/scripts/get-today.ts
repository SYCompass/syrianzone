import { appRouter } from "@/server/trpc/router";

async function main() {
  const caller = appRouter.createCaller({ ip: undefined, userAgent: undefined });
  const data = await caller.poll.getToday({ slug: "best-ministers" });
  console.log({ count: data.candidates.length, names: data.candidates.map(c => c.name).slice(0, 5) });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


