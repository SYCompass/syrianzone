import { appRouter, createContext } from "@/server/trpc/router";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ctx = await createContext({ headers: req.headers });
    const caller = appRouter.createCaller(ctx);
    const res = await caller.ballot.submit(body);
    return Response.json(res);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), { status: 400 });
  }
}


