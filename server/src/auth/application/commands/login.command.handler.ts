import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session } from '../../domain/entities/session.entity';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import {
  UNIT_OF_WORK,
  type UnitOfWorkPort,
} from '../../../db/unit-of-work.port';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../ports/password-hasher.port';
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
import { LoginCommand, type LoginResult } from './login.command';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<
  LoginCommand,
  LoginResult
> {
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: UserWriteRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(SESSION_WRITE_REPOSITORY)
    private readonly sessionWriteRepository: SessionWriteRepositoryPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  /**
   * Проверяет пароль и создаёт session + access JWT.
   */
  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userWriteRepository.loadByEmail(command.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await this.passwordHasher.verify(
      command.password,
      user.getPasswordHash(),
    );
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    const refreshToken = this.tokenService.generateRefreshToken();
    const session = Session.create({
      userId: user.getId().getValue(),
      refreshTokenHash: this.tokenService.hashToken(refreshToken),
      expiresAt: this.tokenService.getRefreshExpiresAt(),
    });

    await this.unitOfWork.execute(async () => {
      await this.sessionWriteRepository.save(session);
    });

    const accessToken = this.tokenService.signAccessToken({
      sub: user.getId().getValue(),
      sid: session.getId(),
    });

    return { accessToken, refreshToken };
  }
}
