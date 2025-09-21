import { spawn } from 'node:child_process';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

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

  // Backfill safety: ensure poll and candidate exist even on fresh DBs
  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const sql = postgres(url, { ssl: 'require' });
    const slug = 'best-ministers';
    const [{ id: pollId } = {}] = await sql`select id from polls where slug = ${slug} limit 1`;
    let ensuredPollId = pollId;
    if (!ensuredPollId) {
      ensuredPollId = randomUUID();
      await sql`insert into polls (id, slug, title, timezone) values (${ensuredPollId}, ${slug}, ${'تقييم الوزراء'}, ${'Europe/Amsterdam'}) on conflict (slug) do nothing`;
      console.log('Ensured poll row for', slug);
    }
    const [{ exists } = { exists: false }] = await sql`select exists(select 1 from candidates where id = ${'item31'} and poll_id = ${ensuredPollId}) as exists`;
    if (!exists) {
      const [{ s } = { s: 0 }] = await sql`select coalesce(max(sort), 0) as s from candidates where poll_id = ${ensuredPollId}`;
      await sql`insert into candidates (id, poll_id, name, title, image_url, sort, category) values (${ 'item31' }, ${ ensuredPollId }, ${ 'محمد طه الأحمد' }, ${ 'رئيس اللجنة العليا لانتخابات مجلس الشعب' }, ${ '/tierlist/images/item31.png' }, ${ s + 1 }, ${ 'minister' }) on conflict (id) do nothing`;
      console.log('Inserted candidate item31');
    }
    await sql.end({ timeout: 1 });
  } catch (e) {
    console.warn('Ensure poll/candidate step failed (non-fatal):', e?.message || e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


