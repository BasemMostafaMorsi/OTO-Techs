import { test, expect } from '../../helpers/test';
import { login } from '../../helpers/auth';

test.describe('Customer payment terms dropdown', () => {
  test('@regression dropdown consumes wheel scrolling without moving the page', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/en/contacts/customers/create?tab=salesSetting');

    const paymentTerms = page.getByRole('combobox', { name: 'Payment terms', exact: true });
    await paymentTerms.click();

    const listbox = page.getByRole('listbox').filter({ visible: true }).first();
    await expect(listbox).toBeVisible();
    // The popup is visible before its async options arrive. A wheel event sent
    // to the initial "Create new" row cannot exercise list scrolling.
    await expect(listbox.getByRole('option').filter({ hasNotText: 'Create new' }).first()).toBeVisible();
    await expect.poll(() => listbox.evaluate(el => el.scrollHeight - el.clientHeight), {
      message: 'Payment terms must finish loading and overflow before testing scrolling',
    }).toBeGreaterThan(0);
    await listbox.hover();
    const pageScrollBefore = await paymentTerms.evaluate(el => {
      const positions: number[] = [];
      for (let parent = el.parentElement; parent; parent = parent.parentElement) positions.push(parent.scrollTop);
      return [window.scrollY, ...positions];
    });
    const listScrollBefore = await listbox.evaluate(element => element.scrollTop);
    await page.mouse.wheel(0, 600);

    await expect
      .poll(() => listbox.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(listScrollBefore);
    expect(await paymentTerms.evaluate(el => {
      const positions: number[] = [];
      for (let parent = el.parentElement; parent; parent = parent.parentElement) positions.push(parent.scrollTop);
      return [window.scrollY, ...positions];
    })).toEqual(pageScrollBefore);
  });
});
