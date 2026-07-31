import { describe, expect, it } from 'vitest';
import { api } from './client';

/** Smoke: typed client экспортирует getHello из контракта */
describe('shared/api', () => {
  it('exposes getHello from apiContract', () => {
    expect(typeof api.getHello).toBe('function');
  });
});
