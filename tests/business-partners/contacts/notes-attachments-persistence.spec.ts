import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { test, expect, Page } from '../../helpers/test';
import { login } from '../../helpers/auth';

async function deleteOwnContact(page: Page, id: number, name: string) {
  await page.goto('/en/contacts/contacts');
  const response = page.waitForResponse(r => {
    const url = new URL(r.url());
    return r.request().method()==='GET' && url.pathname.endsWith('/sales/customers') &&
      [...url.searchParams.values()].some(value => value.includes(name));
  });
  await page.getByPlaceholder('Search',{exact:true}).fill(name);
  expect((await response).ok()).toBeTruthy();
  const row = page.getByRole('row').filter({has:page.getByText(`#${id}`,{exact:true})});
  await expect(row).toContainText(name);
  await row.getByLabel('more').click();
  await page.getByRole('menuitem',{name:'Delete',exact:true}).click();
  const deleted = page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith(`/sales/customers/${id}`));
  await page.getByRole('dialog').getByRole('button',{name:/delete|confirm|yes/i}).click();
  expect((await deleted).ok(),'Delete only the contact created by this test').toBeTruthy();
  await expect(row).toHaveCount(0);
}

for (const variant of ['note','attachment'] as const) {
  test(`@e2e @business-partners ${variant} persists after saving and reloading a contact`, async ({page},testInfo) => {
    test.setTimeout(120_000);
    const name = `BP-E2E-${variant}-${Date.now()}`;
    const note = `Persistence evidence ${name}`;
    let contactId: number | undefined;
    let attachmentURL: string | null = null;
    await mkdir('artifacts/business-partners',{recursive:true});
    await login(page);
    try {
      await page.goto('/en/contacts/contacts/create?tab=attachments');
      await page.getByRole('radio',{name:'Commercial',exact:true}).check();
      await page.getByRole('textbox',{name:'Name *',exact:true}).fill(name);
      if (variant==='note') {
        await page.getByPlaceholder('Notes',{exact:true}).fill(note);
        await expect(page.getByPlaceholder('Notes',{exact:true})).toHaveValue(note);
      } else {
        const uploading = page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/sales/uploads'));
        await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/contact-proof.png'));
        const upload = await uploading;
        await testInfo.attach('upload-result',{body:JSON.stringify({status:upload.status()}),contentType:'application/json'});
        expect(upload.ok(),'Valid PNG upload must succeed before saving the contact').toBeTruthy();
        const image=page.getByRole('main').locator('img[src*="/attachments/"]').first();
        await expect(image,'Uploaded image preview').toBeVisible();
        attachmentURL=await image.getAttribute('src');
      }
      const saving=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/sales/customers'));
      await page.getByRole('button',{name:'Save',exact:true}).click();
      const saved=await saving;
      const body=await saved.json();
      contactId=body.data?.id;
      expect(saved.ok(),'Create contact').toBeTruthy();
      expect(contactId,'Created contact ID').toBeTruthy();
      const submitted=saved.request().postDataJSON();
      await testInfo.attach('contact-persistence-evidence',{
        body:JSON.stringify({contactId,name,note:variant==='note'?note:undefined,submittedNote:submitted.note,attachmentURL,submittedAttachments:submitted.attachments},null,2),
        contentType:'application/json',
      });
      if(variant==='note') expect(submitted.note,'The request contains the entered note').toBe(note);
      const url=`/en/contacts/contacts/${contactId}?tab=attachmentsNotes`;
      await page.goto(url);
      await expect(page.getByRole('main').getByText(name,{exact:true})).toBeVisible();
      await page.reload();
      const main=page.getByRole('main');
      await expect(main.getByText(name,{exact:true})).toBeVisible();
      await expect(main.getByText('Attachments',{exact:true})).toBeVisible();
      if(variant==='note') {
        await expect(main,'Saved note remains visible after reloading the details').toContainText(note);
      } else {
        await expect(main.getByText('No attachments available',{exact:true})).toBeHidden();
        const image=main.locator('img').filter({visible:true});
        await expect(image).toHaveAttribute('src',attachmentURL!);
        await expect.poll(()=>image.evaluate((element:HTMLImageElement)=>element.complete&&element.naturalWidth>0),
          {message:'Persisted attachment loads as a real image'}).toBe(true);
        await expect.poll(()=>main.getByRole('link').evaluateAll(links=>links.map(link=>link.getAttribute('href'))),
          {message:'Attachment action links to the same persisted file'}).toContain(attachmentURL);
      }
    } finally {
      const file=path.resolve(`artifacts/business-partners/${variant}-persistence.png`);
      await page.screenshot({path:file,fullPage:true});
      await testInfo.attach('persistence-screen',{path:file,contentType:'image/png'});
      if(contactId) await test.step('Delete the test contact',()=>deleteOwnContact(page,contactId!,name));
    }
  });
}
