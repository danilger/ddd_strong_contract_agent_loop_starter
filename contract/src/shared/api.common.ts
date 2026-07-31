import { z } from 'zod';

/** Тело ошибки API */
export const ErrorBodySchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

export type ErrorBodyDto = z.infer<typeof ErrorBodySchema>;
