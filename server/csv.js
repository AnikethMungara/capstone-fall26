// Minimal RFC 4180 CSV writer/parser (quotes, commas, newlines, unicode).

// Spreadsheet apps run cells that start with = + - @ as formulas. Free-text
// survey answers are untrusted, so neutralise those (plain numbers are left alone).
const NUMBER = /^-?\d+(\.\d+)?$/;
export function safeCell(value) {
  const s = String(value ?? "");
  return /^[=+\-@\t\r]/.test(s) && !NUMBER.test(s) ? `'${s}` : s;
}

const quote = (s) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export const toCsv = (columns, rows) =>
  [columns.join(","), ...rows.map((r) => columns.map((c) => quote(safeCell(r[c]))).join(","))].join("\n") + "\n";

export function parseCsv(text) {
  const src = text.replace(/^﻿/, "");
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
