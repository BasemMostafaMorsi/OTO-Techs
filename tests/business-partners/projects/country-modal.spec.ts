import { test, expect } from '../../helpers/test';
import { login } from '../../helpers/auth';

test.describe('Project country modal', () => {
  test('@regression modal shows country field and supports cancel', async ({ page }, info) => {
    await login(page);
    await page.goto('/en/contacts/projects/create');
    await page.getByRole('combobox', { name: 'Country', exact: true }).click();
    await page.getByText('Create new', { exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Add Country' })).toBeVisible();
    await expect(dialog.getByLabel('Country Name')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Submit', exact: true })).toBeVisible();
    // User-confirmed behavior: translation and Arabic fields are not required.
    await dialog.getByLabel('Country Name').fill('QA unsaved country');
    const screenshot = await page.screenshot({ fullPage: true });
    await info.attach('accepted-country-dialog', { body: screenshot, contentType: 'image/png' });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue('');
  });
});
