import {test,expect,Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir,writeFile} from 'node:fs/promises';
const base='/en/finance/accounting/configuration/banks-treasuries',api='/api/v1.0/bank_vaults',folder='artifacts/finance/accounting/configuration/banks-treasuries';
const field=(p:Page,n:string)=>p.getByRole('textbox',{name:n,exact:true});
const row=(p:Page,n:string)=>p.getByRole('row').filter({has:p.getByText(n,{exact:true})});
const status=(p:Page,n:string)=>row(p,n).locator('input.MuiSwitch-input');
function response(p:Page,method:string,path=api){return p.waitForResponse(r=>r.request().method()===method&&new URL(r.url()).pathname===path);}
async function open(p:Page){const pending=response(p,'GET');await p.goto(base);const r=await pending;expect(r.ok()).toBeTruthy();return (await r.json()).data;}
async function choose(p:Page,name:string|RegExp,value:string){await p.getByRole('combobox',{name,exact:typeof name==='string'}).click();await p.getByRole('option').filter({hasText:value}).first().click();await p.keyboard.press('Escape');}
async function form(p:Page,bank:boolean){await p.goto(base+(bank?'/bank-account/create':'/treasury/create'));await expect(field(p,bank?'Account name *':'Treasury name *')).toBeVisible();}
test.beforeEach(async({page})=>{test.setTimeout(120000);await login(page);});
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('bank-treasury-screen',{path,contentType:'image/png'});});
for(const bank of [true,false]){
 const kind=bank?'Bank':'Treasury',auto='Automated '+(bank?'Bank Account':'Treasury')+' Creation In chart of Accounts';
 test(`${kind} required fields block empty save`,async({page})=>{
  await form(page,bank);await page.getByRole('button',{name:'Save',exact:true}).click();
  const required=bank?['Account name is required','Bank Keepers field is required','Short name is required','Account number is required','Country is required']:['Treasury name is required'];
  for(const text of required)await expect(page.getByText(text,{exact:true})).toBeVisible();await expect(page).toHaveURL(/\/create$/);
 });
 test(`${kind} manual account is required and automatic mode hides it`,async({page})=>{
  await form(page,bank);const control=page.getByRole('checkbox',{name:auto,exact:true});await expect(control).toBeChecked();await control.uncheck();await expect(page.getByRole('combobox',{name:'Account name *',exact:true})).toBeVisible();await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('region').getByText('Account name is required',{exact:true})).toBeVisible();await control.check();await expect(page.getByRole('combobox',{name:'Account name *',exact:true})).toBeHidden();
 });
 test(`${kind} owned record create edit status and delete`,async({page},info)=>{
  let name='BT-E2E-'+kind+'-'+Date.now(),id='',deleted=false;await mkdir(folder,{recursive:true});
  async function find(){await open(page);const pending=page.waitForResponse(r=>new URL(r.url()).pathname===api&&new URL(r.url()).searchParams.get('search')===name);await page.getByPlaceholder('Search',{exact:true}).fill(name);await pending;await expect(row(page,name)).toBeVisible();}
  async function menu(action:string){await row(page,name).getByRole('button',{name:'more',exact:true}).click();await page.getByRole('menuitem',{name:action,exact:true}).click();}
  try{
   await form(page,bank);await choose(page,bank?'Bank Keepers *':/^Treasurer/,'new emp');
   if(bank){await field(page,'Short name *').fill('E2E'+Date.now());await field(page,'Account number *').fill(String(Date.now()));await page.getByRole('combobox',{name:'Country *',exact:true}).click();await page.getByRole('option').filter({hasNotText:'Create new'}).first().click();}else await choose(page,'Choose branch','Cairo');
   await expect(page.getByRole('checkbox',{name:auto,exact:true})).toBeChecked();await field(page,bank?'Account name *':'Treasury name *').fill(name);await field(page,'Write your Notes').fill('Automation notes');
   const pending=response(page,'POST');await page.getByRole('button',{name:'Save',exact:true}).click();const r=await pending,b=await r.json();id=String(b.data?.id||'');await writeFile(folder+'/'+kind+'-fixture.json',JSON.stringify({id,name,account_id:b.data?.account_id,automaticAccount:true}));expect(r.ok(),b.message).toBeTruthy();expect(id).not.toBe('');await find();await expect(row(page,name)).toContainText(bank?'Bank account':'Treasury');await menu('Edit');await expect(field(page,bank?'Account name *':'Treasury name *')).toHaveValue(name);await expect(field(page,'Write your Notes')).toHaveValue('Automation notes');
   const next=name+'-edited';await field(page,bank?'Account name *':'Treasury name *').fill(next);await field(page,'Write your Notes').fill('Edited notes');const save=page.waitForResponse(r=>['POST','PUT','PATCH'].includes(r.request().method())&&new URL(r.url()).pathname===api+'/'+id);await page.getByRole('button',{name:'Update',exact:true}).click();expect((await save).ok()).toBeTruthy();name=next;await find();await menu('Edit');await expect(field(page,'Write your Notes')).toHaveValue('Edited notes');await find();
   for(const active of [false,true]){await status(page,name).click();await expect(status(page,name)).toBeChecked({checked:active});await find();await expect(status(page,name)).toBeChecked({checked:active});}
   await menu('Delete');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await find();await menu('Delete');const remove=response(page,'DELETE',api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();const removed=await remove;expect(removed.ok()).toBeTruthy();deleted=true;await writeFile(folder+'/'+kind+'-cleanup.json',JSON.stringify({id,status:removed.status()}));await open(page);
   await info.attach('deletion-response',{body:JSON.stringify({id,status:removed.status()}),contentType:'application/json'});
  }finally{if(id&&!deleted){await find();await menu('Delete');const pending=response(page,'DELETE',api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();await writeFile(folder+'/'+kind+'-cleanup.json',JSON.stringify({id,status:(await pending).status()}));}}
 });
}
test('Status filter offers Active and Inactive for bank treasury status',async({page},info)=>{
 await open(page);await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('combobox',{name:'Status',exact:true}).click();
 const options=await page.getByRole('option').allTextContents();await info.attach('status-options',{body:JSON.stringify({expected:['Active','Inactive'],actual:options}),contentType:'application/json'});
 expect(options,'Filter choices should correspond to the active/inactive row status').toEqual(['Active','Inactive']);
});
test('no-match search and clear',async({page})=>{const before=await open(page),key='BT-NONE-'+Date.now();const pending=page.waitForResponse(r=>new URL(r.url()).pathname===api&&new URL(r.url()).searchParams.get('search')===key);await page.getByPlaceholder('Search',{exact:true}).fill(key);expect((await (await pending).json()).data.meta.total).toBe(0);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();const reset=response(page,'GET');await page.getByPlaceholder('Search',{exact:true}).fill('');expect((await (await reset).json()).data.meta.total).toBe(before.meta.total);});
