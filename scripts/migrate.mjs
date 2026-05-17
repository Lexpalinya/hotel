#!/usr/bin/env node
/**
 * Auto-migration runner.
 *
 * Reads every .sql file under supabase/migrations/ in lexicographic order and
 * runs them against the database. Tracks applied migrations in a
 * public._migrations table so each file runs exactly once across deploys.
 *
 * Idempotent — safe to run on every Vercel build.
 *
 * Required env vars:
 *   - DIRECT_URL              (Supabase → Settings → Database → "Direct connection")
 *   - SKIP_MIGRATE=1          to skip (e.g. preview deploys)
 */

import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIG_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');

if (process.env.SKIP_MIGRATE === '1') {
  console.log('[migrate] SKIP_MIGRATE=1 — skipping');
  process.exit(0);
}

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  console.error('[migrate] DIRECT_URL (or DATABASE_URL) not set — cannot run migrations');
  console.error('[migrate] add it to Vercel env vars OR set SKIP_MIGRATE=1');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: conn,
  // Supabase pooler / direct conn both need ssl; node-postgres doesn't auto-detect from URL.
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  // bootstrap tracking table
  await client.query(`
    create table if not exists public._migrations (
      name      text primary key,
      checksum  text not null,
      applied_at timestamptz not null default now()
    );
  `);

  const files = fs.readdirSync(MIG_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('[migrate] no .sql files found in', MIG_DIR);
    return;
  }

  const { rows: applied } = await client.query('select name, checksum from public._migrations');
  const appliedMap = new Map(applied.map((r) => [r.name, r.checksum]));

  let ranAny = false;
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIG_DIR, file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex').slice(0, 16);

    if (appliedMap.has(file)) {
      const prev = appliedMap.get(file);
      if (prev !== checksum) {
        console.warn(`[migrate] ⚠ ${file} checksum changed (${prev} → ${checksum}) — refusing to re-run`);
        console.warn('[migrate]   if intentional, write a NEW migration file instead of editing this one');
      } else {
        console.log(`[migrate] ✓ ${file} (already applied)`);
      }
      continue;
    }

    process.stdout.write(`[migrate] → ${file} ... `);
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into public._migrations (name, checksum) values ($1, $2)', [file, checksum]);
      await client.query('commit');
      console.log('done');
      ranAny = true;
    } catch (e) {
      await client.query('rollback').catch(() => {});
      console.log('FAILED');
      throw e;
    }
  }

  if (!ranAny) console.log('[migrate] up to date');
}

let exitCode = 0;
try {
  await main();
} catch (e) {
  console.error('[migrate] error:', e.message);
  exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
process.exit(exitCode);
