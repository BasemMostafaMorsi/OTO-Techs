import {openList} from '../../../helpers/open-list';
/// <reference types="node" />
import { test, expect, Page } from '../../../helpers/test';
import { login } from '../../../helpers/auth';
import { mkdir, stat } from 'node:fs/promises';
const base = '/en/contacts/configuration/project-categories', api = '/sales/categories';
const row = (page: Page, id: string) => page.getByRole('row').filter({ has: page.getByText('#' + id, { exact: true }) });
const nameField = (page: Page) => page.getByRole('dialog').getByRole('textbox', { name: 'Category Name *', exact: true });
async function open(page: Page) { return openList(page, base, api); }
async function search(page: Page, value: string) {
    const p = page.waitForResponse(r => r.request().method() === 'GET' && r.url().includes(api + '?') && r.url().includes(encodeURIComponent(value))); await page.getByPlaceholder('Search', { exact: true }).fill(value); expect((await p).ok()).toBeTruthy();
}
async function select(page: Page, field: string, value: string) { await page.getByRole('combobox', { name: new RegExp('^' + field) }).click(); await page.getByRole('option', { name: value, exact: true }).click(); }
async function create(page: Page, name: string) {
    await open(page); await page.getByRole('button', { name: 'Create', exact: true }).click(); await nameField(page).fill(name); await page.getByRole('dialog').locator('[name=note]').fill('QA description ' + name);
    const p = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(api)); await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click(); const response = await p, body = await response.json();
    await test.info().attach('create-category', { body: JSON.stringify({ status: response.status(), body }), contentType: 'application/json' }); expect(response.ok(), body.message).toBeTruthy(); expect(body.data?.id).toBeTruthy(); await expect(page.getByRole('dialog')).toBeHidden(); return String(body.data.id);
}
async function locate(page: Page, id: string, name: string) { await open(page); await search(page, name); await expect(row(page, id)).toContainText(name); return row(page, id); }
async function edit(page: Page, id: string, name: string) { await (await locate(page, id, name)).getByRole('button', { name: 'more', exact: true }).click(); await page.getByRole('menuitem', { name: 'Edit', exact: true }).click(); await expect(nameField(page)).toHaveValue(name); }
async function cleanup(page: Page, id: string, name: string) {
    const path = test.info().outputPath(`category-${id}-before-cleanup.png`); await page.screenshot({ path, fullPage: true }); await test.info().attach('before-cleanup', { path, contentType: 'image/png' });
    await (await locate(page, id, name)).locator('button:has(i.tabler-trash)').click(); const p = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().endsWith(api + '/' + id)); await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click(); expect((await p).ok()).toBeTruthy(); await expect(row(page, id)).toHaveCount(0);
}
async function complete(page: Page) {
    const counter = page.getByRole('button', { name: /^\d+\/\d+$/ }), counts = async () => (await counter.innerText()).split('/').map(Number); const total = (await counts())[1];
    for (let i = 0; (await counts())[0] < total && i < 100; i++) { const previous = (await counts())[0]; await page.getByRole('table').evaluate(table => { let p = table.parentElement; while (p && p.scrollHeight <= p.clientHeight) p = p.parentElement; const e = p || document.scrollingElement; if (e) e.scrollTop = e.scrollHeight; }); await expect.poll(async () => (await counts())[0]).toBeGreaterThan(previous); }
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(total); return total;
}
test.beforeEach(async ({ page }) => { test.setTimeout(150_000); await mkdir('artifacts/business-partners/contact-settings/project-categories', { recursive: true }); await login(page); });
test.afterEach(async ({ page }, info) => { const path = `artifacts/business-partners/contact-settings/project-categories/${info.title.replace(/[^a-z0-9]+/gi, '-')}.png`; await page.screenshot({ path, fullPage: true }); await info.attach('category-screen', { path, contentType: 'image/png' }); });



test('required name prevents submission',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Create',exact:true}).click();
 let writes=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith(api))writes++;});
 await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();
 await expect(page.getByText('Name is required',{exact:true})).toBeVisible();expect(writes).toBe(0);
});
test('create edit and reopen persisted values',async({page})=>{
 const name='PCAT-E2E-LIFE-'+Date.now();let id='';
 try{id=await create(page,name);await edit(page,id,name);
 await expect(page.getByRole('dialog').locator('[name=note]')).toHaveValue('QA description '+name);
 await nameField(page).fill(name+'-EDITED');await page.getByRole('dialog').locator('[name=note]').fill('Edited description');
 const p=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith(api+'/'+id));
 await page.getByRole('dialog').getByRole('button',{name:'Submit',exact:true}).click();const r=await p;
 await test.info().attach('update-response',{body:JSON.stringify(await r.json()),contentType:'application/json'});expect(r.ok()).toBeTruthy();
 await edit(page,id,name+'-EDITED');await expect(page.getByRole('dialog').locator('[name=note]')).toHaveValue('Edited description');
 }finally{if(id)await cleanup(page,id,name);}
});
for(const action of ['eye','Preview'])test(action+' opens selected record',async({page})=>{
 const name='PCAT-E2E-VIEW-'+Date.now();let id='';
 try{id=await create(page,name);const item=await locate(page,id,name);
 if(action==='eye')await item.locator('button:has(i.tabler-eye)').click();
 else{await item.getByRole('button',{name:'more',exact:true}).click();await page.getByRole('menuitem',{name:'Preview',exact:true}).click();}
 await expect(nameField(page)).toHaveValue(name);await expect(page.getByRole('dialog').locator('[name=note]')).toHaveValue('QA description '+name);
 }finally{if(id)await cleanup(page,id,name);}
});
test('cancel create leaves no record',async({page})=>{
 const name='PCAT-E2E-CANCEL-'+Date.now();await open(page);await page.getByRole('button',{name:'Create',exact:true}).click();await nameField(page).fill(name);
 await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await search(page,name);await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
});
test('cancel edit and delete preserve record',async({page})=>{
 const name='PCAT-E2E-KEEP-'+Date.now();let id='';
 try{id=await create(page,name);await edit(page,id,name);await nameField(page).fill(name+'-UNSAVED');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
 await edit(page,id,name);await expect(nameField(page)).toHaveValue(name);await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
 await row(page,id).locator('button:has(i.tabler-trash)').click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await locate(page,id,name);
 }finally{if(id)await cleanup(page,id,name);}
});
async function changeDialog(page:Page,id:string,name:string,status:string){
 await (await locate(page,id,name)).getByRole('button',{name:'more',exact:true}).click();const loaded=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().endsWith(api+'/'+id)); await page.getByRole('menuitem',{name:'Status',exact:true}).click(); const response=await loaded; expect(response.ok()).toBeTruthy(); await response.finished(); await page.waitForTimeout(5000); // Slow-user regression: allow dialog form initialization to settle.
 await expect(page.getByRole('dialog').getByRole('combobox')).toContainText(status==='Inactive'?'Active':'Inactive');
 await page.getByRole('dialog').getByRole('combobox').click();await page.getByRole('option',{name:status,exact:true}).click();
}
test('confirmed status persists across reload',async({page})=>{
 const name='PCAT-E2E-STATUS-'+Date.now();let id='';
 try{id=await create(page,name);for(const status of ['Inactive','Active']){
 await changeDialog(page,id,name,status);await page.getByRole('dialog').getByRole('button',{name:'Change',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeHidden();await expect(row(page,id).getByText(status,{exact:true})).toBeVisible();
 await expect((await locate(page,id,name)).getByText(status,{exact:true})).toBeVisible();
 }}finally{if(id)await cleanup(page,id,name);}
});
test('cancel status preserves Active',async({page})=>{
 const name='PCAT-E2E-STATUS-CANCEL-'+Date.now();let id='';
 try{id=await create(page,name);await changeDialog(page,id,name,'Inactive');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
 await expect((await locate(page,id,name)).getByText('Active',{exact:true})).toBeVisible();
 }finally{if(id)await cleanup(page,id,name);}
});
test('list search reset and download',async({page})=>{
 await open(page);const total=await complete(page);
 await search(page,'PCAT-NOT-EXISTS-'+Date.now());await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
 await search(page,'');await expect(page.getByRole('button',{name:new RegExp('^\\d+/'+total+'$')})).toBeVisible();
 const p=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const d=await p;
 expect(await d.failure()).toBeNull();const path=test.info().outputPath(d.suggestedFilename());await d.saveAs(path);expect((await stat(path)).size).toBeGreaterThan(0);await test.info().attach('list-download',{path});
});



