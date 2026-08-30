import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('hr analytics', () => {
  test('department overview and trends render real charts', async ({ page }) => {
    await loginAs(page, 'HRofficer');

    await page.goto('/hr/department-overview');
    await expect(page.getByRole('heading', { name: /burnout risk distribution by department/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /factor insights/i })).toBeVisible();
    await expect(page.getByText(/job role/i).first()).toBeVisible();
    await expect(page.getByText(/work mode/i).first()).toBeVisible();

    await page.goto('/hr/trends');
    await expect(page.getByRole('button', { name: /risk trend/i })).toBeVisible();
    await page.getByRole('button', { name: /risk trend/i }).click();
    await expect(page.getByText(/risk trend/i).first()).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();

    await page.getByRole('button', { name: /sleep & lifestyle/i }).click();
    await expect(page.getByText(/sleep & lifestyle/i).first()).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.getByText(/not available/i)).toHaveCount(0);
  });
});
