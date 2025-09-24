import { appRouter, createContext } from "@/server/trpc/router";
import { rateLimit1PerMin } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const ua = req.headers.get("user-agent") || "";
    const deviceId: string | undefined = body?.deviceId;
    const key = deviceId ? `device:${deviceId}` : (ip ? `ip:${ip}` : `ua:${ua}`);
    const rl = await rateLimit1PerMin.limit(key);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil(((rl.reset || 0) - Date.now()) / 1000));
      return new Response(JSON.stringify({ error: "Too many submissions. Please wait a minute." }), {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      });
    }
    const ctx = await createContext({ headers: req.headers });
    const caller = appRouter.createCaller(ctx);
    const res = await caller.ballot.submit(body);
    return Response.json(res);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), { status: 400 });
  }
}


