# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recommendations.spec.ts >> developer recommendations >> shows the empty state when the latest prediction has no recommendations
- Location: tests\recommendations.spec.ts:5:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "BurnoutGuard" [ref=e6] [cursor=pointer]:
        - /url: /
      - generic [ref=e7]:
        - link "Dashboard" [ref=e8] [cursor=pointer]:
          - /url: /developer/dashboard
        - link "Check-in" [ref=e9] [cursor=pointer]:
          - /url: /developer/check-in
        - link "My Risk" [ref=e10] [cursor=pointer]:
          - /url: /developer/my-risk
        - link "Recommendations" [ref=e11] [cursor=pointer]:
          - /url: /developer/recommendations
        - link "Reports" [ref=e12] [cursor=pointer]:
          - /url: /developer/reports
        - link "Journal" [ref=e13] [cursor=pointer]:
          - /url: /developer/journal
        - link "Wellness Resources" [ref=e14] [cursor=pointer]:
          - /url: /wellness-resources
    - generic [ref=e15]:
      - button "Toggle dark mode" [ref=e16] [cursor=pointer]
      - button "Notifications" [ref=e21] [cursor=pointer]
      - button "Language" [ref=e28] [cursor=pointer]
      - button "Profile menu" [ref=e35] [cursor=pointer]: JD
  - button "Need help now?" [ref=e36] [cursor=pointer]
  - main [ref=e39]:
    - generic [ref=e40]:
      - generic [ref=e41]:
        - generic [ref=e42]:
          - heading "Good afternoon, John" [level=1] [ref=e43]
          - paragraph [ref=e44]: Thursday, September 3, 2026 · 🔥 1-day streak
        - button "+ Check-in" [ref=e45] [cursor=pointer]
      - generic [ref=e47]:
        - generic [ref=e48]: Current Burnout Risk
        - paragraph [ref=e49]: No check-ins yet. Submit your first check-in to see your burnout risk.
        - button "Check-in →" [ref=e50] [cursor=pointer]
  - button "Open wellbeing chat" [ref=e52] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe('developer recommendations', () => {
  5  |   test('shows the empty state when the latest prediction has no recommendations', async ({ page }) => {
  6  |     await loginAs(page, 'Developer');
  7  | 
  8  |     await page.waitForFunction(() => {
  9  |       return Boolean(localStorage.getItem('bg_token') || localStorage.getItem('token'));
  10 |     });
  11 | 
  12 |     const latestPrediction = await page.evaluate(async () => {
  13 |       const token = localStorage.getItem('bg_token') || localStorage.getItem('token');
  14 |       const response = await fetch('http://localhost:5000/api/predictions/latest', {
  15 |         headers: {
  16 |           Authorization: token ? `Bearer ${token}` : '',
  17 |         },
  18 |       });
  19 |       return response.json();
  20 |     });
  21 | 
  22 |     const predictionId = latestPrediction?.prediction?.predictionId;
> 23 |     expect(predictionId).toBeTruthy();
     |                          ^ Error: expect(received).toBeTruthy()
  24 | 
  25 |     const recommendationPayload = await page.evaluate(async (pid) => {
  26 |       const token = localStorage.getItem('bg_token') || localStorage.getItem('token');
  27 |       const response = await fetch(`http://localhost:5000/api/recommendations/by-prediction/${pid}`, {
  28 |         headers: {
  29 |           Authorization: token ? `Bearer ${token}` : '',
  30 |         },
  31 |       });
  32 |       return response.json();
  33 |     }, predictionId);
  34 | 
  35 |     expect(Array.isArray(recommendationPayload.recommendations)).toBe(true);
  36 |     expect(recommendationPayload.recommendations).toHaveLength(0);
  37 | 
  38 |     await page.goto('/developer/recommendations');
  39 |     await expect(page.getByRole('heading', { name: /your action plan|your 7-day recovery plan/i })).toBeVisible({ timeout: 30000 });
  40 |     await expect(page.getByText(/no active recommendations right now/i)).toBeVisible();
  41 |     await expect(page.locator('.rec-card')).toHaveCount(0);
  42 |   });
  43 | });
  44 | 
```