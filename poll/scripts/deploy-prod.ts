import { spawn } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function createNeonSnapshot() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  const branchId = process.env.NEON_BRANCH_ID;
  if (!apiKey || !projectId || !branchId) {
    throw new Error("Missing NEON_API_KEY, NEON_PROJECT_ID or NEON_BRANCH_ID env vars");
  }

  const endpoint = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/snapshots`;
  const body = JSON.stringify({ snapshot: { name: `pre-deploy-${new Date().toISOString()}` } });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Neon snapshot failed: ${res.status} ${res.statusText} ${text}`);
  }
  const json = (await res.json()) as any;
  const snapId = json?.snapshot?.id || json?.id;
  console.log("Created Neon snapshot:", snapId || json);
}

async function runApplySql(sqlPath: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", ["tsx", "scripts/apply-sql.ts", sqlPath], { stdio: "inherit", env: process.env });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`apply-sql exited with code ${code}`));
    });
  });
}

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    throw new Error("Usage: pnpm tsx scripts/deploy-prod.ts <path-to-sql-file>");
  }

  console.log("Creating Neon snapshot before applying migrations...");
  await createNeonSnapshot();

  console.log("Running SQL apply script:", sqlPath);
  await runApplySql(sqlPath);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


