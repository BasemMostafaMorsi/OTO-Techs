import {test,expect,Page} from '../../helpers/test';
import {login} from '../../helpers/auth';
// @ts-ignore - Node types are not installed in this project config
import {mkdir,stat} from 'node:fs/promises';

const base='/en/contacts/projects',api='/sales/projects';
const projectName=(page:Page)=>page.getByRole('textbox',{name:'Project name *',exact:true});
async function select(page:Page,field:string,value:RegExp){
 await page.getByRole('combobox',{name:new RegExp('^'+field)}).click();await page.getByRole('option',{name:value}).click();
}
async function search(page:Page,value:string){
 const p=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes(api+'?')&&r.url().includes(encodeURIComponent(value)));
 await page.getByPlaceholder('Search',{exact:true}).fill(value);expect((await p).ok()).toBeTruthy();
}
async function create(page:Page,name:string,extra?:()=>Promise<void>){
 await page.goto(base+'/create');await projectName(page).fill(name);
 await select(page,'Customer name',/^Basem\s*#8$/);await select(page,'Service center',/Master Service Center/);
 if(extra)await extra();
 const p=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith(api));await page.getByRole('button',{name:'Save',exact:true}).click();
 const response=await p,body=await response.json();await test.info().attach('create-project',{body:JSON.stringify({status:response.status(),body}),contentType:'application/json'});
 expect(response.ok(),body.message).toBeTruthy();expect(body.data?.id).toBeTruthy();return String(body.data.id);
}
async function edit(page:Page,id:string,name:string){await page.goto(`${base}/edit/${id}`);await expect(projectName(page)).toHaveValue(name);}
async function cleanup(page:Page,id:string,name:string){
 const screenshot=test.info().outputPath(`project-${id}-before-cleanup.png`);await page.screenshot({path:screenshot,fullPage:true});await test.info().attach('before-cleanup',{path:screenshot,contentType:'image/png'});
 await page.goto(`${base}/edit/${id}`);await expect(projectName(page)).toHaveValue(new RegExp('^'+name));
 await page.getByRole('button',{name:'Delete',exact:true}).click();const p=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith(api+'/'+id));
 await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();expect((await p).ok()).toBeTruthy();
 await page.goto(base);await search(page,name);await expect(page.getByRole('row').filter({has:page.getByText('#'+id,{exact:true})})).toHaveCount(0);
}
async function complete(page:Page){
 const counter=page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});await expect(counter).toBeVisible();
 const counts=async()=>(await counter.innerText()).split('/').map(Number);const total=(await counts())[1];
 for(let n=0;(await counts())[0]<total&&n<100;n++){
  const previous=(await counts())[0];await page.getByRole('table').evaluate(table=>{let p=table.parentElement;while(p&&p.scrollHeight<=p.clientHeight)p=p.parentElement;const e=p||document.scrollingElement;if(e)e.scrollTop=e.scrollHeight;});
  await expect.poll(async()=>(await counts())[0]).toBeGreaterThan(previous);
 }
 await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(total);return total;
}
test.beforeEach(async({page})=>{test.setTimeout(150_000);await mkdir('artifacts/business-partners/projects',{recursive:true});await login(page);});
test.afterEach(async({page},info)=>{const path=`artifacts/business-partners/projects/${info.title.replace(/[^a-z0-9]+/gi,'-')}.png`;await page.screenshot({path,fullPage:true});await info.attach('project-screen',{path,contentType:'image/png'});});

test('@projects required name customer and service center prevent submission',async({page})=>{
 await page.goto(base+'/create');const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith(api))writes.push(r.url());});
 await page.getByRole('button',{name:'Save',exact:true}).click();for(const text of ['Project name is required','Customer name is required','Service center is required'])await expect(page.getByText(text,{exact:true})).toBeVisible();expect(writes).toEqual([]);
});
test('@projects create linked project, open row, edit and delete',async({page},info)=>{
 const name=`PROJ-E2E-LIFE-${Date.now()}`;let id:string|undefined;
 try{
  id=await create(page,name);await page.goto(base);await search(page,name);const row=page.getByRole('row').filter({hasText:name});await expect(row).toContainText('Basem');await expect(row).toContainText('Master Service Center');
  await row.locator('button:has(i.tabler-eye)').click();await expect(page).toHaveURL(new RegExp(`/projects/edit/${id}$`));await expect(projectName(page)).toHaveValue(name);
  await expect(page.getByRole('combobox',{name:/Customer name/})).toHaveValue('Basem');await expect(page.getByRole('combobox',{name:/Service center/})).toHaveValue('Master Service Center');
  await projectName(page).fill(name+'-EDITED');await page.getByRole('textbox',{name:'Description',exact:true}).fill('Edited project description');
  const p=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith(api+'/'+id));await page.getByRole('button',{name:'Save',exact:true}).click();const response=await p;expect(response.ok()).toBeTruthy();
  await info.attach('update-project',{body:JSON.stringify({submitted:response.request().postDataJSON(),body:await response.json()}),contentType:'application/json'});
  await edit(page,id,name+'-EDITED');await expect(page.getByRole('textbox',{name:'Description',exact:true})).toHaveValue('Edited project description');
 }finally{if(id)await cleanup(page,id,name);}
});
test('@projects reference description and full address persist',async({page})=>{
 const name=`PROJ-E2E-ADDRESS-${Date.now()}`,ref=String(Date.now());let id:string|undefined;
 try{
  id=await create(page,name,async()=>{
   await page.locator('input[name=reference_number]').fill(ref);await page.getByRole('textbox',{name:'Description',exact:true}).fill('QA project description');
   for(const [field,value] of [['Country','Egypt'],['Area','Cairo'],['City','Nasr City']])await select(page,field,new RegExp('^'+value+'$'));
   await page.getByRole('textbox',{name:'Address',exact:true}).fill('QA Street 123');await page.getByRole('textbox',{name:'Landmark',exact:true}).fill('QA Landmark');
  });await edit(page,id,name);
  await expect(page.locator('input[name=reference_number]')).toHaveValue(ref);await expect(page.getByRole('textbox',{name:'Description',exact:true})).toHaveValue('QA project description');
  for(const [field,value] of [['Country','Egypt'],['Area','Cairo'],['City','Nasr City']])await expect(page.getByRole('combobox',{name:field,exact:true})).toHaveValue(value);
  await expect(page.getByRole('textbox',{name:'Address',exact:true})).toHaveValue('QA Street 123');await expect(page.getByRole('textbox',{name:'Landmark',exact:true})).toHaveValue('QA Landmark');
 }finally{if(id)await cleanup(page,id,name);}
});
test('@projects cancel deletion preserves project',async({page})=>{
 const name=`PROJ-E2E-CANCEL-${Date.now()}`;let id:string|undefined;
 try{id=await create(page,name);await edit(page,id,name);await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await page.reload();await expect(projectName(page)).toHaveValue(name);}
 finally{if(id)await cleanup(page,id,name);}
});
test('@projects address dependencies and country change reset',async({page})=>{
 await page.goto(base+'/create');await expect(page.getByRole('combobox',{name:/^Area/})).toBeDisabled();await expect(page.getByRole('combobox',{name:/^City/})).toBeDisabled();
 for(const [field,value] of [['Country','Egypt'],['Area','Cairo'],['City','Nasr City']])await select(page,field,new RegExp('^'+value+'$'));
 await select(page,'Country',/^Saudi Arabia$/);await expect(page.getByRole('combobox',{name:'Country',exact:true})).toHaveValue('Saudi Arabia');
 await expect.soft(page.getByRole('combobox',{name:/^Area/}),'Area clears after country change').toHaveValue('');await expect.soft(page.getByRole('combobox',{name:/^City/}),'City clears after country change').toHaveValue('');await expect(page.getByRole('combobox',{name:/^City/})).toBeDisabled();
});
test('@projects all list IDs match loaded pages without duplicates',async({page},info)=>{
 const pages=new Map<number,string[]>(),pending:Promise<void>[]=[];
 page.on('response',r=>{if(r.ok()&&r.request().method()==='GET'&&r.url().includes(api+'?'))pending.push(r.json().then(body=>{pages.set(body.data.meta.current_page,body.data.collection.map((x:{id:number})=>String(x.id)));}));});
 const p=page.waitForResponse(r=>r.url().includes(api+'?'));await page.goto(base);expect((await p).ok()).toBeTruthy();await expect(page.getByRole('table').locator('tbody tr').first()).toBeVisible();const total=await complete(page);await Promise.all(pending);
 const ids=await page.getByRole('table').locator('tbody tr').evaluateAll(es=>es.map(e=>e.textContent?.match(/#(\d+)/)?.[1]));expect(new Set(ids).size).toBe(total);expect(ids.slice().sort()).toEqual([...pages.values()].flat().sort());await info.attach('all-project-ids',{body:JSON.stringify({total,ids,pages:[...pages.keys()]}),contentType:'application/json'});
});
test('@projects empty search reset and list download',async({page},info)=>{
 await page.goto(base);await search(page,`NO-PROJECT-${Date.now()}`);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();await search(page,'');await expect(page.getByRole('table').locator('tbody tr').first()).toBeVisible();
 const p=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const file=await p;expect(await file.failure()).toBeNull();const path=info.outputPath(file.suggestedFilename());await file.saveAs(path);expect((await stat(path)).size).toBeGreaterThan(0);await info.attach('projects-export',{path,contentType:'application/octet-stream'});
});
for(const [field,value,column] of [['Customer','Basem','CUSTOMER'],['Service center','Master Service Center','SERVICE CENTER']]){
 test(`@projects ${field} filter and reset`,async({page})=>{
  const initial=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes(api+'?'));await page.goto(base);const initialData=(await (await initial).json()).data;
  await expect(page.getByRole('button',{name:new RegExp(`^\\d+/${initialData.meta.total}$`)})).toBeVisible();const original=await complete(page);
  const baseline=await page.getByRole('table').locator('tbody tr').allTextContents();await page.getByRole('button',{name:'Filter',exact:true}).click();await select(page,field,new RegExp('^'+value+'(?:\\s*#\\d+)?$'));
  const p=page.waitForResponse(r=>r.url().includes(api+'?'));await page.getByRole('button',{name:'Submit',exact:true}).click();expect((await p).ok()).toBeTruthy();
  await expect.poll(async()=>new URL(page.url()).search.length).toBeGreaterThan(0);await complete(page);
  const table=page.getByRole('table'),headers=(await table.getByRole('columnheader').allTextContents()).map(x=>x.trim().toUpperCase()),index=headers.indexOf(column);expect(index).toBeGreaterThan(-1);
  const rows=table.locator('tbody tr');expect(await rows.count()).toBeGreaterThan(0);for(const row of await rows.all())await expect(row.locator('td').nth(index)).toContainText(value);
  await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByRole('button',{name:new RegExp(`^\\d+/${original}$`)})).toBeVisible();
  await complete(page);await expect.poll(()=>page.getByRole('table').locator('tbody tr').allTextContents()).toEqual(baseline);
 });
}
test('@projects optimize hides and restores Ref column',async({page})=>{
 await page.goto(base);await expect(page.getByRole('columnheader',{name:'Ref',exact:true})).toBeVisible();await page.getByRole('button',{name:'Optimize',exact:true}).click();const checkbox=page.getByRole('checkbox',{name:'Ref',exact:true});await expect(checkbox).toBeChecked();
 try{await checkbox.uncheck();await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Ref',exact:true})).toHaveCount(0);}
 finally{if(!await checkbox.isVisible())await page.getByRole('button',{name:'Optimize',exact:true}).click();await checkbox.check();await page.getByRole('button',{name:'Submit',exact:true}).click();}await expect(page.getByRole('columnheader',{name:'Ref',exact:true})).toBeVisible();
});
