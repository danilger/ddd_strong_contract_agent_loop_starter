import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type {
  AccessTokenPayload,
  TokenServicePort,
} from '../../application/ports/token.service.port';

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 7;

/** JWT + refresh token service */
@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Подписывает access JWT.
   */
  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TTL });
  }

  /**
   * Генерирует opaque refresh-токен.
   */
  generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * SHA-256 hash токена для хранения.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Срок жизни refresh-сессии.
   */
  getRefreshExpiresAt(): Date {
    return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  }
}
