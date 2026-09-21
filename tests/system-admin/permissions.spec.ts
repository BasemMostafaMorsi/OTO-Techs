import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('System Admin permissions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/en/users/system-admin');
  });

  test('@smoke permission tree and summary load successfully', async ({ page }) => {
    const permissionForm = page.locator('#permissions-form');

    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(page.getByPlaceholder('Search')).toBeVisible();
    await expect(page.getByText(/Selected modules: \d+ - Permission count \(\d+ \/ \d+\)/)).toBeVisible();

    for (const moduleName of [
      'User management',
      'CRM',
      'Business partners',
      'Fleet',
      'Finance',
      'Configuration',
      'Under Development',
    ]) {
      await expect(permissionForm.getByText(moduleName, { exact: true })).toBeVisible();
    }
  });

  test('@regression Finance expands and displays its permission branches', async ({ page }) => {
    const permissionForm = page.locator('#permissions-form');
    const checkboxCountBefore = await page.getByRole('checkbox').count();

    await permissionForm.getByText('Finance', { exact: true }).click();

    await expect(permissionForm.getByText('Dashboard', { exact: true })).toBeVisible();
    await expect(permissionForm.getByText('Accounting', { exact: true })).toBeVisible();
    await expect(permissionForm.getByText('Inventory', { exact: true })).toBeVisible();
    await expect(permissionForm.getByText('Sales', { exact: true })).toBeVisible();
    await expect(permissionForm.getByText('Purchase', { exact: true })).toBeVisible();
    await expect(permissionForm.getByText('Tax center', { exact: true })).toBeVisible();

    expect(await page.getByRole('checkbox').count()).toBeGreaterThan(checkboxCountBefore);
  });

  test('@regression Select all updates the summary and can be restored without submitting', async ({
    page,
  }) => {
    const selectAllRow = page.getByText('Select all', { exact: true }).locator('..');
    const selectAll = selectAllRow.getByRole('checkbox');
    const summary = page.getByText(/Selected modules:/);

    await expect(selectAll).toBeChecked();
    const initialSummary = await summary.innerText();

    await selectAll.click();
    await expect(selectAll).not.toBeChecked();
    await expect(summary).toContainText(/Selected modules: 0 - Permission count \(0 \/ \d+\)/);

    await selectAll.click();
    await expect(selectAll).toBeChecked();
    await expect(summary).toHaveText(initialSummary);
  });
});
