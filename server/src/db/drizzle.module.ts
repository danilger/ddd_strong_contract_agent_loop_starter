import { Global, Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { DB } from './db.port';
import { SQLITE } from './sqlite.unit-of-work';
import { SqliteUnitOfWork } from './sqlite.unit-of-work';
import { UNIT_OF_WORK } from './unit-of-work.port';
import * as schema from './schema';

/**
 * Создаёт каталог для файла SQLite при необходимости.
 */
function ensureDbDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

@Global()
@Module({
  providers: [
    {
      provide: SQLITE,
      useFactory: () => {
        const filePath = resolve(
          process.env.DATABASE_PATH ??
            join(process.cwd(), 'data', 'app.sqlite'),
        );
        ensureDbDir(filePath);
        const sqlite = new Database(filePath);
        sqlite.pragma('journal_mode = WAL');
        sqlite.pragma('foreign_keys = ON');
        return sqlite;
      },
    },
    {
      provide: DB,
      inject: [SQLITE],
      useFactory: (sqlite: Database.Database) => {
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL REFERENCES users(id),
            refresh_token_hash TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            revoked_at INTEGER,
            created_at INTEGER NOT NULL
          );
        `);
        return drizzle(sqlite, { schema });
      },
    },
    { provide: UNIT_OF_WORK, useClass: SqliteUnitOfWork },
  ],
  exports: [DB, SQLITE, UNIT_OF_WORK],
})
export class DrizzleModule {}
