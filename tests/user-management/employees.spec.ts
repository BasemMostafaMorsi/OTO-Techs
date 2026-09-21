import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('User Management - Employees', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/en/users/employees');
  });

  test('@smoke employee list, statistics, and actions load successfully', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main.getByText('Employees', { exact: true })).toBeVisible();
    await expect(main.getByText('Branches', { exact: true })).toBeVisible();
    await expect(main.getByText('Departments', { exact: true })).toBeVisible();
    await expect(main.getByText('Divisions', { exact: true })).toBeVisible();

    for (const action of ['Create', 'Export', 'Tree', 'Filter', 'Optimize']) {
      await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible();
    }

    for (const column of [
      'Name',
      'Ref.number',
      'Status',
      'Title',
      'Division',
      'Department',
      'Branch',
      'Direct manager',
      'Email',
      'Mobile number',
      'Action',
    ]) {
      await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible();
    }
  });

  test('@regression search returns the matching employee', async ({ page }) => {
    const email = process.env.LUXORA_EMAIL!;
    await page.getByPlaceholder('Search').fill(email);

    const matchingRow = page.getByRole('row').filter({ hasText: email });
    await expect(matchingRow).toBeVisible();
    await expect(matchingRow).toContainText('Active');
  });
});
