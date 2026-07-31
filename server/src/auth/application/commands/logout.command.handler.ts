import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionInvalidError } from '../../domain/errors/auth.errors';
import {
  UNIT_OF_WORK,
  type UnitOfWorkPort,
} from '../../../db/unit-of-work.port';
import {
  SESSION_WRITE_REPOSITORY,
  type SessionWriteRepositoryPort,
} from '../ports/session.write.repository.port';
import {
  TOKEN_SERVICE_PORT,
  type TokenServicePort,
} from '../ports/token.service.port';
import { LogoutCommand } from './logout.command';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<
  LogoutCommand,
  void
> {
  constructor(
    @Inject(SESSION_WRITE_REPOSITORY)
    private readonly sessionWriteRepository: SessionWriteRepositoryPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  /**
   * Отзывает сессию по refresh-токену.
   */
  async execute(command: LogoutCommand): Promise<void> {
    const hash = this.tokenService.hashToken(command.refreshToken);
    const session =
      await this.sessionWriteRepository.loadByRefreshTokenHash(hash);
    if (!session) {
      throw new SessionInvalidError();
    }

    session.revoke();
    await this.unitOfWork.execute(async () => {
      await this.sessionWriteRepository.save(session);
    });
  }
}
