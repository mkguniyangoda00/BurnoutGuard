import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe.serial('developer check-in flow', () => {
  test('submits a full check-in and surfaces updated developer views', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.goto('/developer/check-in');

    // Sleep
    await page.locator('input[type="number"]').nth(0).fill('6.5');
    await page.locator('input[type="number"]').nth(1).fill('2');

    // Physical
    await page.locator('button', { hasText: '4' }).first().click().catch(() => {});
    await page.locator('input[type="number"]').nth(2).fill('5');

    // Work
    const workNumbers = page.locator('input[type="number"]');
    await workNumbers.nth(3).fill('8.5');
    await workNumbers.nth(4).fill('2');
    await workNumbers.nth(5).fill('1');
    await workNumbers.nth(6).fill('3');
    await workNumbers.nth(7).fill('25');

    // Work patterns
    await workNumbers.nth(8).fill('4');
    await workNumbers.nth(9).fill('2');
    await page.locator('button', { hasText: '3' }).nth(1).click().catch(() => {});
    await page.locator('button', { hasText: '4' }).nth(1).click().catch(() => {});
    await page.locator('button', { hasText: 'Yes' }).first().click();
    await page.locator('button', { hasText: 'No' }).first().click();

    // Mental & emotional
    await page.locator('button', { hasText: '6' }).first().click().catch(() => {});
    await page.locator('button', { hasText: '7' }).first().click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(2).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(3).click().catch(() => {});

    // Lifestyle
    await workNumbers.nth(10).fill('2');
    await page.locator('button', { hasText: '4' }).nth(2).click().catch(() => {});

    // Psychological wellbeing
    await page.locator('button', { hasText: '6' }).nth(1).click().catch(() => {});
    await page.locator('button', { hasText: '7' }).nth(1).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(4).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(5).click().catch(() => {});
    await page.locator('button', { hasText: '2' }).nth(1).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(6).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(7).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(8).click().catch(() => {});

    // Work design
    await page.locator('button', { hasText: '3' }).nth(9).click().catch(() => {});
    await page.locator('button', { hasText: '3' }).nth(10).click().catch(() => {});
    await page.locator('button', { hasText: '4' }).nth(3).click().catch(() => {});
    await page.locator('button', { hasText: '2' }).nth(2).click().catch(() => {});
    await page.locator('button', { hasText: '4' }).nth(4).click().catch(() => {});
    await page.locator('input[type="number"]').nth(11).fill('4');

    // Work context
    await page.locator('button', { hasText: '3' }).nth(11).click().catch(() => {});
    await page.locator('button', { hasText: '4' }).nth(5).click().catch(() => {});
    await page.locator('button', { hasText: '2' }).nth(3).click().catch(() => {});
    await page.locator('button', { hasText: '4' }).nth(6).click().catch(() => {});
    await page.locator('button', { hasText: 'No' }).nth(1).click();

    await page.locator('textarea').last().fill('Integration test journal note');
    await page.getByRole('button', { name: /submit check-in/i }).click();

    await expect(page.getByText(/success/i)).toBeVisible();

    await page.getByRole('button', { name: /back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/developer\/dashboard$/);
    await expect(page.getByText(/risk level/i).first()).toBeVisible();

    await page.goto('/developer/explanation');
    await expect(page.getByText(/risk area/i)).toBeVisible();
    await expect(page.getByText(/protective/i)).toBeVisible();
  });
});
