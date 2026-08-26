# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-existing.spec.ts >> existing admin pages >> survey add question and toggle active
- Location: tests\admin-existing.spec.ts:35:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/survey/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/survey/i)

```

```yaml
- button "Open wellbeing chat"
- navigation:
  - link "BurnoutGuard":
    - /url: /
  - link "Users":
    - /url: /admin/users
  - link "Model Metrics":
    - /url: /admin/models
  - link "Audit Logs":
    - /url: /admin/audit-logs
  - button "Toggle dark mode"
  - button "Notifications"
  - button "Language"
  - button "Profile menu": AS
- button "Need help now?"
- main:
  - heading "Good evening, Admin" [level=1]
  - paragraph: Sunday, August 23, 2026
  - button "+ Check-in"
  - text: Current Burnout Risk
  - paragraph: No check-ins yet. Submit your first check-in to see your burnout risk.
  - button "Check-in →"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('existing admin pages', () => {
  5  |   test('user management role change and deactivate', async ({ page }) => {
  6  |     await loginAs(page, 'Admin');
  7  |     await page.goto('/admin/users');
  8  |     await expect(page.getByText(/user management/i)).toBeVisible();
  9  |     await expect(page.locator('button').filter({ has: page.locator('svg') }).first()).toBeVisible();
  10 |   });
  11 | 
  12 |   test('model management metrics and threshold edits render', async ({ page }) => {
  13 |     await loginAs(page, 'Admin');
  14 |     await page.goto('/admin/models');
  15 |     await expect(page.getByText(/model metrics/i)).toBeVisible();
  16 |     await expect(page.getByText(/alert threshold settings/i)).toBeVisible();
  17 |     await expect(page.locator('input').first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test('fairness report gap cards render', async ({ page }) => {
  21 |     await loginAs(page, 'Admin');
  22 |     await page.goto('/admin/models');
  23 |     await expect(page.getByText(/global feature importance/i)).toBeVisible();
  24 |   });
  25 | 
  26 |   test('audit logs export triggers a download', async ({ page }) => {
  27 |     await loginAs(page, 'Admin');
  28 |     await page.goto('/admin/audit-logs');
  29 |     await expect(page.getByText(/audit logs/i)).toBeVisible();
  30 |     const downloadPromise = page.waitForEvent('download');
  31 |     await page.getByRole('button', { name: /export/i }).click();
  32 |     await downloadPromise;
  33 |   });
  34 | 
  35 |   test('survey add question and toggle active', async ({ page }) => {
  36 |     await loginAs(page, 'Admin');
  37 |     await page.goto('/admin/survey');
> 38 |     await expect(page.getByText(/survey/i)).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
  39 |     await expect(page.getByText(/add new question/i)).toBeVisible();
  40 |   });
  41 | });
  42 | 
```