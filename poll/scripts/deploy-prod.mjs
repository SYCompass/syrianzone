import { spawn } from 'node:child_process';

async function createNeonSnapshot() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  const branchId = process.env.NEON_BRANCH_ID;
  if (!apiKey || !projectId || !branchId) {
    throw new Error('Missing NEON_API_KEY, NEON_PROJECT_ID or NEON_BRANCH_ID env vars');
  }

  // Use the official Snapshot endpoint (Beta): POST /projects/{project_id}/branches/{branch_id}/snapshot
  const name = `pre-deploy-${new Date().toISOString()}`;
  const url = new URL(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/snapshot`);
  url.searchParams.set('name', name);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    // body optional; we pass name via query param per docs
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Neon snapshot failed: ${res.status} ${res.statusText} ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  const snapshotId = (json && (json.snapshot?.id || json.id)) || 'unknown';
  console.log('Created Neon snapshot:', snapshotId);
}

async function runDrizzleMigrate() {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['-s', 'drizzle:migrate'], { stdio: 'inherit', env: process.env });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`drizzle:migrate exited with code ${code}`));
    });
  });
}

async function main() {
  console.log('Creating Neon snapshot before applying migrations...');
  await createNeonSnapshot();
  console.log('Running drizzle migrations (pending only)...');
  await runDrizzleMigrate();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


