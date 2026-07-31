import { expect, test } from '@playwright/test';

test.describe('auth API', () => {
  test('health is up', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  test('register → login → me → refresh → logout', async ({ request }) => {
    const email = `api-${Date.now()}@example.com`;
    const password = 'password1';

    const register = await request.post('/auth/register', {
      data: { email, password },
    });
    expect(register.status()).toBe(201);
    const { userId } = (await register.json()) as { userId: string };
    expect(userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const login = await request.post('/auth/login', {
      data: { email, password },
    });
    expect(login.status()).toBe(200);
    const { accessToken } = (await login.json()) as { accessToken: string };
    expect(accessToken.length).toBeGreaterThan(10);

    const me = await request.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(me.status()).toBe(200);
    await expect(me.json()).resolves.toEqual({ userId, email });

    const refresh = await request.post('/auth/refresh');
    expect(refresh.status()).toBe(200);
    const refreshed = (await refresh.json()) as { accessToken: string };
    expect(refreshed.accessToken.length).toBeGreaterThan(10);

    const logout = await request.post('/auth/logout');
    expect(logout.status()).toBe(204);
  });
});
