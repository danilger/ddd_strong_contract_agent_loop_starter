import type { User } from '../../domain/entities/user.entity';

export const USER_WRITE_REPOSITORY = Symbol('USER_WRITE_REPOSITORY');

/** Write-порт пользователя */
export interface UserWriteRepositoryPort {
  save(user: User): Promise<void>;
  loadById(id: string): Promise<User | null>;
  loadByEmail(email: string): Promise<User | null>;
}
