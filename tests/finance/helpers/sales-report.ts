import { expect, Page } from '@playwright/test';
import { minorUnits, sumMinor } from './decimal';

export const salesReportPath = '/en/finance/financial-statement/reports/sales-invoice-report';
export const money = { precision: 2 } as const; // English UI displays two decimal places; no FX assumptions.
export const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
export const invoiceID = (text: string) => {
  const match = text.match(/#(\d+)/);
  if (!match) throw new Error(`Missing invoice ID: ${text}`);
  return match[1];
};

export async function readTable(page: Page): Promise<Record<string, string>[]> {
  const table = page.getByRole('main').getByRole('table');
  await expect(table).toBeVisible();
  const headers = (await table.getByRole('columnheader').allTextContents()).map(normalize);
  const rows = await table.locator('tbody tr, tfoot tr').evaluateAll(elements => elements.map(row =>
    Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.replace(/\s+/g, ' ').trim())));
  return rows.filter(cells => cells.length === headers.length)
    .map(cells => Object.fromEntries(headers.map((h, i) => [h, cells[i]])));
}

export async function expectAllRowsVisible(page: Page, count: number) {
  // Fail explicitly on a paginated data set until its pager has been verified;
  // never compare a single page with a grand total and claim all-page coverage.
  await expect(page.getByRole('main').getByRole('button', {name:`${count}/${count}`,exact:true}),
    'Requires the complete data set on screen; larger data sets need a verified pagination adapter').toBeVisible();
}

export async function loadAllInvoiceRows(page: Page) {
  const counter = page.getByRole('main').getByRole('button', {name:/^\d+\/\d+$/});
  await expect(counter).toBeVisible();
  const counts = async () => (await counter.innerText()).split('/').map(Number);
  await expect.poll(async () => (await counts())[1]).toBeGreaterThan(0);
  const total = (await counts())[1];
  for (let batch=0; (await counts())[0]<total && batch<100; batch++) {
    const previous=(await counts())[0];
    await page.getByRole('main').getByRole('table').evaluate(table => {
      let container=table.parentElement;
      while(container && container.scrollHeight<=container.clientHeight) container=container.parentElement;
      const target=container || document.scrollingElement;
      if(target) target.scrollTop=target.scrollHeight;
    });
    await expect.poll(async () => (await counts())[0], {message:'Next invoice batch loads'}).toBeGreaterThan(previous);
    expect((await counts())[1], 'Invoice count stays stable while loading').toBe(total);
  }
  const rows=await readTable(page);
  await expectAllRowsVisible(page,rows.length);
  expect(new Set(rows.map(row=>invoiceID(row['Invoice no']))).size).toBe(total);
  return rows;
}

export async function openSalesReport(page: Page) {
  const response = page.waitForResponse(r => r.url().includes('/reports/sales_invoice_report?') && r.request().method() === 'GET');
  await page.goto(salesReportPath);
  expect((await response).status(), 'Sales report API').toBe(200);
  await expect(page.getByRole('heading', {name:'Sales Invoice',exact:true})).toBeVisible();
  await expect.poll(async () => (await readTable(page)).filter(r => /^sales invoice #\d+$/.test(r.INV)).length).toBeGreaterThan(0);
}

export async function salesSnapshot(page: Page) {
  const rows = await readTable(page);
  const invoices = rows.filter(r => /^sales invoice #\d+$/.test(r.INV));
  const totals = rows.filter(r => r.Date === 'Total');
  expect(totals, 'Exactly one report total row').toHaveLength(1);
  expect(new Set(invoices.map(r => invoiceID(r.INV))).size, 'No duplicate invoice IDs').toBe(invoices.length);
  await expectAllRowsVisible(page, invoices.length);
  for (const column of ['Amount', 'Total']) {
    expect(minorUnits(totals[0][column], money), `${column}: total equals all displayed rows`)
      .toBe(sumMinor(invoices.map(r => r[column]), money));
  }
  return { invoices, total: totals[0] };
}

export async function filterCustomer(page: Page, customerID: string, expectedIDs: string[]) {
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  await page.getByRole('combobox',{name:'Customer',exact:true}).click();
  await page.getByRole('option').filter({hasText:new RegExp(`#${customerID}\\s*$`)}).click();
  const response = page.waitForResponse(r => r.url().includes('/reports/sales_invoice_report?'));
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  expect((await response).status()).toBe(200);
  await expect.poll(async () => (await readTable(page)).filter(r => /^sales invoice #\d+$/.test(r.INV))
    .map(r => invoiceID(r.INV)).sort()).toEqual([...expectedIDs].sort());
}
