import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../../../db/db.port';
import { dbContext, type AppDatabase } from '../../../db/db.context';
import * as schema from '../../../db/schema';
import type { UserWriteRepositoryPort } from '../../application/ports/user.write.repository.port';
import type { UserReadRepositoryPort } from '../../application/ports/user.read.repository.port';
import { User } from '../../domain/entities/user.entity';
import { EmailAlreadyExistsError } from '../../domain/errors/auth.errors';

/** Drizzle-адаптер User write/read */
@Injectable()
export class DrizzleUserRepositoryAdapter
  implements UserWriteRepositoryPort, UserReadRepositoryPort
{
  constructor(@Inject(DB) private readonly rootDb: AppDatabase) {}

  private get db(): AppDatabase {
    return dbContext.getStore() ?? this.rootDb;
  }

  /**
   * Сохраняет пользователя (insert или update hash).
   */
  async save(user: User): Promise<void> {
    const row = {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      passwordHash: user.getPasswordHash(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };

    const existing = await this.loadById(row.id);
    if (existing) {
      await this.db
        .update(schema.usersTable)
        .set({
          passwordHash: row.passwordHash,
          updatedAt: row.updatedAt,
        })
        .where(eq(schema.usersTable.id, row.id));
      return;
    }

    try {
      await this.db.insert(schema.usersTable).values(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }

  /**
   * Загружает агрегат по id.
   */
  async loadById(id: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.id, id));
    const row = rows[0];
    if (!row) return null;
    return this.toAggregate(row);
  }

  /**
   * Загружает агрегат по email.
   */
  async loadByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.email, email.trim().toLowerCase()));
    const row = rows[0];
    if (!row) return null;
    return this.toAggregate(row);
  }

  /**
   * Read-модель для /auth/me.
   */
  async findById(
    id: string,
  ): Promise<{ userId: string; email: string } | null> {
    const user = await this.loadById(id);
    if (!user) return null;
    return {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
    };
  }

  private toAggregate(row: typeof schema.usersTable.$inferSelect): User {
    return User.rehydrate({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

/**
 * Определяет unique-constraint ошибку SQLite.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}
