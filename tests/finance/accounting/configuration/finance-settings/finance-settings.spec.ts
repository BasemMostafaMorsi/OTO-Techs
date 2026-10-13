import {test, expect, Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir} from 'node:fs/promises';

const route='/en/finance/accounting/configuration/setting';
const folder='artifacts/finance/accounting/configuration/finance-settings';
const screens: Record<string, number>={Sales:5,Purchases:4,Vat:2,Vouchers:2,'Financial settlement':1,Inventory:6,'Banks & Treasuries':4,General:2};
async function values(panel:ReturnType<Page['getByRole']>){return {inputs:await panel.locator('input').evaluateAll(nodes=>nodes.map(node=>({value:(node as HTMLInputElement).value,checked:(node as HTMLInputElement).checked}))),chips:await panel.getByRole('button',{name:/^\d+\./}).allTextContents()};}
async function select(page:Page,name:string){
 await page.getByRole('tab',{name,exact:true}).click();
 const panel=page.getByRole('tabpanel',{name,exact:true});
 await expect(panel).toBeVisible();
 return panel;
}
test.beforeEach(async({page})=>{test.setTimeout(90000);await login(page);const data=page.waitForResponse(r=>r.url().split('?')[0].endsWith('/api/v1.0/finance/finance_settings'));await page.goto(route);expect((await data).ok()).toBeTruthy();await expect(page.getByRole('tab')).toHaveCount(11);});
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('finance-settings-screen',{path,contentType:'image/png'});});

test('Chart of accounts depth is populated and protected',async({page})=>{
 const panel=await select(page,'Chart of accounts');const depth=panel.getByRole('textbox');await expect(depth).toBeDisabled();await expect(depth).toHaveValue(/^[1-9]\d*$/);
});
for(const [name,count] of Object.entries(screens))test(`${name} controls load and dropdown dismissal preserves saved values after reload`,async({page},info)=>{
 let panel=await select(page,name);await expect(panel.getByRole('combobox')).toHaveCount(count);await expect(panel.getByRole('button',{name:'Save',exact:true})).toBeVisible();
 // Vouchers use chips, so empty combobox inputs are intentional.
 if(name!=='Vouchers')for(const combo of await panel.getByRole('combobox').all())await expect(combo).not.toHaveValue('');
 else await expect(panel.getByRole('button',{name:/^\d+\./}).first()).toBeVisible();
 await expect(panel.getByRole('progressbar')).toHaveCount(0);
 const before=await values(panel);await info.attach('saved-settings-before',{body:JSON.stringify(before),contentType:'application/json'});
 for(const combo of await panel.getByRole('combobox').all()){
  await combo.click();await expect(page.getByRole('listbox')).toBeVisible();await expect(page.getByRole('option').first()).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toBeHidden();
 }
 await expect.poll(()=>values(panel)).toEqual(before);
 await select(page,'Chart of accounts');panel=await select(page,name);await expect.poll(()=>values(panel)).toEqual(before);
 await page.reload();panel=await select(page,name);await expect.poll(()=>values(panel)).toEqual(before);
});
for(const [name,groups] of Object.entries({'Balance sheet':['Equity','Liabilities','Assets'],'Income statement':['Expenses','Revenue']}))test(`${name} configuration groups load`,async({page})=>{
 const panel=await select(page,name);for(const group of groups)await expect(panel.getByRole('button',{name:group,exact:true})).toBeVisible();
});

const settingsPath='/api/v1.0/finance/finance_settings';
const isSettings=(url:string)=>new URL(url).pathname===settingsPath;
function normalized(data:Record<string,unknown>){const {updated_at,created_at,...settings}=data;return settings;}
async function baseline(page:Page){const pending=page.waitForResponse(r=>isSettings(r.url())&&r.request().method()==='GET');await page.reload();const response=await pending;expect(response.ok()).toBeTruthy();return normalized((await response.json()).data);}
async function ready(page:Page,name:string){const panel=await select(page,name);await expect(panel.getByRole('combobox')).toHaveCount(screens[name]);if(name!=='Vouchers'){for(const control of await panel.getByRole('combobox').all())await expect(control).not.toHaveValue('');}else await expect(panel.getByRole('button',{name:/^\d+\./}).first()).toBeVisible();await expect(panel.getByRole('progressbar')).toHaveCount(0);return panel;}

for(const name of [...Object.keys(screens),'Save all'])test(`${name} unchanged save preserves server settings`,async({page},info)=>{
 const before=await baseline(page);
 if(name==='Save all'){for(const tab of Object.keys(screens))await ready(page,tab);}else await ready(page,name);
 const pending=page.waitForResponse(r=>isSettings(r.url())&&r.request().method()==='POST');
 await (name==='Save all'?page.getByRole('button',{name,exact:true}):page.getByRole('tabpanel').getByRole('button',{name:'Save',exact:true})).click();
 const response=await pending,body=await response.json();await info.attach('save-response',{body:JSON.stringify({status:response.status(),body}),contentType:'application/json'});
 expect(response.ok()).toBeTruthy();expect(body.is_success).toBe(true);expect(await baseline(page)).toEqual(before);
 await ready(page,name==='Save all'?'General':name);
});

for(const name of Object.keys(screens))test(`${name} first required selection rejects empty save and reload restores value`,async({page},info)=>{
 const before=await baseline(page);let panel=await ready(page,name);const snapshot=await values(panel);let attemptedWrites=0;
 // Guard invalid test data from reaching shared company settings. This verifies client validation only.
 await page.route('**/finance/finance_settings',async route=>{if(route.request().method()==='GET')await route.continue();else{attemptedWrites++;await route.abort();}});
 const control=panel.getByRole('combobox').first();await control.hover();await panel.getByRole('button',{name:'Clear',exact:true}).click();await expect(control).toHaveValue('');
 await panel.getByRole('button',{name:'Save',exact:true}).click();await expect(control).toHaveAttribute('aria-invalid','true');await expect(panel.getByText(/required/i).first()).toBeVisible();
 await info.attach('validation-screen',{body:await panel.ariaSnapshot(),contentType:'text/plain'});await panel.screenshot({path:folder+'/'+name.replace(/\W+/g,'-')+'-required.png'});
 expect(attemptedWrites,'Client validation must prevent invalid submission').toBe(0);expect(await baseline(page)).toEqual(before);panel=await ready(page,name);await expect.poll(()=>values(panel)).toEqual(snapshot);
});
