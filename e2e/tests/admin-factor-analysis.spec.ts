import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('admin factor analysis', () => {
  test('all factor analysis tabs render and update', async ({ page }) => {
    await loginAs(page, 'Admin');
    await page.goto('/admin/factor-analysis');

    await expect(page.getByText(/auto-generated insights/i)).toBeVisible();
    await expect(page.getByText(/association in the observed dataset/i)).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();

    const dimensionSelect = page.locator('select').nth(0);
    for (const label of ['Experience', 'Job Role', 'Work Mode']) {
      await dimensionSelect.selectOption({ label });
      await expect(page.getByText(/loading demographic analysis/i)).toBeHidden({ timeout: 10000 });
      await expect(page.locator('table')).toBeVisible();
    }
    await dimensionSelect.selectOption({ label: 'Age Group' });

    await page.getByRole('button', { name: /factor explorer/i }).click();
    await expect(page.getByRole('heading', { name: /factor explorer/i })).toBeVisible();
    const factorSelect = page.locator('select').last();
    for (const value of ['sleepHours', 'overtimeHours', 'stressLevel']) {
      await factorSelect.selectOption(value);
      await expect(page.getByText(/pearson correlation/i)).toBeVisible();
      await expect(page.locator('svg').first()).toBeVisible();
    }

    await page.getByRole('button', { name: /interaction analysis/i }).click();
    await expect(page.getByRole('heading', { name: /interaction analysis/i })).toBeVisible();
    const selects = page.locator('select');
    await selects.nth(0).selectOption('sleepHours');
    await selects.nth(1).selectOption('overtimeHours');
    await expect(page.getByRole('heading', { name: /interaction analysis/i })).toBeVisible();
    await expect(page.locator('text=insufficient data').first()).toBeVisible();
  });
});
