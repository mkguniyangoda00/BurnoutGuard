# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hr.spec.ts >> hr analytics >> department overview and trends render real charts
- Location: tests\hr.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/factor insights/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/factor insights/i)

```

```yaml
- button "Open wellbeing chat"
- navigation:
  - link "BurnoutGuard":
    - /url: /
  - link "Department Overview":
    - /url: /hr/department-overview
  - link "Trends":
    - /url: /hr/trends
  - link "Wellness Resources":
    - /url: /wellness-resources
  - button "Toggle dark mode"
  - button "Notifications"
  - button "Language"
  - button "Profile menu": AH
- button "Need help now?"
- main:
  - heading "Organisation Burnout Overview" [level=1]
  - paragraph: All data anonymised and aggregated · Minimum 5 members per group shown
  - text: 80% Avg High Risk Rate 20% Avg Moderate Risk Rate 0% Avg Low Risk Rate TechCorp Most Stressed Dept
  - heading "Burnout Risk Distribution by Department" [level=2]
  - text: TechCorp 20% 80% Low Risk Moderate Risk High/Critical Risk
  - heading "Highest-Risk Departments" [level=2]
  - text: 1. TechCorp 80% High/Critical
  - heading "Overtime Trend (Recent Weeks)" [level=2]
  - text: Week 4 of Aug 0.6h avg Week 3 of Aug 0.59h avg
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('hr analytics', () => {
  5  |   test('department overview and trends render real charts', async ({ page }) => {
  6  |     await loginAs(page, 'HRofficer');
  7  | 
  8  |     await page.goto('/hr/department-overview');
  9  |     await expect(page.getByText(/burnout risk distribution by department/i)).toBeVisible();
> 10 |     await expect(page.getByText(/factor insights/i)).toBeVisible();
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  11 |     await expect(page.getByText(/job role/i)).toBeVisible();
  12 |     await expect(page.getByText(/work mode/i)).toBeVisible();
  13 | 
  14 |     await page.goto('/hr/trends');
  15 |     await expect(page.getByRole('button', { name: /risk trend/i })).toBeVisible();
  16 |     await page.getByRole('button', { name: /risk trend/i }).click();
  17 |     await expect(page.getByText(/risk trend/i).first()).toBeVisible();
  18 |     await expect(page.locator('svg').first()).toBeVisible();
  19 | 
  20 |     await page.getByRole('button', { name: /sleep & lifestyle/i }).click();
  21 |     await expect(page.getByText(/sleep & lifestyle/i).first()).toBeVisible();
  22 |     await expect(page.locator('svg').first()).toBeVisible();
  23 |     await expect(page.getByText(/not available/i)).toHaveCount(0);
  24 |   });
  25 | });
  26 | 
```