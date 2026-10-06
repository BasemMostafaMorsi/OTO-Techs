import {test,expect,Page} from '../../../helpers/test';
import {login} from '../../../helpers/auth';
import {mkdir} from 'node:fs/promises';
import {stat} from 'node:fs/promises';

const base='/en/finance/accounting/journal-entries';
async function search(page:Page,value:string){
 const response=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes('/finance/journal_entries?')&&r.url().includes(encodeURIComponent(value)));
 await page.getByPlaceholder('Search',{exact:true}).fill(value);
 expect((await response).ok()).toBeTruthy();
}
async function fillJournal(page:Page,reference:string,description:string){
  await page.goto(`${base}/create`);
  await page.getByPlaceholder('MM/DD/YYYY',{exact:true}).fill(new Intl.DateTimeFormat('en-US',{month:'2-digit',day:'2-digit',year:'numeric',timeZone:'Africa/Cairo'}).format(new Date()));
  await page.locator('input[name=ref]').fill(reference);
  await page.locator('textarea[name=description]').fill(description);
  await page.getByPlaceholder('Search by name, number, or type').fill('cash');
  await page.getByRole('option').filter({hasText:/Main treasury\s*#1111001/}).click();
  await page.getByRole('button',{name:'New',exact:true}).click();
  await page.getByPlaceholder('Search by name, number, or type').nth(1).click();
  await page.getByRole('option').filter({hasText:/Petty Cash\s*#1111002/}).click();
  await page.locator('input[name=debit_0]').fill('0.10');
  await page.locator('input[name=credit_1]').fill('0.10');
}
async function submit(page:Page,choice='New'){
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  await page.getByRole('menuitem',{name:choice,exact:true}).click();
}
test.beforeEach(async({page})=>{await mkdir('artifacts/finance',{recursive:true});await login(page);});
test.afterEach(async({page},info)=>{
  const file=`artifacts/finance/${info.title.replace(/[^a-z0-9]+/gi,'-')}.png`;
  await page.screenshot({path:file,fullPage:true});
  await info.attach('journal-screen',{path:file,contentType:'image/png'});
});

test('@finance @journal list pagination, unique records and empty search',async({page},info)=>{
 test.setTimeout(120_000);
 await page.goto(base);
 const counter=page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});
 const counts=async()=>(await counter.innerText()).split('/').map(Number);
 await expect.poll(async()=>(await counts())[1]).toBeGreaterThan(0);
 const total=(await counts())[1];
 for(let batch=0;(await counts())[0]<total&&batch<100;batch++){
  const previous=(await counts())[0];
  await page.getByRole('table').evaluate(table=>{let element=table.parentElement;while(element&&element.scrollHeight<=element.clientHeight)element=element.parentElement;const container=element||document.scrollingElement;if(container)container.scrollTop=container.scrollHeight;});
  await expect.poll(async()=>(await counts())[0]).toBeGreaterThan(previous);
  expect((await counts())[1],'Dataset remains stable while loading').toBe(total);
 }
 const rows=page.getByRole('table').locator('tbody tr');
 await expect(rows).toHaveCount(total);
 const texts=await rows.allInnerTexts();
 expect(new Set(texts).size,'Loaded rows are unique').toBe(total);
 await info.attach('pagination-evidence',{body:JSON.stringify({total,loaded:texts.length}),contentType:'application/json'});
 await page.getByPlaceholder('Search',{exact:true}).fill(`NO-SUCH-JOURNAL-${Date.now()}`);
 await expect(counter).toHaveText('0/0');
 await expect(page.getByRole('table').locator('tbody tr').filter({has:page.getByRole('button',{name:'more',exact:true})})).toHaveCount(0);
 await page.getByPlaceholder('Search',{exact:true}).fill('');
 await expect.poll(async()=>(await counts())[1]).toBe(total);
});

test('@finance @journal list export downloads a nonempty file',async({page},info)=>{
 await page.goto(base);
 await expect(page.getByRole('table')).toBeVisible();
 const downloadEvent=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export',exact:true}).click();
 const download=await downloadEvent;
 expect(await download.failure()).toBeNull();
 const file=info.outputPath(download.suggestedFilename());
 await download.saveAs(file);
 expect((await stat(file)).size).toBeGreaterThan(0);
 await info.attach('journal-list-export',{path:file,contentType:'application/octet-stream'});
});

for(const scenario of ['required fields','numeric reference','unbalanced amounts']){
 test(`@finance @journal validation: ${scenario}`,async({page},info)=>{
  test.setTimeout(90_000);
  const writes:string[]=[];
  page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/finance/journal_entries'))writes.push(r.url());});
  if(scenario==='required fields')await page.goto(`${base}/create`);
  else await fillJournal(page,scenario==='numeric reference'?'INVALID-REF':String(Date.now()),`FIN-E2E-VALIDATION-${Date.now()}`);
  if(scenario==='unbalanced amounts')await page.locator('input[name=credit_1]').fill('0.09');
  await submit(page);
  if(scenario==='required fields'){
   for(const message of ['Date is required','Description is required','Account name is required'])await expect(page.getByText(message,{exact:true})).toBeVisible();
  }else await expect(page.getByText(scenario==='numeric reference'?'Please insert numbers only':'Division must be equal 0',{exact:true})).toBeVisible();
  await expect(page).toHaveURL(/\/journal-entries\/create$/);
  await info.attach('write-requests',{body:JSON.stringify(writes),contentType:'application/json'});
  expect(writes,'Invalid form must not submit a journal').toEqual([]);
 });
}

test('@finance @journal draft edit, notes, search, delete confirmation and deletion',async({page},info)=>{
 test.setTimeout(150_000);
 const ref=String(Date.now()),description=`FIN-E2E-CRUD-${ref}`,updated=description+'-EDITED';
 let id:string|undefined;
 try{
  await fillJournal(page,ref,description);
  await page.locator('textarea[name=notes]').fill('Journal test note '+ref);
  const upload=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/uploads'));
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/contact-proof.png');
  expect((await upload).ok(),'Journal attachment upload').toBeTruthy();
  const image=page.getByRole('main').locator('img[src*="attachments/"]').first();
  await expect(image).toBeVisible();
  const attachmentURL=await image.getAttribute('src');
  const creation=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/finance/journal_entries'));
  await submit(page,'Draft');
  const response=await creation;expect(response.ok()).toBeTruthy();id=(await response.json()).data.id;
  await info.attach('own-journal',{body:JSON.stringify({id,ref,description}),contentType:'application/json'});
  await page.goto(`${base}/edit/${id}`);
  await expect(page.locator('textarea[name=notes]')).toHaveValue('Journal test note '+ref);
  await expect(page.getByRole('main').locator('img').filter({visible:true}).last()).toBeVisible();
  await expect.poll(async()=>page.getByRole('main').locator('img').evaluateAll(es=>es.map(e=>e.getAttribute('src')))).toContain(attachmentURL);
  await expect(page.locator('input[name=ref]')).toHaveValue(ref);
  await page.locator('textarea[name=description]').fill(updated);
  await page.getByRole('button',{name:'Save',exact:true}).click();
  const saved=page.waitForResponse(r=>['PUT','PATCH','POST'].includes(r.request().method())&&r.url().includes('/finance/journal_entries'));
  await page.getByRole('menuitem',{name:'Save as Draft',exact:true}).click();
  expect((await saved).ok()).toBeTruthy();
  await page.goto(`${base}/edit/${id}`);
  await expect(page.locator('textarea[name=description]')).toHaveValue(updated);
  await expect(page.getByText('Draft',{exact:true})).toBeVisible();
  await page.goto(base);
  await search(page,ref);
  const row=page.getByRole('row').filter({hasText:updated});
  await expect(row).toHaveCount(1);
  await expect.poll(async()=>await page.getByRole('table').locator('tbody tr').count()).toBe(1);
  await row.getByRole('button',{name:'more',exact:true}).click();
  await page.getByRole('menuitem',{name:'Preview',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/journal-entries/.*${id}`));
  await expect(page.locator('textarea[name=description]')).toHaveValue(updated);
  await info.attach('preview-url',{body:page.url(),contentType:'text/plain'});
  await page.goto(base);
  await search(page,ref);
  await expect(row).toHaveCount(1);
  await row.getByRole('button',{name:'more',exact:true}).click();
  await page.getByRole('menuitem',{name:'Delete',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(row).toHaveCount(1);
 }finally{
  if(id){
   await page.goto(`${base}/edit/${id}`);
   await expect(page.locator('input[name=ref]')).toHaveValue(ref);
   await expect(page.locator('textarea[name=description]')).toHaveValue(new RegExp(`^${description}`));
   await page.getByRole('button',{name:'Delete',exact:true}).click();
   const deleted=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().includes(id!));
   await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();
   expect((await deleted).ok()).toBeTruthy();
   await page.goto(base);await search(page,ref);
   await expect(page.getByRole('row').filter({hasText:description})).toHaveCount(0);
  }
 }
});

test('@finance @journal multiline decimal totals recalculate',async({page})=>{
 await fillJournal(page,String(Date.now()),`FIN-E2E-SUM-${Date.now()}`);
 await page.locator('input[name=debit_0]').fill('0.10');
 await page.locator('input[name=credit_1]').fill('0.30');
 await page.getByRole('button',{name:'New',exact:true}).click();
 await page.getByPlaceholder('Search by name, number, or type').nth(2).click();
 await page.getByRole('option').filter({hasText:/Main treasury\s*#1111001/}).click();
 await page.locator('input[name=debit_2]').fill('0.20');
 await page.locator('input[name=debit_2]').press('Tab');
 await expect(page.getByRole('main')).toContainText(/Total Debit:\s*0\.300/);
 await expect(page.getByRole('main')).toContainText(/Total Credit:\s*0\.300/);
 await expect(page.getByRole('main')).toContainText(/Division\s*=\s*0(?:\.0+)?(?![\d.])/);
 await page.locator('input[name=debit_2]').fill('0.25');
 await page.locator('input[name=debit_2]').press('Tab');
 await expect(page.getByRole('main')).toContainText(/Total Debit:\s*0\.350/);
 await expect(page.getByRole('main')).toContainText(/Division\s*=\s*0\.050/);
});

for(const status of ['Draft','Posted','Unposted','Canceled']){
 test(`@finance @journal status filter: ${status}`,async({page},info)=>{
  await page.goto(base);
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  await page.locator('input[name=status]').click();
  await page.getByRole('option',{name:status,exact:true}).click();
  const response=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes('/finance/journal_entries?'));
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  expect((await response).ok()).toBeTruthy();
  const counter=page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});
  await expect(counter).toBeVisible();
  await expect.poll(async()=>{
   const rows=await page.getByRole('table').locator('tbody tr').evaluateAll(es=>es.map(e=>Array.from(e.querySelectorAll('td')).map(c=>(c as HTMLElement).innerText.trim())));
   const loaded=Number((await counter.innerText()).split('/')[0]);
   const records=rows.filter(r=>r.length>4);
   return records.length===loaded && records.every(r=>r[3]===status);
  },{message:'Every loaded row matches the chosen status'}).toBe(true);
  await info.attach('filter-result',{body:JSON.stringify({status,counter:await counter.innerText(),rows:await page.getByRole('table').innerText()}),contentType:'application/json'});
 });
}
