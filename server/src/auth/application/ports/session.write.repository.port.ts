import type { Session } from '../../domain/entities/session.entity';

export const SESSION_WRITE_REPOSITORY = Symbol('SESSION_WRITE_REPOSITORY');

/** Write-порт сессий */
export interface SessionWriteRepositoryPort {
  save(session: Session): Promise<void>;
  loadByRefreshTokenHash(hash: string): Promise<Session | null>;
}
