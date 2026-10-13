import {test,expect} from '../../../helpers/test';
import {login} from '../../../helpers/auth';
import {mkdir} from 'node:fs/promises';
test('Hide zero must preserve a negative nonzero account balance',async({page},info)=>{
 test.setTimeout(60000);await mkdir('artifacts/finance/accounting/accounts/filters',{recursive:true});await login(page);
 const api='/api/v1.0/finance/accounts';
 const wait=()=>{const start=Date.now();return page.waitForResponse(r=>r.request().method()==='GET'&&r.request().timing().startTime>=start&&new URL(r.url()).pathname===api).then(async r=>{expect(r.ok()).toBeTruthy();return {url:r.url(),body:await r.json()};});};
 let pending=wait();await page.goto('/en/finance/accounting/accounts');await pending;
 pending=wait();await page.getByPlaceholder('Search',{exact:true}).fill('Main treasury');const original=await pending;
 const account=original.body.data.collection.find((r:any)=>r.name==='Main treasury');expect(account,'Main treasury baseline record must exist').toBeTruthy();expect(Number(account.balance),'Regression requires an observed negative nonzero balance').toBeLessThan(0);
 const before='artifacts/finance/accounting/accounts/filters/hide-zero-negative-before.png';await page.screenshot({path:before,fullPage:true});await info.attach('before-filter',{path:before,contentType:'image/png'});
 await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByRole('checkbox',{name:'Hide zero values',exact:true}).check();
 pending=wait();await page.getByRole('button',{name:'Submit',exact:true}).click();const filtered=await pending;
 await expect(page.getByRole('button',{name:new RegExp('^\\d+/'+filtered.body.data.meta.total+'$')})).toBeVisible();
 const after='artifacts/finance/accounting/accounts/filters/hide-zero-negative-after.png';await page.screenshot({path:after,fullPage:true});await info.attach('after-filter',{path:after,contentType:'image/png'});
 await info.attach('negative-balance-comparison',{body:JSON.stringify({account:{id:account.id,name:account.name,number:account.account_number,balance:account.balance},request:filtered.url,result:filtered.body.data},null,2),contentType:'application/json'});
 expect(filtered.body.data.collection.some((r:any)=>r.id===account.id),'Hide zero values must retain Main treasury with nonzero negative balance '+account.balance).toBe(true);
});
