import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer reports and journal', () => {
  test('weekly report downloads and journal entry persists', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.goto('/developer/reports');
    await expect(page.getByText(/weekly wellness report/i)).toBeVisible();
    await expect(page.getByText(/risk score trend/i)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export \/ print/i }).click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toContain('.pdf');

    await page.goto('/developer/journal');
    const unique = `E2E reflection ${Date.now()}`;
    await page.locator('textarea').first().fill(unique);
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(unique)).toBeVisible();
    await expect(page.getByText(/past reflections/i)).toBeVisible();
  });
});
