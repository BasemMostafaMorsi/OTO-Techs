import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Product categories - Arabic', () => {
  test('@regression newly created Arabic category is selected and remains available', async ({
    page,
  }) => {
    test.fail(
      true,
      'Known defect: an inline category can be created in Arabic but is not displayed afterwards.',
    );

    const suffix = Date.now().toString().slice(-8);
    const categoryName = `فئة آلية ${suffix}`;
    const shortCode = `AR${suffix.slice(-4)}`;

    await login(page);
    await page.goto(
      '/ar/finance/inventory/inventory-managment/products-services/create?tab=sales',
    );

    const category = page.getByRole('combobox').nth(1);
    await category.click();
    await page.getByText(/إنشاء جديد|create new/i, { exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const textInputs = dialog.locator('input[type="text"]');
    await textInputs.nth(0).fill(categoryName);
    await textInputs.nth(1).fill(shortCode);

    const createResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && /categor/i.test(response.url()),
    );
    await dialog.getByRole('button', { name: /إرسال|submit/i }).click();

    const response = await createResponse;
    expect(response.ok(), `Category API returned ${response.status()}`).toBeTruthy();
    await expect(dialog).toBeHidden();
    await expect(category).toHaveValue(categoryName, { timeout: 10_000 });

    await category.click();
    await expect(page.getByRole('option', { name: categoryName })).toBeVisible();
  });
});
