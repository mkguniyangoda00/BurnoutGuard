# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-factor-analysis.spec.ts >> admin factor analysis >> all factor analysis tabs render and update
- Location: tests\admin-factor-analysis.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/auto-generated insights/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/auto-generated insights/i)

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
  4  | test.describe('admin factor analysis', () => {
  5  |   test('all factor analysis tabs render and update', async ({ page }) => {
  6  |     await loginAs(page, 'Admin');
  7  |     await page.goto('/admin/factor-analysis');
  8  | 
> 9  |     await expect(page.getByText(/auto-generated insights/i)).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  10 |     await expect(page.getByText(/association in the observed dataset/i)).toBeVisible();
  11 |     await expect(page.locator('svg').first()).toBeVisible();
  12 | 
  13 |     const dimensionSelect = page.locator('select').nth(0);
  14 |     for (const label of ['Experience', 'Job Role', 'Work Mode']) {
  15 |       await dimensionSelect.selectOption({ label });
  16 |       await expect(page.getByText(/demographic breakdown/i)).toBeVisible();
  17 |       await expect(page.locator('table')).toBeVisible();
  18 |     }
  19 |     await dimensionSelect.selectOption({ label: 'Age Group' });
  20 | 
  21 |     await page.getByRole('button', { name: /factor explorer/i }).click();
  22 |     const factorSelect = page.locator('select').nth(1);
  23 |     for (const label of ['sleepHours', 'overtimeHours', 'stressLevel']) {
  24 |       await factorSelect.selectOption({ label });
  25 |       await expect(page.getByText(/pearson correlation/i)).toBeVisible();
  26 |       await expect(page.locator('svg').first()).toBeVisible();
  27 |     }
  28 | 
  29 |     await page.getByRole('button', { name: /interaction analysis/i }).click();
  30 |     const selects = page.locator('select');
  31 |     await selects.nth(1).selectOption({ label: 'sleepHours' });
  32 |     await selects.nth(2).selectOption({ label: 'overtimeHours' });
  33 |     await expect(page.getByText(/interaction analysis/i)).toBeVisible();
  34 |     await expect(page.locator('text=insufficient data').first()).toBeVisible();
  35 |   });
  36 | });
  37 | 
```