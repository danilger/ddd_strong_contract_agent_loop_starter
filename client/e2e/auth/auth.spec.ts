import { expect, test } from '@playwright/test';

test.describe('auth UI', () => {
  test('register, login and show me', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'password1';

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Auth' })).toBeVisible();

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByTestId('auth-status')).toContainText('Registered', {
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByTestId('auth-status')).toHaveText('Logged in');

    await page.getByRole('button', { name: 'Me' }).click();
    await expect(page.getByTestId('auth-me')).toContainText(email);
  });
});
