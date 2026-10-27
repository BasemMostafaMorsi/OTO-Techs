import {expect, Locator} from '../../helpers/test';

export async function inventoryInput(table: Locator, column: string, row = 0) {
  const headers = (await table.getByRole('columnheader').allTextContents()).map(v => v.trim());
  const index = headers.indexOf(column);
  expect(index, `Inventory column ${column} must exist`).toBeGreaterThanOrEqual(0);
  const item = table.getByRole('row').filter({has: table.page().getByRole('combobox', {name:'Choose product', exact:true})}).nth(row);
  return item.getByRole('cell').nth(index).getByRole('textbox');
}
