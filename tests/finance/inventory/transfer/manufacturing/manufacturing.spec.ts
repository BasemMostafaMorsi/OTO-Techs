import {test, expect, Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';

const base = '/en/finance/inventory/transfer/manufacturing';
const api = '/inventory/manufactures';
const field = (page: Page, name: string) => page.getByRole('textbox', {name, exact: true});
const table = (page: Page, index: number) => page.getByRole('table').nth(index);
const rows = (page: Page, index: number) => table(page, index).getByRole('row').filter({has: page.getByRole('combobox', {name: 'Choose product', exact: true})});
async function create(page: Page) {
  await page.goto(base + '/create');
  await expect(field(page, 'Date *')).toBeVisible();
}
async function draft(page: Page) {
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Save as Draft', exact: true}).click();
}
async function warehouse(page: Page, index: number, name: string) {
  await page.getByRole('combobox', {name: 'Choose warehouse', exact: true}).nth(index).click();
  await page.getByRole('option', {name, exact: true}).click();
}
async function product(page: Page, index: number, name: string, sku: string) {
  const input = table(page, index).getByRole('combobox', {name: 'Choose product', exact: true});
  await input.click();
  const option = page.getByRole('option').filter({hasText: name}).filter({hasText: sku});
  await expect(option).toHaveCount(1);
  const [data] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'GET' && /\/inventory\/products\/[^/?]+$/.test(r.url()))
      .then(async r => { expect(r.ok()).toBeTruthy(); return (await r.json()).data; }),
    option.click(),
  ]);
  await expect(input).toHaveValue(name);
  return data;
}
async function prepared(page: Page) {
  await create(page);
  await page.getByRole('checkbox', {name: 'Scrap', exact: true}).uncheck();
  await warehouse(page, 0, 'مخزن الرياض #1');
  await warehouse(page, 1, 'مخزن مكة #3');
  const source = await product(page, 0, 'gold', 'P-0004');
  const output = await product(page, 1, 'potat', 'P-0002');
  return {source, output};
}
async function save(page: Page, method: string, suffix = '') {
  const [result] = await Promise.all([
    page.waitForResponse(r => r.request().method() === method && r.url().endsWith(api + suffix))
      .then(async r => {
        const sent = r.request().postDataJSON();
        const values = (items: any[]) => items.map(i => ({product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price}));
        return {status: r.status(), body: await r.json(), submitted: {notes: sent.notes, reference: sent.reference_number, batch: sent.batch_number, from: values(sent.from_manufacture_items), to: values(sent.to_manufacture_items)}};
      }),
    draft(page),
  ]);
  await test.info().attach(method === 'PUT' ? 'manufacturing-update' : 'manufacturing-create', {body: JSON.stringify(result), contentType: 'application/json'});
  return result;
}
async function removeOwned(page: Page, id: string, ref: string) {
  await page.goto(`${base}/edit/${id}`);
  await expect(field(page, 'Ref No')).toHaveValue(ref);
  await expect(page.getByRole('main').getByText('Draft', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  const [result] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().endsWith(api + '/' + id))
      .then(async r => ({status: r.status(), body: await r.json()})),
    page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click(),
  ]);
  await test.info().attach('owned-manufacturing-delete', {body: JSON.stringify({id, ref, ...result}), contentType: 'application/json'});
  expect(result.body.is_success).toBe(true);
  await expect(page).toHaveURL(/\/manufacturing$/);
  await page.getByPlaceholder('Search', {exact: true}).fill(ref);
  await expect(page.getByRole('button', {name: '0/0', exact: true})).toBeVisible();
}

test.beforeEach(async ({page}) => { test.setTimeout(150000); await login(page); });
test.afterEach(async ({page}, info) => {
  const path = info.outputPath('manufacturing-screen.png');
  await page.screenshot({path, fullPage: true});
  await info.attach('manufacturing-screen', {path, contentType: 'image/png'});
});

test('creation defaults expose source output scrap and draft actions', async ({page}) => {
  await create(page);
  await expect(field(page, 'Date *')).toBeEditable();
  await expect(field(page, 'Date *')).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);
  for (const name of ['Ref No', 'Batch number', 'Notes']) await expect(field(page, name)).toBeEmpty();
  await expect(page.getByRole('checkbox', {name: 'Scrap', exact: true})).toBeChecked();
  await expect(page.getByRole('table')).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect(rows(page, i)).toHaveCount(1);
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Validate', 'Save as Draft']);
});

test('blank draft validates warehouses products quantities and output prices', async ({page}) => {
  await create(page);
  const writes: string[] = [];
  page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith(api)) writes.push(r.url()); });
  await draft(page); await page.keyboard.press('Escape');
  for (const text of ['Warehouse is required', 'Product name is required', 'Quantity is required']) await expect(page.getByText(text, {exact: true})).toHaveCount(3);
  await expect(page.getByText('Unit price is required', {exact: true})).toHaveCount(2);
  expect(writes).toEqual([]);
});

test('source output and scrap line additions and removals are independent', async ({page}) => {
  await create(page);
  for (let i = 0; i < 3; i++) {
    await table(page, i).getByRole('button', {name: 'Add new', exact: true}).click();
    for (let j = 0; j < 3; j++) await expect(rows(page, j)).toHaveCount(j === i ? 2 : 1);
    await rows(page, i).last().getByRole('cell').last().getByRole('button').click();
    await expect(rows(page, i)).toHaveCount(1);
  }
});

test('disabling scrap removes its fields from blank draft validation', async ({page}) => {
  await create(page);
  await page.getByRole('checkbox', {name: 'Scrap', exact: true}).uncheck();
  await expect(page.getByRole('table')).toHaveCount(2);
  await draft(page); await page.keyboard.press('Escape');
  for (const text of ['Warehouse is required', 'Product name is required', 'Quantity is required']) await expect(page.getByText(text, {exact: true})).toHaveCount(2);
  await expect(page.getByText('Unit price is required', {exact: true})).toHaveCount(1);
  await page.getByRole('checkbox', {name: 'Scrap', exact: true}).check();
  await expect(page.getByRole('table')).toHaveCount(3);
  await expect(rows(page, 2)).toHaveCount(1);
});

test('leaving creation discards reference batch notes and extra rows', async ({page}) => {
  await create(page);
  for (const name of ['Ref No', 'Batch number', 'Notes']) await field(page, name).fill(name === 'Ref No' ? '918273' : 'MFG-E2E-UNSAVED');
  await table(page, 0).getByRole('button', {name: 'Add new', exact: true}).click();
  await page.goto(base); await page.getByRole('button', {name: 'Create', exact: true}).click();
  for (const name of ['Ref No', 'Batch number', 'Notes']) await expect(field(page, name)).toBeEmpty();
  for (let i = 0; i < 3; i++) await expect(rows(page, i)).toHaveCount(1);
});

test('no-match search and clear restore the manufacturing list', async ({page}) => {
  await page.goto(base);
  const counter = page.getByRole('button', {name: /^\d+\/\d+$/});
  await expect(counter).toBeVisible(); const original = await counter.innerText();
  await page.getByPlaceholder('Search', {exact: true}).fill('MFG-NONE-' + Date.now());
  await expect(counter).toHaveText('0/0');
  await page.getByPlaceholder('Search', {exact: true}).fill('');
  await expect(counter).toHaveText(original);
});

test('source and output readonly balances match their warehouse stock', async ({page}, info) => {
  const data = await prepared(page);
  const stock = (product: any, id: number) => Number(product.stock_details.find((s: any) => s.warehouse_id === id)?.stock ?? 0);
  const sourceBalance = table(page, 0).getByRole('textbox').nth(1);
  const outputBalance = table(page, 1).getByRole('textbox').nth(2);
  await expect(sourceBalance).toHaveAttribute('readonly', '');
  await expect(outputBalance).toHaveAttribute('readonly', '');
  await expect.poll(async () => Number(await sourceBalance.inputValue())).toBe(stock(data.source, 1));
  await expect.poll(async () => Number(await outputBalance.inputValue())).toBe(stock(data.output, 3));
  await warehouse(page, 0, 'مخزن جدة #2');
  await expect(table(page, 0).getByRole('combobox', {name: 'Choose product', exact: true})).toBeEmpty();
  await expect(table(page, 1).getByRole('combobox', {name: 'Choose product', exact: true})).toHaveValue('potat');
  const reselected = await product(page, 0, 'gold', 'P-0004');
  await expect.poll(async () => Number(await sourceBalance.inputValue())).toBe(stock(reselected, 2));
  await expect.poll(async () => Number(await outputBalance.inputValue())).toBe(stock(data.output, 3));
  await info.attach('manufacturing-stock-baseline', {body: JSON.stringify({source: data.source.stock_details, output: data.output.stock_details}), contentType: 'application/json'});
});

test('owned draft persists fields cancels deletion and saves notes edit', async ({page}, info) => {
  await prepared(page);
  const ref = String(Date.now()), marker = 'MFG-E2E-' + ref;
  let id: string | undefined;
  try {
    await field(page, 'Ref No').fill(ref);
    await field(page, 'Batch number').fill(marker);
    await field(page, 'Notes').fill(marker);
    await table(page, 0).getByRole('textbox').first().fill('1');
    await table(page, 1).getByRole('textbox').first().fill('1');
    await table(page, 1).getByRole('textbox').nth(1).fill('1');
    const created = await save(page, 'POST');
    if (created.body.data?.id) id = String(created.body.data.id);
    expect(created.body.is_success).toBe(true); expect(id).toBeTruthy();
    await page.goto(`${base}/edit/${id}`);
    await expect(field(page, 'Notes')).toHaveValue(marker);
    await expect(field(page, 'Batch number')).toHaveValue(marker);
    await expect(field(page, 'Ref No')).toHaveValue(ref);
    await expect(page.getByRole('main').getByText('Draft', {exact: true})).toBeVisible();
    await expect(table(page, 0).getByRole('combobox', {name: 'Choose product', exact: true})).toHaveValue('gold');
    await expect(table(page, 1).getByRole('combobox', {name: 'Choose product', exact: true})).toHaveValue('potat');
    await expect(page.getByRole('checkbox', {name: 'Scrap', exact: true})).not.toBeChecked();
    for (let i = 0; i < 2; i++) await expect.poll(async () => Number(await table(page, i).getByRole('textbox').first().inputValue())).toBe(1);
    await page.getByRole('button', {name: 'Delete', exact: true}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Cancel', exact: true}).click();
    await page.reload(); await expect(field(page, 'Notes')).toHaveValue(marker);
    await field(page, 'Notes').fill(marker + '-EDITED');
    const updated = await save(page, 'PUT', '/' + id);
    const path = info.outputPath('manufacturing-update-result.png');
    await page.screenshot({path, fullPage: true}); await info.attach('manufacturing-update-screen', {path, contentType: 'image/png'});
    expect(updated.status, 'Updating only draft notes should succeed with the saved products').toBe(200);
    expect(updated.body.is_success).toBe(true);
    await page.goto(`${base}/edit/${id}`);
    await expect(field(page, 'Notes')).toHaveValue(marker + '-EDITED');
  } finally { if (id) await removeOwned(page, id, ref); }
});
