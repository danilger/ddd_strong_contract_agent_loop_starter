import { initClient } from '@ts-rest/core';
import { apiContract } from '@repo/contract';

/** Typed HTTP-клиент к `@repo/contract` */
export const api = initClient(apiContract, {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  baseHeaders: {},
});
