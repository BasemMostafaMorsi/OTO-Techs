import {test,expect,Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir,writeFile} from 'node:fs/promises';
const base='/en/finance/accounting/configuration/taxes',api='/api/v1.0/taxes',folder='artifacts/finance/accounting/configuration/taxes';
const field=(p:Page,name:string)=>p.getByRole('textbox',{name,exact:true});
const row=(p:Page,name:string)=>p.getByRole('row').filter({has:p.getByText(name,{exact:true})});
const action=(p:Page,name:string,icon:string)=>row(p,name).getByRole('button').filter({has:p.locator('i.tabler-'+icon)});
function response(p:Page,method:string,path=api){return p.waitForResponse(r=>r.request().method()===method&&new URL(r.url()).pathname===path);}
async function open(p:Page){const pending=response(p,'GET');await p.goto(base);expect((await pending).ok()).toBeTruthy();await expect(p.getByRole('button',{name:'Create',exact:true})).toBeVisible();}
async function type(p:Page,value:string){await p.getByRole('combobox',{name:/^Depend on/}).click();await p.getByRole('option',{name:value,exact:true}).click();}
async function classification(p:Page,value:string){await p.getByRole('combobox',{name:'Choose class',exact:true}).click();await p.getByRole('option',{name:value,exact:true}).click();}
const initialized=new WeakSet<Page>();
async function create(p:Page){const pending=initialized.has(p)?null:Promise.all(['/api/v1.0/finance/finance_settings','/api/v1.0/all_tax_classes'].map(path=>p.waitForResponse(r=>new URL(r.url()).pathname===path).then(r=>r.json())));await p.getByRole('button',{name:'Create',exact:true}).click();if(pending){await pending;initialized.add(p);}await expect(field(p,'Tax name *')).toBeVisible();}
test.beforeEach(async({page})=>{test.setTimeout(90000);await login(page);await open(page);});
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('tax-screen',{path,contentType:'image/png'});});
test('blank submission validates name short key and dependency',async({page})=>{
 await create(page);await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();
 for(const message of ['Tax name is required','Short key is required','Depend on is required'])await expect(page.getByText(message,{exact:true})).toBeVisible();
});
test('cancel and close discard unsaved tax fields',async({page})=>{
 for(const close of ['Cancel','close']){await create(page);await field(page,'Tax name *').fill('TAX-E2E-unsaved');await field(page,'Short Key *').fill('UNSAVED');await type(page,'Sales');await field(page,'Rate(%) *').fill('12.5');await page.getByRole('dialog').getByRole('button',{name:close,exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();}
 await create(page);await expect(field(page,'Tax name *')).toBeEmpty();await expect(field(page,'Short Key *')).toBeEmpty();await expect(page.getByRole('combobox',{name:/^Depend on/})).toBeEmpty();
});
test('dependency changes clear incompatible tax class',async({page})=>{
 await create(page);await type(page,'Sales');await classification(page,'Sales Tax Class');await type(page,'Purchases');await expect(page.getByRole('combobox',{name:'Choose class',exact:true})).toBeEmpty();await classification(page,'Purchase Tax Class');await type(page,'Sales');await expect(page.getByRole('combobox',{name:'Choose class',exact:true})).toBeEmpty();
});
test('no-match search and clearing restore list',async({page})=>{
 const before=await page.getByRole('button',{name:/^\d+\/\d+$/}).innerText(),key='TAX-NONE-'+Date.now();const pending=page.waitForResponse(r=>new URL(r.url()).pathname===api&&new URL(r.url()).searchParams.get('search')===key);await page.getByPlaceholder('Search',{exact:true}).fill(key);expect((await (await pending).json()).data.meta.total).toBe(0);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();const reset=response(page,'GET');await page.getByPlaceholder('Search',{exact:true}).fill('');await reset;await expect(page.getByRole('button',{name:before,exact:true})).toBeVisible();
});
for(const dependency of ['Sales','Purchases'])test(`${dependency} tax create edit status and delete lifecycle`,async({page},info)=>{
 let name='TAX-E2E-'+dependency+'-'+Date.now(),id='',deleted=false;const code='T'+Date.now(),className=dependency==='Sales'?'Sales Tax Class':'Purchase Tax Class';await mkdir(folder,{recursive:true});
 try{
  await create(page);await type(page,dependency);await classification(page,className);await field(page,'Tax name *').fill(name);await field(page,'Short Key *').fill(code);await field(page,'Rate(%) *').fill('12.5');await field(page,'Description').fill('Automation tax');
  const pending=response(page,'POST');await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();const r=await pending,b=await r.json();id=b.data?.id||'';await writeFile(folder+'/'+dependency+'-fixture.json',JSON.stringify({id,name,code}));expect(r.ok(),b.message).toBeTruthy();expect(id).not.toBe('');await open(page);await expect(row(page,name)).toContainText('12.50%');
  await action(page,name,'edit').click();await expect(field(page,'Tax name *')).toHaveValue(name);await expect(field(page,'Short Key *')).toHaveValue(code);await expect(page.getByRole('combobox',{name:/^Depend on/})).toHaveValue(dependency);await expect(page.getByRole('combobox',{name:'Choose class',exact:true})).toHaveValue(className);await expect(field(page,'Description')).toHaveValue('Automation tax');
  await field(page,'Tax name *').fill(name+'-cancel');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await action(page,name,'edit').click();await expect(field(page,'Tax name *')).toHaveValue(name);
  const next=name+'-edited';await field(page,'Tax name *').fill(next);await field(page,'Rate(%) *').fill('7.25');await field(page,'Description').fill('Edited tax');const save=page.waitForResponse(r=>['PUT','PATCH','POST'].includes(r.request().method())&&new URL(r.url()).pathname===api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();expect((await save).ok()).toBeTruthy();name=next;await open(page);await expect(row(page,name)).toContainText('7.25%');await action(page,name,'edit').click();await expect(field(page,'Description')).toHaveValue('Edited tax');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  for(const active of [false,true]){await row(page,name).getByRole('checkbox').click();await expect(row(page,name).getByRole('checkbox')).toBeChecked({checked:active});await open(page);await expect(row(page,name).getByRole('checkbox')).toBeChecked({checked:active});}
  await action(page,name,'trash').click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await open(page);await expect(row(page,name).getByRole('checkbox')).toBeChecked();await action(page,name,'trash').click();const remove=response(page,'DELETE',api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();const removed=await remove;expect(removed.ok()).toBeTruthy();deleted=true;await writeFile(folder+'/'+dependency+'-cleanup.json',JSON.stringify({id,status:removed.status()}));await open(page);await info.attach('post-delete-observation',{body:JSON.stringify({id,visible:await row(page,name).count(),active:await row(page,name).count()?await row(page,name).getByRole('checkbox').isChecked():null}),contentType:'application/json'});
 }finally{if(id&&!deleted){await open(page);await action(page,name,'trash').click();const pending=response(page,'DELETE',api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();await writeFile(folder+'/'+dependency+'-cleanup.json',JSON.stringify({id,status:(await pending).status()}));}}
});
