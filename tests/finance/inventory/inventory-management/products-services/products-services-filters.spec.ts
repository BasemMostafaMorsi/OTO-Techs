import {test,expect,Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir} from 'node:fs/promises';
const base='/en/finance/inventory/inventory-managment/products-services',api='/api/v1.0/inventory/products',folder='artifacts/finance/inventory/inventory-management/products-services';
const response=(p:Page)=>p.waitForResponse(r=>r.request().method()==='GET'&&new URL(r.url()).pathname===api);
const cases=[{title:'Product',filters:{'Product Type':'Product'}},{title:'Service',filters:{'Product Type':'Service'}},{title:'Active',filters:{Status:'Active'}},{title:'Inactive',filters:{Status:'Inactive'}},{title:'Category new',filters:{Category:'new'}},{title:'Service Active category',filters:{'Product Type':'Service',Status:'Active',Category:'الرئيسيه'}}];
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/filter-'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('filter-screen',{path,contentType:'image/png'});});
for(const scenario of cases)test(`${scenario.title} filter matches baseline and Reset restores all`,async({page},info)=>{
 test.setTimeout(90000);await login(page);const initial=response(page);await page.goto(base);const baseline=(await (await initial).json()).data;
 expect(baseline.meta.last_page,'Complete baseline required; pagination is not covered here').toBe(1);
 const expected=baseline.collection.filter((r:any)=>Object.entries(scenario.filters).every(([key,value])=>key==='Product Type'?Number(r.type)===(value==='Service'?1:0):key==='Status'?Number(r.status)===(value==='Active'?1:0):r.category?.category_translates?.name===value));
 await page.getByRole('button',{name:'Filter',exact:true}).click();for(const [key,value] of Object.entries(scenario.filters)){await page.getByRole('combobox',{name:key,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();await page.keyboard.press('Escape');}
 const filtered=response(page);await page.getByRole('button',{name:'Submit',exact:true}).click();const result=(await (await filtered).json()).data;
 await info.attach('filter-reconciliation',{body:JSON.stringify({filters:scenario.filters,expected:expected.map((r:any)=>r.id),actual:result.collection.map((r:any)=>r.id),total:result.meta.total}),contentType:'application/json'});
 expect(result.meta.total).toBe(expected.length);expect(result.collection.map((r:any)=>r.id).sort()).toEqual(expected.map((r:any)=>r.id).sort());
 await expect(page.getByRole('button',{name:`${expected.length}/${expected.length}`,exact:true})).toBeVisible();for(const record of expected)await expect(page.getByRole('row').filter({has:page.getByText(record.product_translates[0].name,{exact:true})})).toBeVisible();
 await page.getByRole('button',{name:'Filter',exact:true}).click();const reset=response(page);await page.getByRole('button',{name:'Reset',exact:true}).click();const restored=(await (await reset).json()).data;expect(restored.collection.map((r:any)=>r.id).sort()).toEqual(baseline.collection.map((r:any)=>r.id).sort());await expect(page.getByRole('button',{name:`${baseline.meta.total}/${baseline.meta.total}`,exact:true})).toBeVisible();
});
