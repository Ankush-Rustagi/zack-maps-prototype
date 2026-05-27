/**
 * Tiny RFC-4180-ish CSV parser. Handles quoted fields, escaped quotes ("")
 * inside quotes, and \r\n / \n line endings. Sufficient for hand-pasted
 * 2-column files; not meant to be a full parser library.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') { inQuote = true; continue; }
    if (ch === ',') { row.push(cur); cur = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') {
      row.push(cur); cur = '';
      if (row.some((c) => c.trim())) rows.push(row.map((c) => c.trim()));
      row = [];
      continue;
    }
    cur += ch;
  }
  if (cur || row.length > 0) {
    row.push(cur);
    if (row.some((c) => c.trim())) rows.push(row.map((c) => c.trim()));
  }
  return rows;
}

export interface BulkRow {
  name: string;
  address: string;
}

/**
 * Inspect the first row; if it looks like a header (contains "name" and/or
 * "address"), use it to figure out column order. Otherwise assume the first
 * column is address and the second is name (the user's stated order).
 */
export function csvToBulkRows(text: string): BulkRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const first = rows[0].map((c) => c.toLowerCase());
  const hasHeader = first.some((c) => c === 'name' || c === 'address' || c === 'addr');
  let addressIdx = 0;
  let nameIdx = 1;
  let dataStart = 0;

  if (hasHeader) {
    dataStart = 1;
    const nameAt = first.findIndex((c) => c === 'name' || c === 'location' || c === 'location name');
    const addrAt = first.findIndex((c) => c === 'address' || c === 'addr' || c === 'street');
    if (nameAt >= 0) nameIdx = nameAt;
    if (addrAt >= 0) addressIdx = addrAt;
  }

  const out: BulkRow[] = [];
  for (let i = dataStart; i < rows.length; i++) {
    const cells = rows[i];
    const address = (cells[addressIdx] ?? '').trim();
    const name = (cells[nameIdx] ?? '').trim();
    if (!address) continue; // skip empties
    out.push({ name: name || address, address });
  }
  return out;
}
