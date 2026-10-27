import {inventoryInput} from '../../../helpers/inventory-columns';
import {test, expect, Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';

const base = '/en/finance/inventory/transfer/internal-transfer';
const api = '/inventory/internal_transfers';
const field = (page: Page, name: string) => page.getByRole('textbox', {name, exact: true});
const item = (page: Page) => page.getByRole('row').filter({has: page.getByRole('combobox', {name: 'Choose product', exact: true})}).first();
async function warehouse(page: Page, name: string, value: string) {
  await page.getByRole('combobox', {name, exact: true}).click();
  await page.getByRole('option', {name: value, exact: true}).click();
}
async function product(page: Page) {
  await page.getByRole('combobox', {name: 'Choose product', exact: true}).click();
  const option = page.getByRole('option').filter({hasText: 'gold'}).filter({hasText: 'P-0004'});
  await expect(option).toHaveCount(1);
  const [data] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'GET' && /\/inventory\/products\/[^/?]+$/.test(r.url()))
      .then(async r => { expect(r.ok()).toBeTruthy(); return (await r.json()).data; }),
    option.click(),
  ]);
  await expect(page.getByRole('combobox', {name: 'Choose product', exact: true})).toHaveValue('gold');
  return data;
}
async function prepare(page: Page) {
  await page.goto(base + '/create');
  await warehouse(page, 'From warehouse *', 'مخزن الرياض #1');
  await warehouse(page, 'To warehouse *', 'مخزن جدة #2');
  return product(page);
}
async function save(page: Page, method: string, suffix = '') {
  // Read the response immediately, before the UI navigates after saving.
  const pending = page.waitForResponse(r => r.request().method() === method && r.url().endsWith(api + suffix))
    .then(async r => ({status: r.status(), body: await r.json(), submitted: r.request().postDataJSON()}));
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Save as Draft', exact: true}).click();
  const result = await pending;
  await test.info().attach('draft-save-response', {body: JSON.stringify(result), contentType: 'application/json'});
  return result;
}
async function reopen(page: Page, id: string, ref: string, notes: string, quantity: number) {
  await page.goto(`${base}/edit/${id}`);
  await expect(field(page, 'Ref No')).toHaveValue(ref);
  await expect(field(page, 'Notes')).toHaveValue(notes);
  await expect(page.getByRole('main').getByText('Draft', {exact: true})).toBeVisible();
  await expect(page.getByRole('combobox', {name: 'From warehouse *', exact: true})).toHaveValue('مخزن الرياض');
  await expect(page.getByRole('combobox', {name: 'To warehouse *', exact: true})).toHaveValue('مخزن جدة');
  await expect(page.getByRole('combobox', {name: 'Choose product', exact: true})).toHaveValue('gold');
  await expect.poll(async () => Number(await item(page).getByRole('textbox').first().inputValue())).toBe(quantity);
}
async function removeOwned(page: Page, id: string, ref: string) {
  await page.goto(`${base}/edit/${id}`);
  await expect(field(page, 'Ref No')).toHaveValue(ref);
  await expect(page.getByRole('main').getByText('Draft', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  const pending = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().endsWith(api + '/' + id))
    .then(async r => ({status: r.status(), body: await r.json()}));
  await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
  const result = await pending;
  await test.info().attach('owned-draft-delete', {body: JSON.stringify({id, ref, ...result}), contentType: 'application/json'});
  expect(result.status).toBe(200);
  expect(result.body.is_success).toBe(true);
  await expect(page).toHaveURL(/internal-transfer$/);
  await page.getByPlaceholder('Search', {exact: true}).fill(ref);
  await expect(page.getByRole('button', {name: '0/0', exact: true})).toBeVisible();
}

test.beforeEach(async ({page}) => { test.setTimeout(180000); await login(page); });
test.afterEach(async ({page}, info) => {
  const path = info.outputPath(`${info.title.replace(/[^a-z0-9]+/gi, '-')}.png`);
  await page.screenshot({path, fullPage: true});
  await info.attach('internal-transfer-screen', {path, contentType: 'image/png'});
});

for (const quantity of ['0', '-1']) {
  test(`complete draft rejects quantity ${quantity} with server validation`, async ({page}, info) => {
    await prepare(page);
    const ref = String(Date.now());
    await field(page, 'Ref No').fill(ref);
    await field(page, 'Notes').fill('IT-E2E-INVALID-' + ref);
    await item(page).getByRole('textbox').first().fill(quantity);
    const result = await save(page, 'POST');
    try {
      expect(result.status).toBe(422);
      expect(result.body.is_success).toBe(false);
      expect(result.body.data).toBeNull();
      expect(result.body.message).toMatch(/quantity must be at least 1/i);
      await expect(page).toHaveURL(/internal-transfer\/create$/);
      await info.attach('quantity-validation', {body: JSON.stringify({quantity, result}), contentType: 'application/json'});
    } finally {
      if (result.body.is_success && result.body.data?.id) await removeOwned(page, String(result.body.data.id), ref);
    }
  });
}

test('source warehouse changes refresh readonly balance from product stock details', async ({page}, info) => {
  const data = await prepare(page);
  const stock = (id: number) => Number(data.stock_details.find((s: {warehouse_id: number}) => s.warehouse_id === id).stock);
  const balance = await inventoryInput(page.getByRole('table').first(), 'Balance before');
  await expect(balance).toHaveAttribute('readonly', '');
  await expect.poll(async () => Number(await balance.inputValue())).toBe(stock(1));
  await warehouse(page, 'To warehouse *', 'مخزن مكة #3');
  await warehouse(page, 'From warehouse *', 'مخزن جدة #2');
  await expect.poll(async () => Number(await balance.inputValue())).toBe(stock(2));
  await warehouse(page, 'From warehouse *', 'مخزن الرياض #1');
  await expect.poll(async () => Number(await balance.inputValue())).toBe(stock(1));
  await info.attach('warehouse-balance-comparison', {body: JSON.stringify({riyadh: stock(1), jeddah: stock(2)}), contentType: 'application/json'});
});

test('owned draft persists edits cancels deletion and leaves stock unchanged', async ({page}, info) => {
  const original = await prepare(page);
  const ref = String(Date.now()), notes = 'IT-E2E-' + ref;
  let id: string | undefined;
  try {
    await field(page, 'Ref No').fill(ref);
    await field(page, 'Notes').fill(notes);
    await item(page).getByRole('textbox').first().fill('1');
    const created = await save(page, 'POST');
    if (created.body.data?.id) id = String(created.body.data.id);
    expect(created.body.is_success).toBe(true);
    expect(id).toBeTruthy();
    expect(created.body.data.status).toBe(-1);
    await reopen(page, id!, ref, notes, 1);
    await field(page, 'Notes').fill(notes + '-EDITED');
    await item(page).getByRole('textbox').first().fill('2');
    const updated = await save(page, 'PUT', '/' + id);
    expect(updated.body.is_success).toBe(true);
    expect(updated.body.data.status).toBe(-1);
    await reopen(page, id!, ref, notes + '-EDITED', 2);
    const path = info.outputPath('edited-draft.png');
    await page.screenshot({path, fullPage: true});
    await info.attach('edited-draft', {path, contentType: 'image/png'});
    await page.getByRole('button', {name: 'Delete', exact: true}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await reopen(page, id!, ref, notes + '-EDITED', 2);
    const after = await prepare(page);
    const stocks = (data: typeof original) => data.stock_details.map((s: {warehouse_id: number; stock: number}) => ({warehouse: s.warehouse_id, stock: Number(s.stock)})).sort((a: {warehouse: number}, b: {warehouse: number}) => a.warehouse - b.warehouse);
    await info.attach('draft-stock-comparison', {body: JSON.stringify({before: stocks(original), after: stocks(after)}), contentType: 'application/json'});
    expect(stocks(after), 'Saving and editing a draft must not move inventory').toEqual(stocks(original));
  } finally {
    if (id) await removeOwned(page, id, ref);
  }
});

test('warehouse status and combined filters match baseline and Reset restores rows', async ({page}, info) => {
  test.setTimeout(300000);
  await prepare(page);
  const ref = String(Date.now());
  let id: string | undefined;
  const response = () => page.waitForResponse(r => r.request().method() === 'GET' && r.url().includes(api + '?'))
    .then(async r => { expect(r.ok()).toBeTruthy(); return (await r.json()).data; });
  const ids = (rows: {id: number}[]) => rows.map(r => String(r.id)).sort();
  const visibleIDs = () => page.getByRole('table').locator('tbody tr').evaluateAll(rows => rows.map(row => row.querySelector('td:nth-child(2) p')?.textContent?.match(/^#(\d+)$/)?.[1]).filter(Boolean).sort());
  try {
    await field(page, 'Ref No').fill(ref);
    await field(page, 'Notes').fill('IT-E2E-FILTER-' + ref);
    await item(page).getByRole('textbox').first().fill('1');
    const created = await save(page, 'POST');
    if (created.body.data?.id) id = String(created.body.data.id);
    expect(created.body.is_success).toBe(true);
    expect(id).toBeTruthy();
    await expect(page).toHaveURL(/internal-transfer$/);
    await expect(page.getByRole('button', {name: 'Filter', exact: true})).toBeVisible();
    const initial = response(); await page.reload(); const baseline = await initial;
    // Avoid silently claiming full-list comparisons when pagination is required.
    expect(baseline.meta.last_page, 'This comparison requires the complete baseline on one page').toBe(1);
    await expect.poll(visibleIDs).toEqual(ids(baseline.collection));
    expect(baseline.collection.some((r: {id: number}) => String(r.id) === id)).toBe(true);
    const variants = [
      {name: 'From Riyadh', choices: [['From', 'مخزن الرياض']], matches: (r: any) => r.fromWarehouse.id === 1},
      {name: 'From Jeddah', choices: [['From', 'مخزن جدة']], matches: (r: any) => r.fromWarehouse.id === 2},
      {name: 'To Makkah', choices: [['To', 'مخزن مكة']], matches: (r: any) => r.toWarehouse.id === 3},
      {name: 'Draft', choices: [['Status', 'Draft']], matches: (r: any) => r.status === -1},
      {name: 'Completed', choices: [['Status', 'Completed']], matches: (r: any) => r.status === 3},
      {name: 'Riyadh to Jeddah Completed', choices: [['From', 'مخزن الرياض'], ['To', 'مخزن جدة'], ['Status', 'Completed']], matches: (r: any) => r.fromWarehouse.id === 1 && r.toWarehouse.id === 2 && r.status === 3},
    ];
    for (const variant of variants) await test.step(variant.name + ' and Reset', async () => {
      await page.getByRole('button', {name: 'Filter', exact: true}).click();
      for (const [name, value] of variant.choices) {
        await page.getByRole('combobox', {name, exact: true}).click();
        const warehouseId = name === 'Status' ? null : ({'مخزن الرياض': 1, 'مخزن جدة': 2, 'مخزن مكة': 3} as Record<string, number>)[value];
        await page.getByRole('option', {name: warehouseId ? value + ' #' + warehouseId : value, exact: true}).click();
      }
      const pending = response(); await page.getByRole('button', {name: 'Submit', exact: true}).click(); const filtered = await pending;
      const expected = ids(baseline.collection.filter(variant.matches));
      await info.attach('filter-' + variant.name, {body: JSON.stringify({expected, actual: ids(filtered.collection), total: filtered.meta.total}), contentType: 'application/json'});
      expect(filtered.meta.total).toBe(expected.length);
      expect(ids(filtered.collection)).toEqual(expected);
      await expect.poll(visibleIDs).toEqual(expected);
      await page.getByRole('button', {name: 'Filter', exact: true}).click();
      const reset = response(); await page.getByRole('button', {name: 'Reset', exact: true}).click();
      expect(ids((await reset).collection)).toEqual(ids(baseline.collection));
      await expect.poll(visibleIDs).toEqual(ids(baseline.collection));
    });
  } finally {
    if (id) { await page.keyboard.press('Escape'); await removeOwned(page, id, ref); }
  }
});
