import { test, expect } from '@playwright/test';
import { minorUnits, sumMinor, journalDifference } from '../helpers/decimal';

test.describe('@finance-unit exact decimal oracles', () => {
  test('currency, negative, Arabic and locale-specific amounts', () => {
    expect(minorUnits('1,234.50 SAR', {precision:2,currency:'SAR'})).toBe(123450n);
    expect(minorUnits('(1,234.50)', {precision:2})).toBe(-123450n);
    expect(minorUnits('١٬٢٣٤٫٥٠', {precision:2})).toBe(123450n);
    expect(minorUnits('1.234,50', {precision:2,decimalSeparator:',',groupSeparator:'.'})).toBe(123450n);
    expect(minorUnits('9007199254740993.01', {precision:2})).toBe(900719925474099301n);
  });
  test('rejects malformed values, missing data and hidden rounding', () => {
    for (const value of ['', '-', 'N/A', '1,23.00', '1.2.3', '0.001']) {
      expect(() => minorUnits(value, {precision:2})).toThrow();
    }
    expect(minorUnits('1.1000', {precision:2})).toBe(110n);
  });
  test('decimal sums and journals balance exactly', () => {
    expect(sumMinor(['0.10','0.20'], {precision:2})).toBe(30n);
    expect(journalDifference([{debit:'1.10',credit:'0'},{debit:'0',credit:'1.10'}], {precision:2})).toBe(0n);
    expect(journalDifference([{debit:'1.10',credit:'0'},{debit:'0',credit:'1.09'}], {precision:2})).toBe(1n);
  });
});
