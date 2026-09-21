import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Sales Invoice form', () => {
  test('@smoke required fields, transaction tabs, and totals are available', async ({ page }) => {
    await login(page);
    await page.goto('/en/finance/sales-invoices/invoices/create?tab=items');

    await expect(page.getByText('Create Sales Invoice', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Date *' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Customer name *' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Warehouse Name *' })).toBeVisible();

    for (const tab of [
      'Items',
      'Payment methods',
      'Sales',
      'Terms & conditions',
      'Special Fields',
      'Attachments',
    ]) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
    }

    for (const total of ['Sub Total', 'Discount', 'Taxable amount', 'Tax', 'Net']) {
      await expect(page.getByRole('paragraph').filter({ hasText: new RegExp(`^${total}$`) })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  });
});
