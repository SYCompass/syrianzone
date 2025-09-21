import { finishOAuth } from "@/lib/xAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || undefined;
    if (!code) return new Response("Missing code", { status: 400 });
    const res = await finishOAuth(code, state);
    return new Response("Auth OK" + (res.user ? ` as ${res.user}` : ""), { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || "error", { status: 400 });
  }
}


