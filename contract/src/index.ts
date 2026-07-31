import { initContract } from '@ts-rest/core';
import { helloContract } from './hello/hello.contract';

const c = initContract();

/** Агрегированный HTTP-контракт API */
export const apiContract = c.router({
  ...helloContract,
});

export * from './hello/hello.contract';
