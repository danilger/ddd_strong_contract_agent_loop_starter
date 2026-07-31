import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port';

const ROUNDS = 10;

/** bcrypt-адаптер паролей */
@Injectable()
export class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  /**
   * Хеширует пароль.
   */
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, ROUNDS);
  }

  /**
   * Сверяет пароль с hash.
   */
  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
