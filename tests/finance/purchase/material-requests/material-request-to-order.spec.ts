import { test, expect } from '../../../helpers/test';
import { login } from '../../../helpers/auth';

test.describe('Material Request conversion', () => {
  test('@smoke product data is populated in a Purchase Order', async ({ page }) => {
    test.setTimeout(90_000);

    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getDate(),
    ).padStart(2, '0')}/${now.getFullYear()}`;
    const description = `AUTO material request ${Date.now()}`;

    await login(page);
    await page.goto('/en/finance/inventory/inventory-managment/products-services');
    await page.getByPlaceholder('Search',{exact:true}).fill('gold');
    await page.getByRole('row').filter({hasText:'#P-0004'}).getByText('gold',{exact:true}).click();
    const sourceUnit = page.getByRole('combobox', {name:'Unit of measure *',exact:true});
    await expect(sourceUnit).not.toHaveValue('');
    const expectedUnit = await sourceUnit.inputValue();
    await test.info().attach('source-product-unit', {body:JSON.stringify({product:'gold',unit:expectedUnit}),contentType:'application/json'});
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
    await test.info().attach('created-material-request',{body:JSON.stringify({id:requestId,description}),contentType:'application/json'});

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
      .waitFor({ state: 'hidden', timeout: 30_000 });

    const productInput = page.locator('input[placeholder="Select Product"]').first();
    const unitInput = page.locator('input[placeholder="Select Unit"]').first();
    const numberInputs = page.locator('input[type="number"]');
    const quantityInput = numberInputs.nth(0);
    const priceInput = numberInputs.nth(1);

    await expect(productInput).toHaveValue('gold');
    await expect(quantityInput).toHaveValue('20');

    const evidence = test.info().outputPath('purchase-order-converted-unit.png');
    await page.screenshot({path:evidence,fullPage:true});
    await test.info().attach('converted-order-screen',{path:evidence,contentType:'image/png'});
    await test.info().attach('unit-conversion-comparison',{body:JSON.stringify({requestId,product:'gold',expectedUnit,actualUnit:await unitInput.inputValue(),quantity:await quantityInput.inputValue(),displayedPrice:await priceInput.inputValue()}),contentType:'application/json'});
    await expect(unitInput, 'Converted UOM must match the source product unit').toHaveValue(expectedUnit);
  });
});
