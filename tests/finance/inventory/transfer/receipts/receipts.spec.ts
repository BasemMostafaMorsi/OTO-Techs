import {inventoryInput} from '../../../helpers/inventory-columns';
import {inventorySettings} from '../../../helpers/inventory-settings';
let currentSettings:Record<string,string>;
import {test,expect,Page} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
import {mkdir} from 'node:fs/promises';
const base='/en/finance/inventory/transfer/receipts',folder='artifacts/finance/inventory/transfer/receipts';
const field=(p:Page,name:string)=>p.getByRole('textbox',{name,exact:true});
const lines=(p:Page)=>p.getByRole('row').filter({has:p.getByRole('combobox',{name:'Choose product',exact:true})});
async function create(p:Page){await p.getByRole('button',{name:'Create',exact:true}).click();await expect(field(p,'Date *')).toBeVisible();await expect(p.getByRole('combobox',{name:'Warehouse name *',exact:true})).not.toHaveValue('');}
test.beforeEach(async({page})=>{test.setTimeout(90000);await login(page);currentSettings=await inventorySettings(page, "Receipts");await page.goto(base);await expect(page.getByRole('button',{name:'more',exact:true}).first()).toBeVisible();});
test.afterEach(async({page},info)=>{await mkdir(folder,{recursive:true});const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('inventory-receipt-screen',{path,contentType:'image/png'});});

test('blank draft validates counterparty and item fields',async({page})=>{await create(page);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('menuitem',{name:'Save as Draft',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('combobox',{name:'Customer / Supplier name *',exact:true})).toHaveAttribute('aria-invalid','true');for(const message of ['Product name is required','Quantity is required',...(currentSettings.hide_prices_on_platform==='1'?[]:['Unit price is required'])])await expect(page.getByText(message,{exact:true})).toBeVisible();});
test('receipt defaults and save actions are available',async({page})=>{await create(page);await expect(field(page,'Date *')).toBeEnabled({enabled:currentSettings.can_change_date==='1'});await expect(field(page,'Date *')).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);await expect(page.getByRole('combobox',{name:'Type *',exact:true})).toHaveValue('Customer');await expect(lines(page)).toHaveCount(1);await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('menuitem')).toHaveText(['Validate','Save as Draft']);await page.keyboard.press('Escape');});
test('add and remove unsaved receipt lines',async({page})=>{await create(page);await page.getByRole('button',{name:'Add new',exact:true}).click();await expect(lines(page)).toHaveCount(2);await lines(page).last().getByRole('cell').last().getByRole('button').click();await expect(lines(page)).toHaveCount(1);});
test('quantity times unit price produces line total',async({page},info)=>{
 test.setTimeout(150000);
 const original=await inventorySettings(page,'Receipts');
 async function visibility(prices:boolean,total:boolean){
  await inventorySettings(page,'Receipts');const panel=page.getByRole('tabpanel',{name:'Receipts',exact:true});
  await panel.getByRole('checkbox',{name:'On platform',exact:true}).nth(0).setChecked(prices);
  await panel.getByRole('checkbox',{name:'On platform',exact:true}).nth(1).setChecked(total);
  const pending=page.waitForResponse(r=>r.url().includes('/inventory/inventory_special_fields')&&['POST','PUT','PATCH'].includes(r.request().method()));
  await panel.getByRole('button',{name:'Save',exact:true}).click();expect((await pending).ok()).toBeTruthy();
 }
 let failure:unknown;
 try{
  await visibility(false,false);
  const visible=await inventorySettings(page,'Receipts');expect(visible.hide_prices_on_platform).toBe('0');expect(visible.hide_total_value_on_platform).toBe('0');
  await page.goto(base);await create(page);
  const product=page.getByRole('combobox',{name:'Choose product',exact:true});await product.fill('gold');await page.getByRole('option').filter({hasText:'P-0004'}).click();
  const table=page.getByRole('table'),quantity=await inventoryInput(table,'Quantity'),price=await inventoryInput(table,'Unit price'),total=await inventoryInput(table,'Total');
  await expect.poll(async()=>Number(await price.inputValue())).toBeGreaterThan(0);
  const expected=Number(await price.inputValue())*2;
  await quantity.fill('2');await quantity.blur();await expect.poll(async()=>Number(await total.inputValue())).toBeCloseTo(expected,2);
  await info.attach('receipt-calculation',{body:JSON.stringify({quantity:2,price:await price.inputValue(),total:await total.inputValue()}),contentType:'application/json'});
  await info.attach('receipt-calculation-screen',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 }catch(error){failure=error;throw error;}
 finally{
  try{await visibility(original.hide_prices_on_platform==='1',original.hide_total_value_on_platform==='1');expect(await inventorySettings(page,'Receipts')).toEqual(original);}
  catch(error){if(!failure)throw error;await info.attach('settings-restore-error',{body:String(error),contentType:'text/plain'});}
 }
});
test('unsaved reference notes and added line are discarded',async({page})=>{await create(page);await field(page,'Ref No').fill('918273');await field(page,'Notes').fill('Receipt unsaved check');await page.getByRole('button',{name:'Add new',exact:true}).click();await page.goto(base);await create(page);await expect(field(page,'Ref No')).toBeEmpty();await expect(field(page,'Notes')).toBeEmpty();await expect(lines(page)).toHaveCount(1);});
test('no match search and clear restore receipt rows',async({page})=>{await page.getByPlaceholder('Search',{exact:true}).fill('RECEIPT-NONE-'+Date.now());await expect(page.getByRole('button',{name:'0/0',exact:true})).toBeVisible();await page.getByPlaceholder('Search',{exact:true}).fill('');await expect(page.getByRole('button',{name:'more',exact:true}).first()).toBeVisible();});

