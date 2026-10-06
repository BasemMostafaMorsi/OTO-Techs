import {test,expect,Page} from '../../helpers/test';
import {login} from '../../helpers/auth';
import {mkdir,stat} from 'node:fs/promises';
const base='/en/contacts/vendors';
async function search(page:Page,value:string){
 const response=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes('/sales/customers?')&&r.url().includes(encodeURIComponent(value)));
 await page.getByPlaceholder('Search',{exact:true}).fill(value);expect((await response).ok()).toBeTruthy();
}
async function create(page:Page){
 const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/sales/customers'));
 await page.getByRole('button',{name:'Save',exact:true}).click();const result=await pending;
 const body=await result.json();await test.info().attach('create-response',{body:JSON.stringify({status:result.status(),body}),contentType:'application/json'});
 expect(result.ok(),`Vendor creation: HTTP ${result.status()} ${body.message||''}`).toBeTruthy();expect(body.data?.id).toBeTruthy();return String(body.data.id);
}
async function edit(page:Page,id:string){
 await page.goto(base);await search(page,id);
 const row=page.getByRole('row').filter({has:page.getByText('#'+id,{exact:true})});
 await row.getByRole('button',{name:'more',exact:true}).click();await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Name *',exact:true})).toBeVisible();
}
async function cleanup(page:Page,id:string,prefix:string){
 const evidence=test.info().outputPath(`customer-${id}-before-cleanup.png`);await page.screenshot({path:evidence,fullPage:true});await test.info().attach('before-cleanup',{path:evidence,contentType:'image/png'});
 await page.goto(base);await search(page,id);
 const row=page.getByRole('row').filter({has:page.getByText('#'+id,{exact:true})});
 await expect(row).toContainText(prefix);
 await row.getByRole('button',{name:'more',exact:true}).click();await page.getByRole('menuitem',{name:'Delete',exact:true}).click();
 const response=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/sales/customers/'+id));
 await page.getByRole('dialog').getByRole('button',{name:/delete|confirm|yes/i}).click();expect((await response).ok()).toBeTruthy();
 await expect(row).toHaveCount(0);
}
async function fillName(page:Page,name:string,type='Commercial'){
 await page.goto(base+'/create');await page.getByRole('radio',{name:type,exact:true}).check();await page.getByRole('textbox',{name:'Name *',exact:true}).fill(name);
 await expect(page.getByRole('combobox',{name:/^Type/}),'Vendor form must default to Vendor').toHaveValue('Vendor');
}
async function completeRows(page:Page){
 const counter=page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});await expect(counter).toBeVisible();
 const counts=async()=>(await counter.innerText()).split('/').map(Number);const total=(await counts())[1];
 for(let n=0;(await counts())[0]<total&&n<100;n++){
  const previous=(await counts())[0];await page.getByRole('table').evaluate(table=>{let parent=table.parentElement;while(parent&&parent.scrollHeight<=parent.clientHeight)parent=parent.parentElement;const container=parent||document.scrollingElement;if(container)container.scrollTop=container.scrollHeight;});
  await expect.poll(async()=>(await counts())[0]).toBeGreaterThan(previous);
 }
 await expect(page.getByRole('table').locator('tbody tr').filter({has:page.locator('td')})).toHaveCount(total);return total;
}
test.beforeEach(async({page})=>{await mkdir('artifacts/business-partners/vendors',{recursive:true});await login(page);});
test.afterEach(async({page},info)=>{const file=`artifacts/business-partners/vendors/${info.title.replace(/[^a-z0-9]+/gi,'-')}.png`;await page.screenshot({path:file,fullPage:true});await info.attach('vendor-screen',{path:file,contentType:'image/png'});});

test('@vendors required name prevents saving',async({page})=>{
 await page.goto(base+'/create');const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/sales/customers'))writes.push(r.url());});
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByText('Name is required',{exact:true})).toBeVisible();expect(writes).toEqual([]);
});
for(const type of ['Individual','Governmental','Commercial']){
 test(`@vendors ${type} create, preview, edit and delete`,async({page},info)=>{
  test.setTimeout(150_000);const name=`VEND-E2E-${type}-${Date.now()}`,email=`customer.${Date.now()}@example.com`;let id:string|undefined;
  try{
   await fillName(page,name,type);await page.locator('input[name=company_email]').fill(email);id=await create(page);
   await info.attach('created-vendor',{body:JSON.stringify({id,name,type}),contentType:'application/json'});
   await page.goto(base);await search(page,name);const row=page.getByRole('row').filter({hasText:name});await expect(row).toContainText(type);
   await row.locator('button:has(i.tabler-eye)').click();await expect(page).toHaveURL(new RegExp(`/vendors/${id}(?:\\?|$)`));await expect(page.getByRole('main')).toContainText(name);await expect(page.getByRole('main')).toContainText(email);
   await edit(page,id);await expect(page.getByRole('textbox',{name:'Name *',exact:true})).toHaveValue(name);await expect(page.getByRole('radio',{name:type,exact:true})).toBeChecked();
   await page.getByRole('textbox',{name:'Name *',exact:true}).fill(name+'-EDITED');
   const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith('/sales/customers/'+id));
   await page.getByRole('button',{name:/save|update/i}).click();const response=await saved;expect(response.ok()).toBeTruthy();
   await info.attach('update-evidence',{body:JSON.stringify({submitted:response.request().postDataJSON(),received:await response.json()}),contentType:'application/json'});
   expect(response.request().postDataJSON().name).toBe(name+'-EDITED');
   await page.goto(`${base}/${id}`);await expect(page.getByRole('main')).toContainText(name+'-EDITED');
   await info.attach('updated-preview',{body:await page.screenshot({path:`artifacts/business-partners/vendors/${type}-updated.png`,fullPage:true}),contentType:'image/png'});
  }finally{if(id)await cleanup(page,id,name);}
 });
}
test('@vendors purchase settings persist after save and reload',async({page},info)=>{
 test.setTimeout(150_000);const name=`VEND-E2E-PURCHASE-${Date.now()}`;let id:string|undefined;
 try{
  await fillName(page,name);await page.getByRole('tab',{name:'Purchase Setting',exact:true}).click();
  await page.getByRole('combobox',{name:'Payment terms',exact:true}).click();const option=page.getByRole('option').filter({hasNotText:/create new/i}).first();await expect(option).toBeVisible();await option.click();const terms=await page.getByRole('combobox',{name:'Payment terms',exact:true}).inputValue();expect(terms).not.toBe('');
  await page.locator('input[name=debit_limit]').fill('1000');await page.locator('input[name=debit_alert_limit]').fill('800');
  id=await create(page);await edit(page,id);await page.getByRole('tab',{name:'Purchase Setting',exact:true}).click();
  await expect(page.locator('input[name=debit_limit]')).toHaveValue('1000');await expect(page.locator('input[name=debit_alert_limit]')).toHaveValue('800');
  await expect(page.getByRole('combobox',{name:'Payment terms',exact:true})).toHaveValue(terms);
  await info.attach('purchase-settings',{body:JSON.stringify({id,terms,debitLimit:1000,alertLimit:800}),contentType:'application/json'});
 }finally{if(id)await cleanup(page,id,name);}
});
test('@vendors address parent dependencies and additional address',async({page})=>{
 await page.goto(base+'/create?tab=address');
 await expect(page.getByRole('combobox',{name:/^Area/})).toBeDisabled();await expect(page.getByRole('combobox',{name:/^City/})).toBeDisabled();
 await page.getByRole('combobox',{name:'Country',exact:true}).click();await page.getByRole('option').filter({hasNotText:/create new/i}).first().click();
 await expect(page.getByRole('combobox',{name:/^Area/})).toBeEnabled();await expect(page.getByRole('combobox',{name:/^City/})).toBeDisabled();
 await page.getByText('Add new Address',{exact:true}).click();await expect(page.getByRole('combobox',{name:'Country',exact:true})).toHaveCount(2);
});
test('@vendors attachment and note persist',async({page},info)=>{
 test.setTimeout(150_000);const name=`VEND-E2E-FILE-${Date.now()}`;let id:string|undefined;
 try{
  await fillName(page,name);await page.getByRole('tab',{name:'Attachments',exact:true}).click();
  await page.getByPlaceholder('Notes',{exact:true}).fill('Vendor note '+name);
  const upload=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/uploads'));await page.locator('input[type=file]').setInputFiles('tests/fixtures/contact-proof.png');expect((await upload).ok()).toBeTruthy();
  const image=page.locator('img[src*="attachments/"]').last();await expect(image).toBeVisible();const src=await image.getAttribute('src');
  id=await create(page);await edit(page,id);await page.getByRole('tab',{name:'Attachments',exact:true}).click();
  await expect(page.getByPlaceholder('Notes',{exact:true})).toHaveValue('Vendor note '+name);
  await expect.poll(async()=>page.locator('img').evaluateAll(es=>es.map(e=>e.getAttribute('src')))).toContain(src);
  await info.attach('attachment-persistence',{body:JSON.stringify({id,src}),contentType:'application/json'});
 }finally{if(id)await cleanup(page,id,name);}
});
for(const status of ['Active','Suspend']){
 test(`@vendors status filter: ${status}`,async({page},info)=>{
  await page.goto(base);await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('combobox',{name:'Status',exact:true}).click();await page.getByRole('option',{name:status,exact:true}).click();
  test.setTimeout(120_000);
  const pending=page.waitForResponse(r=>r.url().includes('/sales/customers?')&&new URL(r.url()).searchParams.get('status')===(status==='Active'?'1':'2'));await page.getByRole('button',{name:'Submit',exact:true}).click();const response=await pending;expect(response.ok()).toBeTruthy();const data=(await response.json()).data;
  await info.attach('filter-response',{body:JSON.stringify(data),contentType:'application/json'});
  const count=data.meta.total;
  if(count===0){await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();return;}
  await expect(page.getByRole('main').getByRole('button',{name:new RegExp(`^\\d+/${count}$`)})).toBeVisible();await completeRows(page);
  await expect.poll(async()=>{
   const table=page.getByRole('table');const headers=(await table.getByRole('columnheader').allTextContents()).map(s=>s.trim().toLowerCase());const index=headers.indexOf('status');if(index<0)return false;
   const values=await table.locator('tbody tr').evaluateAll((es,i)=>es.map(e=>(e.querySelectorAll('td')[i]?.querySelector('input[type=checkbox]') as HTMLInputElement|null)?.checked),index);
   return values.length===count&&values.every(value=>value===(status==='Active'));
  }).toBe(true);
 });
}
test('@vendors empty search reset and list download',async({page},info)=>{
 await page.goto(base);await search(page,`NO-CUSTOMER-${Date.now()}`);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
 const loaded=page.waitForResponse(r=>r.url().includes('/sales/customers?'));await page.getByPlaceholder('Search',{exact:true}).fill('');await loaded;await expect(page.getByRole('table')).toBeVisible();
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await event;expect(await download.failure()).toBeNull();const file=info.outputPath(download.suggestedFilename());await download.saveAs(file);expect((await stat(file)).size).toBeGreaterThan(0);await info.attach('vendors-export',{path:file,contentType:'application/octet-stream'});
});

for(const scenario of [
 {label:'company details',tab:null,fields:{reference_number:'654321',company_mobile_number:'0501234567',company_phone_number:'0112345678',company_email:'customer.qa@example.com',website:'https://example.com'}},
 {label:'bank details',tab:'Accounting Mapping',fields:{bank_name:'QA Bank',branch_name:'QA Branch',swift_code:'TESTSAJE',bank_iban:'SA0380000000608010167519','customer_accounting_setting.0.bank_number':'1234567890'}},
 {label:'address text',tab:'Address Details',fields:{'address.0.short_number':'12345'}},
]){
 test(`@vendors ${scenario.label} persist after reload`,async({page},info)=>{
  test.setTimeout(150_000);const name=`VEND-E2E-DETAILS-${Date.now()}`;let id:string|undefined;
  const fields:Record<string,string>={...scenario.fields};
  if(scenario.label==='company details'){const unique=String(Date.now());fields.reference_number=unique;fields.company_phone_number='01'+unique.slice(-8);fields.company_mobile_number='05'+unique.slice(-8);fields.company_email=`customer.${unique}@example.com`;}
  try{
   await fillName(page,name);if(scenario.tab)await page.getByRole('tab',{name:scenario.tab,exact:true}).click();
   for(const [key,value] of Object.entries(fields))await page.locator(`input[name="${key}"]`).fill(value);
   if(scenario.label==='address text'){await page.getByRole('textbox',{name:'Address',exact:true}).fill('QA Street 123');await page.getByRole('textbox',{name:'Landmark',exact:true}).fill('QA Landmark');}
   id=await create(page);await edit(page,id);await expect(page.getByRole('textbox',{name:'Name *',exact:true})).toHaveValue(name);
   if(scenario.tab)await page.getByRole('tab',{name:scenario.tab,exact:true}).click();
   for(const [key,value] of Object.entries(fields))await expect(page.locator(`input[name="${key}"]`)).toHaveValue(value);
   if(scenario.label==='address text'){await expect(page.getByRole('textbox',{name:'Address',exact:true})).toHaveValue('QA Street 123');await expect(page.getByRole('textbox',{name:'Landmark',exact:true})).toHaveValue('QA Landmark');}
   await info.attach('saved-details',{body:await page.screenshot({path:`artifacts/business-partners/vendors/${scenario.label.replace(/ /g,'-')}.png`,fullPage:true}),contentType:'image/png'});
  }finally{if(id)await cleanup(page,id,name);}
 });
}

test('@vendors multiple contact details persist',async({page})=>{
 test.setTimeout(150_000);const name=`VEND-E2E-CONTACTS-${Date.now()}`;let id:string|undefined;
 try{
  await fillName(page,name);await page.getByPlaceholder('Enter',{exact:true}).nth(0).fill('QA Contact One');await page.getByPlaceholder('Enter',{exact:true}).nth(1).fill('Manager');
  await page.locator('input[name="company_contacts.0.email"]').fill('one@example.com');
  await page.getByText('Add new Contact',{exact:true}).click();await page.getByPlaceholder('Enter',{exact:true}).nth(2).fill('QA Contact Two');await page.getByPlaceholder('Enter',{exact:true}).nth(3).fill('Assistant');
  await page.locator('input[name="company_contacts.1.email"]').fill('two@example.com');
  id=await create(page);await edit(page,id);
  await expect(page.getByPlaceholder('Enter',{exact:true}).nth(0)).toHaveValue('QA Contact One');await expect(page.getByPlaceholder('Enter',{exact:true}).nth(2)).toHaveValue('QA Contact Two');
  await expect(page.locator('input[name="company_contacts.0.email"]')).toHaveValue('one@example.com');await expect(page.locator('input[name="company_contacts.1.email"]')).toHaveValue('two@example.com');
 }finally{if(id)await cleanup(page,id,name);}
});

test('@vendors cancel deletion preserves vendor',async({page})=>{
 test.setTimeout(120_000);const name=`VEND-E2E-CANCEL-${Date.now()}`;let id:string|undefined;
 try{
  await fillName(page,name);id=await create(page);await page.goto(base);await search(page,name);
  const row=page.getByRole('row').filter({has:page.getByText('#'+id,{exact:true})});await row.getByRole('button',{name:'more',exact:true}).click();await page.getByRole('menuitem',{name:'Delete',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:/cancel|go back/i}).click();await expect(row).toBeVisible();
  await page.goto(`${base}/${id}`);await expect(page.getByRole('main')).toContainText(name);
 }finally{if(id)await cleanup(page,id,name);}
});

test('@vendors complete list pagination without missing or duplicate IDs',async({page},info)=>{
 test.setTimeout(120_000);const pages=new Map<number,string[]>();const pending:Promise<void>[]=[];
 page.on('response',r=>{if(r.ok()&&r.request().method()==='GET'&&r.url().includes('/sales/customers?'))pending.push(r.json().then(body=>{pages.set(body.data.meta.current_page,body.data.collection.map((item:{id:number})=>String(item.id)));}));});
 const loaded=page.waitForResponse(r=>r.url().includes('/sales/customers?'));await page.goto(base);expect((await loaded).ok()).toBeTruthy();
 await expect(page.getByRole('table').locator('tbody tr').first()).toBeVisible();const total=await completeRows(page);await Promise.all(pending);
 const ids=await page.getByRole('table').locator('tbody tr').evaluateAll(es=>es.map(e=>e.textContent?.match(/#(\d+)/)?.[1]));
 expect(ids).toHaveLength(total);expect(new Set(ids).size).toBe(total);expect(ids.slice().sort()).toEqual([...pages.values()].flat().sort());
 await info.attach('pagination-evidence',{body:JSON.stringify({total,pages:[...pages.keys()],ids}),contentType:'application/json'});
});

test('@vendors optimize hides and restores a column',async({page})=>{
 await page.goto(base);await expect(page.getByRole('columnheader',{name:'Ref',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Optimize',exact:true}).click();const checkbox=page.getByRole('checkbox',{name:'Ref',exact:true});await expect(checkbox).toBeChecked();
 try{
  await checkbox.uncheck();await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Ref',exact:true})).toHaveCount(0);
 }finally{
  if(!await checkbox.isVisible())await page.getByRole('button',{name:'Optimize',exact:true}).click();await checkbox.check();await page.getByRole('button',{name:'Submit',exact:true}).click();
 }
 await expect(page.getByRole('columnheader',{name:'Ref',exact:true})).toBeVisible();
});

test('@vendors suspend and reactivate persist after reload',async({page},info)=>{
 test.setTimeout(150_000);const name=`VEND-E2E-STATUS-${Date.now()}`;let id:string|undefined;
 try{
  await fillName(page,name);id=await create(page);await page.goto(`${base}/${id}`);await expect(page.getByRole('main')).toContainText(name);
  await page.getByRole('button',{name:'Suspend',exact:true}).click();await expect(page.getByRole('button',{name:'Reactivate',exact:true})).toBeVisible();await page.reload();
  await expect(page.getByRole('button',{name:'Reactivate',exact:true})).toBeVisible();await expect(page.getByRole('main').getByText('Suspend',{exact:true})).toBeVisible();
  await info.attach('suspended-vendor',{body:await page.screenshot({path:'artifacts/business-partners/vendors/suspended.png',fullPage:true}),contentType:'image/png'});
  await page.getByRole('button',{name:'Reactivate',exact:true}).click();await expect(page.getByRole('button',{name:'Suspend',exact:true})).toBeVisible();await page.reload();
  await expect(page.getByRole('main').getByText('Active',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Suspend',exact:true})).toBeVisible();
 }finally{if(id)await cleanup(page,id,name);}
});

test('@vendors changing country clears the previous area and city',async({page})=>{
 test.setTimeout(90_000);
 await page.goto(base+'/create?tab=address');
 for(const [field,value] of [['Country','Egypt'],['Area','Cairo'],['City','Nasr City']]){
  await page.getByRole('combobox',{name:field,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();await expect(page.getByRole('combobox',{name:field,exact:true})).toHaveValue(value);
 }
 await page.getByRole('combobox',{name:'Country',exact:true}).click();await page.getByRole('option',{name:'Saudi Arabia',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Country',exact:true})).toHaveValue('Saudi Arabia');
 await expect.soft(page.getByRole('combobox',{name:/^Area/}),'Previous country area must not remain displayed').toHaveValue('');
 await expect.soft(page.getByRole('combobox',{name:/^City/}),'Previous country city must not remain displayed').toHaveValue('');
 await expect(page.getByRole('combobox',{name:/^City/})).toBeDisabled();
});

test('@vendors country area and city persist after saving address',async({page})=>{
 test.setTimeout(150_000);const name=`VEND-E2E-GEO-${Date.now()}`;let id:string|undefined;
 try{
  await fillName(page,name);await page.getByRole('tab',{name:'Address Details',exact:true}).click();
  for(const [field,value] of [['Country','Egypt'],['Area','Cairo'],['City','Nasr City']]){await page.getByRole('combobox',{name:field,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();}
  await page.getByRole('textbox',{name:'Address',exact:true}).fill('QA address geography');id=await create(page);await edit(page,id);
  await expect(page.getByRole('textbox',{name:'Name *',exact:true})).toHaveValue(name);await page.getByRole('tab',{name:'Address Details',exact:true}).click();
  for(const [field,value] of [['Country','Egypt'],['Area','Cairo'],['City','Nasr City']])await expect(page.getByRole('combobox',{name:field,exact:true})).toHaveValue(value);
 }finally{if(id)await cleanup(page,id,name);}
});


