import { read, utils } from 'xlsx';

export type TabularRow = Record<string, string>;

const normalizeHeader = (value: string) => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, '')
    .replace(/[^a-z0-9]+/g, '')
);

const detectDelimiter = (text: string) => {
  const sample = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const tabCount = (sample.match(/\t/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) return '\t';
  if (semicolonCount > commaCount && semicolonCount > 0) return ';';
  return ',';
};

export const parseTabularText = (text: string, delimiter = detectDelimiter(text)): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((value) => value.trim())) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((value) => value.trim())) {
    rows.push(currentRow);
  }

  return rows;
};

export const parseTabularRows = (text: string): TabularRow[] => {
  const rows = parseTabularText(text);
  if (rows.length === 0) return [];

  const [headerRow, ...valueRows] = rows;
  const headers = headerRow.map(normalizeHeader);

  return valueRows
    .map((row) => headers.reduce<TabularRow>((accumulator, header, index) => {
      if (!header) return accumulator;
      accumulator[header] = String(row[index] || '').trim();
      return accumulator;
    }, {}))
    .filter((row) => Object.values(row).some((value) => value.trim()));
};

const parseWorkbookRows = (buffer: ArrayBuffer): TabularRow[] => {
  const workbook = read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<(string | number | boolean | null)[]>(firstSheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  });

  if (rows.length === 0) return [];

  const [headerRow, ...valueRows] = rows;
  const headers = headerRow.map((value) => normalizeHeader(String(value || '')));

  return valueRows
    .map((row) => headers.reduce<TabularRow>((accumulator, header, index) => {
      if (!header) return accumulator;
      accumulator[header] = String(row[index] ?? '').trim();
      return accumulator;
    }, {}))
    .filter((row) => Object.values(row).some((value) => value.trim()));
};

export const readTabularFile = async (file: File) => {
  const extension = String(file.name || '').toLowerCase().split('.').pop() || '';
  if (['xlsx', 'xls'].includes(extension)) {
    const buffer = await file.arrayBuffer();
    return parseWorkbookRows(buffer);
  }
  const text = await file.text();
  return parseTabularRows(text);
};

export const getTabularValue = (row: TabularRow, candidates: string[]) => {
  for (const candidate of candidates) {
    const value = row[normalizeHeader(candidate)];
    if (String(value || '').trim()) {
      return String(value).trim();
    }
  }
  return '';
};

const escapeCsvValue = (value: string) => {
  const normalized = String(value ?? '');
  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export const downloadCsvTemplate = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>> = [],
) => {
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map((value) => escapeCsvValue(String(value ?? ''))).join(',')),
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
