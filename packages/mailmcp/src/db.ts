import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

const MIGRATIONS = [
  `CREATE TABLE accounts (
     email TEXT PRIMARY KEY,
     alias TEXT UNIQUE,
     refresh_token_enc TEXT NOT NULL,
     scopes TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'ok',
     last_error TEXT,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   );
   CREATE TABLE oauth_clients (
     client_id TEXT PRIMARY KEY,
     data TEXT NOT NULL,
     created_at INTEGER NOT NULL
   );
   CREATE TABLE auth_codes (
     code_hash TEXT PRIMARY KEY,
     client_id TEXT NOT NULL,
     data TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   );
   CREATE TABLE tokens (
     token_hash TEXT PRIMARY KEY,
     kind TEXT NOT NULL,
     client_id TEXT NOT NULL,
     data TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   );
   CREATE TABLE pending (
     id TEXT PRIMARY KEY,
     kind TEXT NOT NULL,
     data TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   );`,
];

export function openDb(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    db.exec(MIGRATIONS[v]!);
    db.exec(`PRAGMA user_version = ${v + 1}`);
    db.exec('COMMIT');
  }
  return db;
}

export function purgeExpired(db: Db): void {
  const now = Date.now();
  for (const table of ['auth_codes', 'tokens', 'pending']) {
    db.prepare(`DELETE FROM ${table} WHERE expires_at < ?`).run(now);
  }
}

// Short-lived server-side state (OAuth round trips, consent screens).
export function putPending(db: Db, id: string, kind: string, data: unknown, ttlMs: number): void {
  db.prepare('INSERT INTO pending (id, kind, data, expires_at) VALUES (?, ?, ?, ?)').run(
    id,
    kind,
    JSON.stringify(data),
    Date.now() + ttlMs,
  );
}

export function getPending<T>(db: Db, id: string, kind: string): T | undefined {
  const row = db
    .prepare('SELECT data, expires_at FROM pending WHERE id = ? AND kind = ?')
    .get(id, kind) as { data: string; expires_at: number } | undefined;
  if (!row || row.expires_at < Date.now()) return undefined;
  return JSON.parse(row.data) as T;
}

export function takePending<T>(db: Db, id: string, kind: string): T | undefined {
  const value = getPending<T>(db, id, kind);
  // Only consume the row if it is of the requested kind.
  db.prepare('DELETE FROM pending WHERE id = ? AND kind = ?').run(id, kind);
  return value;
}
