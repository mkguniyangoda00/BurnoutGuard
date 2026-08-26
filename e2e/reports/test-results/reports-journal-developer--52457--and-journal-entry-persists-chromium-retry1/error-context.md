# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reports-journal.spec.ts >> developer reports and journal >> weekly report downloads and journal entry persists
- Location: tests\reports-journal.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - button "Open wellbeing chat" [ref=f1e5] [cursor=pointer]
  - navigation [ref=f1e8]:
    - generic [ref=f1e9]:
      - link "BurnoutGuard" [ref=f1e10] [cursor=pointer]:
        - /url: /
      - generic [ref=f1e11]:
        - link "Dashboard" [ref=f1e12] [cursor=pointer]:
          - /url: /developer/dashboard
        - link "Check-in" [ref=f1e13] [cursor=pointer]:
          - /url: /developer/check-in
        - link "My Risk" [ref=f1e14] [cursor=pointer]:
          - /url: /developer/my-risk
        - link "Recommendations" [ref=f1e15] [cursor=pointer]:
          - /url: /developer/recommendations
        - link "Reports" [ref=f1e16] [cursor=pointer]:
          - /url: /developer/reports
        - link "Journal" [ref=f1e17] [cursor=pointer]:
          - /url: /developer/journal
        - link "Wellness Resources" [ref=f1e18] [cursor=pointer]:
          - /url: /wellness-resources
    - generic [ref=f1e19]:
      - button "Toggle dark mode" [ref=f1e20] [cursor=pointer]
      - button "Notifications" [ref=f1e25] [cursor=pointer]
      - button "Language" [ref=f1e31] [cursor=pointer]
      - button "Profile menu" [ref=f1e38] [cursor=pointer]: JD
  - button "Need help now?" [ref=f1e39] [cursor=pointer]
  - main [ref=f1e42]:
    - generic [ref=f1e43]:
      - generic [ref=f1e44]:
        - generic [ref=f1e45]:
          - heading "Weekly Wellness Report" [level=1] [ref=f1e46]
          - paragraph [ref=f1e47]: 17 Aug – 23 Aug 2026 · 7 check-ins submitted
        - button "📥 Export / Print" [ref=f1e48] [cursor=pointer]
      - generic [ref=f1e49]:
        - generic [ref=f1e50]:
          - generic [ref=f1e51]: "6.3"
          - generic [ref=f1e52]: Avg stress / 10
        - generic [ref=f1e53]:
          - generic [ref=f1e54]: 7.8h
          - generic [ref=f1e55]: Avg sleep
        - generic [ref=f1e56]:
          - generic [ref=f1e57]: "4.9"
          - generic [ref=f1e58]: Avg mood / 10
        - generic [ref=f1e59]:
          - generic [ref=f1e60]: 8.4h
          - generic [ref=f1e61]: Avg work hours
      - generic [ref=f1e62]:
        - heading "Risk score trend" [level=3] [ref=f1e63]
        - generic [ref=f1e69]:
          - generic [ref=f1e70]: Wk 17/8
          - generic [ref=f1e71]: 0%
        - paragraph [ref=f1e72]: → Wellness metrics are stable compared to last week.
      - generic [ref=f1e73]: "✓ Weekly summary: Week of 17 Aug 2026: Average stress 6.29/10, sleep 7.75h, mood 4.86/10, work hours 8.4h/day. Burnout risk: Unknown. Trend: Stable."
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('developer reports and journal', () => {
  5  |   test('weekly report downloads and journal entry persists', async ({ page }) => {
  6  |     await loginAs(page, 'Developer');
  7  | 
  8  |     await page.goto('/developer/reports');
  9  |     await expect(page.getByText(/weekly wellness report/i)).toBeVisible();
  10 |     await expect(page.getByText(/risk score trend/i)).toBeVisible();
  11 | 
> 12 |     const downloadPromise = page.waitForEvent('download');
     |                                  ^ Error: page.waitForEvent: Test timeout of 30000ms exceeded.
  13 |     await page.getByRole('button', { name: /export \/ print/i }).click();
  14 |     const download = await downloadPromise;
  15 |     await expect(download.suggestedFilename()).toContain('.pdf');
  16 | 
  17 |     await page.goto('/developer/journal');
  18 |     const unique = `E2E reflection ${Date.now()}`;
  19 |     await page.locator('textarea').first().fill(unique);
  20 |     await page.getByRole('button', { name: /save/i }).click();
  21 |     await expect(page.getByText(unique)).toBeVisible();
  22 |     await expect(page.getByText(/past reflections/i)).toBeVisible();
  23 |   });
  24 | });
  25 | 
```