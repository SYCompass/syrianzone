import { NextResponse } from "next/server";
import { register, collectDefaultMetrics } from "prom-client";

collectDefaultMetrics();

export async function GET() {
  return new NextResponse(await register.metrics(), {
    headers: { "Content-Type": register.contentType },
  });
}
