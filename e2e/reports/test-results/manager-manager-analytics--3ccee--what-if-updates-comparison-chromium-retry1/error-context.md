# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manager.spec.ts >> manager analytics >> team overview shows core panels and team what-if updates comparison
- Location: tests\manager.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/team risk factors/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/team risk factors/i)

```

```yaml
- button "Open wellbeing chat"
- navigation:
  - link "BurnoutGuard":
    - /url: /
  - link "Team Overview":
    - /url: /manager/dashboard
  - link "Sprint Risk":
    - /url: /manager/sprint-risk
  - link "Wellness Resources":
    - /url: /wellness-resources
  - button "Toggle dark mode"
  - button "Notifications"
  - button "Language"
  - button "Profile menu": SM
- button "Need help now?"
- main:
  - heading "Team Burnout Overview" [level=1]
  - paragraph: Software Engineering Department · All data is anonymised to protect privacy
  - combobox:
    - 'option "Department: Engineering" [selected]'
  - combobox:
    - 'option "Work Mode: All" [selected]'
    - 'option "Work Mode: Remote"'
    - 'option "Work Mode: Hybrid"'
    - 'option "Work Mode: Onsite"'
  - combobox:
    - 'option "Risk Period: This Week" [selected]'
    - 'option "Risk Period: Last 4 Weeks"'
    - 'option "Risk Period: Last 3 Months"'
  - text: 8 High Risk 2 Moderate Risk 0 Low Risk 1 No Data
  - heading "Team Burnout Heatmap (Last 4 Weeks)" [level=2]
  - text: Dev 01 Dev 02 Dev 03 Dev 04 Dev 05 Dev 06 Dev 07 Dev 08 Dev 09 Dev 10 Dev 11 Week -0 Week -1 Week -2 Week -3 Low Risk Moderate Risk High/Critical Risk No Data
  - heading "Workload Hotspots" [level=2]
  - table:
    - rowgroup:
      - row "Department Avg Meetings Avg Urgent Tasks Avg Overtime (hrs)":
        - columnheader "Department"
        - columnheader "Avg Meetings"
        - columnheader "Avg Urgent Tasks"
        - columnheader "Avg Overtime (hrs)"
    - rowgroup:
      - row "TechCorp 3.1 2 0.9h":
        - cell "TechCorp"
        - cell "3.1"
        - cell "2"
        - cell "0.9h"
  - heading "Team Recommendation Trends" [level=2]
  - paragraph: Not enough data available for this department.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('manager analytics', () => {
  5  |   test('team overview shows core panels and team what-if updates comparison', async ({ page }) => {
  6  |     await loginAs(page, 'Manager');
  7  | 
  8  |     await page.goto('/manager/dashboard');
  9  |     await expect(page.getByText(/team burnout heatmap/i)).toBeVisible();
  10 |     await expect(page.getByText(/workload hotspots/i)).toBeVisible();
> 11 |     await expect(page.getByText(/team risk factors/i)).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  12 | 
  13 |     const teamRiskSection = page.getByText(/team risk factors/i).locator('..');
  14 |     await expect(teamRiskSection).toContainText(/of \d+ developers/i);
  15 |     await expect(teamRiskSection).toContainText(/risk increasing|protective|not enough data/i);
  16 | 
  17 |     await expect(page.getByText(/team what-if simulator/i)).toBeVisible();
  18 |     const sliders = page.locator('input[type="range"]');
  19 |     await sliders.nth(0).fill('2');
  20 |     await sliders.nth(1).fill('3');
  21 |     await sliders.nth(2).fill('4');
  22 |     await page.getByRole('button', { name: /simulate/i }).click();
  23 |     await expect(page.getByText(/before/i)).toBeVisible();
  24 |     await expect(page.getByText(/after/i)).toBeVisible();
  25 |     await expect(page.locator('svg').first()).toBeVisible();
  26 |   });
  27 | });
  28 | 
```