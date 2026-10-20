import {test,expect,Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir} from 'node:fs/promises';
const base='/en/finance/inventory/inventory-managment/products-services',api='/api/v1.0/inventory/products',folder='artifacts/finance/inventory/inventory-management/products-services';
const response=(p:Page)=>p.waitForResponse(r=>r.request().method()==='GET'&&new URL(r.url()).pathname===api);
async function complete(p: Page, firstResponse: import('@playwright/test').Response) {
 expect(firstResponse.ok()).toBeTruthy();
 const first=(await firstResponse.json()).data;
 const collection=[...first.collection];
 // Fetch the remaining source pages independently of the UI's eager loading.
 // The application may already have loaded page 2 before the first assertion.
 const url=new URL(firstResponse.url());
 const headers=Object.fromEntries(Object.entries(await firstResponse.request().allHeaders())
  .filter(([name])=>!name.startsWith(':')&&name!=='content-length'));
 for(let current=first.meta.current_page+1;current<=first.meta.last_page;current++){
  url.searchParams.set('page',String(current));
  const res=await p.request.get(url.toString(),{headers});expect(res.ok()).toBeTruthy();
  const next=(await res.json()).data;
  expect(next.meta.current_page).toBe(current);
  expect(next.meta.total,'Stable source total during pagination').toBe(first.meta.total);
  collection.push(...next.collection);
 }
 expect(collection).toHaveLength(first.meta.total);
 expect(new Set(collection.map((r:any)=>r.id)).size,'No duplicate source IDs').toBe(first.meta.total);
 const counter=p.getByRole('button',{name:/^\d+\/\d+$/});
 await expect(counter).toBeVisible();
 const loaded=async()=>Number((await counter.innerText()).split('/')[0]);
 for(let n=0;await loaded()<first.meta.total&&n<first.meta.last_page;n++){
  const previous=await loaded();
  await p.getByRole('table').evaluate(table=>{
   let container=table.parentElement;
   while(container&&container.scrollHeight<=container.clientHeight)container=container.parentElement;
   const scroll=container||document.scrollingElement;if(scroll)scroll.scrollTop=scroll.scrollHeight;
  });
  await expect.poll(loaded).toBeGreaterThan(previous);
 }
 await expect(counter).toHaveText(String(first.meta.total)+'/'+first.meta.total);
 return {...first,collection};
}
const cases=[{title:'Product',filters:{'Product Type':'Product'}},{title:'Service',filters:{'Product Type':'Service'}},{title:'Active',filters:{Status:'Active'}},{title:'Inactive',filters:{Status:'Inactive'}},{title:'Category new',filters:{Category:'new'}},{title:'Service Active category',filters:{'Product Type':'Service',Status:'Active',Category:'الرئيسيه'}}];
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/filter-'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('filter-screen',{path,contentType:'image/png'});});
for(const scenario of cases)test(`${scenario.title} filter matches baseline and Reset restores all`,async({page},info)=>{
 test.setTimeout(120000);await login(page);const initial=response(page);await page.goto(base);const baseline=await complete(page,await initial);
 const expected=baseline.collection.filter((r:any)=>Object.entries(scenario.filters).every(([key,value])=>key==='Product Type'?Number(r.type)===(value==='Service'?1:0):key==='Status'?Number(r.status)===(value==='Active'?1:0):r.category?.category_translates?.name===value));
 await page.getByRole('button',{name:'Filter',exact:true}).click();for(const [key,value] of Object.entries(scenario.filters)){await page.getByRole('combobox',{name:key,exact:true}).click();const optionName=key==='Category'?new RegExp('^'+value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?: #[0-9]+)?$'):value;await page.getByRole('option',{name:optionName,exact:true}).click();await page.keyboard.press('Escape');}
 const filtered=response(page);await page.getByRole('button',{name:'Submit',exact:true}).click();const result=await complete(page,await filtered);
 await info.attach('filter-reconciliation',{body:JSON.stringify({filters:scenario.filters,expected:expected.map((r:any)=>r.id),actual:result.collection.map((r:any)=>r.id),total:result.meta.total}),contentType:'application/json'});
 expect(result.meta.total).toBe(expected.length);expect(result.collection.map((r:any)=>r.id).sort()).toEqual(expected.map((r:any)=>r.id).sort());
 await expect(page.getByRole('button',{name:`${expected.length}/${expected.length}`,exact:true})).toBeVisible();for(const record of expected)await expect(page.getByRole('row').filter({has:page.getByText(record.product_translates[0].name,{exact:true})})).toBeVisible();
 await page.getByRole('button',{name:'Filter',exact:true}).click();const reset=response(page);await page.getByRole('button',{name:'Reset',exact:true}).click();const restored=await complete(page,await reset);expect(restored.collection.map((r:any)=>r.id).sort()).toEqual(baseline.collection.map((r:any)=>r.id).sort());await expect(page.getByRole('button',{name:`${baseline.meta.total}/${baseline.meta.total}`,exact:true})).toBeVisible();
});
