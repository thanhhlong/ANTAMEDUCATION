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
