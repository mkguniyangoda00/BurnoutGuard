import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer recommendations', () => {
  test('completes a recommendation and persists effectiveness rating', async ({ page }) => {
    await loginAs(page, 'Developer');
    await page.goto('/developer/recommendations');

    await expect(page.locator('.rec-card').first()).toBeVisible();

    const firstCard = page.locator('.rec-card').first();
    await firstCard.getByRole('button').click();
    await expect(firstCard).toContainText(/did this help\?/i);

    await firstCard.getByRole('button', { name: '5' }).click();
    await page.reload();
    await expect(page.locator('.rec-card').first()).toContainText(/5/);
  });
});
