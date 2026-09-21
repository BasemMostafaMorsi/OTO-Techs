import { test, expect, Locator, Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { login } from '../helpers/auth';

async function selectFirstAvailable(
  page: Page,
  combobox: Locator,
  preferred?: RegExp,
): Promise<void> {
  await combobox.click();
  const listbox = page.getByRole('listbox').filter({ visible: true }).last();
  const options = listbox.getByRole('option');
  const selectableOptions = options.filter({ hasNotText: /create new|إنشاء جديد/i });
  await expect(selectableOptions.first()).toBeVisible();

  if (preferred) {
    const preferredOption = selectableOptions.filter({ hasText: preferred }).first();
    if (await preferredOption.isVisible().catch(() => false)) {
      await preferredOption.click();
      return;
    }
  }

  await selectableOptions.first().click();
}

test.describe('User Management - Employee lifecycle', () => {
  test('@e2e create, preview, update, and export an employee', async ({ page }) => {
    test.setTimeout(120_000);
    test.fail(
      true,
      'Known defect: the Preview action routes the user to the employee Edit page.',
    );

    const suffix = Date.now().toString().slice(-8);
    const originalName = `AUTO Employee ${suffix}`;
    const updatedName = `AUTO Updated ${suffix}`;
    const surname = `User ${suffix}`;
    const originalTitle = `QA ${suffix}`;
    const updatedTitle = `Senior QA ${suffix}`;
    const email = `auto.employee.${suffix}@example.com`;
    const mobile = `010${suffix}`.slice(0, 11);
    const today = new Date();
    const hiringDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(
      today.getDate(),
    ).padStart(2, '0')}/${today.getFullYear()}`;

    await login(page);
    await page.goto('/en/users/employees/create');

    await page.getByRole('textbox', { name: 'Employee Name *' }).fill(originalName);
    await page.getByRole('textbox', { name: 'Surname *' }).fill(surname);
    await page.getByRole('textbox', { name: 'Mobile number *' }).fill(mobile);
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Hiring Date' }).fill(hiringDate);

    await selectFirstAvailable(
      page,
      page.getByRole('combobox', { name: /^Department/ }),
      /^HR\b/i,
    );
    await selectFirstAvailable(page, page.getByRole('combobox', { name: /^Division/ }));
    await selectFirstAvailable(page, page.getByRole('combobox', { name: 'Branch *' }));
    await page.getByRole('textbox', { name: 'Title *' }).fill(originalTitle);
    await selectFirstAvailable(
      page,
      page.getByRole('combobox', { name: 'Direct manager *' }),
      /no manager/i,
    );
    await selectFirstAvailable(page, page.getByRole('combobox', { name: 'User type *' }));

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && /employees/i.test(response.url()),
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok(), `Create employee API returned ${createResponse.status()}`).toBeTruthy();

    const created = await createResponse.json();
    const employeeId = created.data.id;
    expect(employeeId).toBeTruthy();

    await page.goto('/en/users/employees');
    await page.getByPlaceholder('Search').fill(email);
    const createdRow = page.getByRole('row').filter({ hasText: email });
    await expect(createdRow).toContainText(originalName);
    await expect(createdRow).toContainText(originalTitle);

    await createdRow.getByLabel('more').click();
    await page.getByRole('menuitem', { name: 'Preview' }).click();
    await page.waitForURL(new RegExp(`/employees/(?:edit/)?${employeeId}(?:\\?|$)`));

    const previewOpenedEdit = page.url().includes('/employees/edit/');
    expect
      .soft(previewOpenedEdit, 'Preview must open a read-only employee details page')
      .toBeFalsy();

    if (previewOpenedEdit) {
      await expect(page.getByRole('textbox', { name: 'Employee Name *' })).toHaveValue(originalName);
      await expect(page.getByRole('textbox', { name: 'Surname *' })).toHaveValue(surname);
      await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(email);
      await expect(page.getByRole('textbox', { name: 'Mobile number *' })).toHaveValue(mobile);
      await expect(page.getByRole('textbox', { name: 'Title *' })).toHaveValue(originalTitle);
    } else {
      const preview = page.getByRole('main');
      await expect(preview).toContainText(originalName);
      await expect(preview).toContainText(surname);
      await expect(preview).toContainText(email);
      await expect(preview).toContainText(mobile);
      await expect(preview).toContainText(originalTitle);

      await page.goto('/en/users/employees');
      await page.getByPlaceholder('Search').fill(email);
      const rowForEdit = page.getByRole('row').filter({ hasText: email });
      await expect(rowForEdit).toBeVisible();
      await rowForEdit.getByLabel('more').click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
    }

    await expect(page.getByRole('textbox', { name: 'Employee Name *' })).toHaveValue(originalName);
    await page.getByRole('textbox', { name: 'Employee Name *' }).fill(updatedName);
    await page.getByRole('textbox', { name: 'Title *' }).fill(updatedTitle);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        ['POST', 'PUT', 'PATCH'].includes(response.request().method()) &&
        response.url().includes(`/employees/${employeeId}`),
    );
    await page.getByRole('button', { name: /save|update/i }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.ok(), `Update employee API returned ${updateResponse.status()}`).toBeTruthy();

    await page.goto('/en/users/employees');
    await page.getByPlaceholder('Search').fill(email);
    const updatedRow = page.getByRole('row').filter({ hasText: email });
    await expect(updatedRow).toContainText(updatedName);
    await expect(updatedRow).toContainText(updatedTitle);

    await page.getByPlaceholder('Search').clear();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
    expect(downloadPath).toBeTruthy();
    expect((await fs.stat(downloadPath!)).size).toBeGreaterThan(0);

    console.log(`Lifecycle completed for employee #${employeeId}: create, data check, update, export.`);
  });
});
