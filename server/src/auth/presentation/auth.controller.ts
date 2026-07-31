import { Controller, HttpException, Req, Res, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { authContract } from '@repo/contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request, Response } from 'express';
import { LogoutCommand } from '../application/commands/logout.command';
import { RefreshSessionCommand } from '../application/commands/refresh-session.command';
import { GetMeQuery } from '../application/queries/get-me.query';
import type { AccessTokenPayload } from '../application/ports/token.service.port';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  SessionInvalidError,
} from '../domain/errors/auth.errors';
import {
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_NAME,
  type AuthenticatedRequest,
} from './auth.constants';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginCommandAdapter } from './login-command.adapter';
import { MeDtoAdapter } from './me-dto.adapter';
import { RegisterUserCommandAdapter } from './register-user-command.adapter';

/** HTTP-граница Auth BC */
@Controller()
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly registerUserCommandAdapter: RegisterUserCommandAdapter,
    private readonly loginCommandAdapter: LoginCommandAdapter,
    private readonly meDtoAdapter: MeDtoAdapter,
  ) {}

  @TsRestHandler(authContract.register, { validateResponses: true })
  register() {
    return tsRestHandler(authContract.register, async ({ body }) => {
      try {
        const userId = await this.commandBus.execute(
          this.registerUserCommandAdapter.adapt(body),
        );
        return { status: 201 as const, body: { userId } };
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }

  @TsRestHandler(authContract.login, { validateResponses: true })
  login(@Res({ passthrough: true }) res: Response) {
    return tsRestHandler(authContract.login, async ({ body }) => {
      try {
        const result = await this.commandBus.execute(
          this.loginCommandAdapter.adapt(body),
        );
        this.setRefreshCookie(res, result.refreshToken);
        return {
          status: 200 as const,
          body: { accessToken: result.accessToken },
        };
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }

  @TsRestHandler(authContract.refresh, { validateResponses: true })
  refresh(@Req() req: Request) {
    return tsRestHandler(authContract.refresh, async () => {
      try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
          string | undefined;
        if (!refreshToken) {
          throw new SessionInvalidError();
        }
        const accessToken = await this.commandBus.execute(
          new RefreshSessionCommand(refreshToken),
        );
        return { status: 200 as const, body: { accessToken } };
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }

  @TsRestHandler(authContract.logout, { validateResponses: true })
  logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return tsRestHandler(authContract.logout, async () => {
      try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!refreshToken) {
          throw new SessionInvalidError();
        }
        await this.commandBus.execute(new LogoutCommand(refreshToken));
        res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });
        return { status: 204 as const, body: undefined };
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }

  @UseGuards(JwtAuthGuard)
  @TsRestHandler(authContract.getMe, { validateResponses: true })
  getMe(@CurrentUser() user: AccessTokenPayload) {
    return tsRestHandler(authContract.getMe, async () => {
      try {
        const model = await this.queryBus.execute(new GetMeQuery(user.sub));
        return {
          status: 200 as const,
          body: this.meDtoAdapter.adaptFromReadModel(model),
        };
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }

  /**
   * Ставит httpOnly refresh cookie.
   */
  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: '/auth',
    });
  }

  /**
   * Маппит доменные ошибки в HTTP.
   */
  private mapError(error: unknown): HttpException {
    if (error instanceof EmailAlreadyExistsError) {
      return new HttpException(
        { message: error.message, code: 'EMAIL_EXISTS' },
        409,
      );
    }
    if (error instanceof InvalidCredentialsError) {
      return new HttpException(
        { message: error.message, code: 'INVALID_CREDENTIALS' },
        401,
      );
    }
    if (error instanceof SessionInvalidError) {
      return new HttpException(
        { message: error.message, code: 'SESSION_INVALID' },
        401,
      );
    }
    if (error instanceof HttpException) {
      return error;
    }
    throw error;
  }
}
