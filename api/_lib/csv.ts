// Minimal CSV builder (RFC 4180 quoting), prefixed with a UTF-8 BOM so
// Vietnamese diacritics render correctly when opened directly in Excel.
function csvCell(value: string): string {
  const needsQuoting = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

export function buildCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map(row => row.map(csvCell).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// RFC 4180 parser (inverse of buildCsv): handles quoted fields with embedded
// commas/newlines/escaped quotes, and strips a leading UTF-8 BOM if present.
// Returns one array of cells per row; trailing blank lines are dropped.
export function parseCsv(content: string): string[][] {
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // ignored — paired \n below ends the row
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}
