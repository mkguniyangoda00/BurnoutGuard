import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer reports and journal', () => {
  test('weekly report downloads and journal entry persists', async ({ page }) => {
    await loginAs(page, 'Developer');

    // Ensure a report exists for this account regardless of cron/prior test
    // state — reports are only generated weekly or on demand, never implicitly.
    const token = await page.evaluate(() => localStorage.getItem('token'));
    await page.request.post('http://localhost:5000/api/reports/generate', {
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.goto('/developer/reports');
    await expect(page.getByRole('heading', { name: /week \d+ wellness report/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /risk score trend/i })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export pdf/i }).click();
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
