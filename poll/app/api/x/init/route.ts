import { startOAuth } from "@/lib/xAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const redirect = urlObj.searchParams.get("redirect_uri") || process.env.TWITTER_REDIRECT_URI || "https://syrian.zone/oauth/x/callback";
    const { url } = await startOAuth(redirect);
    return Response.redirect(url, 302);
  } catch (e: any) {
    return new Response(e?.message || "error", { status: 400 });
  }
}


