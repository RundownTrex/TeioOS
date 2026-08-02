/**
 * Client-side CSV export helper.
 *
 * Generates a UTF-8 CSV file (with BOM so Excel renders non-ASCII correctly)
 * from an array of rows and triggers a browser download. Values containing
 * commas, quotes, or newlines are quoted per RFC 4180.
 */

const escapeCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

/**
 * @param {string} filename  e.g. "exam-analytics-2026-08-02.csv"
 * @param {string[]} headers Column headers.
 * @param {Array<Array<unknown>>} rows Row-major cell values.
 */
export const downloadCsv = (filename, headers, rows) => {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export default downloadCsv;
