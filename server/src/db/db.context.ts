import { AsyncLocalStorage } from 'async_hooks';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

/** Текущий db-клиент внутри UoW (иначе root) */
export const dbContext = new AsyncLocalStorage<AppDatabase>();
