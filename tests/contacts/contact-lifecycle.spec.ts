import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { login } from '../helpers/auth';

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
    await page.getByPlaceholder('Search').fill(originalName);
    await page.waitForTimeout(1_000);
    const createdRow = page.getByRole('row').filter({ hasText: originalName });
    await expect(createdRow).toContainText(originalName);
    await expect(createdRow).toContainText('Commercial');
    const createdRowText = await createdRow.innerText();
    const contactId = createdRowText.match(/#(\d+)/)?.[1];
    expect(contactId, 'The created contact ID was not displayed in the list').toBeTruthy();

    await createdRow.locator('button').first().click();
    await page.waitForURL(new RegExp(`/contacts/contacts/${contactId}(?:\\?|$)`));
    const preview = page.getByRole('main');
    await expect(preview).toContainText(originalName);
    await expect(preview).toContainText(email);
    await expect(preview).toContainText(mobile);
    await expect(preview).toContainText('Commercial');

    await page.goto('/en/contacts/contacts');
    const exportArtifactPromise = Promise.race([
      page
        .waitForEvent('download', { timeout: 15_000 })
        .then((download) => ({ kind: 'download' as const, download })),
      page
        .waitForResponse(
          (response) => /export/i.test(response.url()) && response.request().method() !== 'OPTIONS',
          { timeout: 15_000 },
        )
        .then((response) => ({ kind: 'response' as const, response })),
    ]);
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const exportArtifact = await exportArtifactPromise;
    if (exportArtifact.kind === 'download') {
      const downloadPath = await exportArtifact.download.path();
      expect(exportArtifact.download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
      expect(downloadPath).toBeTruthy();
      expect((await fs.stat(downloadPath!)).size).toBeGreaterThan(0);
    } else {
      expect
        .soft(
          exportArtifact.response.ok(),
          `Export failed with ${exportArtifact.response.status()} at ${exportArtifact.response.url()}`,
        )
        .toBeTruthy();
      if (exportArtifact.response.ok()) {
        expect((await exportArtifact.response.body()).length).toBeGreaterThan(0);
      }
    }

    await page.getByPlaceholder('Search').fill(originalName);
    await page.waitForTimeout(1_000);
    const rowForTransform = page.getByRole('row').filter({ hasText: originalName });
    await rowForTransform.getByLabel('more').click();
    await page.getByRole('menuitem', { name: 'Transform' }).click();
    const transformDialog = page.getByRole('dialog');
    await expect(transformDialog).toContainText('Linking with representative');

    const transformResponsePromise = page
      .waitForResponse(
        (response) =>
          response.request().method() !== 'GET' &&
          /sales|representative|employee/i.test(response.url()),
        { timeout: 10_000 },
      )
      .catch(() => null);
    await transformDialog
      .getByRole('button', { name: /add sales representative/i })
      .click();
    const transformResponse = await transformResponsePromise;
    expect
      .soft(transformResponse?.ok() ?? false, 'Transform did not complete successfully')
      .toBeTruthy();

    await page.goto('/en/contacts/contacts');
    await page.getByPlaceholder('Search').fill(originalName);
    await page.waitForTimeout(1_000);
    const rowForEdit = page.getByRole('row').filter({ hasText: originalName });
    await expect(rowForEdit).toBeVisible();
    await rowForEdit.getByLabel('more').click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveValue(originalName);
    await page.getByRole('textbox', { name: 'Name *' }).fill(updatedName);

    await page.getByRole('button', { name: /save|update/i }).click();
    await expect(page.getByText(/contact updated successfully/i)).toBeVisible();
    await page.waitForURL(/\/contacts\/contacts(?:\?|$)/);

    await page.goto(`/en/contacts/contacts/${contactId}`);
    await expect(page.getByRole('main')).toContainText(updatedName);

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
    ]) {
      await expect(page.getByText(field, { exact: true }).last()).toBeVisible();
    }

    const filterComboboxes = page.getByRole('combobox').filter({ visible: true });
    await expect(filterComboboxes).toHaveCount(10);
    await filterComboboxes.nth(4).click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();

    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2_000);
    await page.getByPlaceholder('Search').fill(contactId!);
    await page.waitForTimeout(1_000);
    const rowForDelete = page.getByRole('row').filter({ hasText: `#${contactId}` });
    await expect(rowForDelete).toBeVisible();
    await rowForDelete.getByLabel('more').click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const confirmation = page.getByRole('dialog');
    await confirmation.getByRole('button', { name: /delete|confirm|yes/i }).click();
    await expect(page.getByRole('row').filter({ hasText: updatedName })).toHaveCount(0);

    console.log(
      `Contact #${contactId}: created, previewed, exported, transformed, edited, filtered, and deleted.`,
    );
  });
});
