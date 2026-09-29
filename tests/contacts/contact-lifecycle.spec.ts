import { test, expect, Page } from '../helpers/test';
import fs from 'node:fs/promises';
import { login } from '../helpers/auth';

async function searchContacts(page: Page, query: string) {
  // Wait for the debounced search response before opening a row menu. Otherwise
  // the result refresh can detach the menu between "more" and "Edit" clicks.
  await Promise.all([
    page.waitForResponse(response => {
      const url = new URL(response.url());
      return response.request().method() === 'GET' &&
        url.pathname.endsWith('/sales/customers') &&
        [...url.searchParams.values()].some(value => value.includes(query));
    }),
    page.getByPlaceholder('Search').fill(query),
  ]);
}

test.describe('Business Partners - Contact lifecycle', () => {
  test('@e2e create, preview, export, transform, edit, filter, and delete a contact', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const suffix = Date.now().toString().slice(-8);
    const originalName = `AUTO Contact ${suffix}`;
    const updatedName = `AUTO Contact Updated ${suffix}`;
    const email = `auto.contact.${suffix}@example.com`;
    const mobile = `010${suffix}`.slice(0, 11);

    await login(page);
    await page.goto('/en/contacts/contacts/create');

    await page.getByRole('radio', { name: 'Commercial' }).check();
    await page.getByRole('textbox', { name: 'Name *' }).fill(originalName);
    await page.getByRole('textbox', { name: 'Mobile number' }).first().fill(mobile);
    await page.getByRole('textbox', { name: 'Email' }).first().fill(email);

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/contact created successfully/i)).toBeVisible();
    await page.waitForURL(/\/contacts\/contacts(?:\?|$)/);

    await page.goto('/en/contacts/contacts');
    await searchContacts(page, originalName);
    const createdRow = page.getByRole('row').filter({ hasText: originalName });
    await expect(createdRow).toContainText(originalName);
    await expect(createdRow).toContainText('Commercial');
    const createdRowText = await createdRow.innerText();
    const contactId = createdRowText.match(/#(\d+)/)?.[1];
    expect(contactId, 'The created contact ID was not displayed in the list').toBeTruthy();
    try {
      await createdRow.locator('button').first().click();
      await page.waitForURL(new RegExp(`/contacts/contacts/${contactId}(?:\\?|$)`));
      const preview = page.getByRole('main');
      await expect(preview).toContainText(originalName);
      await expect(preview).toContainText(email);
      await expect(preview).toContainText(mobile);
      await expect(preview).toContainText('Commercial');

      await page.goto('/en/contacts/contacts');
      const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
      await page.getByRole('button', { name: 'Export', exact: true }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
      expect(downloadPath).toBeTruthy();
      expect((await fs.stat(downloadPath!)).size).toBeGreaterThan(0);

      await searchContacts(page, originalName);
      const rowForTransform = page.getByRole('row').filter({ hasText: originalName });
      await rowForTransform.getByLabel('more').click();
      await page.getByRole('menuitem', { name: 'Transform' }).click();
      const transformDialog = page.getByRole('dialog');
      await expect(transformDialog).toContainText('Linking with representative');

      await transformDialog
        .getByRole('button', { name: /add sales representative/i })
        .click();
      await transformDialog.getByRole('combobox', { name: 'Sales rep *' }).click();
      const representatives = page.getByRole('option').filter({ hasNotText: /create new/i });
      const representative = process.env.LUXORA_SALES_REP
        ? representatives.filter({ hasText: process.env.LUXORA_SALES_REP }).first()
        : representatives.first();
      await expect(representative).toBeVisible();
      const representativeName = await representative.innerText();
      await representative.click();
      const transformResponsePromise = page.waitForResponse(
        response => response.request().method() === 'POST' && response.url().endsWith('/sales/assign_sales'),
      );
      await transformDialog.getByRole('button', { name: 'Submit', exact: true }).click();
      const transformResponse = await transformResponsePromise;
      const transformBody = await transformResponse.json();
      await test.info().attach('contact-transform', {
        body: JSON.stringify({ representativeName, status: transformResponse.status(), message: transformBody.message }),
        contentType: 'application/json',
      });
      await test.info().attach('contact-transform-screen', { body: await page.screenshot(), contentType: 'image/png' });
      expect
        .soft(transformResponse.ok() && transformBody.is_success !== false,
          `Assigning ${representativeName}: HTTP ${transformResponse.status()} — ${transformBody.message}. The representative must belong to the contact's tree (LUXORA_SALES_REP).`)
        .toBeTruthy();

      await page.goto('/en/contacts/contacts');
      await searchContacts(page, originalName);
      const rowForEdit = page.getByRole('row').filter({ hasText: originalName });
      await expect(rowForEdit).toBeVisible();
      await rowForEdit.getByLabel('more').click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();

      await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveValue(originalName);
      await page.getByRole('textbox', { name: 'Name *' }).fill(updatedName);
      await page.getByRole('textbox', { name: 'Name *' }).press('Tab');

      const updateResponsePromise = page.waitForResponse(response =>
        response.request().method() === 'PUT' && response.url().endsWith(`/sales/customers/${contactId}`));
      await page.getByRole('button', { name: /save|update/i }).click();
      const updateResponse = await updateResponsePromise;
      expect(updateResponse.ok(), 'Contact update API must succeed').toBeTruthy();
      expect(updateResponse.request().postDataJSON().name).toBe(updatedName);
      await expect(page.getByText(/contact updated successfully/i)).toBeVisible();
      await page.waitForURL(/\/contacts\/contacts(?:\?|$)/);

      await page.goto(`/en/contacts/contacts/${contactId}`);
      await expect.soft(page.getByRole('main')).toContainText(updatedName);
      await test.info().attach('contact-updated-preview', { body: await page.screenshot(), contentType: 'image/png' });

      await page.goto('/en/contacts/contacts');
      await page.getByPlaceholder('Search').clear();
      await page.getByRole('button', { name: 'Filter', exact: true }).click();
      for (const field of [
        'Section',
        'Direct manager',
        'Rep',
        'Project',
        'Status',
        'Category',
        'Classification',
        'Country',
        'Area',
        'City',
        'Chart of accounts linkage',
      ]) {
        await expect(page.getByRole('combobox', { name: field, exact: true })).toBeVisible();
      }

      await page.getByRole('combobox', { name: 'Status', exact: true }).click();
      await page.getByRole('option', { name: 'Active', exact: true }).click();
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(page.getByRole('table')).toBeVisible();

      await page.getByRole('button', { name: 'Filter', exact: true }).click();
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
    } finally {
      // Cleanup targets the exact record created above, including after a failed assertion.
      await page.goto('/en/contacts/contacts');
      await searchContacts(page, contactId!);
      const rowForDelete = page.getByRole('row').filter({ has: page.getByText(`#${contactId}`, { exact: true }) });
      await expect(rowForDelete).toBeVisible();
      await rowForDelete.getByLabel('more').click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();

      const confirmation = page.getByRole('dialog');
      const deleteResponsePromise = page.waitForResponse(response =>
        response.request().method() === 'DELETE' && response.url().endsWith(`/sales/customers/${contactId}`));
      await confirmation.getByRole('button', { name: /delete|confirm|yes/i }).click();
      expect((await deleteResponsePromise).ok(), 'Created contact cleanup must succeed').toBeTruthy();
      await expect(rowForDelete).toHaveCount(0);
      console.log(`Test contact #${contactId} deleted.`);
    }
  });
});
