import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginCommandHandler } from './application/commands/login.command.handler';
import { LogoutCommandHandler } from './application/commands/logout.command.handler';
import { RefreshSessionCommandHandler } from './application/commands/refresh-session.command.handler';
import { RegisterUserCommandHandler } from './application/commands/register-user.command.handler';
import { UserRegisteredDomainEventHandler } from './application/event-handlers/user-registered.domain-event.handler';
import { PASSWORD_HASHER_PORT } from './application/ports/password-hasher.port';
import { SESSION_WRITE_REPOSITORY } from './application/ports/session.write.repository.port';
import { TOKEN_SERVICE_PORT } from './application/ports/token.service.port';
import { USER_READ_REPOSITORY } from './application/ports/user.read.repository.port';
import { USER_WRITE_REPOSITORY } from './application/ports/user.write.repository.port';
import { GetMeQueryHandler } from './application/queries/get-me.query.handler';
import { BcryptPasswordHasherAdapter } from './infrastructure/adapters/bcrypt-password-hasher.adapter';
import { DrizzleSessionRepositoryAdapter } from './infrastructure/adapters/drizzle-session.repository.adapter';
import { DrizzleUserRepositoryAdapter } from './infrastructure/adapters/drizzle-user.repository.adapter';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { AuthController } from './presentation/auth.controller';
import { JwtStrategy } from './presentation/jwt.strategy';
import { LoginCommandAdapter } from './presentation/login-command.adapter';
import { MeDtoAdapter } from './presentation/me-dto.adapter';
import { RegisterUserCommandAdapter } from './presentation/register-user-command.adapter';

const commandHandlers = [
  RegisterUserCommandHandler,
  LoginCommandHandler,
  RefreshSessionCommandHandler,
  LogoutCommandHandler,
];

const queryHandlers = [GetMeQueryHandler];

const eventHandlers = [UserRegisteredDomainEventHandler];

/** Модуль чистого Auth BC */
@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
    }),
  ],
  controllers: [AuthController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    RegisterUserCommandAdapter,
    LoginCommandAdapter,
    MeDtoAdapter,
    JwtStrategy,
    DrizzleUserRepositoryAdapter,
    {
      provide: USER_WRITE_REPOSITORY,
      useExisting: DrizzleUserRepositoryAdapter,
    },
    {
      provide: USER_READ_REPOSITORY,
      useExisting: DrizzleUserRepositoryAdapter,
    },
    DrizzleSessionRepositoryAdapter,
    {
      provide: SESSION_WRITE_REPOSITORY,
      useExisting: DrizzleSessionRepositoryAdapter,
    },
    BcryptPasswordHasherAdapter,
    { provide: PASSWORD_HASHER_PORT, useExisting: BcryptPasswordHasherAdapter },
    JwtTokenService,
    { provide: TOKEN_SERVICE_PORT, useExisting: JwtTokenService },
  ],
})
export class AuthModule {}
