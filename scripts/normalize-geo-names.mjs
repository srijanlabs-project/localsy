import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import xlsx from 'xlsx';

const DEFAULT_COLUMN_CANDIDATES = [
  'areaName',
  'Area',
  'area',
  'Locality',
  'locality',
  'localityName',
  'name',
];

const ACRONYMS = new Set([
  'AWC',
  'CBD',
  'CGS',
  'CIDCO',
  'GIDC',
  'ITC',
  'KWC',
  'LIG',
  'MGM',
  'MIDC',
  'NH',
  'NRI',
]);

const DEVANAGARI_DIGITS = new Map([
  ['०', '0'],
  ['१', '1'],
  ['२', '2'],
  ['३', '3'],
  ['४', '4'],
  ['५', '5'],
  ['६', '6'],
  ['७', '7'],
  ['८', '8'],
  ['९', '9'],
]);

const DEVANAGARI_WORD_REPLACEMENTS = [
  [/सेक्टर/gu, 'Sector'],
  [/नगर/gu, 'Nagar'],
  [/गांव/gu, 'Gaon'],
  [/गाव/gu, 'Gav'],
  [/रोड/gu, 'Road'],
  [/मार्केट/gu, 'Market'],
  [/नोड/gu, 'Node'],
  [/पुराना/gu, 'Old'],
  [/नया/gu, 'New'],
  [/पूर्व/gu, 'East'],
  [/पश्चिम/gu, 'West'],
  [/तालुका/gu, 'Taluka'],
  [/फाटा/gu, 'Phata'],
  [/कॉलोनी/gu, 'Colony'],
];

const DEVANAGARI_CONSONANTS = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'n',
  'च': 'ch',
  'छ': 'chh',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ny',
  'ट': 't',
  'ठ': 'th',
  'ड': 'd',
  'ढ': 'dh',
  'ण': 'n',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'ph',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'sh',
  'ष': 'sh',
  'स': 's',
  'ह': 'h',
  'ळ': 'l',
};

const DEVANAGARI_INDEPENDENT_VOWELS = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
};

const DEVANAGARI_MATRAS = {
  'ा': 'aa',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function fixMojibake(value) {
  if (!/[ÃÂà¤à¥]/.test(value)) return value;
  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8');
    return repaired.includes('\uFFFD') ? value : repaired;
  } catch {
    return value;
  }
}

function replaceDevanagariDigits(value) {
  return Array.from(value).map((char) => DEVANAGARI_DIGITS.get(char) || char).join('');
}

function transliterateDevanagari(value) {
  let output = '';

  for (let i = 0; i < value.length; i += 1) {
    const current = value[i];
    const next = value[i + 1];

    if (DEVANAGARI_INDEPENDENT_VOWELS[current]) {
      output += DEVANAGARI_INDEPENDENT_VOWELS[current];
      continue;
    }

    if (DEVANAGARI_CONSONANTS[current]) {
      let sound = DEVANAGARI_CONSONANTS[current];
      if (next && DEVANAGARI_MATRAS[next]) {
        sound += DEVANAGARI_MATRAS[next];
        i += 1;
      } else if (next === '्') {
        i += 1;
      } else {
        sound += 'a';
      }
      output += sound;
      continue;
    }

    if (current === 'ं') {
      output += 'n';
      continue;
    }
    if (current === 'ः') {
      output += 'h';
      continue;
    }
    if (current === 'ँ') {
      output += 'n';
      continue;
    }

    output += current;
  }

  return output;
}

function toTitleCaseWord(word) {
  if (!word) return word;
  if (/^[0-9]+$/.test(word)) return word;
  if (/^[0-9A-Z/+.-]+$/.test(word)) return word;
  if (ACRONYMS.has(word.toUpperCase())) return word.toUpperCase();
  if (/^[A-Z]{2,}$/.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCasePreservingCodes(value) {
  return value
    .split(/\s+/)
    .map((part) => part
      .split(/([/+-])/)
      .map((token) => (['/', '+', '-'].includes(token) ? token : toTitleCaseWord(token)))
      .join(''))
    .join(' ');
}

function normalizeSectorPrefix(value) {
  const match = value.match(/^(?<prefix>lig\s+\d+(?:st|nd|rd|th)?\s+)?(?:sector|sect|sec)\s*[.:\-=]?\s*(?:(?:no|number)\s*[.:\-=\s]*)?(?<number>\d{1,2})\s*(?<suffix>[a-z]{0,4})\b\s*(?<rest>.*)$/i);
  if (!match?.groups) return value;

  const prefix = match.groups.prefix
    ? titleCasePreservingCodes(match.groups.prefix.trim()).replace(/^Lig\b/, 'LIG')
    : '';
  const number = String(Number(match.groups.number));
  const suffixRaw = String(match.groups.suffix || '').trim().toUpperCase();
  const rest = String(match.groups.rest || '').trim();
  const suffix = suffixRaw
    ? (suffixRaw.length <= 2 ? suffixRaw : ` ${suffixRaw}`)
    : '';

  let normalized = `${prefix ? `${prefix} ` : ''}Sector ${number}${suffix}`;
  if (rest) {
    normalized += ` ${titleCasePreservingCodes(rest)}`;
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

function normalizeSpecialTokens(value) {
  let next = value;
  next = next.replace(/^sect$/i, 'Sector');
  next = next.replace(/\bsector\s+([0-9]{1,2})\s+([a-z])\b/gi, (_full, number, suffix) => `Sector ${Number(number)}${suffix.toUpperCase()}`);
  next = next.replace(/\bsector\s+([0-9]{1,2})([a-z]{3,})\b/gi, (_full, number, suffix) => `Sector ${Number(number)} ${suffix.toUpperCase()}`);
  next = next.replace(/\bSector\s+(\d{1,2})\s*-\s*([A-Z]{1,2})\b/g, (_full, number, suffix) => `Sector ${Number(number)}${suffix}`);
  next = next.replace(/\bSector\s+(\d{1,2}[A-Z]?)\s*\/\s*([A-Z])\b/g, (_full, left, right) => `Sector ${left}/${right}`);
  next = next.replace(/\bcbd\b/gi, 'CBD');
  next = next.replace(/\bcgs\b/gi, 'CGS');
  next = next.replace(/\bitc\b/gi, 'ITC');
  next = next.replace(/\bmgm\b/gi, 'MGM');
  next = next.replace(/\bawc\b/gi, 'AWC');
  next = next.replace(/\bkwc\b/gi, 'KWC');
  next = next.replace(/\blig\b/gi, 'LIG');
  next = next.replace(/\bnode\s+([ivx]+)/gi, (_full, roman) => `Node ${roman.toUpperCase()}`);
  next = next.replace(/\bsec\b/gi, 'Sector');
  next = next.replace(/\bsect\b/gi, 'Sector');
  return next;
}

export function normalizeGeoName(input) {
  if (input === null || input === undefined) return '';

  let value = String(input);
  if (!value.trim()) return value;

  value = fixMojibake(value);
  value = value.normalize('NFKC');
  value = replaceDevanagariDigits(value);

  for (const [pattern, replacement] of DEVANAGARI_WORD_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  if (/[ऀ-ॿ]/u.test(value)) {
    value = transliterateDevanagari(value);
  }

  value = value
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*([:/.-])\s*/g, '$1')
    .trim();

  value = normalizeSectorPrefix(value);
  value = normalizeSpecialTokens(value);
  value = titleCasePreservingCodes(value);
  value = normalizeSectorPrefix(value);
  value = value.replace(/\bSector\b/g, 'Sector');
  value = value.replace(/\s+/g, ' ').trim();

  return value;
}

function readTabularInput(inputPath, selectedSheet) {
  const extension = path.extname(inputPath).toLowerCase();

  if (extension === '.txt') {
    const raw = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/);
    const header = (lines[0] || 'value').trim() || 'value';
    const rows = lines.slice(1).map((line) => ({ [header]: line }));
    return {
      type: 'txt',
      sheetName: 'Sheet1',
      header,
      rows,
      workbook: null,
    };
  }

  const workbook = xlsx.readFile(inputPath, { cellDates: false });
  const sheetName = selectedSheet || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" was not found.`);
  }

  const rows = xlsx.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    blankrows: true,
  });

  return {
    type: extension,
    sheetName,
    rows,
    workbook,
    worksheet,
  };
}

function writeTabularOutput(outputPath, source, rows) {
  const extension = path.extname(outputPath).toLowerCase();

  if (source.type === 'txt' || extension === '.txt') {
    const header = source.header || Object.keys(rows[0] || {})[0] || 'value';
    const body = rows.map((row) => String(row[header] ?? '')).join('\n');
    fs.writeFileSync(outputPath, `${header}\n${body}`, 'utf8');
    return;
  }

  const nextWorkbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(rows, { skipHeader: false });
  xlsx.utils.book_append_sheet(nextWorkbook, sheet, source.sheetName || 'Sheet1');
  xlsx.writeFile(nextWorkbook, outputPath);
}

function resolveColumns(rows, requestedColumns) {
  const headers = Object.keys(rows.find((row) => row && typeof row === 'object') || {});
  if (requestedColumns.length > 0) {
    return requestedColumns.filter((column) => headers.includes(column));
  }
  return DEFAULT_COLUMN_CANDIDATES.filter((column) => headers.includes(column));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input ? path.resolve(args.input) : '';
  const outputPath = args.output ? path.resolve(args.output) : '';
  const requestedColumns = String(args.columns || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/normalize-geo-names.mjs --input <file> --output <file> [--columns Area,Locality]');
    process.exit(1);
  }

  const source = readTabularInput(inputPath, args.sheet ? String(args.sheet) : '');
  const columns = resolveColumns(source.rows, requestedColumns);
  if (columns.length === 0) {
    console.error(`No matching columns found. Available columns: ${Object.keys(source.rows[0] || {}).join(', ')}`);
    process.exit(1);
  }

  const stats = [];
  const nextRows = source.rows.map((row, index) => {
    if (!row || typeof row !== 'object') return row;
    const nextRow = { ...row };
    for (const column of columns) {
      const original = String(row[column] ?? '');
      const normalized = normalizeGeoName(original);
      nextRow[column] = normalized;
      if (original !== normalized) {
        stats.push({
          row: index + 2,
          column,
          original,
          normalized,
        });
      }
    }
    return nextRow;
  });

  writeTabularOutput(outputPath, source, nextRows);

  console.log(`Normalized ${stats.length} values across columns: ${columns.join(', ')}`);
  if (stats.length > 0) {
    console.log('Sample changes:');
    stats.slice(0, 20).forEach((item) => {
      console.log(`Row ${item.row} | ${item.column} | "${item.original}" -> "${item.normalized}"`);
    });
  }
  console.log(`Output written to ${outputPath}`);
}

main();
