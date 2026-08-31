import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer recommendations', () => {
  test('completes a recommendation and persists effectiveness rating', async ({ page }) => {
    await loginAs(page, 'Developer');
    await page.goto('/developer/recommendations');

    const firstIncompleteCard = page.locator('.rec-card').filter({ hasText: /request manager support about your workload/i }).first();
    await expect(firstIncompleteCard).toBeVisible();
    await firstIncompleteCard.getByRole('button').first().click();
    await expect(firstIncompleteCard.getByText(/did this help\?/i)).toBeVisible({ timeout: 10000 });

    await firstIncompleteCard.getByRole('button', { name: '5' }).click();
    await expect(firstIncompleteCard.getByText(/did this help\?/i)).toHaveCount(0, { timeout: 10000 });
    await page.reload();
    await expect(page.locator('.rec-card').filter({ hasText: /request manager support about your workload/i }).first()).not.toContainText(/did this help\?/i);
  });
});
