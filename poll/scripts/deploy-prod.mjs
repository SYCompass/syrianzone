import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';

function log(...args) {
  if ((process.env.VERBOSE_LOG || '').toLowerCase() === 'true') console.log('[deploy]', ...args);
}

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

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // If quota exceeded or any snapshot-specific issue, warn and continue
      if (res.status === 422 || text.includes('SNAPSHOTS_LIMIT_EXCEEDED')) {
        console.warn('Snapshot skipped (limit/quota):', `${res.status} ${res.statusText} ${text}`);
        return false;
      }
      console.warn('Snapshot skipped (API error):', `${res.status} ${res.statusText} ${text}`);
      return false;
    }
    const json = await res.json().catch(() => ({}));
    const snapshotId = (json && (json.snapshot?.id || json.id)) || 'unknown';
    log('Created Neon snapshot:', snapshotId);
    return true;
  } catch (e) {
    console.warn('Snapshot skipped (network/error):', e?.message || e);
    return false;
  }
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
  const wantSnapshot = (process.env.NEON_SNAPSHOT || '').toLowerCase() !== 'skip' && (process.env.NEON_SNAPSHOT || '').toLowerCase() !== 'false';
  if (wantSnapshot) {
    console.log('Creating Neon snapshot before applying migrations...');
    await createNeonSnapshot();
  } else {
    log('Skipping Neon snapshot (NEON_SNAPSHOT=skip)');
  }

  // List migration files present in the container image
  try {
    const dir = '/app/drizzle';
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    log(`[pre] drizzle directory has ${files.length} .sql files`);
    if (files.length) {
      log('[pre] first:', files[0]);
      log('[pre] last :', files[files.length - 1]);
    }
  } catch (e) {
    log('[pre] unable to list /app/drizzle:', e?.message || e);
  }

  console.log('Running drizzle migrations (pending only)...');
  await runDrizzleMigrate();
  log('Migrations finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


