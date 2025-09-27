import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isHttpUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const src = req.nextUrl.searchParams.get("url") || "";
    if (!src || !isHttpUrl(src)) return NextResponse.json({ error: "invalid url" }, { status: 400 });

    // Basic SSRF guard: allow any http(s), but you can restrict to your domains if needed
    const upstream = await fetch(src, { cache: "no-store" });
    if (!upstream.ok) return NextResponse.json({ error: "fetch failed" }, { status: 502 });

    const buf = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const res = new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
      },
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}


