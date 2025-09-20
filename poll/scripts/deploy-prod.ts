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

  // Use official Snapshot endpoint (Beta): POST /projects/{project_id}/branches/{branch_id}/snapshot
  const name = `pre-deploy-${new Date().toISOString()}`;
  const url = new URL(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/snapshot`);
  url.searchParams.set("name", name);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Neon snapshot failed: ${res.status} ${res.statusText} ${text}`);
  }
  const json = (await res.json()) as any;
  const snapshotId = json?.snapshot?.id || json?.id;
  console.log("Created Neon snapshot:", snapshotId || json);
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

async function runDrizzleMigrate() {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", ["-s", "drizzle:migrate"], { stdio: "inherit", env: process.env });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`drizzle:migrate exited with code ${code}`));
    });
  });
}

async function main() {
  const arg = process.argv[2];
  const mode = !arg || arg === "--pending" ? "pending" : "single";

  console.log("Creating Neon snapshot before applying migrations...");
  await createNeonSnapshot();

  if (mode === "pending") {
    console.log("Running drizzle migrations (pending only)...");
    await runDrizzleMigrate();
  } else {
    console.log("Running SQL apply script:", arg);
    await runApplySql(arg);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


