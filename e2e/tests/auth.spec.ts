import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

const roles = [
  ['Developer', '/developer/dashboard'],
  ['Manager', '/manager/dashboard'],
  ['HRofficer', '/hr/department-overview'],
  ['Admin', '/admin/users'],
  ['ResearchAdmin', '/admin/users'],
] as const;

test.describe('auth flows', () => {
  for (const [role, dashboard] of roles) {
    test(`successful login as ${role} redirects to the correct dashboard`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page).toHaveURL(new RegExp(`${dashboard.replace(/\//g, '\\/')}$`));
    });
  }

  test('invalid credentials show the error banner', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#loginEmail').fill('dev@burnoutguard.com');
    await page.locator('#loginPassword').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logout clears session and redirects to /login', async ({ page }) => {
    await loginAs(page, 'Developer');
    await page.getByRole('button', { name: /profile menu/i }).click();
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('#loginEmail')).toBeVisible();
  });

  test('developer direct navigation to /admin/users is currently allowed by route guards', async ({ page }) => {
    await loginAs(page, 'Developer');
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    test.info().annotations.push({
      type: 'finding',
      description: 'ProtectedRoute only checks authentication; it does not enforce role-based access to /admin/users.',
    });
  });
});
