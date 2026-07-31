import { expect, test } from '@playwright/test';

test.describe('hello UI', () => {
  test('shows message from API', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Starter client' }),
    ).toBeVisible();
    await expect(page.getByText('Hello World!')).toBeVisible({
      timeout: 15_000,
    });
  });
});
