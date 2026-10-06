export interface DecimalFormat {
  precision: number;
  decimalSeparator?: '.' | ',';
  groupSeparator?: ',' | '.' | ' ';
  currency?: string;
}

/** Exact minor units. Reject excess precision instead of silently rounding report data. */
export function minorUnits(raw: string, format: DecimalFormat): bigint {
  if (!Number.isInteger(format.precision) || format.precision < 0 || format.precision > 8) {
    throw new Error('Currency precision must be an integer between 0 and 8');
  }
  const decimal = format.decimalSeparator ?? '.';
  const group = format.groupSeparator ?? ',';
  if (decimal === group) throw new Error('Decimal and group separators must differ');
  let value = raw.replace(/[\u200e\u200f\u061c]/g, '').replace(/\u00a0/g, ' ').trim();
  value = value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, decimal).replace(/٬/g, group);
  if (format.currency) {
    if (value.startsWith(format.currency)) value = value.slice(format.currency.length).trim();
    if (value.endsWith(format.currency)) value = value.slice(0, -format.currency.length).trim();
  }
  const parentheses = value.startsWith('(') && value.endsWith(')');
  if (parentheses) value = value.slice(1, -1).trim();
  const negative = parentheses || value.startsWith('-');
  if (parentheses && /^[+-]/.test(value)) throw new Error(`Ambiguous sign: ${raw}`);
  value = value.replace(/^[+-]/, '');
  const parts = value.split(decimal);
  if (parts.length > 2) throw new Error(`Invalid decimal: ${raw}`);
  const groups = parts[0].split(group);
  if (groups.length > 1 && (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some(p => !/^\d{3}$/.test(p)))) {
    throw new Error(`Invalid digit grouping: ${raw}`);
  }
  const integer = groups.join('');
  const fraction = parts[1] ?? '';
  if (!/^\d+$/.test(integer) || !/^\d*$/.test(fraction)) throw new Error(`Invalid amount: ${raw}`);
  if (fraction.length > format.precision && /[1-9]/.test(fraction.slice(format.precision))) {
    throw new Error(`Amount exceeds currency precision: ${raw}`);
  }
  const amount = BigInt(integer + fraction.slice(0, format.precision).padEnd(format.precision, '0'));
  return negative ? -amount : amount;
}

export function sumMinor(values: string[], format: DecimalFormat): bigint {
  return values.reduce((sum, value) => sum + minorUnits(value, format), 0n);
}

export function journalDifference(lines: {debit: string; credit: string}[], format: DecimalFormat): bigint {
  if (lines.length < 2) throw new Error('A journal needs at least two lines');
  return sumMinor(lines.map(line => line.debit), format) - sumMinor(lines.map(line => line.credit), format);
}
