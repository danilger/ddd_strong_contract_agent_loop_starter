import { expect, test } from '@playwright/test';

test.describe('hello API', () => {
  test('GET / returns Hello World message', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Hello World!' });
  });
});
