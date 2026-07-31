import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { z } from 'zod';
import { UserSchema } from '@repo/contract';
import {
  UserReadModel,
  UserReadRepositoryPort,
} from '../../application/ports/user.read.repository.port';
import {
  UserWriteRepositoryPort,
} from '../../application/ports/user.write.repository.port';
import { User } from '../../domain/entities/user.entity';
import { DB } from '../../../db/db.port';
import * as schema from '../../../db/schema';

type DbClient = LibSQLDatabase<typeof schema>;

@Injectable()
export class DrizzleUserRepositoryAdapter
  implements UserWriteRepositoryPort, UserReadRepositoryPort
{
  constructor(@Inject(DB) private readonly db: DbClient) {}

  async save(user: User): Promise<void> {
    const row = {
      id: user.getId().getValue(),
      name: user.getName(),
      email: user.getEmail().getValue(),
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString(),
    };

    const existing = await this.loadById(row.id);
    if (existing) {
      const rows = await this.db
        .update(schema.userTable)
        .set({
          name: row.name,
          updatedAt: row.updatedAt,
        })
        .where(eq(schema.userTable.id, row.id))
        .returning();
      const parsed = UserSchema.safeParse(rows[0]);
      if (!parsed.success) {
        throw new Error('DB row does not match shared contract');
      }
      return;
    }

    const rows = await this.db.insert(schema.userTable).values(row).returning();
    const parsed = UserSchema.safeParse(rows[0]);
    if (!parsed.success) {
      throw new Error('DB row does not match shared contract');
    }
  }

  async loadById(id: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.id, id));
    const row = rows[0];
    if (!row) return null;

    return this.toAggregate(row);
  }

  async loadByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.email, email));
    const row = rows[0];
    if (!row) return null;

    return this.toAggregate(row);
  }

  async delete(id: string): Promise<void> {
    const result = await this.db
      .delete(schema.userTable)
      .where(eq(schema.userTable.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error('User not found');
    }
    const parsed = UserSchema.safeParse(result[0]);
    if (!parsed.success) {
      throw new Error('DB row does not match shared contract');
    }
  }

  async findById(id: string): Promise<UserReadModel | null> {
    const rows = await this.db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.id, id));
    const row = rows[0];
    if (!row) return null;

    return this.toReadModel(row);
  }

  async findAll(): Promise<UserReadModel[]> {
    const rows = await this.db.select().from(schema.userTable);
    return rows
      .map((row) => UserSchema.safeParse(row))
      .filter((r): r is z.SafeParseSuccess<z.infer<typeof UserSchema>> => r.success)
      .map((r) => this.toReadModel(r.data));
  }

  private toAggregate(row: z.infer<typeof UserSchema>): User {
    const parsed = UserSchema.safeParse(row);
    if (!parsed.success) {
      throw new Error('DB row does not match shared contract');
    }

    return User.rehydrate({
      id: parsed.data.id,
      name: parsed.data.name,
      email: parsed.data.email,
      createdAt: new Date(parsed.data.createdAt),
      updatedAt: new Date(parsed.data.updatedAt),
    });
  }

  private toReadModel(row: z.infer<typeof UserSchema>): UserReadModel {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
