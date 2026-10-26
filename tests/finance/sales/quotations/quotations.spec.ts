import {test,expect,Page} from '../../../helpers/test';
import {login} from '../../../helpers/auth';
const base='/en/finance/sales-invoices/quotations';
const endpoint='/sales_purchase/sales_quotations';
const rows=(p:Page)=>p.getByRole('row').filter({has:p.getByRole('button',{name:'more',exact:true})});
const lines=(p:Page)=>p.getByRole('row').filter({has:p.getByRole('combobox',{name:'Select Product',exact:true})});
const pending=(p:Page)=>p.waitForResponse(r=>new URL(r.url()).pathname.endsWith(endpoint)&&r.request().method()==='GET',{timeout:30000});
async function list(p:Page){const wait=pending(p);wait.catch(()=>{});await p.goto(base);const response=await wait;expect(response.ok()).toBeTruthy();const data=(await response.json()).data;await expect(p.getByRole('button',{name:'Create',exact:true})).toBeVisible();return {response,data};}
async function match(p:Page,data:any){
  await expect(rows(p)).toHaveCount(data.collection.length);
  await expect(p.getByRole('button',{name:`${data.collection.length}/${data.meta.total}`,exact:true})).toBeVisible();
  for(const record of data.collection){
    const row=rows(p).filter({has:p.locator('td:nth-child(2)').getByText(`#${record.id}`,{exact:true})});
    await expect(row).toHaveCount(1);await expect(row.getByRole('cell').nth(1)).toContainText(record.date);
    await expect(row.getByRole('cell').nth(2)).toContainText(record.customer.name);
    await expect.poll(async()=>Number((await row.getByRole('cell').nth(3).innerText()).replace(/,/g,''))).toBe(Number(record.total_amount));
  }
}
async function allSource(p:Page,response:any,data:any){
  const records=[...data.collection];const headers=await response.request().allHeaders();
  for(const key of Object.keys(headers))if(key.startsWith(':')||key==='content-length')delete headers[key];
  for(let i=2;i<=data.meta.last_page;i++){
    const url=new URL(response.url());url.searchParams.set('page',String(i));const next=await p.request.get(url.toString(),{headers});expect(next.ok()).toBeTruthy();records.push(...(await next.json()).data.collection);
  }
  expect(records.length).toBe(data.meta.total);expect(new Set(records.map(x=>x.id)).size).toBe(records.length);return records;
}
async function create(p:Page){await p.goto(base+'/create');await expect(p.getByRole('heading',{name:'Quotation',exact:true})).toBeVisible();await expect(lines(p)).toHaveCount(1);}
test.beforeEach(async({page})=>{test.setTimeout(90000);page.setDefaultTimeout(30000);await login(page);});
test.afterEach(async({page},info)=>{await info.attach('quotation-screen',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});});

test('quotation list IDs dates customers and amounts match loaded source',async({page})=>{const {data}=await list(page);await match(page,data);});
test('no-match search and clearing search restore quotation rows',async({page})=>{
  const {data}=await list(page);const search=page.getByRole('textbox',{name:'Search',exact:true});
  let wait=pending(page);await search.fill('QUOTE-NONE-'+Date.now());expect((await wait).ok()).toBeTruthy();await expect(rows(page)).toHaveCount(0);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
  wait=pending(page);await search.fill('');await wait;await match(page,data);
});
for(const status of ['Draft','Waiting for Approval','Approved','Rejected','Completed','Archived'])test(`status filter ${status} and Reset match source`,async({page},info)=>{
  const {response,data}=await list(page);const baseline=await allSource(page,response,data);
  await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('combobox',{name:'Status',exact:true}).click();await page.getByRole('option',{name:status,exact:true}).click();
  let wait=pending(page);await page.getByRole('button',{name:'Submit',exact:true}).click();const result=await wait;expect(result.ok()).toBeTruthy();const selected=new URL(result.url()).searchParams.get('status');expect(selected).not.toBeNull();const filtered=(await result.json()).data;
  const expected=baseline.filter(x=>String(x.status)===selected);expect(filtered.meta.total).toBe(expected.length);for(const record of filtered.collection)expect(String(record.status)).toBe(selected);
  await match(page,filtered);for(const row of await rows(page).all())await expect(row.getByRole('cell').nth(4)).toHaveText(status);
  await info.attach('status-filter-evidence',{body:JSON.stringify({status,selected,expectedIds:expected.map(x=>x.id),actualIds:filtered.collection.map((x:any)=>x.id)}),contentType:'application/json'});
  await page.getByRole('button',{name:'Filter',exact:true}).click();wait=pending(page);await page.getByRole('button',{name:'Reset',exact:true}).click();await wait;await match(page,data);
});
test('closing filter without submitting preserves list',async({page})=>{const {data}=await list(page);await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('combobox',{name:'Status',exact:true}).click();await page.getByRole('option',{name:'Draft',exact:true}).click();await page.getByRole('button',{name:'close',exact:true}).click();await match(page,data);});
test('blank quotation rejects missing expiration date without creation',async({page})=>{
  await create(page);let writes=0;await page.route('**/sales_purchase/sales_quotations',async r=>{if(r.request().method()==='POST'){writes++;await r.abort();}else await r.continue();});
  await page.getByRole('button',{name:'Submit',exact:true}).click();await page.getByRole('menuitem',{name:'Create new',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Expiration date *',exact:true})).toHaveAttribute('aria-invalid','true');
  await expect(page.getByRole('paragraph').filter({hasText:/^Expiration date is required$/})).toBeVisible();expect(writes).toBe(0);
});
test('add and remove unsaved quotation lines',async({page})=>{await create(page);await page.getByRole('button',{name:'New',exact:true}).click();await expect(lines(page)).toHaveCount(2);await lines(page).last().getByRole('cell').last().getByRole('button').click();await expect(lines(page)).toHaveCount(1);});
test('product unit loads and decimal quantity price discount tax reconcile',async({page},info)=>{
  await create(page);await page.getByRole('combobox',{name:'Select Product',exact:true}).click();await page.getByRole('option').filter({hasNotText:'Create new'}).first().click();
  const row=lines(page).first();await expect(row.getByRole('combobox',{name:'Select Unit',exact:true})).not.toHaveValue('');
  await row.getByRole('spinbutton').nth(0).fill('2');await row.getByRole('spinbutton').nth(1).fill('0.1');await row.getByRole('spinbutton').nth(2).fill('0');await row.getByRole('spinbutton').nth(2).blur();
  const taxText=await row.getByRole('cell').nth(6).innerText();const rate=Number(taxText.match(/([\d.]+)%/)?.[1]||0);const expected=Math.round(0.2*(1+rate/100)*100)/100;
  await expect.poll(async()=>Number((await row.getByRole('cell').nth(7).innerText()).replace(/,/g,''))).toBe(expected);
  await info.attach('arithmetic',{body:JSON.stringify({quantity:2,price:0.1,discount:0,taxRate:rate,expected}),contentType:'application/json'});
});
test('all quotation tabs open and switching preserves an unsaved quantity',async({page})=>{
  await create(page);await lines(page).first().getByRole('spinbutton').first().fill('3');
  for(const name of ['Payment methods','Sales','Terms & conditions','Special Fields','Attachments','Items']){const tab=page.getByRole('tab',{name,exact:true});await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');}
  await expect(lines(page).first().getByRole('spinbutton').first()).toHaveValue('3');
});
test('reopening create discards unsaved quantity and extra lines',async({page})=>{await create(page);await lines(page).first().getByRole('spinbutton').first().fill('7');await page.getByRole('button',{name:'New',exact:true}).click();await list(page);await create(page);await expect(lines(page).first().getByRole('spinbutton').first()).toBeEmpty();});
