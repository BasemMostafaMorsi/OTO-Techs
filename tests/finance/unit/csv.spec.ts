import { test, expect } from '@playwright/test';
import { parseCSV } from '../helpers/csv';

test('@finance-unit CSV preserves quoted values, newlines, signs and empty fields', () => {
  expect(parseCSV('\uFEFF"ID","Name","Amount","Memo"\r\n"1","A, B","-0.10","line 1\n""line 2"""\r\n"2","C","0",""\r\n'))
    .toEqual([{ID:'1',Name:'A, B',Amount:'-0.10',Memo:'line 1\n"line 2"'}, {ID:'2',Name:'C',Amount:'0',Memo:''}]);
});

test('@finance-unit CSV rejects malformed exports instead of losing columns', () => {
  for (const csv of ['ID,ID\n1,2', 'ID,Amount\n1', 'ID\n"unfinished', 'ID\n"one"two', 'ID\non"e']) {
    expect(() => parseCSV(csv)).toThrow();
  }
});
