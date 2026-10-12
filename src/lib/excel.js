import * as XLSX from 'xlsx';
import { LIST_FIELDS, PRODUCT_FIELDS, parseMatrix } from './catalog.js';

const PRODUCT_NOTES = [
  'Shri Harish Crackers — product import template',
  'Required columns: name, price.',
  'Optional columns: id, originalPrice, description, category, image, badge, active.',
  'Prices must be zero or more. Negative prices are rejected.',
  'Leave active blank to keep a product visible. Use true or false.',
  'The image column is a path such as /image.png. The workbook does not contain image files.',
  'Add image files to the website separately. Importing a filename does not upload the picture.',
  'Use the same id to update an existing product. A blank id matches an existing product by name.',
  'Choose Add new items to avoid creating a second copy of a product that is already saved.',
  'This import writes products to Cloud Firestore after you confirm it. Image cells stay as paths and are not uploaded.',
];

const LIST_NOTES = [
  'Shri Harish Crackers — product list import template',
  'Required columns: name, price.',
  'Optional columns: id, active.',
  'This catalog has no product images.',
  'Prices must be zero or more. Negative prices are rejected.',
  'Leave active blank to keep an item visible. Use true or false.',
  'Use the same id to update an existing item. A blank id matches an existing item by name.',
  'Choose Add new items to avoid creating a second copy of an item that is already saved.',
  'This import writes product list items to Cloud Firestore after you confirm it.',
];

export function spreadsheetTypeError(file) {
  const name = String(file?.name || '').toLowerCase();
  if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) return 'Use an Excel .xlsx file or a .csv file.';
  return '';
}

export async function readSpreadsheet(file, kind) {
  const typeError = spreadsheetTypeError(file);
  if (typeError) return { error: typeError, rows: [], warnings: [] };

  try {
    const buffer = await file.arrayBuffer();
    const csv = file.name.toLowerCase().endsWith('.csv');
    const workbook = csv
      ? XLSX.read(new TextDecoder().decode(buffer).replace(/^\uFEFF/, ''), { type: 'string' })
      : XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { error: 'The file has no sheets.', rows: [], warnings: [] };
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
    return parseMatrix(matrix, kind);
  } catch {
    return { error: 'The file could not be read. Use a valid .xlsx or .csv file.', rows: [], warnings: [] };
  }
}

function downloadBook(filename, sheetName, rows, notes) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = (rows[0] || []).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(book, sheet, sheetName);
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(notes.map(line => [line])), 'Instructions');
  XLSX.writeFile(book, filename);
}

export function downloadTemplate(kind) {
  if (kind === 'products') {
    downloadBook('shri-harish-products-template.xlsx', 'Products', [PRODUCT_FIELDS], PRODUCT_NOTES);
    return;
  }
  downloadBook('shri-harish-product-list-template.xlsx', 'Product List', [LIST_FIELDS], LIST_NOTES);
}

export function downloadCatalog(kind, items) {
  if (kind === 'products') {
    const rows = [
      PRODUCT_FIELDS,
      ...items.map(item => [
        item.id,
        item.name,
        item.price,
        item.originalPrice ?? '',
        item.description || '',
        item.category || '',
        item.image || '',
        item.badge || '',
        item.active === false ? 'false' : 'true',
      ]),
    ];
    downloadBook('shri-harish-products.xlsx', 'Products', rows, PRODUCT_NOTES);
    return;
  }

  const rows = [
    LIST_FIELDS,
    ...items.map(item => [item.id, item.name, item.price, item.active === false ? 'false' : 'true']),
  ];
  downloadBook('shri-harish-product-list.xlsx', 'Product List', rows, LIST_NOTES);
}
