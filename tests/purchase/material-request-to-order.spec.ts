import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Material Request conversion', () => {
  test('@smoke product data is populated in a Purchase Order', async ({ page }) => {
    test.fail(
      true,
      'Known defect: converted items currently lose UOM, purchase price, and calculated totals.',
    );

    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getDate(),
    ).padStart(2, '0')}/${now.getFullYear()}`;
    const description = `AUTO material request ${Date.now()}`;

    await login(page);
    await page.goto('/en/finance/purchase-invoices/request-material/create');

    await page.locator('input[placeholder="MM/DD/YYYY"]').fill(date);
    await page.locator('textarea[name="description"]').fill(description);

    const product = page.getByRole('combobox');
    await product.fill('gold');
    await page.getByRole('option').filter({ hasText: /gold/i }).first().click();
    await page.locator('input[name="quantity_0"]').fill('20');

    await page.getByRole('button', { name: 'Submit' }).click();
    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/purchase_material_requests'),
    );
    await page.getByRole('menuitem').first().getByRole('button').click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.ok()).toBeTruthy();
    const saved = await saveResponse.json();
    const requestId = saved.data.id;

    await page.goto('/en/finance/purchase-invoices/request-material');
    const requestRow = page
      .getByRole('row')
      .filter({ hasText: `#${requestId}` })
      .first();
    await expect(requestRow).toContainText(description.slice(0, 20));

    await requestRow.getByLabel('more').click();
    await page
      .getByRole('menuitem', { name: 'Convert to order' })
      .filter({ visible: true })
      .click();

    await page.waitForURL(/\/orders\/create\?from_materialReq=true/);
    await page
      .getByText('Loading form lists...')
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    await page
      .getByText('Loading form lists...')
      .waitFor({ state: 'hidden', timeout: 30_000 });

    const productInput = page.locator('input[placeholder="Select Product"]').first();
    const unitInput = page.locator('input[placeholder="Select Unit"]').first();
    const numberInputs = page.locator('input[type="number"]');
    const quantityInput = numberInputs.nth(0);
    const priceInput = numberInputs.nth(1);

    await expect(productInput).toHaveValue('gold');
    await expect(quantityInput).toHaveValue('20');

    // Values expected from Product Master Data after conversion.
    await expect.soft(unitInput, 'UOM was not populated').not.toHaveValue('');

    const price = Number(await priceInput.inputValue());
    expect.soft(price, 'Purchase price was not populated').toBeGreaterThan(0);

    const netText = await page.getByText(/^Net$/).locator('..').innerText();
    expect.soft(netText, 'Net total remained zero').not.toContain('0 SAR');
  });
});
