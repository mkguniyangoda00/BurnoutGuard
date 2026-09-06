import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer what-if and counterfactual', () => {
  test('what-if updates risk score and my risk renders counterfactual state', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.goto('/developer/what-if');
    const riskCard = page.locator('text=Predicted Risk Score').locator('..');
    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).fill('8');
    await sliders.nth(1).fill('12');
    await expect(riskCard.getByRole('img')).toHaveCount(0);
    await expect(riskCard.getByText(/predicted risk score/i)).toBeVisible();
    await expect(riskCard.getByText(/0\.\d{2}/)).toBeVisible({ timeout: 15000 });

    await page.goto('/developer/my-risk');
    await expect(page.getByRole('heading', { name: /rq3 interface condition/i })).toBeVisible();
    await expect(page.getByText(/prediction-only, prediction\+shap, and prediction\+shap\+counterfactual\/recommendation/i)).toBeVisible();
  });
});
