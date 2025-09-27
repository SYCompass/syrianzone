import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

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
    const wParam = req.nextUrl.searchParams.get("w");
    const hParam = req.nextUrl.searchParams.get("h");
    const fitParam = (req.nextUrl.searchParams.get("fit") || "cover").toLowerCase();
    if (!src || !isHttpUrl(src)) return NextResponse.json({ error: "invalid url" }, { status: 400 });

    // Fetch original
    const upstream = await fetch(src, { cache: "no-store", headers: { "user-agent": req.headers.get("user-agent") || "Mozilla/5.0" } });
    if (!upstream.ok) return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
    // If upstream returned HTML or empty bytes, bail
    if (contentType.includes("text/html")) {
      return NextResponse.json({ error: "upstream non-image" }, { status: 502 });
    }
    const input = Buffer.from(await upstream.arrayBuffer());

    // Convert to JPEG for maximum canvas compatibility (iOS Safari)
    try {
      // sharp can read most formats including avif/webp/png/jpeg/svg
      let pipeline = sharp(input, { animated: false, limitInputPixels: 268435456 });
      const w = wParam ? Math.max(1, Math.min(2000, parseInt(wParam, 10) || 0)) : null;
      const h = hParam ? Math.max(1, Math.min(2000, parseInt(hParam, 10) || 0)) : null;
      if ((w || h) && (w !== null || h !== null)) {
        const fit = fitParam === "contain" ? "contain" : "cover";
        pipeline = pipeline.resize({ width: w || undefined, height: h || undefined, fit: fit as any, position: "centre", background: { r: 255, g: 255, b: 255, alpha: 1 } });
      }
      const jpeg = await pipeline.jpeg({ quality: 90, chromaSubsampling: "4:4:4", force: true }).toBuffer();
      return new NextResponse(jpeg as unknown as BodyInit, {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
          "access-control-allow-origin": "*",
        },
      });
    } catch {
      // Fallback to original bytes if conversion fails
      return new NextResponse(input as unknown as BodyInit, {
        status: 200,
        headers: {
          "content-type": contentType || "application/octet-stream",
          "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
          "access-control-allow-origin": "*",
        },
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}


