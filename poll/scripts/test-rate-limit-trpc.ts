/*
 Test tRPC /api/submit flow (ministers/govs) under server-side rate limiting.
 - Posts two ballots to /api/submit via the tRPC HTTP endpoint
 - Expects the second to be blocked by rate limit
 Usage:
   pnpm tsx ./scripts/test-rate-limit-trpc.ts --base=http://localhost:3000 --device=test-device-456
*/

type TierKey = "S" | "A" | "B" | "C" | "D" | "F";

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=", 2);
      if (v === undefined) {
        const next = args[i + 1];
        if (next && !next.startsWith("--")) { out[k] = next; i++; }
        else { out[k] = true; }
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const base = (args.base as string) || process.env.BASE_URL || "http://localhost:3000";
  const deviceId = (args.device as string) || process.env.DEVICE_ID || `test-device-${Date.now()}`;

  // Fetch data for today via trpc getToday
  const getTodayUrl = `${base}/api/trpc/poll.getToday?input=${encodeURIComponent(JSON.stringify({ slug: "best-ministers" }))}`;
  console.log("[test-trpc] Fetching today poll:", getTodayUrl);
  const todayRes = await fetch(getTodayUrl);
  const todayJson: any = await todayRes.json().catch(() => ({}));
  if (!todayRes.ok || !todayJson?.result?.data) {
    console.error("[test-trpc] Failed to fetch today poll:", todayRes.status, todayJson);
    process.exit(1);
  }
  const cands: Array<{ id: string }> = todayJson.result.data.candidates || [];
  if (cands.length < 3) {
    console.error("[test-trpc] Not enough candidates to submit a valid vote");
    process.exit(1);
  }

  const ids = cands.slice(0, 3).map((c) => c.id);
  const tiers: Record<TierKey, Array<{ candidateId: string; pos: number }>> = { S: [], A: [], B: [], C: [], D: [], F: [] };
  tiers.S.push({ candidateId: ids[0], pos: 0 });
  tiers.A.push({ candidateId: ids[1], pos: 0 });
  tiers.B.push({ candidateId: ids[2], pos: 0 });

  const payload = { pollSlug: "best-ministers", tiers, cfToken: "dev-ok", deviceId };
  const submitUrl = `${base}/api/submit`;

  console.log("[test-trpc] First submit:", submitUrl, { deviceId });
  const r1 = await fetch(submitUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const j1 = await r1.json().catch(() => ({}));
  console.log("[test-trpc] First submit status:", r1.status, j1);

  console.log("[test-trpc] Second submit (expect 429):");
  const r2 = await fetch(submitUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const j2 = await r2.json().catch(() => ({}));
  const retryAfter = r2.headers.get("retry-after");
  console.log("[test-trpc] Second submit status:", r2.status, j2, retryAfter ? `(Retry-After: ${retryAfter}s)` : "");

  if (r2.status !== 429 && !(j2?.error && String(j2.error).toLowerCase().includes("too many"))) {
    console.warn("[test-trpc] Warning: second request was not rate-limited.");
  } else {
    console.log("[test-trpc] Success: rate limit enforced.");
  }
}

main().catch((e) => { console.error("[test-trpc] Unexpected error:", e); process.exit(1); });


