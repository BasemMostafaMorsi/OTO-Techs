import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('User Management - Edit permissions', () => {
  test('@e2e update, persist, and restore an employee permission group', async ({ page }) => {
    test.setTimeout(90_000);

    await login(page);
    await page.goto('/en/users/permissions');
    await page.getByPlaceholder('Search').fill('AUTO Updated');

    const employeeRow = page.getByRole('row').filter({ hasText: 'AUTO Updated' }).first();
    await expect(employeeRow).toBeVisible();
    const employeeId = (await employeeRow.innerText()).match(/#(\d+)/)?.[1];
    expect(employeeId).toBeTruthy();

    await employeeRow.locator('button').click();
    await page.waitForURL(new RegExp(`/users/permissions/${employeeId}(?:\\?|$)`));

    const permissionForm = page.locator('#permissions-form');
    const financeCheckbox = permissionForm.getByRole('checkbox').nth(5);
    await expect(financeCheckbox).toBeVisible();
    const originallyChecked = await financeCheckbox.isChecked();

    await financeCheckbox.click();
    await expect(financeCheckbox).toBeChecked({ checked: !originallyChecked });

    const saveChangedResponse = page.waitForResponse(
      (response) =>
        response.request().method() !== 'GET' &&
        /permission/i.test(response.url()),
    );
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    expect((await saveChangedResponse).ok()).toBeTruthy();

    await page.reload();
    const savedFinanceCheckbox = page.locator('#permissions-form').getByRole('checkbox').nth(5);
    await expect(savedFinanceCheckbox).toBeChecked({ checked: !originallyChecked });

    await savedFinanceCheckbox.click();
    await expect(savedFinanceCheckbox).toBeChecked({ checked: originallyChecked });

    const restoreResponse = page.waitForResponse(
      (response) =>
        response.request().method() !== 'GET' &&
        /permission/i.test(response.url()),
    );
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    expect((await restoreResponse).ok()).toBeTruthy();

    await page.reload();
    await expect(page.locator('#permissions-form').getByRole('checkbox').nth(5)).toBeChecked({
      checked: originallyChecked,
    });
  });
});
