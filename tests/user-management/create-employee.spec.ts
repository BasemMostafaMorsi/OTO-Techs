import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('User Management - Create Employee', () => {
  test('@smoke required employee sections and fields are available', async ({ page }) => {
    await login(page);
    await page.goto('/en/users/employees/create');

    await expect(page.getByText('Personal Information', { exact: true })).toBeVisible();
    await expect(page.getByText('Contact Information', { exact: true })).toBeVisible();
    await expect(page.getByText('Work Information', { exact: true })).toBeVisible();

    await expect(page.getByRole('textbox', { name: 'Employee Name *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Surname *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mobile number *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Hiring Date' })).toBeVisible();

    for (const field of [
      'Department *',
      'Division *',
      'Branch *',
      'Direct manager *',
      'User type *',
    ]) {
      await expect(page.getByRole('combobox', { name: field })).toBeVisible();
    }
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  });

  test('@regression Area and City remain dependent on their parent address fields', async ({ page }) => {
    await login(page);
    await page.goto('/en/users/employees/create');

    await expect(page.getByPlaceholder('Choose country')).toBeVisible();
    await expect(page.getByPlaceholder('Choose area')).toBeDisabled();
    await expect(page.getByPlaceholder('Choose city')).toBeDisabled();
    await expect(page.getByText('(Select a country first)', { exact: true })).toBeVisible();
    await expect(page.getByText('(Select an area first)', { exact: true })).toBeVisible();
  });
});
