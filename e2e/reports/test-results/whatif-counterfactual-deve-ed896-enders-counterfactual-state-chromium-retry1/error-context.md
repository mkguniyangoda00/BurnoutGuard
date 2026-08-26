# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: whatif-counterfactual.spec.ts >> developer what-if and counterfactual >> what-if updates risk score and my risk renders counterfactual state
- Location: tests\whatif-counterfactual.spec.ts:5:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByText(/predicted risk score/i).locator('..')
Expected pattern: /%/
Received string:  "Predicted Risk Score0.92High"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByText(/predicted risk score/i).locator('..')
    14 × locator resolved to <div class="card ">…</div>
       - unexpected value "Predicted Risk Score0.92High"

```

```yaml
- text: Predicted Risk Score 0.92 High
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('developer what-if and counterfactual', () => {
  5  |   test('what-if updates risk score and my risk renders counterfactual state', async ({ page }) => {
  6  |     await loginAs(page, 'Developer');
  7  | 
  8  |     await page.goto('/developer/what-if');
  9  |     const initialScore = await page.getByText(/predicted risk score/i).locator('..').textContent();
  10 |     const sliders = page.locator('input[type="range"]');
  11 |     await sliders.nth(0).fill('8');
  12 |     await sliders.nth(1).fill('12');
  13 |     await expect(page.getByText(/predicted risk score/i).locator('..')).not.toHaveText(initialScore ?? '');
> 14 |     await expect(page.getByText(/predicted risk score/i).locator('..')).toContainText(/%/);
     |                                                                         ^ Error: expect(locator).toContainText(expected) failed
  15 | 
  16 |     await page.goto('/developer/my-risk');
  17 |     const counterfactual = page.locator('text=Counterfactual').first();
  18 |     if (await counterfactual.count()) {
  19 |       await expect(counterfactual).toBeVisible();
  20 |     } else {
  21 |       await expect(page.getByText(/counterfactual/i)).toHaveCount(0);
  22 |     }
  23 |   });
  24 | });
  25 | 
```