import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionInvalidError } from '../../domain/errors/auth.errors';
import {
  SESSION_WRITE_REPOSITORY,
  type SessionWriteRepositoryPort,
} from '../ports/session.write.repository.port';
import {
  TOKEN_SERVICE_PORT,
  type TokenServicePort,
} from '../ports/token.service.port';
import {
  USER_WRITE_REPOSITORY,
  type UserWriteRepositoryPort,
} from '../ports/user.write.repository.port';
import { RefreshSessionCommand } from './refresh-session.command';

@Injectable()
@CommandHandler(RefreshSessionCommand)
export class RefreshSessionCommandHandler implements ICommandHandler<
  RefreshSessionCommand,
  string
> {
  constructor(
    @Inject(SESSION_WRITE_REPOSITORY)
    private readonly sessionWriteRepository: SessionWriteRepositoryPort,
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: UserWriteRepositoryPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
  ) {}

  /**
   * Выдаёт новый access по валидному refresh.
   */
  async execute(command: RefreshSessionCommand): Promise<string> {
    const hash = this.tokenService.hashToken(command.refreshToken);
    const session =
      await this.sessionWriteRepository.loadByRefreshTokenHash(hash);
    if (!session) {
      throw new SessionInvalidError();
    }

    try {
      session.assertActive();
    } catch {
      throw new SessionInvalidError();
    }

    const user = await this.userWriteRepository.loadById(session.getUserId());
    if (!user) {
      throw new SessionInvalidError();
    }

    return this.tokenService.signAccessToken({
      sub: user.getId().getValue(),
      sid: session.getId(),
    });
  }
}
