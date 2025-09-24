import { appRouter, createContext } from "@/server/trpc/router";
import { aj } from "@/lib/arcjet";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      return new Response(JSON.stringify({ error: "Too many submissions. Please wait a minute." }), { status: 429 });
    }
    const ctx = await createContext({ headers: req.headers });
    const caller = appRouter.createCaller(ctx);
    const res = await caller.ballot.submit(body);
    return Response.json(res);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), { status: 400 });
  }
}


