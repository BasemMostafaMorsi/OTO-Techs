import {test,expect,Page} from '../../helpers/test';
import {login} from '../../helpers/auth';
import {mkdir,stat} from 'node:fs/promises';
type Config={screen:string;api:string;label:string;prefix:string;account:boolean};
export function masterDataSuite(c:Config){
 const base='/en/finance/accounting/'+c.screen,api='/api/v1.0/finance/'+c.api;
 const dialog=(p:Page)=>p.getByRole('dialog');
 const row=(p:Page,name:string)=>p.getByRole('row').filter({has:p.getByText(name,{exact:true})});
 const nameField=(p:Page)=>dialog(p).locator('[name=name]');
 const response=(p:Page,method:string,suffix='')=>p.waitForResponse(r=>r.request().method()===method&&new URL(r.url()).pathname===api+suffix);
 async function open(p:Page){await p.goto(base);await expect(p.getByRole('button',{name:/^\d+\/\d+$/})).toBeVisible();}
 async function search(p:Page,value:string){const pending=p.waitForResponse(r=>r.request().method()==='GET'&&new URL(r.url()).pathname===api&&(new URL(r.url()).searchParams.get('search')||'')===value);await p.getByPlaceholder('Search',{exact:true}).fill(value);expect((await pending).ok()).toBeTruthy();}
 async function locate(p:Page,name:string){await open(p);await search(p,name);await expect(row(p,name)).toBeVisible();return row(p,name);}
 async function choose(p:Page,placeholder:string,option:string){await dialog(p).getByPlaceholder(placeholder,{exact:true}).click();await p.getByRole('option',{name:option,exact:true}).click();}
 async function form(p:Page,name:string,num:string){
  await open(p);await p.getByRole('button',{name:'Create',exact:true}).click();
  if(c.account){await choose(p,'Account main','Cash 1111');await expect(dialog(p).getByPlaceholder('0',{exact:true})).toHaveValue('1111');await choose(p,'Debit / Credit','Debit');await choose(p,'Financial Statement Guidance','Cash In Hand');}
  else{await p.getByRole('combobox',{name:'Cost center type',exact:true}).click();await p.getByRole('option',{name:'Secondary',exact:true}).click();await p.getByRole('combobox',{name:'Main cost center *',exact:true}).click();await p.getByRole('option',{name:'CC-E2E-INSPECT-20261008 987654',exact:true}).click();await expect(dialog(p).getByPlaceholder('0',{exact:true})).toHaveValue('987654');}
  if(c.account) await expect(dialog(p).locator('[name=single_account_number]')).not.toHaveValue(''); await dialog(p).locator('[name=single_account_number]').fill(num);await nameField(p).fill(name);await dialog(p).locator('[name=notes]').fill('QA note '+name);
 }
 async function create(p:Page,name:string,num=String(Date.now()).slice(-7)){await form(p,name,num);const pending=response(p,'POST');await dialog(p).getByRole('button',{name:'Submit',exact:true}).click();const r=await pending,body=await r.json();await test.info().attach('create-response',{body:JSON.stringify({status:r.status(),body}),contentType:'application/json'});expect(r.ok(),body.message).toBeTruthy();expect(body.data?.id).toBeTruthy();await expect(dialog(p)).toBeHidden();return {id:String(body.data.id),name,num,number:String(body.data.account_number)};}
 async function action(p:Page,name:string,action:string){await (await locate(p,name)).getByRole('button',{name:'more',exact:true}).click();await p.getByRole('menuitem',{name:action,exact:true}).click();}
 async function edit(p:Page,name:string){await action(p,name,'Edit');await expect(nameField(p)).toHaveValue(name);}
 async function cleanup(p:Page,record:{id:string;name:string}){const path=test.info().outputPath('before-cleanup.png');await p.screenshot({path,fullPage:true});await test.info().attach('before-cleanup',{path,contentType:'image/png'});await action(p,record.name,'Delete');const pending=response(p,'DELETE','/'+record.id);await dialog(p).getByRole('button',{name:'Delete',exact:true}).click();const r=await pending;await test.info().attach('cleanup-response',{body:JSON.stringify({status:r.status(),body:await r.json()}),contentType:'application/json'});expect(r.ok()).toBeTruthy();await expect(row(p,record.name)).toHaveCount(0);}
 async function owned(p:Page,fn:(record:Awaited<ReturnType<typeof create>>)=>Promise<void>){const record=await create(p,c.prefix+'-'+Date.now());try{await fn(record);}finally{await cleanup(p,record);}}
 test.beforeEach(async({page})=>{test.setTimeout(150000);await mkdir('artifacts/finance/accounting/'+c.screen,{recursive:true});await login(page);});
 test.afterEach(async({page},info)=>{const path='artifacts/finance/accounting/'+c.screen+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('screen',{path,contentType:'image/png'});});
 test('required fields block empty submission',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Create',exact:true}).click();const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname===api)writes.push(r.url());});await dialog(page).getByRole('button',{name:'Submit',exact:true}).click();
  await expect(dialog(page).getByText(c.account?'Account number is required':'Cost center number is required',{exact:true})).toBeVisible();await expect(dialog(page).getByText('Account name is required',{exact:true})).toBeVisible();
  if(c.account){await expect(dialog(page).getByText('Main account is required',{exact:true})).toBeVisible();await expect(dialog(page).getByText('Type is required',{exact:true})).toBeVisible();}expect(writes).toEqual([]);
 });
 test('create edit name notes and hierarchy persist',async({page})=>owned(page,async r=>{
  await edit(page,r.name);await expect(dialog(page).locator('[name=notes]')).toHaveValue('QA note '+r.name);await expect(dialog(page).locator('[name=single_account_number]')).toHaveValue(r.num);
  if(c.account){await expect(dialog(page).getByPlaceholder('Account main',{exact:true})).toHaveValue('1111. Cash');await expect(dialog(page).getByPlaceholder('Currency',{exact:true})).toHaveValue('SAR');await expect(dialog(page).getByPlaceholder('Financial Statement Guidance',{exact:true})).toHaveValue('Cash In Hand');}
  const updated=r.name+'-EDIT';await nameField(page).fill(updated);await dialog(page).locator('[name=notes]').fill('Edited QA note');const pending=response(page,'PUT','/'+r.id);await dialog(page).getByRole('button',{name:'Save',exact:true}).click();const result=await pending;expect(result.ok()).toBeTruthy();r.name=updated;await expect(dialog(page)).toBeHidden();await edit(page,r.name);await expect(dialog(page).locator('[name=notes]')).toHaveValue('Edited QA note');await expect(dialog(page).locator('[name=single_account_number]')).toHaveValue(r.num);
 }));
 test('cancel creation leaves no record',async({page})=>{const name=c.prefix+'-CANCEL-'+Date.now();await form(page,name,String(Date.now()).slice(-7));await dialog(page).getByRole('button',{name:'Cancel',exact:true}).click();await search(page,name);await expect(row(page,name)).toHaveCount(0);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();});
 test('cancel edit and deletion preserve saved values',async({page})=>owned(page,async r=>{await edit(page,r.name);await nameField(page).fill(r.name+'-UNSAVED');await dialog(page).getByRole('button',{name:'Cancel',exact:true}).click();await edit(page,r.name);await expect(nameField(page)).toHaveValue(r.name);await dialog(page).getByRole('button',{name:'Cancel',exact:true}).click();await action(page,r.name,'Delete');await dialog(page).getByRole('button',{name:'Cancel',exact:true}).click();await locate(page,r.name);}));
 for(const mode of ['eye','Preview'])test(mode+' opens correct saved details',async({page})=>owned(page,async r=>{if(mode==='eye')await (await locate(page,r.name)).locator('button:has(i.tabler-eye)').click();else await action(page,r.name,'Preview');await expect(nameField(page)).toHaveValue(r.name);await expect(dialog(page).locator('[name=notes]')).toHaveValue('QA note '+r.name);}));
 test('deactivate reactivate persist after reload',async({page})=>owned(page,async r=>{for(const checked of [false,true]){const target=await locate(page,r.name),toggle=target.locator('input.MuiSwitch-input');await expect(toggle).toBeChecked({checked:!checked});await toggle.click();await expect(toggle).toBeChecked({checked});await expect((await locate(page,r.name)).locator('input.MuiSwitch-input')).toBeChecked({checked});}}));
 for(const status of ['Active','Inactive'])test('status filter and reset '+status,async({page})=>owned(page,async r=>{
  await locate(page,r.name);if(status==='Inactive'){await row(page,r.name).locator('input.MuiSwitch-input').click();await expect(row(page,r.name).locator('input.MuiSwitch-input')).not.toBeChecked();}
  await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('combobox',{name:'Status',exact:true}).click();await page.getByRole('option',{name:status,exact:true}).click();const pending=response(page,'GET');await page.getByRole('button',{name:'Submit',exact:true}).click();expect((await pending).ok()).toBeTruthy();await expect(row(page,r.name)).toBeVisible();await expect(row(page,r.name).locator('input.MuiSwitch-input')).toBeChecked({checked:status==='Active'});
  await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(row(page,r.name)).toBeVisible();
 }));
 test('tree exposes owned record and hierarchy',async({page})=>owned(page,async r=>{await open(page);await page.getByRole('button',{name:'Tree',exact:true}).click();await page.getByRole('button',{name:'Expand all',exact:true}).click();await expect(page.getByText(new RegExp(r.name)).last()).toBeVisible();await page.getByRole('button',{name:'Collapse all',exact:true}).click();}));
 test('search missing value reset and list download',async({page},info)=>{await open(page);await search(page,'NO-'+c.prefix+'-'+Date.now());await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();await search(page,'');await expect(page.locator('tbody tr').first()).toBeVisible();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await pending;expect(await download.failure()).toBeNull();const path=info.outputPath(download.suggestedFilename());await download.saveAs(path);expect((await stat(path)).size).toBeGreaterThan(0);await info.attach('list-download',{path});});
 test('@additional duplicate number is rejected without changing original',async({page})=>owned(page,async r=>{
  const duplicate=r.name+'-DUP';await form(page,duplicate,r.num);const pending=response(page,'POST');await dialog(page).getByRole('button',{name:'Submit',exact:true}).click();const result=await pending,body=await result.json();
  await test.info().attach('duplicate-number-response',{body:JSON.stringify({status:result.status(),body}),contentType:'application/json'});
  if(result.ok()&&body.is_success!==false&&body.data?.id&&String(body.data.id)!==r.id)await cleanup(page,{id:String(body.data.id),name:duplicate});
  expect(!result.ok()||body.is_success===false,'Duplicate account number must not create another record').toBeTruthy();
  await edit(page,r.name);await expect(nameField(page)).toHaveValue(r.name);
 }));
 test('@additional parent dependent fields are validated',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Create',exact:true}).click();
  if(c.account){
   await choose(page,'Account main','Cash 1111');await expect(dialog(page).locator('[name=single_account_number]')).not.toHaveValue('');await nameField(page).fill(c.prefix+'-UNSAVED');await choose(page,'Debit / Credit','Debit');
   await dialog(page).getByRole('button',{name:'Submit',exact:true}).click();await expect(dialog(page).getByText('Financial statement guidance is required',{exact:true})).toBeVisible();
  }else{
   await page.getByRole('combobox',{name:'Cost center type',exact:true}).click();await page.getByRole('option',{name:'Secondary',exact:true}).click();await dialog(page).getByRole('button',{name:'Submit',exact:true}).click();
   await expect(page.getByRole('combobox',{name:'Main cost center *',exact:true})).toHaveAttribute('aria-invalid','true');
  }
 }); test('@additional attachment persists after save and reopen',async({page})=>owned(page,async r=>{
  await edit(page,r.name);await dialog(page).locator('input[type=file]').setInputFiles('tests/fixtures/contact-proof.png');
  const image=dialog(page).locator('img[src*="/attachments/"]').first();await expect(image).toBeVisible();const source=await image.getAttribute('src');expect(source).toBeTruthy();
  const pending=response(page,'PUT','/'+r.id);await dialog(page).getByRole('button',{name:'Save',exact:true}).click();expect((await pending).ok()).toBeTruthy();await expect(dialog(page)).toBeHidden();await edit(page,r.name);
  const persisted=dialog(page).locator('img[src*="/attachments/"]').first();await expect(persisted).toHaveAttribute('src',source!);await expect.poll(()=>persisted.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 }));}





