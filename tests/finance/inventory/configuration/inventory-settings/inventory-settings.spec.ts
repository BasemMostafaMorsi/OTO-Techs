import {test, expect, Page, Locator} from '../../../../helpers/test';
import {login} from '../../../../helpers/auth';
const route='/en/finance/inventory/configuration/setting';
const api='/inventory/inventory_special_fields';
const tabs=['Receipts','Deliveries','Internal transfer','Manufacturing','Scrap','Stocktaking'];
const folder='artifacts/finance/inventory/configuration/inventory-settings';
const fieldRow=(panel:Locator,name:string)=>panel.getByRole('cell',{name,exact:true}).locator('..');
async function fieldForm(page:Page,name:string,type:string,required:string){
  const dialog=page.getByRole('dialog');await dialog.getByRole('textbox').fill(name);
  for(const [index,value] of [type,required].entries()){
    const control=dialog.getByRole('combobox').nth(index);
    if(await control.isDisabled())await expect(control).toHaveValue(value);
    else{await control.click();await page.getByRole('option',{name:value,exact:true}).click();}
  }
  await dialog.getByRole('button',{name:'Submit',exact:true}).click();await expect(dialog).toBeHidden();
}
async function open(page:Page,name:string){
  const responseFor=(id:number)=>page.waitForResponse(r=>new URL(r.url()).pathname.endsWith(api)&&r.request().method()==='GET'&&new URL(r.url()).searchParams.get('module_id')===String(id),{timeout:30000});
  const initial=responseFor(51);initial.catch(()=>{});
  await page.goto(route);
  expect((await initial).ok()).toBeTruthy();
  await expect(page.getByRole('tabpanel',{name:'Receipts',exact:true}).getByRole('button',{name:'Save',exact:true})).toBeEnabled();
  if(name!=='Receipts'){
    const pending=responseFor(51+tabs.indexOf(name));pending.catch(()=>{});
    await page.getByRole('tab',{name,exact:true}).click();
    expect((await pending).ok()).toBeTruthy();
  }
  const panel=page.getByRole('tabpanel',{name,exact:true});
  await expect(panel.getByRole('button',{name:'Save',exact:true})).toBeEnabled();
  await expect(panel.getByRole('checkbox')).toHaveCount(['Receipts','Deliveries'].includes(name)?6:5);
  return panel;
}
async function state(panel:Locator){
  return {checks:await panel.getByRole('checkbox').evaluateAll(nodes=>nodes.map(n=>(n as HTMLInputElement).checked)),
    radios:await panel.getByRole('radio').evaluateAll(nodes=>nodes.map(n=>(n as HTMLInputElement).checked))};
}
async function apply(panel:Locator,value:Awaited<ReturnType<typeof state>>){
  const index=value.radios.indexOf(true);if(index>=0)await panel.getByRole('radio').nth(index).check();
  for(let i=0;i<value.checks.length;i++)await panel.getByRole('checkbox').nth(i).setChecked(value.checks[i]);
}
async function save(page:Page,panel:Locator){
  const pending=page.waitForResponse(r=>new URL(r.url()).pathname.includes(api)&&['POST','PUT','PATCH'].includes(r.request().method()));
  await panel.getByRole('button',{name:'Save',exact:true}).click();
  const response=await pending;const body=await response.json();
  await test.info().attach('settings-save-response',{body:JSON.stringify({status:response.status(),body}),contentType:'application/json'});
  expect(response.ok()).toBeTruthy();expect(body.is_success).toBe(true);
  await expect(panel.getByRole('button',{name:'Save',exact:true})).toBeEnabled();
}
test.beforeEach(async({page})=>{test.setTimeout(120000);page.setDefaultTimeout(30000);await login(page);});
test.afterEach(async({page},info)=>{
  const screenshot=await page.screenshot({fullPage:true});
  await info.attach('inventory-settings-screen',{body:screenshot,contentType:'image/png'});
});
for(const name of tabs){
  test(`${name}: all settings save, reload and restore original values`,async({page},info)=>{
    let panel=await open(page,name);const before=await state(panel);
    await info.attach('original-settings',{body:JSON.stringify(before),contentType:'application/json'});
    const changed={checks:before.checks.map(v=>!v),radios:before.radios};
    let primary:unknown;
    try{
      await apply(panel,changed);await expect.poll(()=>state(panel)).toEqual(changed);
      await save(page,panel);panel=await open(page,name);
      await expect.poll(()=>state(panel),{message:'Saved inventory settings must persist after reloading'}).toEqual(changed);
      await info.attach('saved-settings-screen',{body:await page.screenshot(),contentType:'image/png'});
    }catch(error){primary=error;throw error;}
    finally{
      try{panel=await open(page,name);await apply(panel,before);await save(page,panel);panel=await open(page,name);await expect.poll(()=>state(panel)).toEqual(before);}
      catch(error){await info.attach('restore-error',{body:String(error),contentType:'text/plain'});if(!primary)throw error;}
    }
  });
  test(`${name}: unsaved options and cancelled special field do not persist; required fields validate`,async({page})=>{
    let panel=await open(page,name);const before=await state(panel);const table=await panel.getByRole('table').innerText();
    await panel.getByRole('checkbox').first().setChecked(!before.checks[0]);
    panel=await open(page,name);await expect.poll(()=>state(panel)).toEqual(before);
    await panel.getByRole('button',{name:'Add',exact:true}).click();const dialog=page.getByRole('dialog');
    await dialog.getByRole('button',{name:'Submit',exact:true}).click();
    for(const message of ['Name field is required','Type field is required','Required field is required'])await expect(dialog.getByText(message,{exact:true})).toBeVisible();
    await dialog.getByRole('textbox').fill(`INV-SET-CANCEL-${Date.now()}`);
    await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toBeHidden();
    panel=await open(page,name);await expect.poll(()=>panel.getByRole('table').innerText()).toBe(table);await expect.poll(()=>state(panel)).toEqual(before);
  });
}
for(const name of ['Deliveries','Internal transfer','Scrap'])test(`${name}: price modes are exclusive and selected mode persists`,async({page},info)=>{
  let panel=await open(page,name);const before=await state(panel);let primary:unknown;
  try{
    await expect(panel.getByRole('radio')).toHaveCount(2);
    for(const index of [0,1]){
      await panel.getByRole('radio').nth(index).check();
      await expect(panel.getByRole('radio').nth(index)).toBeChecked();await expect(panel.getByRole('radio').nth(1-index)).not.toBeChecked();
      // Changing price mode may intentionally reset dependent checkbox values.
      const selected=await state(panel);await save(page,panel);panel=await open(page,name);
      await expect.poll(()=>state(panel)).toEqual(selected);
    }
  }catch(error){primary=error;throw error;}
  finally{try{panel=await open(page,name);await apply(panel,before);await save(page,panel);panel=await open(page,name);await expect.poll(()=>state(panel)).toEqual(before);}
    catch(error){await info.attach('restore-error',{body:String(error),contentType:'text/plain'});if(!primary)throw error;}}
});

for(const [index,name] of tabs.entries())test(`${name}: special field create edit discard deletion and saved deletion`,async({page},info)=>{
  test.setTimeout(180000);
  const owned=`INV-SET-E2E-${index}-${Date.now()}`,edited=owned+'-edited';
  const type=['Text','Number','Date'][index%3];
  let panel=await open(page,name);const options=await state(panel);let primary:unknown;
  try{
    await panel.getByRole('button',{name:'Add',exact:true}).click();await fieldForm(page,owned,type,'No');
    await expect(fieldRow(panel,owned)).toHaveCount(1);await save(page,panel);panel=await open(page,name);
    await expect(fieldRow(panel,owned).getByRole('cell').nth(1)).toHaveText(type.toLowerCase());
    await expect(fieldRow(panel,owned).getByRole('cell').nth(2)).toHaveText('No');
    await fieldRow(panel,owned).getByRole('button').filter({has:page.locator('.tabler-edit')}).click();
    await page.getByRole('dialog').getByRole('textbox').fill(edited);
    await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
    await expect(fieldRow(panel,owned)).toHaveCount(1);await expect(fieldRow(panel,edited)).toHaveCount(0);
    await fieldRow(panel,owned).getByRole('button').filter({has:page.locator('.tabler-edit')}).click();
    await fieldForm(page,edited,type,'Yes');await save(page,panel);panel=await open(page,name);
    await expect(fieldRow(panel,owned)).toHaveCount(0);await expect(fieldRow(panel,edited).getByRole('cell').nth(2)).toHaveText('Yes');
    await info.attach('persisted-special-field',{body:await page.screenshot(),contentType:'image/png'});
    await fieldRow(panel,edited).getByRole('button').filter({has:page.locator('.tabler-trash')}).click();
    await expect(fieldRow(panel,edited)).toHaveCount(0);
    panel=await open(page,name);await expect(fieldRow(panel,edited)).toHaveCount(1);
    await fieldRow(panel,edited).getByRole('button').filter({has:page.locator('.tabler-trash')}).click();
    await save(page,panel);panel=await open(page,name);await expect(fieldRow(panel,edited)).toHaveCount(0);
    await expect.poll(()=>state(panel)).toEqual(options);
  }catch(error){primary=error;throw error;}
  finally{
    try{
      panel=await open(page,name);let removed=false;
      for(const value of [owned,edited])if(await fieldRow(panel,value).count()){
        await expect(fieldRow(panel,value)).toHaveCount(1);
        await fieldRow(panel,value).getByRole('button').filter({has:page.locator('.tabler-trash')}).click();removed=true;
      }
      if(removed){await save(page,panel);panel=await open(page,name);}
      for(const value of [owned,edited])await expect(fieldRow(panel,value)).toHaveCount(0);
    }catch(error){await info.attach('special-field-cleanup-error',{body:String(error),contentType:'text/plain'});if(!primary)throw error;}
  }
});

test('Receipts: price visibility and date editing follow saved settings in create form',async({page},info)=>{
  test.setTimeout(180000);
  let panel=await open(page,'Receipts');const original=await state(panel);let primary:unknown;
  try{
    for(const hide of [false,true]){
      panel=await open(page,'Receipts');
      const value={checks:[...original.checks],radios:original.radios};value.checks[0]=hide;value.checks[value.checks.length-1]=!hide;
      await apply(panel,value);await save(page,panel);
      await page.goto('/en/finance/inventory/transfer/receipts');await page.getByRole('button',{name:'Create',exact:true}).click();
      const date=page.getByRole('textbox',{name:'Date *',exact:true});await expect(date).toBeVisible();
      const price=page.getByRole('columnheader',{name:/unit price/i});
      if(hide){await expect(price).toHaveCount(0);await expect(date).toBeDisabled();}
      else{await expect(price).toBeVisible();await expect(date).toBeEnabled();}
      await info.attach(`receipt-form-hide-prices-${hide}`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    }
  }catch(error){primary=error;throw error;}
  finally{try{panel=await open(page,'Receipts');await apply(panel,original);await save(page,panel);panel=await open(page,'Receipts');await expect.poll(()=>state(panel)).toEqual(original);}
    catch(error){await info.attach('restore-error',{body:String(error),contentType:'text/plain'});if(!primary)throw error;}}
});

