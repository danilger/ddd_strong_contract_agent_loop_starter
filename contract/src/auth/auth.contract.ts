import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ErrorBodySchema } from '../shared/api.common';
import {
  AccessTokenSchema,
  EmailSchema,
  MeSchema,
  PasswordSchema,
  RegisterResultSchema,
} from './auth.schemas';

const c = initContract();

export const RegisterBodySchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const LoginBodySchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type RegisterDto = z.infer<typeof RegisterBodySchema>;
export type LoginDto = z.infer<typeof LoginBodySchema>;

/**
 * Чистый Auth: identity + password + session/JWT.
 * Refresh — только httpOnly cookie.
 */
export const authContract = c.router(
  {
    /** Регистрация по email и паролю */
    register: {
      method: 'POST',
      path: '/auth/register',
      body: RegisterBodySchema,
      responses: {
        201: RegisterResultSchema,
        400: ErrorBodySchema,
        409: ErrorBodySchema,
      },
    },
    /** Вход; access в body, refresh в cookie */
    login: {
      method: 'POST',
      path: '/auth/login',
      body: LoginBodySchema,
      responses: {
        200: AccessTokenSchema,
        400: ErrorBodySchema,
        401: ErrorBodySchema,
      },
    },
    /** Новый access по refresh cookie */
    refresh: {
      method: 'POST',
      path: '/auth/refresh',
      body: c.noBody(),
      responses: {
        200: AccessTokenSchema,
        401: ErrorBodySchema,
      },
    },
    /** Инвалидация сессии и очистка cookie */
    logout: {
      method: 'POST',
      path: '/auth/logout',
      body: c.noBody(),
      responses: {
        204: c.noBody(),
        401: ErrorBodySchema,
      },
    },
    /** Текущий userId и email */
    getMe: {
      method: 'GET',
      path: '/auth/me',
      responses: {
        200: MeSchema,
        401: ErrorBodySchema,
      },
    },
  },
  { strictStatusCodes: true },
);
