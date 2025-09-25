/*
 Small script to verify API rate limiting.
 - Fetches candidates from /api/jolani/candidates
 - Submits a valid vote to /api/jolani/submit twice with the same deviceId
 - Expects the second submission to return 429 within a minute
 Usage:
   pnpm tsx ./scripts/test-rate-limit.ts --base=http://localhost:3000 --device=test-device-123
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
        if (next && !next.startsWith("--")) {
          out[k] = next;
          i++;
        } else {
          out[k] = true;
        }
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

  const candidatesUrl = `${base}/api/jolani/candidates`;
  const submitUrl = `${base}/api/jolani/submit`;

  console.log("[test] Fetching candidates:", candidatesUrl);
  const candRes = await fetch(candidatesUrl);
  const candJson: any = await candRes.json();
  if (!candRes.ok || !candJson?.ok) {
    console.error("[test] Failed to fetch candidates:", candRes.status, candJson);
    process.exit(1);
  }
  const list: Array<{ id: string; category?: string | null }> = candJson.candidates || [];
  if (!Array.isArray(list) || list.length < 3) {
    console.error("[test] Not enough candidates to submit a valid vote");
    process.exit(1);
  }

  // Pick three candidates (prefer non-governor)
  const ministers = list.filter((c) => c.category !== "governor");
  const pick = (ministers.length >= 3 ? ministers : list).slice(0, 3).map((c) => c.id);

  const tiers: Record<TierKey, string[]> = { S: [], A: [], B: [], C: [], D: [], F: [] };
  tiers.S.push(pick[0]);
  tiers.A.push(pick[1]);
  tiers.B.push(pick[2]);

  const payload = { tiers, deviceId };

  // First submission
  console.log("[test] First submit:", submitUrl, payload);
  const res1 = await fetch(submitUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body1 = await res1.json().catch(() => ({}));
  console.log("[test] First submit status:", res1.status, body1);

  // Second submission immediately with same deviceId -> should be 429
  console.log("[test] Second submit (expected 429):", submitUrl);
  const res2 = await fetch(submitUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body2 = await res2.json().catch(() => ({}));
  const retryAfter = res2.headers.get("retry-after");
  console.log("[test] Second submit status:", res2.status, body2, retryAfter ? `(Retry-After: ${retryAfter}s)` : "");

  if (res2.status !== 429) {
    console.warn("[test] Warning: second request was not rate-limited.");
  } else {
    console.log("[test] Success: rate limit enforced.");
  }
}

main().catch((e) => {
  console.error("[test] Unexpected error:", e);
  process.exit(1);
});


