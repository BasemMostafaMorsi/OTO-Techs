import {test, expect, Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir} from 'node:fs/promises';

const route='/en/finance/accounting/configuration/setting';
const folder='artifacts/finance/accounting/configuration/finance-settings';
const screens=['Sales','Purchases','Vat','Vouchers','Financial settlement','Inventory','Banks & Treasuries','General'];
// Year belongs to the separate Financial Period form, not the saved account selections.
const accountSelections=(panel:ReturnType<Page['getByRole']>)=>panel.getByRole('combobox',{name:/^(?!Year(?:\s|\*|$))/i});
let voucherSelectionCount=0;
function rememberSettings(data:any){voucherSelectionCount=(data.payment_voucher_account_ids?.length||0)+(data.receipt_voucher_account_ids?.length||0);}
async function vouchersReady(panel:ReturnType<Page['getByRole']>){await expect(panel.getByRole('button',{name:/^\d+\./})).toHaveCount(voucherSelectionCount);}
async function values(panel:ReturnType<Page['getByRole']>){return {inputs:await panel.locator('input').evaluateAll(nodes=>nodes.map(node=>({value:(node as HTMLInputElement).value,checked:(node as HTMLInputElement).checked}))),chips:await panel.getByRole('button',{name:/^\d+\./}).allTextContents()};}
async function select(page:Page,name:string){
 await page.getByRole('tab',{name,exact:true}).click();
 const panel=page.getByRole('tabpanel',{name,exact:true});
 await expect(panel).toBeVisible();
 return panel;
}
test.beforeEach(async({page})=>{test.setTimeout(90000);await login(page);const data=page.waitForResponse(r=>r.url().split('?')[0].endsWith('/api/v1.0/finance/finance_settings'));await page.goto(route);const response=await data;expect(response.ok()).toBeTruthy();rememberSettings((await response.json()).data);for(const name of screens)await expect(page.getByRole('tab',{name,exact:true})).toBeVisible();});
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('finance-settings-screen',{path,contentType:'image/png'});});

test('Chart of accounts depth is populated and protected',async({page})=>{
 const panel=await select(page,'Chart of accounts');const depth=panel.getByRole('textbox');await expect(depth).toBeDisabled();await expect(depth).toHaveValue(/^[1-9]\d*$/);
});
for(const name of screens)test(`${name} controls load and dropdown dismissal preserves saved values after reload`,async({page},info)=>{
 let panel=await select(page,name);await expect(accountSelections(panel).first()).toBeVisible();await expect(panel.getByRole('button',{name:'Save',exact:true})).toBeVisible();
 // Vouchers use chips, so empty combobox inputs are intentional.
 if(name!=='Vouchers')for(const combo of await accountSelections(panel).all())await expect(combo).not.toHaveValue('');
 else await vouchersReady(panel);
 await expect(panel.getByRole('progressbar')).toHaveCount(0);
 const before=await values(panel);await info.attach('saved-settings-before',{body:JSON.stringify(before),contentType:'application/json'});
 for(const combo of await accountSelections(panel).all()){
  await combo.click();await expect(page.getByRole('listbox')).toBeVisible();await expect(page.getByRole('option').first()).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toBeHidden();
 }
 await expect.poll(()=>values(panel)).toEqual(before);
 await select(page,'Chart of accounts');panel=await select(page,name);await expect.poll(()=>values(panel)).toEqual(before);
 await page.reload();panel=await ready(page,name);await expect.poll(()=>values(panel)).toEqual(before);
});
for(const [name,groups] of Object.entries({'Balance sheet':['Equity','Liabilities','Assets'],'Income statement':['Expenses','Revenue']}))test(`${name} configuration groups load`,async({page})=>{
 const panel=await select(page,name);for(const group of groups)await expect(panel.getByRole('button',{name:group,exact:true})).toBeVisible();
});

const settingsPath='/api/v1.0/finance/finance_settings';
const isSettings=(url:string)=>new URL(url).pathname===settingsPath;
function normalized(data:Record<string,unknown>){const {updated_at,created_at,...settings}=data;return settings;}
async function baseline(page:Page){const pending=page.waitForResponse(r=>isSettings(r.url())&&r.request().method()==='GET');await page.reload();const response=await pending;expect(response.ok()).toBeTruthy();const data=(await response.json()).data;rememberSettings(data);return normalized(data);}
async function ready(page:Page,name:string){const panel=await select(page,name);await expect(accountSelections(panel).first()).toBeVisible();if(name!=='Vouchers'){for(const control of await accountSelections(panel).all())await expect(control).not.toHaveValue('');}else await vouchersReady(panel);await expect(panel.getByRole('progressbar')).toHaveCount(0);return panel;}

for(const name of [...screens,'Save all'])test(`${name} save preserves settings with required financial year`,async({page},info)=>{
 const before=await baseline(page);
 let selectedYear:string|undefined;
 if(name==='Save all'||name==='Financial settlement'){
  const settlement=await select(page,'Financial settlement');
  const year=settlement.getByRole('combobox',{name:/^Year/});
  await expect(year).toBeVisible();
  selectedYear=String(before.closing_period_year || new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Africa/Cairo'}).format(new Date()));
  if(await year.inputValue()!==selectedYear){await year.click();await page.getByRole('option',{name:selectedYear,exact:true}).click();}
  await expect(year).toHaveValue(selectedYear);
 }
 if(name==='Save all'){for(const tab of screens)await ready(page,tab);}else await ready(page,name);
 const pending=page.waitForResponse(r=>isSettings(r.url())&&r.request().method()==='POST');
 await (name==='Save all'?page.getByRole('button',{name,exact:true}):page.getByRole('tabpanel').getByRole('button',{name:'Save',exact:true})).click();
 const response=await pending,body=await response.json();await info.attach('save-response',{body:JSON.stringify({status:response.status(),body}),contentType:'application/json'});
 expect(response.ok()).toBeTruthy();expect(body.is_success).toBe(true);
 const after=await baseline(page);
 if(selectedYear){
  expect(String(after.closing_period_year)).toBe(selectedYear);
  const {closing_period_year:oldYear,...original}=before;
  const {closing_period_year:newYear,...saved}=after;
  expect(saved).toEqual(original);
  const settlement=await select(page,'Financial settlement');await expect(settlement.getByRole('combobox',{name:/^Year/})).toHaveValue(selectedYear);
 }else expect(after).toEqual(before);
 await ready(page,name==='Save all'?'General':name);
});

for(const name of screens)test(`${name} first required selection rejects empty save and reload restores value`,async({page},info)=>{
 const before=await baseline(page);let panel=await ready(page,name);const snapshot=await values(panel);let attemptedWrites=0;
 // Guard invalid test data from reaching shared company settings. This verifies client validation only.
 await page.route('**/finance/finance_settings',async route=>{if(route.request().method()==='GET')await route.continue();else{attemptedWrites++;await route.abort();}});
 const control=accountSelections(panel).first();await control.hover();await panel.getByRole('button',{name:'Clear',exact:true}).click();await expect(control).toHaveValue('');
 await panel.getByRole('button',{name:'Save',exact:true}).click();await expect(control).toHaveAttribute('aria-invalid','true');await expect(panel.getByText(/required/i).first()).toBeVisible();
 await info.attach('validation-screen',{body:await panel.ariaSnapshot(),contentType:'text/plain'});await panel.screenshot({path:folder+'/'+name.replace(/\W+/g,'-')+'-required.png'});
 expect(attemptedWrites,'Client validation must prevent invalid submission').toBe(0);expect(await baseline(page)).toEqual(before);panel=await ready(page,name);await expect.poll(()=>values(panel)).toEqual(snapshot);
});
