import {test,expect,Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir,writeFile} from 'node:fs/promises';
const base='/en/finance/accounting/configuration/currencies',api='/api/v1.0/currencies';
const folder='artifacts/finance/accounting/configuration/currencies';
const field=(p:Page,name:string)=>p.getByRole('textbox',{name:name+' *',exact:true});
const row=(p:Page,name:string)=>p.getByRole('row').filter({has:p.getByText(name,{exact:true})});
const action=(p:Page,name:string,icon:string)=>row(p,name).getByRole('button').filter({has:p.locator('i.tabler-'+icon)});
function response(p:Page,method:string,path=api){return p.waitForResponse(r=>r.request().method()===method&&new URL(r.url()).pathname===path);}
async function open(p:Page){const pending=response(p,'GET');await p.goto(base);expect((await pending).ok()).toBeTruthy();await expect(p.getByRole('button',{name:'Create',exact:true})).toBeVisible();}
async function fill(p:Page,name:string,symbol='T',code='XTS'){await field(p,'Currency name').fill(name);await field(p,'Symbol').fill(symbol);await field(p,'Short key').fill(code);}
test.beforeEach(async({page})=>{test.setTimeout(90000);await login(page);await open(page);});
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('currency-screen',{path,contentType:'image/png'});});

for(const missing of ['Currency name','Symbol','Short key'])test(`${missing} is required`,async({page})=>{
 await page.getByRole('button',{name:'Create',exact:true}).click();await fill(page,'CUR-E2E-INVALID');await field(page,missing).fill('');
 await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();
 await expect(page.getByText(missing+' is required',{exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toBeVisible();
});
test('cancel and close creation discard unsaved fields',async({page})=>{
 for(const close of ['Cancel','close']){await page.getByRole('button',{name:'Create',exact:true}).click();await fill(page,'CUR-E2E-UNSAVED');await page.getByRole('dialog').getByRole('button',{name:close,exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();}
 await page.getByRole('button',{name:'Create',exact:true}).click();await expect(field(page,'Currency name')).toBeEmpty();await expect(field(page,'Symbol')).toBeEmpty();await expect(field(page,'Short key')).toBeEmpty();
});
test('default currency is active and protected from row mutations',async({page})=>{
 const defaultRow=page.getByRole('row').filter({has:page.getByText('Default',{exact:true})});await expect(defaultRow).toHaveCount(1);await expect(defaultRow.getByRole('checkbox')).toBeChecked();await expect(defaultRow.getByRole('checkbox')).toBeDisabled();await expect(defaultRow.getByRole('button')).toHaveCount(0);
});
test('search no-match and clear restore original count',async({page})=>{
 const before=await page.getByRole('button',{name:/^\d+\/\d+$/}).innerText();
 const key='CUR-NO-MATCH-'+Date.now();const pending=page.waitForResponse(r=>new URL(r.url()).pathname===api&&new URL(r.url()).searchParams.get('search')===key);await page.getByPlaceholder('Search',{exact:true}).fill(key);expect((await (await pending).json()).data.meta.total).toBe(0);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
 const reset=response(page,'GET');await page.getByPlaceholder('Search',{exact:true}).fill('');await reset;await expect(page.getByRole('button',{name:before,exact:true})).toBeVisible();
});
test('owned currency create edit status search and deletion lifecycle',async({page},info)=>{
 const uniqueCode=()=>Array.from({length:3},()=>String.fromCharCode(65+Math.floor(Math.random()*26))).join('');
 const code=uniqueCode();let editedCode=uniqueCode();while(editedCode===code)editedCode=uniqueCode();
 let name='CUR-E2E-'+Date.now(),id='',deleted=false;await mkdir(folder,{recursive:true});
 try{
  await test.step('Create and reload persisted name symbol and short key',async()=>{
   await page.getByRole('button',{name:'Create',exact:true}).click();await fill(page,name,'T',code);const pending=response(page,'POST');await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();const r=await pending,b=await r.json();id=b.data?.id||'';await writeFile(folder+'/fixture.json',JSON.stringify({id,name}));expect(r.ok(),b.message).toBeTruthy();expect(id).not.toBe('');await open(page);await expect(row(page,name)).toContainText(code);await expect(row(page,name).getByRole('checkbox')).toBeChecked();
  });
  await test.step('Cancel edit preserves all fields',async()=>{
   await action(page,name,'edit').click();await expect(field(page,'Currency name')).toHaveValue(name);await expect(field(page,'Symbol')).toHaveValue('T');await expect(field(page,'Short key')).toHaveValue(code);await fill(page,name+'-cancel','Z','ZZZ');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await action(page,name,'edit').click();await expect(field(page,'Currency name')).toHaveValue(name);await expect(field(page,'Symbol')).toHaveValue('T');await expect(field(page,'Short key')).toHaveValue(code);
  });
  await test.step('Save edits and verify after reload',async()=>{
   const next=name+'-edited';await fill(page,next,'Q',editedCode);const pending=page.waitForResponse(r=>['PUT','PATCH','POST'].includes(r.request().method())&&new URL(r.url()).pathname===api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();expect((await pending).ok()).toBeTruthy();name=next;await open(page);await action(page,name,'edit').click();await expect(field(page,'Currency name')).toHaveValue(name);await expect(field(page,'Symbol')).toHaveValue('Q');await expect(field(page,'Short key')).toHaveValue(editedCode);await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  });
  await test.step('Inactive and Active both persist after reload',async()=>{
   for(const active of [false,true]){await row(page,name).getByRole('checkbox').click();await expect(row(page,name).getByRole('checkbox')).toBeChecked({checked:active});await open(page);await expect(row(page,name).getByRole('checkbox')).toBeChecked({checked:active});}
  });
  await test.step('Search returns the exact owned currency',async()=>{
   const pending=page.waitForResponse(r=>new URL(r.url()).pathname===api&&new URL(r.url()).searchParams.get('search')===name);await page.getByPlaceholder('Search',{exact:true}).fill(name);const data=(await (await pending).json()).data;expect(data.collection.map((r:any)=>r.id)).toEqual([id]);await expect(row(page,name)).toBeVisible();
  });
  await test.step('Cancel deletion preserves record; confirmed deletion makes it inactive',async()=>{
   await action(page,name,'trash').click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await open(page);await expect(row(page,name)).toBeVisible();await action(page,name,'trash').click();const pending=response(page,'DELETE',api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();const r=await pending;expect(r.ok()).toBeTruthy();deleted=true;await writeFile(folder+'/cleanup.json',JSON.stringify({id,status:r.status()}));await open(page);await expect(row(page,name)).toBeVisible();await expect(row(page,name).getByRole('checkbox')).not.toBeChecked();
  });
 }finally{
  if(id&&!deleted){await open(page);await action(page,name,'trash').click();const pending=response(page,'DELETE',api+'/'+id);await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();const r=await pending;await info.attach('cleanup',{body:JSON.stringify({id,status:r.status()}),contentType:'application/json'});}
 }
});
