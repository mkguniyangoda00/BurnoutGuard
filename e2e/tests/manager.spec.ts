import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('manager analytics', () => {
  test('team overview shows core panels and team what-if updates comparison', async ({ page }) => {
    await loginAs(page, 'Manager');

    await page.goto('/manager/dashboard');
    await expect(page.getByRole('heading', { name: /team burnout heatmap/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /workload hotspots/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /team risk factors/i })).toBeVisible();

    const teamRiskSection = page.getByRole('heading', { name: /team risk factors/i }).locator('..');
    await expect(teamRiskSection).toContainText(/of \d+ developers/i);
    await expect(teamRiskSection).toContainText(/risk increasing|protective|not enough data/i);

    await expect(page.getByRole('heading', { name: /team what-if simulation/i })).toBeVisible();
    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).evaluate((el) => {
      (el as HTMLInputElement).value = '2';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sliders.nth(1).evaluate((el) => {
      (el as HTMLInputElement).value = '3';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sliders.nth(2).evaluate((el) => {
      (el as HTMLInputElement).value = '2';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.getByRole('button', { name: /simulate/i }).click();
    await expect(page.getByText(/before/i)).toBeVisible();
    await expect(page.getByText(/after/i)).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
  });
});
