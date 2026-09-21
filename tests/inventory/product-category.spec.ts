import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Product categories', () => {
  test('@smoke newly created category appears in the product form', async ({ page }) => {
    const suffix = Date.now().toString().slice(-8);
    const categoryName = `AUTO Category ${suffix}`;
    const shortCode = `A${suffix.slice(-5)}`;

    await login(page);
    await page.goto(
      '/en/finance/inventory/inventory-managment/products-services/create?tab=sales',
    );

    const category = page.getByRole('combobox').nth(1);
    await category.click();
    await page.getByText('Create new', { exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Add Category')).toBeVisible();
    await dialog.getByLabel('Name').fill(categoryName);
    await dialog.getByLabel('Short code').fill(shortCode);

    const createResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /categor/i.test(response.url()),
    );
    await dialog.getByRole('button', { name: 'Submit' }).click();

    const response = await createResponse;
    expect(response.ok(), `Category API returned ${response.status()}`).toBeTruthy();
    await expect(dialog).toBeHidden();

    // Expected UX: the newly created category is immediately selected.
    await expect(category).toHaveValue(categoryName, { timeout: 10_000 });

    // It must also remain available after reopening the dropdown.
    await category.click();
    await expect(page.getByRole('option', { name: categoryName })).toBeVisible();
  });
});
