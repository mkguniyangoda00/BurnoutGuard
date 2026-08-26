# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkin.spec.ts >> developer check-in flow >> submits a full check-in and surfaces updated developer views
- Location: tests\checkin.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="number"]').nth(9)

```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - button "Open wellbeing chat" [ref=f2e5] [cursor=pointer]
  - navigation [ref=f2e8]:
    - generic [ref=f2e9]:
      - link "BurnoutGuard" [ref=f2e10] [cursor=pointer]:
        - /url: /
      - generic [ref=f2e11]:
        - link "Dashboard" [ref=f2e12] [cursor=pointer]:
          - /url: /developer/dashboard
        - link "Check-in" [ref=f2e13] [cursor=pointer]:
          - /url: /developer/check-in
        - link "My Risk" [ref=f2e14] [cursor=pointer]:
          - /url: /developer/my-risk
        - link "Recommendations" [ref=f2e15] [cursor=pointer]:
          - /url: /developer/recommendations
        - link "Reports" [ref=f2e16] [cursor=pointer]:
          - /url: /developer/reports
        - link "Journal" [ref=f2e17] [cursor=pointer]:
          - /url: /developer/journal
        - link "Wellness Resources" [ref=f2e18] [cursor=pointer]:
          - /url: /wellness-resources
    - generic [ref=f2e19]:
      - button "Toggle dark mode" [ref=f2e20] [cursor=pointer]
      - button "Notifications" [ref=f2e25] [cursor=pointer]
      - button "Language" [ref=f2e31] [cursor=pointer]
      - button "Profile menu" [ref=f2e38] [cursor=pointer]: JD
  - button "Need help now?" [ref=f2e39] [cursor=pointer]
  - main [ref=f2e42]:
    - generic [ref=f2e43]:
      - generic [ref=f2e45]:
        - heading "Today's Check-in" [level=1] [ref=f2e46]
        - paragraph [ref=f2e47]: Sunday, August 23 · Takes about 90 seconds
      - generic [ref=f2e48]: 💡 Submit today's check-in to get your updated burnout risk score.
      - generic [ref=f2e49]:
        - generic [ref=f2e50]:
          - heading "😴 Sleep & Rest" [level=2] [ref=f2e51]
          - generic [ref=f2e52]:
            - generic [ref=f2e53]:
              - generic [ref=f2e54]: Sleep hours last night
              - spinbutton [ref=f2e55]: "6.5"
            - generic [ref=f2e57]:
              - generic [ref=f2e58]: Sleep quality last night
              - paragraph [ref=f2e59]: 1 = Very poor, 5 = Excellent
              - generic [ref=f2e60]:
                - button "1" [ref=f2e61] [cursor=pointer]
                - button "2" [ref=f2e62] [cursor=pointer]
                - button "3" [ref=f2e63] [cursor=pointer]
                - button "4" [ref=f2e64] [cursor=pointer]
                - button "5" [ref=f2e65] [cursor=pointer]
        - generic [ref=f2e66]:
          - heading "🏃 Physical Activity" [level=2] [ref=f2e67]
          - generic [ref=f2e68]:
            - generic [ref=f2e70]:
              - generic [ref=f2e71]: Exercise level today
              - paragraph [ref=f2e72]: 1 = None, 5 = Intense
              - generic [ref=f2e73]:
                - button "1" [ref=f2e74] [cursor=pointer]
                - button "2" [ref=f2e75] [cursor=pointer]
                - button "3" [ref=f2e76] [cursor=pointer]
                - button "4" [ref=f2e77] [cursor=pointer]
                - button "5" [ref=f2e78] [cursor=pointer]
            - generic [ref=f2e79]:
              - generic [ref=f2e80]: Screen time (hrs, outside work)
              - spinbutton [ref=f2e81]: "2"
        - generic [ref=f2e82]:
          - heading "💼 Work & Productivity" [level=2] [ref=f2e83]
          - generic [ref=f2e84]:
            - generic [ref=f2e85]:
              - generic [ref=f2e86]: Hours worked today
              - spinbutton [ref=f2e87]: "5"
            - generic [ref=f2e88]:
              - generic [ref=f2e89]: Overtime hours
              - spinbutton [ref=f2e90]: "8.5"
            - generic [ref=f2e92]:
              - generic [ref=f2e93]: Workload feeling
              - paragraph [ref=f2e94]: 1 = Very light, 5 = Overwhelming
              - generic [ref=f2e95]:
                - button "1" [ref=f2e96] [cursor=pointer]
                - button "2" [ref=f2e97] [cursor=pointer]
                - button "3" [ref=f2e98] [cursor=pointer]
                - button "4" [ref=f2e99] [cursor=pointer]
                - button "5" [ref=f2e100] [cursor=pointer]
            - generic [ref=f2e101]:
              - generic [ref=f2e102]: Breaks taken today
              - spinbutton [ref=f2e103]: "2"
            - generic [ref=f2e104]:
              - generic [ref=f2e105]: Commute duration (minutes)
              - spinbutton [ref=f2e106]: "1"
            - generic [ref=f2e108]:
              - generic [ref=f2e109]: Work satisfaction
              - paragraph [ref=f2e110]: 1 = Very unsatisfied, 5 = Very satisfied
              - generic [ref=f2e111]:
                - button "1" [ref=f2e112] [cursor=pointer]
                - button "2" [ref=f2e113] [cursor=pointer]
                - button "3" [ref=f2e114] [cursor=pointer]
                - button "4" [ref=f2e115] [cursor=pointer]
                - button "5" [ref=f2e116] [cursor=pointer]
        - generic [ref=f2e117]:
          - heading "📊 Work Patterns" [level=2] [ref=f2e118]
          - generic [ref=f2e119]:
            - generic [ref=f2e120]:
              - generic [ref=f2e121]: Meetings today
              - spinbutton [ref=f2e122]: "3"
            - generic [ref=f2e123]:
              - generic [ref=f2e124]: Urgent / unplanned tasks today
              - spinbutton [ref=f2e125]: "25"
            - generic [ref=f2e127]:
              - generic [ref=f2e128]: Sprint pressure
              - paragraph [ref=f2e129]: 1 = Very relaxed, 5 = Extremely pressured
              - generic [ref=f2e130]:
                - button "1" [ref=f2e131] [cursor=pointer]
                - button "2" [ref=f2e132] [cursor=pointer]
                - button "3" [ref=f2e133] [cursor=pointer]
                - button "4" [ref=f2e134] [cursor=pointer]
                - button "5" [ref=f2e135] [cursor=pointer]
            - generic [ref=f2e137]:
              - generic [ref=f2e138]: Deadline frequency this week
              - paragraph [ref=f2e139]: 1 = Rare, 5 = Constant
              - generic [ref=f2e140]:
                - button "1" [ref=f2e141] [cursor=pointer]
                - button "2" [ref=f2e142] [cursor=pointer]
                - button "3" [ref=f2e143] [cursor=pointer]
                - button "4" [ref=f2e144] [cursor=pointer]
                - button "5" [ref=f2e145] [cursor=pointer]
            - generic [ref=f2e147]:
              - generic [ref=f2e148]: Bug-fixing load today
              - paragraph [ref=f2e149]: 1 = None, 5 = Heavy
              - generic [ref=f2e150]:
                - button "1" [ref=f2e151] [cursor=pointer]
                - button "2" [ref=f2e152] [cursor=pointer]
                - button "3" [ref=f2e153] [cursor=pointer]
                - button "4" [ref=f2e154] [cursor=pointer]
                - button "5" [ref=f2e155] [cursor=pointer]
            - generic [ref=f2e157]:
              - generic [ref=f2e158]: Context switching frequency
              - paragraph [ref=f2e159]: 1 = Focused on one task, 5 = Constantly switching
              - generic [ref=f2e160]:
                - button "1" [ref=f2e161] [cursor=pointer]
                - button "2" [ref=f2e162] [cursor=pointer]
                - button "3" [ref=f2e163] [cursor=pointer]
                - button "4" [ref=f2e164] [cursor=pointer]
                - button "5" [ref=f2e165] [cursor=pointer]
            - generic [ref=f2e166]:
              - generic [ref=f2e167]: Working this weekend?
              - generic [ref=f2e168]:
                - button "No" [ref=f2e169] [cursor=pointer]
                - button "Yes" [ref=f2e170] [cursor=pointer]
            - generic [ref=f2e171]:
              - generic [ref=f2e172]: On-call today?
              - generic [ref=f2e173]:
                - button "No" [ref=f2e174] [cursor=pointer]
                - button "Yes" [ref=f2e175] [cursor=pointer]
        - generic [ref=f2e176]:
          - heading "🧠 Mental & Emotional" [level=2] [ref=f2e177]
          - generic [ref=f2e178]:
            - generic [ref=f2e180]:
              - generic [ref=f2e181]: Stress level today
              - paragraph [ref=f2e182]: 1 = Very calm, 10 = Extremely stressed
              - generic [ref=f2e183]:
                - button "1" [ref=f2e184] [cursor=pointer]
                - button "2" [ref=f2e185] [cursor=pointer]
                - button "3" [ref=f2e186] [cursor=pointer]
                - button "4" [ref=f2e187] [cursor=pointer]
                - button "5" [ref=f2e188] [cursor=pointer]
                - button "6" [ref=f2e189] [cursor=pointer]
                - button "7" [ref=f2e190] [cursor=pointer]
                - button "8" [ref=f2e191] [cursor=pointer]
                - button "9" [ref=f2e192] [cursor=pointer]
                - button "10" [ref=f2e193] [cursor=pointer]
            - generic [ref=f2e195]:
              - generic [ref=f2e196]: Mood score
              - paragraph [ref=f2e197]: 1 = Very low, 10 = Excellent
              - generic [ref=f2e198]:
                - button "1" [ref=f2e199] [cursor=pointer]
                - button "2" [ref=f2e200] [cursor=pointer]
                - button "3" [ref=f2e201] [cursor=pointer]
                - button "4" [ref=f2e202] [cursor=pointer]
                - button "5" [ref=f2e203] [cursor=pointer]
                - button "6" [ref=f2e204] [cursor=pointer]
                - button "7" [ref=f2e205] [cursor=pointer]
                - button "8" [ref=f2e206] [cursor=pointer]
                - button "9" [ref=f2e207] [cursor=pointer]
                - button "10" [ref=f2e208] [cursor=pointer]
            - generic [ref=f2e210]:
              - generic [ref=f2e211]: Energy level
              - paragraph [ref=f2e212]: 1 = Exhausted, 5 = Energised
              - generic [ref=f2e213]:
                - button "1" [ref=f2e214] [cursor=pointer]
                - button "2" [ref=f2e215] [cursor=pointer]
                - button "3" [ref=f2e216] [cursor=pointer]
                - button "4" [ref=f2e217] [cursor=pointer]
                - button "5" [ref=f2e218] [cursor=pointer]
            - generic [ref=f2e220]:
              - generic [ref=f2e221]: Social support level
              - paragraph [ref=f2e222]: 1 = Very isolated, 5 = Well supported
              - generic [ref=f2e223]:
                - button "1" [ref=f2e224] [cursor=pointer]
                - button "2" [ref=f2e225] [cursor=pointer]
                - button "3" [ref=f2e226] [cursor=pointer]
                - button "4" [ref=f2e227] [cursor=pointer]
                - button "5" [ref=f2e228] [cursor=pointer]
        - generic [ref=f2e229]:
          - heading "🍽️ Lifestyle & Health" [level=2] [ref=f2e230]
          - generic [ref=f2e231]:
            - generic [ref=f2e232]:
              - generic [ref=f2e233]: Caffeine intake (cups/scale 0-10)
              - spinbutton [active] [ref=f2e234]: "4"
            - generic [ref=f2e236]:
              - generic [ref=f2e237]: Meal quality today
              - paragraph [ref=f2e238]: 1 = Poor, 5 = Excellent
              - generic [ref=f2e239]:
                - button "1" [ref=f2e240] [cursor=pointer]
                - button "2" [ref=f2e241] [cursor=pointer]
                - button "3" [ref=f2e242] [cursor=pointer]
                - button "4" [ref=f2e243] [cursor=pointer]
                - button "5" [ref=f2e244] [cursor=pointer]
        - generic [ref=f2e245]:
          - heading "🧠 Psychological Wellbeing" [level=2] [ref=f2e246]
          - generic [ref=f2e247]:
            - generic [ref=f2e249]:
              - generic [ref=f2e250]: Anxiety level today
              - paragraph [ref=f2e251]: 1 = None, 10 = Severe
              - generic [ref=f2e252]:
                - button "1" [ref=f2e253] [cursor=pointer]
                - button "2" [ref=f2e254] [cursor=pointer]
                - button "3" [ref=f2e255] [cursor=pointer]
                - button "4" [ref=f2e256] [cursor=pointer]
                - button "5" [ref=f2e257] [cursor=pointer]
                - button "6" [ref=f2e258] [cursor=pointer]
                - button "7" [ref=f2e259] [cursor=pointer]
                - button "8" [ref=f2e260] [cursor=pointer]
                - button "9" [ref=f2e261] [cursor=pointer]
                - button "10" [ref=f2e262] [cursor=pointer]
            - generic [ref=f2e264]:
              - generic [ref=f2e265]: Emotional fatigue
              - paragraph [ref=f2e266]: 1 = None, 10 = Completely drained
              - generic [ref=f2e267]:
                - button "1" [ref=f2e268] [cursor=pointer]
                - button "2" [ref=f2e269] [cursor=pointer]
                - button "3" [ref=f2e270] [cursor=pointer]
                - button "4" [ref=f2e271] [cursor=pointer]
                - button "5" [ref=f2e272] [cursor=pointer]
                - button "6" [ref=f2e273] [cursor=pointer]
                - button "7" [ref=f2e274] [cursor=pointer]
                - button "8" [ref=f2e275] [cursor=pointer]
                - button "9" [ref=f2e276] [cursor=pointer]
                - button "10" [ref=f2e277] [cursor=pointer]
            - generic [ref=f2e279]:
              - generic [ref=f2e280]: Motivation level
              - paragraph [ref=f2e281]: 1 = Very low, 5 = Very high
              - generic [ref=f2e282]:
                - button "1" [ref=f2e283] [cursor=pointer]
                - button "2" [ref=f2e284] [cursor=pointer]
                - button "3" [ref=f2e285] [cursor=pointer]
                - button "4" [ref=f2e286] [cursor=pointer]
                - button "5" [ref=f2e287] [cursor=pointer]
            - generic [ref=f2e289]:
              - generic [ref=f2e290]: Concentration issues
              - paragraph [ref=f2e291]: 1 = None, 5 = Severe difficulty focusing
              - generic [ref=f2e292]:
                - button "1" [ref=f2e293] [cursor=pointer]
                - button "2" [ref=f2e294] [cursor=pointer]
                - button "3" [ref=f2e295] [cursor=pointer]
                - button "4" [ref=f2e296] [cursor=pointer]
                - button "5" [ref=f2e297] [cursor=pointer]
            - generic [ref=f2e299]:
              - generic [ref=f2e300]: Irritability level
              - paragraph [ref=f2e301]: 1 = Very calm, 5 = Very irritable
              - generic [ref=f2e302]:
                - button "1" [ref=f2e303] [cursor=pointer]
                - button "2" [ref=f2e304] [cursor=pointer]
                - button "3" [ref=f2e305] [cursor=pointer]
                - button "4" [ref=f2e306] [cursor=pointer]
                - button "5" [ref=f2e307] [cursor=pointer]
            - generic [ref=f2e309]:
              - generic [ref=f2e310]: Loneliness level
              - paragraph [ref=f2e311]: 1 = Well connected, 5 = Very isolated
              - generic [ref=f2e312]:
                - button "1" [ref=f2e313] [cursor=pointer]
                - button "2" [ref=f2e314] [cursor=pointer]
                - button "3" [ref=f2e315] [cursor=pointer]
                - button "4" [ref=f2e316] [cursor=pointer]
                - button "5" [ref=f2e317] [cursor=pointer]
            - generic [ref=f2e319]:
              - generic [ref=f2e320]: Self-efficacy
              - paragraph [ref=f2e321]: 1 = Very low confidence, 5 = Very confident
              - generic [ref=f2e322]:
                - button "1" [ref=f2e323] [cursor=pointer]
                - button "2" [ref=f2e324] [cursor=pointer]
                - button "3" [ref=f2e325] [cursor=pointer]
                - button "4" [ref=f2e326] [cursor=pointer]
                - button "5" [ref=f2e327] [cursor=pointer]
            - generic [ref=f2e329]:
              - generic [ref=f2e330]: Coping ability
              - paragraph [ref=f2e331]: 1 = Struggling to cope, 5 = Coping very well
              - generic [ref=f2e332]:
                - button "1" [ref=f2e333] [cursor=pointer]
                - button "2" [ref=f2e334] [cursor=pointer]
                - button "3" [ref=f2e335] [cursor=pointer]
                - button "4" [ref=f2e336] [cursor=pointer]
                - button "5" [ref=f2e337] [cursor=pointer]
        - generic [ref=f2e338]:
          - heading "🇱🇰 Work Context" [level=2] [ref=f2e339]
          - generic [ref=f2e340]:
            - generic [ref=f2e342]:
              - generic [ref=f2e343]: Power / internet disruption stress
              - paragraph [ref=f2e344]: 1 = No disruption, 5 = Severely disrupted my work
              - generic [ref=f2e345]:
                - button "1" [ref=f2e346] [cursor=pointer]
                - button "2" [ref=f2e347] [cursor=pointer]
                - button "3" [ref=f2e348] [cursor=pointer]
                - button "4" [ref=f2e349] [cursor=pointer]
                - button "5" [ref=f2e350] [cursor=pointer]
            - generic [ref=f2e352]:
              - generic [ref=f2e353]: WFH environment quality
              - paragraph [ref=f2e354]: 1 = Very poor setup, 5 = Excellent setup
              - generic [ref=f2e355]:
                - button "1" [ref=f2e356] [cursor=pointer]
                - button "2" [ref=f2e357] [cursor=pointer]
                - button "3" [ref=f2e358] [cursor=pointer]
                - button "4" [ref=f2e359] [cursor=pointer]
                - button "5" [ref=f2e360] [cursor=pointer]
            - generic [ref=f2e362]:
              - generic [ref=f2e363]: Family responsibility load
              - paragraph [ref=f2e364]: 1 = Very light, 5 = Very heavy
              - generic [ref=f2e365]:
                - button "1" [ref=f2e366] [cursor=pointer]
                - button "2" [ref=f2e367] [cursor=pointer]
                - button "3" [ref=f2e368] [cursor=pointer]
                - button "4" [ref=f2e369] [cursor=pointer]
                - button "5" [ref=f2e370] [cursor=pointer]
            - generic [ref=f2e372]:
              - generic [ref=f2e373]: Salary vs workload satisfaction
              - paragraph [ref=f2e374]: 1 = Very unsatisfied, 5 = Very satisfied
              - generic [ref=f2e375]:
                - button "1" [ref=f2e376] [cursor=pointer]
                - button "2" [ref=f2e377] [cursor=pointer]
                - button "3" [ref=f2e378] [cursor=pointer]
                - button "4" [ref=f2e379] [cursor=pointer]
                - button "5" [ref=f2e380] [cursor=pointer]
            - generic [ref=f2e381]:
              - generic [ref=f2e382]: After-hours work messaging?
              - generic [ref=f2e383]:
                - button "No" [ref=f2e384] [cursor=pointer]
                - button "Yes" [ref=f2e385] [cursor=pointer]
        - generic [ref=f2e386]:
          - generic [ref=f2e387]: Any notes? (optional, max 500 characters)
          - textbox "e.g. Had a tough sprint review today, feeling overwhelmed..." [ref=f2e388]
          - paragraph [ref=f2e389]: 0/500
        - button "Submit Check-in →" [ref=f2e390] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs } from '../fixtures/auth';
  3  | 
  4  | test.describe.serial('developer check-in flow', () => {
  5  |   test('submits a full check-in and surfaces updated developer views', async ({ page }) => {
  6  |     await loginAs(page, 'Developer');
  7  | 
  8  |     await page.goto('/developer/check-in');
  9  | 
  10 |     // Sleep
  11 |     await page.locator('input[type="number"]').nth(0).fill('6.5');
  12 |     await page.locator('input[type="number"]').nth(1).fill('2');
  13 | 
  14 |     // Physical
  15 |     await page.locator('button', { hasText: '4' }).first().click().catch(() => {});
  16 |     await page.locator('input[type="number"]').nth(2).fill('5');
  17 | 
  18 |     // Work
  19 |     const workNumbers = page.locator('input[type="number"]');
  20 |     await workNumbers.nth(3).fill('8.5');
  21 |     await workNumbers.nth(4).fill('2');
  22 |     await workNumbers.nth(5).fill('1');
  23 |     await workNumbers.nth(6).fill('3');
  24 |     await workNumbers.nth(7).fill('25');
  25 | 
  26 |     // Work patterns
  27 |     await workNumbers.nth(8).fill('4');
> 28 |     await workNumbers.nth(9).fill('2');
     |                              ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  29 |     await page.locator('button', { hasText: '3' }).nth(1).click().catch(() => {});
  30 |     await page.locator('button', { hasText: '4' }).nth(1).click().catch(() => {});
  31 |     await page.locator('button', { hasText: 'Yes' }).first().click();
  32 |     await page.locator('button', { hasText: 'No' }).first().click();
  33 | 
  34 |     // Mental & emotional
  35 |     await page.locator('button', { hasText: '6' }).first().click().catch(() => {});
  36 |     await page.locator('button', { hasText: '7' }).first().click().catch(() => {});
  37 |     await page.locator('button', { hasText: '3' }).nth(2).click().catch(() => {});
  38 |     await page.locator('button', { hasText: '3' }).nth(3).click().catch(() => {});
  39 | 
  40 |     // Lifestyle
  41 |     await workNumbers.nth(10).fill('2');
  42 |     await page.locator('button', { hasText: '4' }).nth(2).click().catch(() => {});
  43 | 
  44 |     // Psychological wellbeing
  45 |     await page.locator('button', { hasText: '6' }).nth(1).click().catch(() => {});
  46 |     await page.locator('button', { hasText: '7' }).nth(1).click().catch(() => {});
  47 |     await page.locator('button', { hasText: '3' }).nth(4).click().catch(() => {});
  48 |     await page.locator('button', { hasText: '3' }).nth(5).click().catch(() => {});
  49 |     await page.locator('button', { hasText: '2' }).nth(1).click().catch(() => {});
  50 |     await page.locator('button', { hasText: '3' }).nth(6).click().catch(() => {});
  51 |     await page.locator('button', { hasText: '3' }).nth(7).click().catch(() => {});
  52 |     await page.locator('button', { hasText: '3' }).nth(8).click().catch(() => {});
  53 | 
  54 |     // Work design
  55 |     await page.locator('button', { hasText: '3' }).nth(9).click().catch(() => {});
  56 |     await page.locator('button', { hasText: '3' }).nth(10).click().catch(() => {});
  57 |     await page.locator('button', { hasText: '4' }).nth(3).click().catch(() => {});
  58 |     await page.locator('button', { hasText: '2' }).nth(2).click().catch(() => {});
  59 |     await page.locator('button', { hasText: '4' }).nth(4).click().catch(() => {});
  60 |     await page.locator('input[type="number"]').nth(11).fill('4');
  61 | 
  62 |     // Work context
  63 |     await page.locator('button', { hasText: '3' }).nth(11).click().catch(() => {});
  64 |     await page.locator('button', { hasText: '4' }).nth(5).click().catch(() => {});
  65 |     await page.locator('button', { hasText: '2' }).nth(3).click().catch(() => {});
  66 |     await page.locator('button', { hasText: '4' }).nth(6).click().catch(() => {});
  67 |     await page.locator('button', { hasText: 'No' }).nth(1).click();
  68 | 
  69 |     await page.locator('textarea').last().fill('Integration test journal note');
  70 |     await page.getByRole('button', { name: /submit check-in/i }).click();
  71 | 
  72 |     await expect(page.getByText(/success/i)).toBeVisible();
  73 | 
  74 |     await page.getByRole('button', { name: /back to dashboard/i }).click();
  75 |     await expect(page).toHaveURL(/\/developer\/dashboard$/);
  76 |     await expect(page.getByText(/risk level/i).first()).toBeVisible();
  77 | 
  78 |     await page.goto('/developer/explanation');
  79 |     await expect(page.getByText(/risk area/i)).toBeVisible();
  80 |     await expect(page.getByText(/protective/i)).toBeVisible();
  81 |   });
  82 | });
  83 | 
```