import {test,expect,Page} from '../../../helpers/test';
import {login} from '../../../helpers/auth';
import {mkdir,stat} from 'node:fs/promises';
import {minorUnits} from '../../helpers/decimal';

const route='/en/finance/accounting/journal-items';
const endpoint='/finance/journal_entry_items?';
const statuses:Record<string,string>={'0':'Draft','1':'Posted','2':'Canceled','3':'Unposted'};
const clean=(value:string)=>value.replace(/\s+/g,' ').trim();
async function rows(page:Page){
 const table=page.getByRole('main').getByRole('table');
 const headers=(await table.getByRole('columnheader').allTextContents()).map(value=>clean(value).toUpperCase());
 return table.locator('tbody tr').evaluateAll((elements,heads)=>elements.map(element=>Array.from(element.querySelectorAll('td')).map(cell=>(cell as HTMLElement).innerText.replace(/\s+/g,' ').trim())).filter(cells=>cells.length===heads.length).map(cells=>Object.fromEntries(heads.map((h,i)=>[h,cells[i]]))),headers);
}
async function open(page:Page){
 const response=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes(endpoint));
 await page.goto(route);const result=await response;expect(result.ok()).toBeTruthy();
 const body=await result.json();
 await expect(page.getByRole('table')).toBeVisible();
 await expect.poll(async()=>(await rows(page)).length).toBeGreaterThan(0);
 return body.data;
}
async function search(page:Page,value:string){
 const response=page.waitForResponse(r=>r.url().includes(endpoint)&&r.url().includes(encodeURIComponent(value)));
 await page.getByPlaceholder('Search',{exact:true}).fill(value);
 const result=await response;expect(result.ok()).toBeTruthy();return (await result.json()).data;
}
async function complete(page:Page){
 const counter=page.getByRole('main').getByRole('button',{name:/^\d+\/\d+$/});
 const counts=async()=>(await counter.innerText()).split('/').map(Number);
 await expect(counter).toBeVisible();const total=(await counts())[1];
 for(let n=0;(await counts())[0]<total&&n<100;n++){
  const previous=(await counts())[0];
  await page.getByRole('table').evaluate(table=>{let parent=table.parentElement;while(parent&&parent.scrollHeight<=parent.clientHeight)parent=parent.parentElement;const container=parent||document.scrollingElement;if(container)container.scrollTop=container.scrollHeight;});
  await expect.poll(async()=>(await counts())[0],{timeout:15_000}).toBeGreaterThan(previous);
  expect((await counts())[1],'Total count remains stable').toBe(total);
 }
 await expect.poll(async()=>(await rows(page)).length).toBe(total);
 return rows(page);
}
test.beforeEach(async({page})=>{await mkdir('artifacts/finance/journal-items',{recursive:true});await login(page);});
test.afterEach(async({page},info)=>{
 const file=`artifacts/finance/journal-items/${info.title.replace(/[^a-z0-9]+/gi,'-')}.png`;
 await page.screenshot({path:file,fullPage:true});await info.attach('journal-items-screen',{path:file,contentType:'image/png'});
});

test('@journal-items complete pagination and displayed fields match loaded API rows',async({page},info)=>{
 test.setTimeout(180_000);
 const pages=new Map<number,any[]>();const pending:Promise<void>[]=[];
 page.on('response',response=>{if(response.url().includes(endpoint)&&response.ok())pending.push(response.json().then(body=>{pages.set(body.data.meta.current_page,body.data.collection);}));});
 const initial=await open(page);const visible=await complete(page);await Promise.all(pending);
 const source=[...pages.entries()].sort((a,b)=>a[0]-b[0]).flatMap(([,items])=>items);
 expect(source).toHaveLength(initial.meta.total);
 const amount=(value:string)=>minorUnits(value,{precision:2}).toString();
 const actual=visible.map(r=>({date:r.DATE,journal:r['JL ID'],status:r.STATUS,account:r.ACCOUNT.toLowerCase(),ref:r.REF,debit:amount(r.DEBIT),credit:amount(r.CREDIT)}));
 const expected=source.map(r=>({date:r.journalEntry.date,journal:String(r.journalEntry.identity_number??''),status:statuses[String(r.journalEntry.status)],account:clean(`${r.account.account_number}. ${r.account.name}`).toLowerCase(),ref:String(r.journalEntry.ref??''),debit:amount(String(r.debit)),credit:amount(String(r.credit))}));
 await info.attach('all-page-reconciliation',{body:JSON.stringify({total:initial.meta.total,pages:[...pages.keys()],actual,expected},null,2),contentType:'application/json'});
 expect(actual.map(row=>JSON.stringify(row)).sort()).toEqual(expected.map(row=>JSON.stringify(row)).sort());
});

test('@journal-items reference search, empty result and clearing search',async({page},info)=>{
 const initial=await open(page);const ref=initial.collection.find((r:any)=>r.journalEntry.ref)?.journalEntry.ref;
 expect(ref,'Existing reference available for search').toBeTruthy();
 const found=await search(page,String(ref));
 await expect.poll(async()=>(await rows(page)).length).toBe(found.meta.total);
 const result=await rows(page);expect(result.length).toBeGreaterThan(0);
 expect(result.every(r=>r.REF===String(ref))).toBe(true);
 await info.attach('reference-search',{body:JSON.stringify({ref,rows:result}),contentType:'application/json'});
 await search(page,`NO-JOURNAL-ITEM-${Date.now()}`);
 await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
 await expect.poll(async()=>(await rows(page)).length).toBe(0);
 const reset=page.waitForResponse(r=>r.url().includes(endpoint));
 await page.getByPlaceholder('Search',{exact:true}).fill('');await reset;
 await expect.poll(async()=>(await rows(page)).length).toBeGreaterThan(0);
});

for(const status of ['Draft','Posted','Unposted','Canceled']){
 test(`@journal-items status filter and reset: ${status}`,async({page},info)=>{
  test.setTimeout(120_000);const initial=await open(page);
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  await page.getByLabel('Status',{exact:true}).click();
  await page.getByRole('option',{name:status,exact:true}).click();
  const response=page.waitForResponse(r=>r.url().includes(endpoint));
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  const data=(await (await response).json()).data;
  await expect(page.getByRole('button',{name:new RegExp(`^\\d+/${data.meta.total}$`)})).toBeVisible();
  const result=await complete(page);
  expect(result.every(row=>row.STATUS===status)).toBe(true);
  await info.attach('status-filter',{body:JSON.stringify({status,total:data.meta.total,rows:result}),contentType:'application/json'});
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  const reset=page.waitForResponse(r=>r.url().includes(endpoint));
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  expect((await (await reset).json()).data.meta.total).toBe(initial.meta.total);
 });
}

for(const [label,column] of [['Account name','ACCOUNT'],['Creator','CREATED BY']]){
 test(`@journal-items ${label} filter`,async({page},info)=>{
  test.setTimeout(120_000);await open(page);
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  await page.getByLabel(label,{exact:true}).click();
  const option=page.getByRole('option').filter({hasText:label==='Account name'?/Main treasury/i:/basem mostafa/i}).first();
  await expect(option).toBeVisible();const selected=clean(await option.innerText());await option.click();
  const response=page.waitForResponse(r=>r.url().includes(endpoint));
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  const data=(await (await response).json()).data;
  await expect(page.getByRole('button',{name:new RegExp(`^\\d+/${data.meta.total}$`)})).toBeVisible();
  const result=await complete(page);
  await info.attach('selected-filter',{body:JSON.stringify({label,selected,total:data.meta.total,rows:result}),contentType:'application/json'});
  expect(result.length,'Selected option has journal items').toBeGreaterThan(0);
  const name=label==='Account name'?'main treasury':'basem mostafa';
  expect(result.every(row=>row[column].toLowerCase().includes(name))).toBe(true);
 });
}

test('@journal-items preview opens the correct parent journal',async({page},info)=>{
 const data=await open(page);const first=data.collection[0];
 await page.getByRole('table').locator('tbody tr').first().getByRole('button').click();
 await expect(page).toHaveURL(new RegExp(`/journal-entries/edit/${first.journal_entry_id}$`));
 await expect(page.locator('input[name=ref]')).toHaveValue(String(first.journalEntry.ref??''));
 await expect(page.locator('textarea[name=description]')).toHaveValue(first.journalEntry.description);
 await info.attach('parent-journal',{body:JSON.stringify({id:first.journal_entry_id,ref:first.journalEntry.ref}),contentType:'application/json'});
});

test('@journal-items list export downloads a nonempty file',async({page},info)=>{
 await open(page);const event=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export',exact:true}).click();
 const download=await event;expect(await download.failure()).toBeNull();
 const file=info.outputPath(download.suggestedFilename());await download.saveAs(file);
 expect((await stat(file)).size).toBeGreaterThan(0);
 await info.attach('journal-items-export',{path:file,contentType:'application/octet-stream'});
});
