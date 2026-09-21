import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Customer payment terms dropdown', () => {
  test('@regression dropdown consumes wheel scrolling without moving the page', async ({
    page,
  }) => {
    test.fail(
      true,
      'Known defect: scrolling Payment Terms moves the page instead of the dropdown list.',
    );

    await login(page);
    await page.goto('/en/contacts/customers/create?tab=salesSetting');

    const paymentTerms = page
      .getByText('Payment Terms', { exact: true })
      .locator('..')
      .getByRole('combobox');
    await paymentTerms.click();

    const listbox = page.getByRole('listbox').filter({ visible: true }).first();
    await expect(listbox).toBeVisible();

    const pageScrollBefore = await page.evaluate(() => window.scrollY);
    const listScrollBefore = await listbox.evaluate((element) => element.scrollTop);

    await listbox.hover();
    await page.mouse.wheel(0, 600);

    await expect
      .poll(() => listbox.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(listScrollBefore);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBefore);
  });
});
