import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';

test.describe('developer recommendations', () => {
  test('shows the empty state when the latest prediction has no recommendations', async ({ page }) => {
    await loginAs(page, 'Developer');

    await page.waitForFunction(() => {
      return Boolean(localStorage.getItem('bg_token') || localStorage.getItem('token'));
    });

    const latestPrediction = await page.evaluate(async () => {
      const token = localStorage.getItem('bg_token') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/predictions/latest', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return response.json();
    });

    const predictionId = latestPrediction?.prediction?.predictionId;
    expect(predictionId).toBeTruthy();

    const recommendationPayload = await page.evaluate(async (pid) => {
      const token = localStorage.getItem('bg_token') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/recommendations/by-prediction/${pid}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return response.json();
    }, predictionId);

    expect(Array.isArray(recommendationPayload.recommendations)).toBe(true);
    expect(recommendationPayload.recommendations).toHaveLength(0);

    await page.goto('/developer/recommendations');
    await expect(page.getByRole('heading', { name: /your action plan|your 7-day recovery plan/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/no active recommendations right now/i)).toBeVisible();
    await expect(page.locator('.rec-card')).toHaveCount(0);
  });
});
