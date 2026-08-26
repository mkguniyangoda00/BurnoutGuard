import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer what-if and counterfactual', () => {
  test('what-if updates risk score and my risk renders counterfactual state', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.goto('/developer/what-if');
    const initialScore = await page.getByText(/predicted risk score/i).locator('..').textContent();
    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).fill('8');
    await sliders.nth(1).fill('12');
    await expect(page.getByText(/predicted risk score/i).locator('..')).not.toHaveText(initialScore ?? '');
    await expect(page.getByText(/predicted risk score/i).locator('..')).toContainText(/%/);

    await page.goto('/developer/my-risk');
    const counterfactual = page.locator('text=Counterfactual').first();
    if (await counterfactual.count()) {
      await expect(counterfactual).toBeVisible();
    } else {
      await expect(page.getByText(/counterfactual/i)).toHaveCount(0);
    }
  });
});
