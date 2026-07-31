import { randomUUID } from 'crypto';
import { SessionInvalidError } from '../errors/auth.errors';

/** Refresh-сессия пользователя */
export class Session {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private refreshTokenHash: string,
    private expiresAt: Date,
    private revokedAt: Date | null,
    private readonly createdAt: Date,
  ) {}

  /**
   * Создаёт активную сессию с hash refresh-токена.
   */
  static create(props: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Session {
    return new Session(
      randomUUID(),
      props.userId,
      props.refreshTokenHash,
      props.expiresAt,
      null,
      new Date(),
    );
  }

  /**
   * Восстанавливает сессию из persistence.
   */
  static rehydrate(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }): Session {
    return new Session(
      props.id,
      props.userId,
      props.refreshTokenHash,
      props.expiresAt,
      props.revokedAt,
      props.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getRefreshTokenHash(): string {
    return this.refreshTokenHash;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  /** Проверяет, что сессия не отозвана и не истекла */
  assertActive(): void {
    if (this.revokedAt || this.expiresAt.getTime() <= Date.now()) {
      throw new SessionInvalidError();
    }
  }

  /** Отзывает сессию */
  revoke(): void {
    this.revokedAt = new Date();
  }
}
