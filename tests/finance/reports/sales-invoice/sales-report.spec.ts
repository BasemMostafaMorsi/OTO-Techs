import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '../../../helpers/test';
import { login } from '../../../helpers/auth';
import { parseCSV } from '../../helpers/csv';
import { minorUnits } from '../../helpers/decimal';
import { loadAllInvoiceRows, filterCustomer, invoiceID, money, normalize, openSalesReport, readTable, salesSnapshot } from '../../helpers/sales-report';

test.describe('@finance-readonly Sales Invoice report reconciliation', () => {
  test.setTimeout(90_000);
  test.beforeEach(async ({page}) => {
    await mkdir(path.resolve('artifacts/finance'), {recursive:true});
    await login(page);
  });
  test.afterEach(async ({page}, testInfo) => {
    const directory = path.resolve('artifacts/finance');
    await mkdir(directory, {recursive:true});
    const screenshot = path.join(directory, `${testInfo.title.replace(/[^a-zA-Z0-9-]+/g,'-')}.png`);
    await page.screenshot({path:screenshot,fullPage:true});
    await testInfo.attach('finance-screen', {path:screenshot,contentType:'image/png'});
  });

  test('RPT-01 supporting check: source invoice fields and complete report totals', async ({page}, testInfo) => {
    await page.goto('/en/finance/sales-invoices/invoices');
    await expect.poll(async () => (await readTable(page)).length).toBeGreaterThan(0);
    const source = await loadAllInvoiceRows(page);
    await openSalesReport(page);
    const report = await salesSnapshot(page);
    await testInfo.attach('source-report-values', {body:JSON.stringify({source,report},null,2),contentType:'application/json'});
    expect.soft(report.invoices.map(r => invoiceID(r.INV)).sort(), 'Report invoice IDs match the fully loaded source list').toEqual(source.map(r => invoiceID(r['Invoice no'])).sort());
    for (const row of source) {
      const id = invoiceID(row['Invoice no']);
      const matching = report.invoices.find(r => invoiceID(r.INV) === id);
      expect.soft(matching, `Invoice #${id}: present in report`).toBeDefined();
      if (!matching) continue;
      expect.soft(normalize(matching.NAME), `Invoice #${id}: customer`).toBe(normalize(row.Customer));
      expect.soft(minorUnits(matching.Total,money), `Invoice #${id}: total`).toBe(minorUnits(row.Total,money));
      expect.soft(minorUnits(matching.Amount,money), `Invoice #${id}: outstanding`).toBe(minorUnits(row['Remaining amount'],money));
      expect.soft(matching.Status, `Invoice #${id}: payment status`).toBe(row['Payment status']);
    }
  });

  test('RPT-01 supporting check: customer filter, refresh and reset', async ({page}, testInfo) => {
    await openSalesReport(page);
    const baseline = await salesSnapshot(page);
    const customer = baseline.invoices[0].NAME;
    const customerID = invoiceID(customer);
    const expected = baseline.invoices.filter(row => invoiceID(row.NAME) === customerID);
    await filterCustomer(page, customerID, expected.map(r => invoiceID(r.INV)));
    const filtered = await salesSnapshot(page);
    await testInfo.attach('filter-comparison', {body:JSON.stringify({baseline,expected,filtered},null,2),contentType:'application/json'});
    expect.soft(filtered.invoices, 'Customer filter preserves invoice values; OPEN BALANCE semantics need confirmation if different').toEqual(expected);
    const refreshResponse = page.waitForResponse(r => r.url().includes('/reports/sales_invoice_report?'));
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    expect((await refreshResponse).status()).toBe(200);
    await expect.poll(async () => await salesSnapshot(page)).toEqual(filtered);
    await testInfo.attach('filtered-values',{body:JSON.stringify({customer,baseline,filtered},null,2),contentType:'application/json'});
    await page.screenshot({path:path.resolve('artifacts/finance/customer-filter.png'),fullPage:true});
    await page.getByRole('button',{name:'Filter',exact:true}).click();
    const resetResponse = page.waitForResponse(r => r.url().includes('/reports/sales_invoice_report?'));
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    expect((await resetResponse).status()).toBe(200);
    await expect.poll(async () => (await readTable(page)).filter(r => /^sales invoice #\d+$/.test(r.INV)).length).toBe(baseline.invoices.length);
    expect(await salesSnapshot(page)).toEqual(baseline);
  });

  for (const filtered of [false, true]) {
  test(`RPT-02 supporting check: ${filtered ? 'customer-filtered' : 'unfiltered'} CSV matches visible invoice fields`, async ({page},testInfo) => {
    await openSalesReport(page);
    if (filtered) {
      const baseline = await salesSnapshot(page);
      const customerID = invoiceID(baseline.invoices[0].NAME);
      await filterCustomer(page, customerID, baseline.invoices.filter(r => invoiceID(r.NAME) === customerID).map(r => invoiceID(r.INV)));
    }
    const report = await salesSnapshot(page);
    await page.getByRole('button',{name:'Export',exact:true}).click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByText('Export Excel',{exact:true}).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    const file = testInfo.outputPath('sales-invoice-export.csv');
    await download.saveAs(file);
    await testInfo.attach('sales-invoice-export',{path:file,contentType:'text/csv'});
    const rows = parseCSV(await readFile(file,'utf8'));
    await testInfo.attach('export-ui-values', {body:JSON.stringify({report,rows},null,2),contentType:'application/json'});
    expect(rows.map(row => row['Invoice ID']).sort()).toEqual(report.invoices.map(row => invoiceID(row.INV)).sort());
    for (const visible of report.invoices) {
      const id = invoiceID(visible.INV);
      const exported = rows.find(row => row['Invoice ID'] === id)!;
      expect.soft(exported['Invoice Number'],`#${id}: source number`).toBe(id);
      expect.soft(exported['Customer Name'],`#${id}: customer`).toBe(visible.NAME.replace(/\s*#\d+$/, '').trim());
      expect.soft(minorUnits(exported['Grand Total'],money),`#${id}: invoice total`).toBe(minorUnits(visible.Total,money));
      expect.soft(exported['Payment Status'],`#${id}: payment status`).toBe(visible.Status);
      expect.soft(exported['Created At'],`#${id}: creation time`).toBe(visible['Created at']);
      const date = exported.Date;
      expect.soft(date,`#${id}: ISO document date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        expect.soft(new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})
          .format(new Date(`${date}T00:00:00Z`)),`#${id}: document date`).toBe(visible.Date);
      }
      expect.soft(exported['Remaining Amount'],`#${id}: outstanding must be numeric, not blank`).toMatch(/^-?\d+(\.\d+)?$/);
      if (exported['Remaining Amount']) {
        expect.soft(minorUnits(exported['Remaining Amount'],money),`#${id}: outstanding`).toBe(minorUnits(visible.Amount,money));
      }
    }
  });
  }
});
