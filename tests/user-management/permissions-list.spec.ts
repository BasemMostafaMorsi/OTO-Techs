import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('User Management - Permissions list', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/en/users/permissions');
  });

  test('@smoke users and role columns load successfully', async ({ page }) => {
    for (const column of [
      'Name',
      'Title',
      'Section',
      'Department',
      'Status',
      'Email',
      'Change role',
    ]) {
      await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible();
    }

    expect(await page.getByRole('row').count()).toBeGreaterThan(1);
  });

  test('@regression search finds the current user and displays the assigned role', async ({ page }) => {
    const email = process.env.LUXORA_EMAIL!;
    await page.getByPlaceholder('Search').fill(email);

    const matchingRow = page.getByRole('row').filter({ hasText: email });
    await expect(matchingRow).toBeVisible();
    await expect(matchingRow).toContainText('Active');
    await expect(matchingRow).toContainText(/Super admin/i);
  });
});
