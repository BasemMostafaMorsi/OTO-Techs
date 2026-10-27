import {expect, Page} from '../../helpers/test';

export async function inventorySettings(page:Page, module:string) {
  const tabs=['Receipts','Deliveries','Internal transfer','Manufacturing','Scrap','Stocktaking'];
  const responseFor=(id:number)=>page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/inventory/inventory_special_fields')&&r.request().method()==='GET'&&new URL(r.url()).searchParams.get('module_id')===String(id));
  const initial=responseFor(51);
  await page.goto('/en/finance/inventory/configuration/setting');
  let response=await initial;
  await expect(page.getByRole('tabpanel',{name:'Receipts',exact:true}).getByRole('button',{name:'Save',exact:true})).toBeEnabled();
  if(module!=='Receipts'){
    const pending=responseFor(51+tabs.indexOf(module));
    await page.getByRole('tab',{name:module,exact:true}).click();response=await pending;
  }
  expect(response.ok()).toBeTruthy();
  const data=await response.json();
  const settings:Record<string,string>=Object.fromEntries(data.data.collection[0].settings.map((s:any)=>[s.key,String(s.value)]));
  return settings;
}
