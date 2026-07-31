import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenPayload } from '../application/ports/token.service.port';
import type { AuthenticatedRequest } from './auth.constants';

/** Текущий JWT payload из request */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
