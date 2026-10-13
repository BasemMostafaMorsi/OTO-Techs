import {test,expect} from '../../../helpers/test';
import {login} from '../../../helpers/auth';
import {mkdir} from 'node:fs/promises';

for(const flow of ['Operating Activities','Investing Activities'])test(`Cash flow retains only ${flow}`,async({page},info)=>{
 test.setTimeout(60000);await login(page);
 const wait=()=>page.waitForResponse(r=>r.request().method()==='GET'&&new URL(r.url()).pathname==='/api/v1.0/finance/accounts'&&new URL(r.url()).searchParams.has('cashflow_id'));
 await page.goto('/en/finance/accounting/accounts');
 await page.getByRole('button',{name:'Filter',exact:true}).click();
 await page.getByRole('combobox',{name:'Cash flow',exact:true}).click();
 await page.getByRole('option',{name:flow,exact:true}).click();
 const pending=wait();await page.getByRole('button',{name:'Submit',exact:true}).click();
 const response=await pending;expect(response.ok()).toBeTruthy();const data=(await response.json()).data;
 await expect(page.getByRole('button',{name:new RegExp('^\\d+/'+data.meta.total+'$')})).toBeVisible();
 await mkdir('artifacts/finance/accounting/accounts/filters',{recursive:true});
 const path=`artifacts/finance/accounting/accounts/filters/cashflow-${flow.replace(/ /g,'-')}.png`;
 await page.screenshot({path,fullPage:true});await info.attach('filter-screen',{path,contentType:'image/png'});
 const mismatches=data.collection.filter((r:any)=>r.cashflow?.name!==flow).map((r:any)=>({id:r.id,name:r.name,cashflow:r.cashflow?.name??null}));
 await info.attach('cashflow-comparison',{body:JSON.stringify({selected:flow,url:response.url(),total:data.meta.total,mismatches},null,2),contentType:'application/json'});
 expect(data.collection.length).toBeGreaterThan(0);
 expect(mismatches,'Every returned account must match the selected Cash flow').toEqual([]);
});
