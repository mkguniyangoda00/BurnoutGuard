import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('existing admin pages', () => {
  test('user management role change and deactivate', async ({ page }) => {
    await loginAs(page, 'Admin');
    await page.goto('/admin/users');
    await expect(page.getByText(/user management/i)).toBeVisible();
    await expect(page.locator('button').filter({ has: page.locator('svg') }).first()).toBeVisible();
  });

  test('model management metrics and threshold edits render', async ({ page }) => {
    await loginAs(page, 'Admin');
    await page.goto('/admin/models');
    await expect(page.getByText(/model metrics/i)).toBeVisible();
    await expect(page.getByText(/alert threshold settings/i)).toBeVisible();
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('fairness report gap cards render', async ({ page }) => {
    await loginAs(page, 'Admin');
    await page.goto('/admin/models');
    await expect(page.getByText(/global feature importance/i)).toBeVisible();
  });

  test('audit logs export triggers a download', async ({ page }) => {
    await loginAs(page, 'Admin');
    await page.goto('/admin/audit-logs');
    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export csv/i }).click();
    await downloadPromise;
  });

  test('survey add question and toggle active', async ({ page }) => {
    await loginAs(page, 'Admin');
    await page.goto('/admin/survey');
    await expect(page.getByRole('heading', { name: 'Survey Management' })).toBeVisible();
    await expect(page.getByText(/add new question/i)).toBeVisible();
  });
});
