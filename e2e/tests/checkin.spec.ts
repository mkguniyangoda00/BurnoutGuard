import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe.serial('developer check-in flow', () => {
  test('submits a full check-in and surfaces updated developer views', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.goto('/developer/check-in');

    await expect(page.getByRole('heading', { name: /sleep/i })).toBeVisible();
    await page.locator('textarea').last().fill('Integration test journal note');
    await page.getByRole('button', { name: /submit check-in/i }).click();

    await expect(page.getByRole('heading', { name: /check-in submitted/i })).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: /back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/developer\/dashboard$/);
    await expect(page.getByText(/risk level/i).first()).toBeVisible();

    await page.goto('/developer/explanation');
    await expect(page.getByRole('heading', { name: /risk areas/i })).toBeVisible();
    await expect(page.getByText(/protective/i)).toBeVisible();
  }, 90_000);
});
