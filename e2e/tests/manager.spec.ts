import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('manager analytics', () => {
  test('team overview shows core panels and team what-if updates comparison', async ({ page }) => {
    await loginAs(page, 'Manager');

    await page.goto('/manager/dashboard');
    await expect(page.getByText(/team burnout heatmap/i)).toBeVisible();
    await expect(page.getByText(/workload hotspots/i)).toBeVisible();
    await expect(page.getByText(/team risk factors/i)).toBeVisible();

    const teamRiskSection = page.getByText(/team risk factors/i).locator('..');
    await expect(teamRiskSection).toContainText(/of \d+ developers/i);
    await expect(teamRiskSection).toContainText(/risk increasing|protective|not enough data/i);

    await expect(page.getByText(/team what-if simulator/i)).toBeVisible();
    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).fill('2');
    await sliders.nth(1).fill('3');
    await sliders.nth(2).fill('4');
    await page.getByRole('button', { name: /simulate/i }).click();
    await expect(page.getByText(/before/i)).toBeVisible();
    await expect(page.getByText(/after/i)).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
  });
});
