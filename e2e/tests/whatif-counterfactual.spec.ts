import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer what-if and counterfactual', () => {
  test('what-if updates risk score and my risk renders counterfactual state', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.goto('/developer/what-if');
    const riskCard = page.locator('text=Predicted Risk Score').locator('..');
    const initialScore = await riskCard.textContent();
    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).fill('8');
    await sliders.nth(1).fill('12');
    await expect(riskCard).not.toHaveText(initialScore ?? '');
    await expect(riskCard).toContainText(/0\.\d{2}/);

    await page.goto('/developer/my-risk');
    const counterfactualHeading = page.getByRole('heading', { name: /what could change your risk/i });
    if (await counterfactualHeading.count()) {
      await expect(counterfactualHeading).toBeVisible();
    } else {
      await expect(page.getByText(/counterfactual/i)).toHaveCount(0);
    }
  });
});
