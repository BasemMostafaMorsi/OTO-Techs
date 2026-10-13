import {test,expect,Page} from '../../helpers/test';
import {login} from '../../helpers/auth';
import {mkdir,writeFile} from 'node:fs/promises';
type Row=Record<string,any>;
type Choice={field:string;value?:string};
type Scenario={name:string;choices:Choice[];matches:(r:Row,today:string)=>boolean;empty?:boolean};
const creator=(r:Row)=>r.createdBy?.name??r.created_by?.name??'';
const tags=(r:Row)=>Array.isArray(r.tags)?r.tags.map((x:any)=>typeof x==='string'?x:x.name):[];
export function accountingFilters(account:boolean){
 const screen=account?'accounts':'cost-centers',api='/api/v1.0/finance/'+(account?'accounts':'cost_centers'),base='/en/finance/accounting/'+screen;
 const folder='artifacts/finance/accounting/'+screen+'/filters';
 const parentName=account?'Cash':'CC-E2E-INSPECT-20261008',parentOption=account?'Cash 1111':'CC-E2E-INSPECT-20261008 987654',parentField=account?'Main account':'Main cost center';
 const name=(r:Row)=>r.name??r.cost_center_name;
 let baseline:Row[]=[];let seeds:{id:string;name:string}[]=[];
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const list=(p:Page,predicate:(u:URL)=>boolean=()=>true)=>{const started=Date.now();return p.waitForResponse(r=>r.request().method()==='GET'&&r.request().timing().startTime>=started&&new URL(r.url()).pathname===api&&predicate(new URL(r.url()))).then(async r=>{expect(r.ok()).toBeTruthy();return {url:r.url(),data:(await r.json()).data};});};
 async function open(p:Page){const pending=list(p,u=>u.searchParams.get('page')==='1'&&!u.searchParams.get('search'));await p.goto(base);const initial=await pending;await expect(p.getByRole('button',{name:new RegExp('^\\d+/'+initial.data.meta.total+'$')})).toBeVisible();}
 async function select(p:Page,field:string,value:string){await p.getByRole('combobox',{name:field,exact:true}).click();await p.getByRole('option',{name:value,exact:true}).click();}
 const captured=new WeakMap<Page,{url:string;data:any}[]>();
 function watch(p:Page){if(captured.has(p))return;captured.set(p,[]);p.on('response',r=>{if(r.ok()&&r.request().method()==='GET'&&new URL(r.url()).pathname===api)r.json().then(body=>captured.get(p)!.push({url:r.url(),data:body.data})).catch(()=>{});});}
 const signature=(url:string)=>{const u=new URL(url);u.searchParams.delete('page');return [...u.searchParams.entries()].sort().map(x=>x.join('=')).join('&');};
 async function loadAll(p:Page,first:{url:string;data:any}){
  const total=first.data.meta.total,key=signature(first.url);
  const loaded=()=>{const pages=new Map<number,Row[]>();pages.set(first.data.meta.current_page,first.data.collection);for(const item of captured.get(p)||[])if(signature(item.url)===key)pages.set(item.data.meta.current_page,item.data.collection);return [...pages.entries()].sort((a,b)=>a[0]-b[0]).flatMap(x=>x[1]);};
  for(let i=0;loaded().length<total&&i<150;i++){
   const previous=loaded().length;await expect.poll(()=>p.locator('tbody tr').count()).toBeGreaterThanOrEqual(previous);
   await p.getByRole('table').evaluate(table=>{let el=table.parentElement;while(el&&el.scrollHeight<=el.clientHeight)el=el.parentElement;const target=el||document.scrollingElement;if(target){target.scrollTop=Math.max(0,target.scrollHeight-target.clientHeight-40);target.scrollTop=target.scrollHeight;}});
   await expect.poll(()=>loaded().length,{timeout:20000,message:'Infinite scroll must load additional API records'}).toBeGreaterThan(previous);
  }
  const rows=loaded();expect(rows).toHaveLength(total);expect(new Set(rows.map(r=>r.id)).size).toBe(total);
  const trs=p.locator('tbody tr').filter({has:p.locator('input.MuiSwitch-input')});await expect(trs).toHaveCount(total); if(total===0)await expect(p.getByRole('button',{name:'0/0',exact:true})).toBeVisible();
  const visible=await trs.evaluateAll(es=>es.map(e=>{const cells=e.querySelectorAll('td');return {name:cells[1]?.querySelector('p')?.textContent?.trim(),number:cells[1]?.querySelectorAll('p')[1]?.textContent?.trim()||'',status:(e.querySelector('input.MuiSwitch-input') as HTMLInputElement)?.checked};}));
  expect(visible).toEqual(rows.map(r=>({name:name(r),number:r.account_number==null?'':String(r.account_number),status:Boolean(Number(r.status))})));
  return rows;
 } async function unfiltered(p:Page){watch(p);captured.set(p,[]);const pending=list(p,u=>u.searchParams.get('page')==='1'&&!u.searchParams.get('search')&&!u.searchParams.get('status'));await p.goto(base);return loadAll(p,await pending);}
 async function find(p:Page,n:string){await open(p);const pending=list(p,u=>u.searchParams.get('search')===n);await p.getByPlaceholder('Search',{exact:true}).fill(n);await pending;const row=p.getByRole('row').filter({has:p.getByText(n,{exact:true})});await expect(row).toBeVisible();return row;}
 async function seed(p:Page,active:boolean){
  await open(p);await p.getByRole('button',{name:'Create',exact:true}).click();const d=p.getByRole('dialog');
  if(account){
   await d.getByPlaceholder('Account main',{exact:true}).click();await p.getByRole('option',{name:parentOption,exact:true}).click();await expect(d.locator('[name=single_account_number]')).not.toHaveValue('');
   await d.getByPlaceholder('Debit / Credit',{exact:true}).click();await p.getByRole('option',{name:'Debit',exact:true}).click();
   await d.getByPlaceholder('Financial Statement Guidance',{exact:true}).click();await p.getByRole('option',{name:'Cash In Hand',exact:true}).click();
   if(!active){await d.getByPlaceholder('Currency',{exact:true}).click();await p.getByRole('option',{name:'EGP',exact:true}).click();} await d.getByPlaceholder('Cashflow guidance',{exact:true}).click();await p.getByRole('option',{name:active?'Operating Activities':'Investing Activities',exact:true}).click();
  }else{
   await select(p,'Cost center type','Secondary');await select(p,'Main cost center *',parentOption);await expect(d.getByPlaceholder('0',{exact:true})).toHaveValue('987654');
  }
  const n=(account?'ACC':'CC')+'-FILTER-E2E-'+Date.now();
  await d.locator('[name=single_account_number]').fill(String(Date.now()).slice(-7));await d.locator('[name=name]').fill(n);
  await d.getByRole('combobox',{name:'',exact:true}).click();await p.getByRole('option',{name:active?'tag1':'1200',exact:true}).click();
  const pending=p.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname===api).then(async r=>({ok:r.ok(),body:await r.json()}));
  await d.getByRole('button',{name:'Submit',exact:true}).click();const result=await pending;
  if(result.body.data?.id){seeds.push({id:String(result.body.data.id),name:n});await writeFile(folder+'/fixtures.json',JSON.stringify(seeds,null,2));}
  expect(result.ok,result.body.message).toBeTruthy();await expect(d).toBeHidden();
  if(!active){const row=await find(p,n);await row.locator('input.MuiSwitch-input').click();await expect(row.locator('input.MuiSwitch-input')).not.toBeChecked();}
 }
 test.beforeAll(async({browser,baseURL})=>{
  test.setTimeout(240000);await mkdir(folder,{recursive:true});const p=await browser.newPage({baseURL});try{await login(p);await seed(p,true);await seed(p,false);baseline=await unfiltered(p);await writeFile(folder+'/baseline.json',JSON.stringify(baseline.map(r=>({id:r.id,name:name(r),number:r.account_number,balance:r.balance??r.value,status:r.status,created_at:r.created_at,parent:r.parent?.name??r.parent?.cost_center_name,tags:r.tags})),null,2));}finally{await p.close();}
 });
 test.afterAll(async({browser,baseURL})=>{
  test.setTimeout(180000);if(!seeds.length)return;const p=await browser.newPage({baseURL});const deleted:string[]=[];
  try{await login(p);for(const s of seeds.slice().reverse()){const row=await find(p,s.name);await row.getByRole('button',{name:'more',exact:true}).click();await p.getByRole('menuitem',{name:'Delete',exact:true}).click();const pending=p.waitForResponse(r=>r.request().method()==='DELETE'&&new URL(r.url()).pathname===api+'/'+s.id);await p.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();expect((await pending).ok()).toBeTruthy();await expect(row).toHaveCount(0);deleted.push(s.id);await writeFile(folder+'/cleanup.json',JSON.stringify({deleted},null,2));}}finally{await p.close();}
 });
 test.beforeEach(async({page})=>{test.setTimeout(180000);await login(page);watch(page);await open(page);});
 test.afterEach(async({page},info)=>{const path=folder+'/'+info.title.replace(/[^a-z0-9]+/gi,'-')+'.png';await page.screenshot({path,fullPage:true});await info.attach('filter-screen',{path,contentType:'image/png'});});
 const cases:Scenario[]=[
  {name:'Creator',choices:[{field:'Creator',value:'basem mostafa'}],matches:r=>creator(r)==='basem mostafa'},
  {name:'Creation date same day',choices:[{field:'Creation date',value:'today'}],matches:(r,t)=>r.created_at.slice(0,10)===t},
  {name:parentField,choices:[{field:parentField,value:parentOption}],matches:r=>(r.parent?.name??r.parent?.cost_center_name)===parentName},
  ...['Active','Inactive'].map(status=>({name:'Status '+status,choices:[{field:'Status',value:status}],matches:(r:Row)=>Number(r.status)===(status==='Active'?1:0)})),
  ...['tag1','1200'].map(tag=>({name:'Tags '+tag,choices:[{field:'Tags',value:tag}],matches:(r:Row)=>tags(r).includes(tag)})),
  {name:'Hide zero values',choices:[{field:'Hide zero values'}],matches:r=>Number(account?r.balance:r.value)!==0,empty:!account},
  {name:'Combined Creator parent Status Tags',choices:[{field:'Creator',value:'basem mostafa'},{field:parentField,value:parentOption},{field:'Status',value:'Active'},{field:'Tags',value:'tag1'}],matches:r=>creator(r)==='basem mostafa'&&(r.parent?.name??r.parent?.cost_center_name)===parentName&&Number(r.status)===1&&tags(r).includes('tag1')},
 ];
 if(account)cases.push(
  ...['Credit','Debit'].map(type=>({name:'Type '+type,choices:[{field:'Type',value:type}],matches:(r:Row)=>Number(r.account_type_id)===(type==='Credit'?1:2)})),
  ...['1','5'].map(level=>({name:'Level '+level,choices:[{field:'Level',value:level}],matches:(r:Row)=>Number(r.level)===Number(level)})),
  ...['SAR','EGP'].map(currency=>({name:'Currency '+currency,choices:[{field:'Currency',value:currency}],matches:(r:Row)=>r.currency?.name===currency})),
  {name:'Financial guidance',choices:[{field:'Financial guidance',value:'Cash In Hand'}],matches:r=>r.financial_statement_guidance?.name==='Cash In Hand'},
  ...['Operating Activities','Investing Activities'].map(flow=>({name:'Cash flow '+flow,choices:[{field:'Cash flow',value:flow}],matches:(r:Row)=>r.cashflow?.name===flow})),
 );
 for(const scenario of cases)test(scenario.name+' matches all pages and Reset',async({page},info)=>{
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  for(const choice of scenario.choices){
   if(choice.field==='Hide zero values')await page.getByRole('checkbox',{name:'Hide zero values',exact:true}).check();
   else if(choice.field==='Creation date'){
    await page.getByRole('textbox',{name:'Creation date',exact:true}).click();
    const date=new Date(today+'T12:00:00Z'),month=date.toLocaleDateString('en-US',{month:'long',timeZone:'UTC'}),day=date.getUTCDate(),year=date.getUTCFullYear();
    const option=page.getByRole('option',{name:new RegExp('^Choose .*'+month+' '+day+'(?:st|nd|rd|th), '+year+'$')});await option.click();await option.click();
   }else await select(page,choice.field,choice.value!);
  }
  captured.set(page,[]);const pending=list(page);await page.getByRole('button',{name:'Submit',exact:true}).click();const first=await pending;const actual=await loadAll(page,first),expected=baseline.filter(r=>scenario.matches(r,today));
  await info.attach('filter-comparison',{body:JSON.stringify({scenario:scenario.name,choices:scenario.choices,url:first.url,baselineCount:baseline.length,expectedIds:expected.map(r=>r.id),expected:expected.map(r=>({id:r.id,name:name(r),balance:r.balance??r.value})),actual:actual.map(r=>({id:r.id,name:name(r),status:r.status,parent:r.parent?.name??r.parent?.cost_center_name,tags:r.tags,creator:creator(r),date:r.created_at,balance:r.balance??r.value,currency:r.currency?.name,type:r.account_type_id,level:r.level,guidance:r.financial_statement_guidance?.name,cashflow:r.cashflow?.name}))},null,2),contentType:'application/json'});
  if(!scenario.empty)expect(expected.length,'Positive filter coverage requires matching baseline records').toBeGreaterThan(0);
  expect(actual.map(r=>r.id).sort(),'Filtered records must exactly match the independent unfiltered baseline predicate').toEqual(expected.map(r=>r.id).sort());
  await page.getByRole('button',{name:'Filter',exact:true}).click();const reset=list(page);await page.getByRole('button',{name:'Reset',exact:true}).click();const restored=await reset;
  expect(restored.data.meta.total).toBe(baseline.length);expect(restored.data.collection.map((r:Row)=>r.id)).toEqual(baseline.slice(0,restored.data.collection.length).map(r=>r.id));
  const params=new URL(restored.url).searchParams;expect([...params.keys()].filter(k=>!['page','limit'].includes(k))).toEqual([]);
 });
}





