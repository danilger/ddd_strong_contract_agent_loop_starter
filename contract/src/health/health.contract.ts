import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

/** Ответ health-check */
export const HealthSchema = z.object({
  ok: z.literal(true),
});

export type HealthDto = z.infer<typeof HealthSchema>;

/** Liveness для Playwright и оркестрации */
export const healthContract = c.router({
  /** Сервер жив */
  getHealth: {
    method: 'GET',
    path: '/health',
    responses: {
      200: HealthSchema,
    },
  },
});
