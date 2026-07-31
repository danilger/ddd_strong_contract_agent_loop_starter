import type { AccessTokenPayload } from '../application/ports/token.service.port';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthenticatedRequest = {
  user: AccessTokenPayload;
  cookies?: Record<string, string>;
};
