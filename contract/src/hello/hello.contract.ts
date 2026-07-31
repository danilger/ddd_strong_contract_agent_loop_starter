import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

/** Тело ответа приветствия стартера */
export const HelloSchema = z.object({
  message: z.string(),
});

export type HelloDto = z.infer<typeof HelloSchema>;

/** Пример GET / — учебный контракт стартера */
export const helloContract = c.router({
  /** Возвращает приветственное сообщение */
  getHello: {
    method: 'GET',
    path: '/',
    responses: {
      200: HelloSchema,
    },
  },
});
