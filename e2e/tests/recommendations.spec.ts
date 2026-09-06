import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer recommendations', () => {
  test('shows the empty state when the latest prediction has no recommendations', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.waitForFunction(() => {
      return Boolean(localStorage.getItem('bg_token') || localStorage.getItem('token'));
    });

    await page.goto('/developer/recommendations');
    await expect(page.getByRole('heading', { name: /your action plan|your 7-day recovery plan/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/no active recommendations right now/i)).toBeVisible();
    await expect(page.locator('.rec-card')).toHaveCount(0);
  });
});
