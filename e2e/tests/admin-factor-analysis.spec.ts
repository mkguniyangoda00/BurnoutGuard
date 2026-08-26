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
      await expect(page.getByText(/demographic breakdown/i)).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    }
    await dimensionSelect.selectOption({ label: 'Age Group' });

    await page.getByRole('button', { name: /factor explorer/i }).click();
    const factorSelect = page.locator('select').nth(1);
    for (const label of ['sleepHours', 'overtimeHours', 'stressLevel']) {
      await factorSelect.selectOption({ label });
      await expect(page.getByText(/pearson correlation/i)).toBeVisible();
      await expect(page.locator('svg').first()).toBeVisible();
    }

    await page.getByRole('button', { name: /interaction analysis/i }).click();
    const selects = page.locator('select');
    await selects.nth(1).selectOption({ label: 'sleepHours' });
    await selects.nth(2).selectOption({ label: 'overtimeHours' });
    await expect(page.getByText(/interaction analysis/i)).toBeVisible();
    await expect(page.locator('text=insufficient data').first()).toBeVisible();
  });
});
