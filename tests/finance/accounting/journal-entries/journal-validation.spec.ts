import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { test, expect, Page } from '../../../helpers/test';
import { login } from '../../../helpers/auth';
import { minorUnits } from '../../helpers/decimal';

async function trialBalanceTotals(page: Page) {
  const response=page.waitForResponse(r=>r.url().includes('/finance/trial_balance?'));
  await page.goto('/en/finance/financial-statement/trial-balance');
  expect((await response).ok(),'Trial balance API').toBeTruthy();
  const counter=page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});
  await expect.poll(async()=>Number((await counter.innerText()).split('/')[1])).toBeGreaterThan(0);
  const footer=page.getByRole('table').getByRole('row').filter({has:page.getByText('Total',{exact:true})});
  await expect(footer).toHaveCount(1);
  await expect(footer.getByRole('cell')).toHaveCount(9);
  const cells=await footer.locator('td').allInnerTexts();
  expect(cells).toHaveLength(9);
  expect(cells[0]).toBe('Total');
  const values=cells.slice(1);
  return values.map(value=>minorUnits(value,{precision:3}).toString());
}

test('@finance ACC-02 unbalanced journal is rejected without changing trial balance',async({page},testInfo)=>{
  test.setTimeout(120_000);
  const reference=String(Date.now());
  const runID=`FIN-E2E-NEG-${reference}`;
  const mutations: {method:string;url:string}[]=[];
  await mkdir('artifacts/finance',{recursive:true});
  await login(page);
  const baseline=await trialBalanceTotals(page);
  await page.goto('/en/finance/accounting/journal-entries/create');
  await page.getByPlaceholder('MM/DD/YYYY',{exact:true}).fill(new Intl.DateTimeFormat('en-US',{
    month:'2-digit',day:'2-digit',year:'numeric',timeZone:'Africa/Cairo',
  }).format(new Date()));
  await page.locator('input[name=ref]').fill(reference);
  await page.locator('textarea[name=description]').fill(runID);
  await expect(page.getByPlaceholder('Currency',{exact:true})).toHaveValue('SAR');
  await page.getByPlaceholder('Search by name, number, or type').fill('cash');
  await page.getByRole('option').filter({hasText:/Main treasury\s*#1111001/}).click();
  await page.getByRole('button',{name:'New',exact:true}).click();
  await page.getByPlaceholder('Search by name, number, or type').nth(1).click();
  await page.getByRole('option').filter({hasText:/Petty Cash\s*#1111002/}).click();
  await page.locator('input[name=debit_0]').fill('0.10');
  await page.locator('input[name=credit_1]').fill('0.09');
  await page.locator('input[name=credit_1]').press('Tab');
  await expect(page.getByRole('main')).toContainText(/Division\s*=\s*0\.010/);
  page.on('request',request=>{
    if(['POST','PUT','PATCH','DELETE'].includes(request.method())&&request.url().includes('/finance/')) {
      const url=new URL(request.url()); mutations.push({method:request.method(),url:url.origin+url.pathname});
    }
  });
  try {
    await page.getByRole('button',{name:'Submit',exact:true}).click();
    await page.getByRole('menuitem',{name:'New',exact:true}).click();
    await expect(page.getByText('Division must be equal 0',{exact:true})).toBeVisible();
    await expect(page).toHaveURL(/\/journal-entries\/create$/);
    await expect(page.getByText('Please insert numbers only',{exact:true})).toBeHidden();
    const screenshot=path.resolve('artifacts/finance/unbalanced-journal.png');
    await page.screenshot({path:screenshot,fullPage:true});
    await testInfo.attach('unbalanced-validation-screen',{path:screenshot,contentType:'image/png'});
    await page.keyboard.press('Escape');
    const after=await trialBalanceTotals(page);
    await testInfo.attach('no-posting-evidence',{
      body:JSON.stringify({runID,reference,debit:'0.10',credit:'0.09',baseline,after,mutations},null,2),contentType:'application/json',
    });
    expect(mutations,'Rejected journal must not issue a finance write request').toEqual([]);
    expect(after,'All displayed trial-balance grand totals remain unchanged').toEqual(baseline);
  } finally {
    const file=path.resolve('artifacts/finance/journal-validation-final.png');
    await page.screenshot({path:file,fullPage:true});
    await testInfo.attach('journal-validation-final',{path:file,contentType:'image/png'});
    await testInfo.attach('finance-write-requests',{body:JSON.stringify(mutations),contentType:'application/json'});
  }
});
