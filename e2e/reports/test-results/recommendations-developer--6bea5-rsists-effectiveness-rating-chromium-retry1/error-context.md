# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recommendations.spec.ts >> developer recommendations >> completes a recommendation and persists effectiveness rating
- Location: tests\recommendations.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.rec-card').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.rec-card').first()

```

```yaml
- button "Open wellbeing chat"
- navigation:
  - link "BurnoutGuard":
    - /url: /
  - link "Dashboard":
    - /url: /developer/dashboard
  - link "Check-in":
    - /url: /developer/check-in
  - link "My Risk":
    - /url: /developer/my-risk
  - link "Recommendations":
    - /url: /developer/recommendations
  - link "Reports":
    - /url: /developer/reports
  - link "Journal":
    - /url: /developer/journal
  - link "Wellness Resources":
    - /url: /wellness-resources
  - button "Toggle dark mode"
  - button "Notifications"
  - button "Language"
  - button "Profile menu": JD
- button "Need help now?"
- main:
  - heading "Your Action Plan" [level=1]
  - paragraph: 0 personalized recommendations based on your SHAP analysis
  - button "Counseling & Wellness Resources"
  - paragraph: No active recommendations right now — your recent check-ins look stable. Keep it up!
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('developer recommendations', () => {
  5  |   test('completes a recommendation and persists effectiveness rating', async ({ page }) => {
  6  |     await loginAs(page, 'Developer');
  7  |     await page.goto('/developer/recommendations');
  8  | 
> 9  |     await expect(page.locator('.rec-card').first()).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     const firstCard = page.locator('.rec-card').first();
  12 |     await firstCard.getByRole('button').click();
  13 |     await expect(firstCard).toContainText(/did this help\?/i);
  14 | 
  15 |     await firstCard.getByRole('button', { name: '5' }).click();
  16 |     await page.reload();
  17 |     await expect(page.locator('.rec-card').first()).toContainText(/5/);
  18 |   });
  19 | });
  20 | 
```