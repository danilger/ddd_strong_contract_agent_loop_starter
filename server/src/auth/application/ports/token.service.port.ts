/** Claims access JWT — только identity + session */
export type AccessTokenPayload = {
  sub: string;
  sid: string;
};

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');

/** Выпуск и хеш токенов */
export interface TokenServicePort {
  signAccessToken(payload: AccessTokenPayload): string;
  generateRefreshToken(): string;
  hashToken(token: string): string;
  getRefreshExpiresAt(): Date;
}
