import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Authentication', () => {
  test('@smoke user can sign in and open the application', async ({ page }) => {
    await login(page);

    await expect(page.getByText(/home|الرئيسية/i).first()).toBeVisible();
    await expect(page.getByText(/system admin|مدير النظام/i).first()).toBeVisible();
  });
});
