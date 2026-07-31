import { z } from 'zod';

export const EmailSchema = z.string().email();

export const PasswordSchema = z.string().min(8);

/** Текущая identity (GET /auth/me) — без ролей */
export const MeSchema = z.object({
  userId: z.string().uuid(),
  email: EmailSchema,
});

export type MeDto = z.infer<typeof MeSchema>;

/** Ответ с access JWT (login, refresh) */
export const AccessTokenSchema = z.object({
  accessToken: z.string(),
});

export type AccessTokenDto = z.infer<typeof AccessTokenSchema>;

/** Результат регистрации */
export const RegisterResultSchema = z.object({
  userId: z.string().uuid(),
});

export type RegisterResultDto = z.infer<typeof RegisterResultSchema>;
