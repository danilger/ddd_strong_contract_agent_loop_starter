import { Injectable } from '@nestjs/common';
import {
  UserReadModel,
  UserReadRepositoryPort,
} from '../../application/ports/user.read.repository.port';
import {
  UserWriteRepositoryPort,
} from '../../application/ports/user.write.repository.port';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class InMemoryUserRepositoryAdapter
  implements UserWriteRepositoryPort, UserReadRepositoryPort
{
  private readonly store = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.store.set(user.getId().getValue(), user);
  }

  async loadById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async loadByEmail(email: string): Promise<User | null> {
    return (
      Array.from(this.store.values()).find(
        (user) => user.getEmail().getValue() === email,
      ) ?? null
    );
  }

  async delete(id: string): Promise<void> {
    if (!this.store.delete(id)) {
      throw new Error('User not found');
    }
  }

  async findById(id: string): Promise<UserReadModel | null> {
    const user = this.store.get(id);
    if (!user) return null;
    return this.toReadModel(user);
  }

  async findAll(): Promise<UserReadModel[]> {
    return Array.from(this.store.values()).map((user) => this.toReadModel(user));
  }

  private toReadModel(user: User): UserReadModel {
    return {
      id: user.getId().getValue(),
      name: user.getName(),
      email: user.getEmail().getValue(),
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString(),
    };
  }
}
