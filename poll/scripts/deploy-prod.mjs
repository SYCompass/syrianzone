import { spawn } from 'node:child_process';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

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
    console.log('Created Neon snapshot:', snapshotId);
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
    console.log('Skipping Neon snapshot (NEON_SNAPSHOT=skip)');
  }

  // List migration files present in the container image
  try {
    const dir = '/app/drizzle';
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    console.log(`[pre] drizzle directory has ${files.length} .sql files`);
    if (files.length) {
      console.log('[pre] first:', files[0]);
      console.log('[pre] last :', files[files.length - 1]);
    }
  } catch (e) {
    console.log('[pre] unable to list /app/drizzle:', e?.message || e);
  }

  console.log('Running drizzle migrations (pending only)...');
  await runDrizzleMigrate();

  // Backfill safety: ensure poll and candidate exist even on fresh DBs
  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const sql = postgres(url, { ssl: 'require' });
    const slug = 'best-ministers';

    // Drizzle metadata visibility
    try {
      const metaTables = await sql`select table_schema, table_name from information_schema.tables where table_schema = 'drizzle'`;
      console.log('[post] drizzle schema tables:', metaTables.map((t) => `${t.table_schema}.${t.table_name}`).join(', ') || '(none)');
      try {
        const j = await sql`select * from drizzle._journal order by created_at desc limit 5`;
        console.log('[post] drizzle._journal latest:', j);
      } catch {}
      try {
        const j2 = await sql`select * from drizzle.__drizzle_migrations order by created_at desc limit 5`;
        console.log('[post] drizzle.__drizzle_migrations latest:', j2);
      } catch {}
    } catch (e) {
      console.log('[post] drizzle journal lookup failed:', e?.message || e);
    }

    const [{ id: pollId } = {}] = await sql`select id from polls where slug = ${slug} limit 1`;
    let ensuredPollId = pollId;
    if (!ensuredPollId) {
      ensuredPollId = randomUUID();
      await sql`insert into polls (id, slug, title, timezone) values (${ensuredPollId}, ${slug}, ${'تقييم الوزراء'}, ${'Europe/Amsterdam'}) on conflict (slug) do nothing`;
      console.log('Ensured poll row for', slug);
    }
    const [{ cnt: preCount } = { cnt: 0 }] = await sql`select count(*)::int as cnt from candidates where poll_id = ${ensuredPollId}`;
    console.log('[post] candidates count before backfill =', preCount);

    const [{ exists } = { exists: false }] = await sql`select exists(select 1 from candidates where id = ${'item31'} and poll_id = ${ensuredPollId}) as exists`;
    if (!exists) {
      const [{ s } = { s: 0 }] = await sql`select coalesce(max(sort), 0) as s from candidates where poll_id = ${ensuredPollId}`;
      await sql`insert into candidates (id, poll_id, name, title, image_url, sort, category) values (${ 'item31' }, ${ ensuredPollId }, ${ 'محمد طه الأحمد' }, ${ 'رئيس اللجنة العليا لانتخابات مجلس الشعب' }, ${ '/tierlist/images/item31.png' }, ${ s + 1 }, ${ 'minister' }) on conflict (id) do nothing`;
      console.log('Inserted candidate item31');
    }
    const [{ exists: ex32 } = { exists: false }] = await sql`select exists(select 1 from candidates where id = ${'item32'} and poll_id = ${ensuredPollId}) as exists`;
    if (!ex32) {
      const [{ s: s2 } = { s: 0 }] = await sql`select coalesce(max(sort), 0) as s from candidates where poll_id = ${ensuredPollId}`;
      await sql`insert into candidates (id, poll_id, name, title, image_url, sort, category) values (${ 'item32' }, ${ ensuredPollId }, ${ 'عنصر اختبار ٣٢' }, ${ 'اختبار مسار الهجرة' }, ${ null }, ${ s2 + 1 }, ${ 'minister' }) on conflict (id) do nothing`;
      console.log('Inserted candidate item32');
    }
    const [{ cnt: postCount } = { cnt: 0 }] = await sql`select count(*)::int as cnt from candidates where poll_id = ${ensuredPollId}`;
    console.log('[post] candidates count after backfill =', postCount);
    await sql.end({ timeout: 1 });
  } catch (e) {
    console.warn('Ensure poll/candidate step failed (non-fatal):', e?.message || e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


