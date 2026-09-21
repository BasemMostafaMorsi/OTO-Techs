import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Purchase Order form', () => {
  test('@smoke required business fields and sections are available', async ({ page }) => {
    await login(page);
    await page.goto('/en/finance/purchase-invoices/orders/create');

    await expect(page.getByText('Create Purchase Order', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Date *' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Vendor name *' })).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Sales Representative Name *' }),
    ).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Warehouse Name *' })).toBeVisible();

    for (const tab of [
      'Items',
      'Payment methods',
      'Purchase',
      'Terms & conditions',
      'Special Fields',
      'Attachments',
    ]) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  });
});
