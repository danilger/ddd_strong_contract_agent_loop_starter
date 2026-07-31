import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../../../db/db.port';
import { dbContext, type AppDatabase } from '../../../db/db.context';
import * as schema from '../../../db/schema';
import type { SessionWriteRepositoryPort } from '../../application/ports/session.write.repository.port';
import { Session } from '../../domain/entities/session.entity';

/** Drizzle-адаптер Session write */
@Injectable()
export class DrizzleSessionRepositoryAdapter implements SessionWriteRepositoryPort {
  constructor(@Inject(DB) private readonly rootDb: AppDatabase) {}

  private get db(): AppDatabase {
    return dbContext.getStore() ?? this.rootDb;
  }

  /**
   * Сохраняет или обновляет сессию (revoke).
   */
  async save(session: Session): Promise<void> {
    const row = {
      id: session.getId(),
      userId: session.getUserId(),
      refreshTokenHash: session.getRefreshTokenHash(),
      expiresAt: session.getExpiresAt(),
      revokedAt: session.getRevokedAt(),
      createdAt: session.getCreatedAt(),
    };

    const existing = await this.db
      .select()
      .from(schema.sessionsTable)
      .where(eq(schema.sessionsTable.id, row.id));

    if (existing[0]) {
      await this.db
        .update(schema.sessionsTable)
        .set({
          refreshTokenHash: row.refreshTokenHash,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
        })
        .where(eq(schema.sessionsTable.id, row.id));
      return;
    }

    await this.db.insert(schema.sessionsTable).values(row);
  }

  /**
   * Ищет сессию по hash refresh-токена.
   */
  async loadByRefreshTokenHash(hash: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(schema.sessionsTable)
      .where(eq(schema.sessionsTable.refreshTokenHash, hash));
    const row = rows[0];
    if (!row) return null;
    return Session.rehydrate({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }
}
