/** Parse quoted CSV without converting money to floating point. */
export function parseCSV(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ',' || c === '\r' || c === '\n') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') {
        rows.push(row); row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else if (c === '"' && !field && !closed) quoted = true;
    else {
      if (closed || c === '"') throw new Error('Malformed CSV quoting');
      field += c;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  if (!headers?.length || headers.some(h => !h) || new Set(headers).size !== headers.length) {
    throw new Error('CSV requires unique nonempty column names');
  }
  return rows.map((cells, i) => {
    if (cells.length !== headers.length) throw new Error(`CSV row ${i + 2}: column count mismatch`);
    return Object.fromEntries(headers.map((h, column) => [h, cells[column]]));
  });
}
