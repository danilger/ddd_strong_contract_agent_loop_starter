import { initContract } from '@ts-rest/core';
import { authContract } from './auth/auth.contract';
import { healthContract } from './health/health.contract';

const c = initContract();

/** Агрегированный HTTP-контракт API */
export const apiContract = c.router({
  ...healthContract,
  ...authContract,
});

export * from './shared/api.common';
export * from './auth/auth.schemas';
export * from './auth/auth.contract';
export * from './health/health.contract';
