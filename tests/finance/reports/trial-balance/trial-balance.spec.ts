import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '../../../helpers/test';
import { login } from '../../../helpers/auth';
import { minorUnits } from '../../helpers/decimal';

test('@finance-readonly FIN-01 RPT-01 supporting check: complete trial balance arithmetic', async ({page},testInfo) => {
  test.setTimeout(150_000);
  await mkdir(path.resolve('artifacts/finance'),{recursive:true});
  try {
    await login(page);
    await page.setViewportSize({width:1440,height:1000});
    const response = page.waitForResponse(r => r.url().includes('/finance/trial_balance?'));
    await page.goto('/en/finance/financial-statement/trial-balance');
    expect((await response).status()).toBe(200);
    const counter = page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});
    await expect(counter).toBeVisible();
    const readCount = async () => (await counter.innerText()).split('/').map(Number);
    await expect.poll(async () => (await readCount())[1]).toBeGreaterThan(0);
    const total = (await readCount())[1];
    const container = page.getByRole('main').locator('.MuiTableContainer-root');
    let loaded = (await readCount())[0];
    for (let batch = 0; loaded < total && batch < 100; batch++) {
      const previous = loaded;
      await container.hover();
      const height = await container.evaluate(element => element.scrollHeight);
      await page.mouse.wheel(0,height);
      await expect.poll(async () => (await readCount())[0],{message:'Infinite scroll loads the next account batch',timeout:10_000})
        .toBeGreaterThan(previous);
      const counts = await readCount();
      expect(counts[1],'Account count remains stable during reconciliation').toBe(total);
      loaded = counts[0];
    }
    expect(loaded,'All accounts loaded before computing totals').toBe(total);
    const raw = await page.getByRole('table').locator('tbody tr,tfoot tr').evaluateAll(rows => rows.map(row =>
      Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.replace(/\s+/g,' ').trim())));
    const accounts = raw.filter(cells => cells.length === 9 && cells[0] !== 'Total' && cells[0] !== '');
    const footer = raw.filter(cells => cells[0] === 'Total');
    await testInfo.attach('all-trial-balance-rows',{body:JSON.stringify({total,accounts,footer},null,2),contentType:'application/json'});
    expect(accounts).toHaveLength(total);
    expect(footer).toHaveLength(1);
    expect(new Set(accounts.map(row => row[0])).size,'No duplicated account labels across batches').toBe(total);
    const codes = accounts.map(row => row[0].match(/^(\d+)\./)?.[1]);
    const amount = (value:string) => minorUnits(value,{precision:3});
    for (const row of accounts) {
      const [openingD,openingC,debit,credit,netD,netC,balanceD,balanceC] = row.slice(1).map(amount);
      expect.soft(netD-netC,`${row[0]}: net movement`).toBe(debit-credit);
      expect.soft(balanceD-balanceC,`${row[0]}: opening + movement = closing`).toBe(openingD-openingC+debit-credit);
    }
    const totals = footer[0].slice(1).map(amount);
    for (let column=0;column<8;column+=2) {
      expect.soft(totals[column],`Total debit equals credit in column pair ${column/2+1}`).toBe(totals[column+1]);
    }
    // Parent account rows already aggregate children. Sum roots once to avoid double counting.
    const unnumbered = accounts.filter((_,i) => !codes[i]);
    if (unnumbered.length) {
      testInfo.annotations.push({type:'data-quality',description:`No displayed account code: ${unnumbered.map(row=>row[0]).join(', ')}`});
      for (const row of unnumbered) {
        expect(row.slice(1).map(amount).every(value=>value===0n),
          `${row[0]}: nonzero unnumbered accounts need explicit hierarchy mapping before aggregation`).toBe(true);
      }
    }
    const roots = accounts.filter((_,i) => codes[i] && !codes.some((code,j) => j!==i && code && codes[i]!.startsWith(code)));
    expect(roots.length,'Chart contains multiple root account groups').toBeGreaterThan(1);
    for (const column of [3,4]) {
      const sum = roots.reduce((value,row) => value+amount(row[column]),0n);
      expect.soft(sum,`Root-account transaction sum for column ${column}`).toBe(amount(footer[0][column]));
    }
  } finally {
    const screenshot = path.resolve('artifacts/finance/trial-balance-all-accounts.png');
    await page.screenshot({path:screenshot,fullPage:true});
    await testInfo.attach('trial-balance-screen',{path:screenshot,contentType:'image/png'});
  }
});
