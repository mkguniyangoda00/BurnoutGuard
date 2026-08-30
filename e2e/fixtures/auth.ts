// @ts-ignore
import { expect, type Page } from '@playwright/test';

type Role = 'Developer' | 'Manager' | 'HRofficer' | 'Admin' | 'ResearchAdmin';

const credentials: Record<Role, { email: string; password: string; dashboard: string }> = {
  Developer: { email: 'dev@burnoutguard.com', password: 'Password123!', dashboard: '/developer/dashboard' },
  Manager: { email: 'manager@burnoutguard.com', password: 'Password123!', dashboard: '/manager/dashboard' },
  HRofficer: { email: 'hr@burnoutguard.com', password: 'Password123!', dashboard: '/hr/department-overview' },
  Admin: { email: 'admin@burnoutguard.com', password: 'Password123!', dashboard: '/admin/users' },
  ResearchAdmin: { email: 'research@burnoutguard.com', password: 'Password123!', dashboard: '/admin/users' },
};

export async function loginAs(page: Page, role: Role) {
  const { email, password, dashboard } = credentials[role];
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPassword').fill(password);
  await Promise.all([
    page.waitForURL(new RegExp(`${dashboard.replace(/\//g, '\\/')}$`)),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  await expect(page).toHaveURL(new RegExp(`${dashboard.replace(/\//g, '\\/')}$`));
}

export const roleCredentials = credentials;
