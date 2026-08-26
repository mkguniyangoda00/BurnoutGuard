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
  - heading "User Management" [level=1]
  - paragraph: 18 registered · 18 active · 0 deactivated
  - textbox "Search by name or email..."
  - table:
    - rowgroup:
      - row "Name Email Role Status Company Actions":
        - columnheader "Name"
        - columnheader "Email"
        - columnheader "Role"
        - columnheader "Status"
        - columnheader "Company"
        - columnheader "Actions"
    - rowgroup:
      - row "JD John Developer dev@burnoutguard.com Developer Active TechCorp":
        - cell "JD John Developer"
        - cell "dev@burnoutguard.com"
        - cell "Developer"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "MG Malithi Guniyangoda kavishkaguniyangoda@gmail.com Developer Active —":
        - cell "MG Malithi Guniyangoda"
        - cell "kavishkaguniyangoda@gmail.com"
        - cell "Developer"
        - cell "Active"
        - cell "—"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "SM Sarah Manager manager@burnoutguard.com Manager Active TechCorp":
        - cell "SM Sarah Manager"
        - cell "manager@burnoutguard.com"
        - cell "Manager"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "JD Jane Dev2 dev2@burnoutguard.com Developer Active TechCorp":
        - cell "JD Jane Dev2"
        - cell "dev2@burnoutguard.com"
        - cell "Developer"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "ED Eve Dev5 dev5@burnoutguard.com Developer Active TechCorp":
        - cell "ED Eve Dev5"
        - cell "dev5@burnoutguard.com"
        - cell "Developer"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "MK Malithi Kavishka Guniyangoda mkguniyangoda@gmail.com Admin Active Prima Management Services Pvt Ltd":
        - cell "MK Malithi Kavishka Guniyangoda"
        - cell "mkguniyangoda@gmail.com"
        - cell "Admin"
        - cell "Active"
        - cell "Prima Management Services Pvt Ltd"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "SG Sampath Guniyangoda guniyangodasm@gmail.com Manager Active Prima Management Services Pvt Ltd":
        - cell "SG Sampath Guniyangoda"
        - cell "guniyangodasm@gmail.com"
        - cell "Manager"
        - cell "Active"
        - cell "Prima Management Services Pvt Ltd"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "CS Chamudi Sehansa chamu@gmail.com Developer Active":
        - cell "CS Chamudi Sehansa"
        - cell "chamu@gmail.com"
        - cell "Developer"
        - cell "Active"
        - cell
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "DV Deshan Vimukthi De Silva dvdsilva@gmail.com Developer Active Prima Management Services Pvt Ltd":
        - cell "DV Deshan Vimukthi De Silva"
        - cell "dvdsilva@gmail.com"
        - cell "Developer"
        - cell "Active"
        - cell "Prima Management Services Pvt Ltd"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "MF Malithi Fashion fashionmalithi@gmail.com Developer Active —":
        - cell "MF Malithi Fashion"
        - cell "fashionmalithi@gmail.com"
        - cell "Developer"
        - cell "Active"
        - cell "—"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "DA Danushi Anandagoda anandagodadanushi@gmail.com HRofficer Active Prima Management Services Pvt Ltd":
        - cell "DA Danushi Anandagoda"
        - cell "anandagodadanushi@gmail.com"
        - cell "HRofficer"
        - cell "Active"
        - cell "Prima Management Services Pvt Ltd"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "AH Alice HR hr@burnoutguard.com HRofficer Active TechCorp":
        - cell "AH Alice HR"
        - cell "hr@burnoutguard.com"
        - cell "HRofficer"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "SD Sam Dev4 dev4@burnoutguard.com Developer Active TechCorp":
        - cell "SD Sam Dev4"
        - cell "dev4@burnoutguard.com"
        - cell "Developer"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "BD Bob Dev3 dev3@burnoutguard.com Developer Active TechCorp":
        - cell "BD Bob Dev3"
        - cell "dev3@burnoutguard.com"
        - cell "Developer"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "DR Dr. Researcher research@burnoutguard.com ResearchAdmin Active University Lab":
        - cell "DR Dr. Researcher"
        - cell "research@burnoutguard.com"
        - cell "ResearchAdmin"
        - cell "Active"
        - cell "University Lab"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "MD Mike Dev6 dev6@burnoutguard.com Developer Active OtherCorp":
        - cell "MD Mike Dev6"
        - cell "dev6@burnoutguard.com"
        - cell "Developer"
        - cell "Active"
        - cell "OtherCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "AS Admin System admin@burnoutguard.com Admin Active TechCorp":
        - cell "AS Admin System"
        - cell "admin@burnoutguard.com"
        - cell "Admin"
        - cell "Active"
        - cell "TechCorp"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
      - row "MG Malithi Guniyangoda guniyangodamalithi@gmail.com Developer Active —":
        - cell "MG Malithi Guniyangoda"
        - cell "guniyangodamalithi@gmail.com"
        - cell "Developer"
        - cell "Active"
        - cell "—"
        - cell:
          - button "Edit Role"
          - button "Deactivate User"
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