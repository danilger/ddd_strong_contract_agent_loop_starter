import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DB } from './db.port';
import { dbContext, type AppDatabase } from './db.context';
import type { UnitOfWorkPort } from './unit-of-work.port';

/** DI-токен raw better-sqlite3 Database */
export const SQLITE = Symbol('SQLITE');

/** Unit of Work на BEGIN/COMMIT для async handlers */
@Injectable()
export class SqliteUnitOfWork implements UnitOfWorkPort {
  constructor(
    @Inject(DB) private readonly db: AppDatabase,
    @Inject(SQLITE) private readonly sqlite: Database.Database,
  ) {}

  /**
   * Выполняет callback в одной SQLite-транзакции.
   */
  async execute<T>(work: () => Promise<T> | T): Promise<T> {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const result = await dbContext.run(this.db, () => work());
      this.sqlite.exec('COMMIT');
      return result;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
}
