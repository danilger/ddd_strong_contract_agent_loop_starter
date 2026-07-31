import { initClient } from '@ts-rest/core';
import { apiContract } from '@repo/contract';

let accessToken: string | null = null;

/** Сохраняет access JWT в памяти вкладки */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Текущий access JWT или null */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Typed HTTP-клиент к `@repo/contract` с cookies */
export const api = initClient(apiContract, {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  credentials: 'include',
  baseHeaders: {
    Authorization: () =>
      accessToken ? `Bearer ${accessToken}` : '',
  },
});
