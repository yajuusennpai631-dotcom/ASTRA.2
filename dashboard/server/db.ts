import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Cloudflare D1 互換のラッパー。
 * worker/index.ts が使う prepare().bind().run()/first()/all() だけを実装している。
 */
class Statement implements D1PreparedStatement {
  constructor(private db: Database.Database, private sql: string, private params: unknown[] = []) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new Statement(this.db, this.sql, values);
  }

  async run(): Promise<D1Result> {
    const info = this.db.prepare(this.sql).run(...(this.params as never[]));
    return { results: [], success: true, meta: { changes: info.changes } };
  }

  async first<T = unknown>(): Promise<T | null> {
    return (this.db.prepare(this.sql).get(...(this.params as never[])) as T | undefined) ?? null;
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const results = this.db.prepare(this.sql).all(...(this.params as never[])) as T[];
    return { results, success: true, meta: { changes: 0 } };
  }
}

export function openDatabase(path: string, migrationsDir: string): D1Database {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new Database(path);
  db.pragma('journal_mode = WAL');

  // migrations/*.sql を名前順に適用（すべて IF NOT EXISTS なので再実行しても安全）
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    console.log(`migration applied: ${file}`);
  }

  return { prepare: (sql: string) => new Statement(db, sql) };
}
