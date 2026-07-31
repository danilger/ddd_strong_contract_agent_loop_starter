import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccessTokenPayload } from '../application/ports/token.service.port';

/** JWT Bearer strategy (только sub + sid) */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
    });
  }

  /**
   * Прокидывает payload в request.user.
   */
  validate(payload: AccessTokenPayload): AccessTokenPayload {
    return payload;
  }
}
