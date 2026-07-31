import { describe, expect, it } from 'vitest';
import { api } from './client';

/** Smoke: typed client экспортирует auth из контракта */
describe('shared/api', () => {
  it('exposes auth methods from apiContract', () => {
    expect(typeof api.register).toBe('function');
    expect(typeof api.login).toBe('function');
    expect(typeof api.getMe).toBe('function');
  });
});
