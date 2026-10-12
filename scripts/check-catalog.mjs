import * as XLSX from 'xlsx';
import {
  applyImport,
  classifyImport,
  normalizeListItem,
  normalizeProduct,
  parseMatrix,
} from '../src/lib/catalog.js';
import { readSpreadsheet } from '../src/lib/excel.js';

let failed = 0;
function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}

const existingProducts = [
  normalizeProduct({ id: 'flower-pot', name: 'Flower Pot', price: 250, originalPrice: 300, image: '/image.png', category: 'Flower Pots', description: 'Bright', badge: 'Popular', highlights: ['Keep me'] }),
];
const existingList = [normalizeListItem({ id: 'rocket', name: 'Rocket', price: 180 })];

const missing = parseMatrix([['id', 'description']], 'products');
assert(missing.error.includes('name'), 'missing required columns are rejected');

const negative = parseMatrix([
  ['name', 'price'],
  ['Bad Cracker', '-5'],
  ['Good Cracker', '40'],
], 'list');
const negativeRows = classifyImport(negative.rows, [], 'list');
assert(negativeRows[0].status === 'invalid', 'negative price is rejected');
assert(negativeRows[1].status === 'add', 'valid sibling row stays available');
assert(negativeRows[0].issues.some(issue => issue.includes('zero or more')), 'negative price explains the error');

const duplicates = classifyImport(parseMatrix([
  ['name', 'price'],
  ['Sparkler', '90'],
  ['Sparkler', '90'],
], 'list').rows, [], 'list');
assert(duplicates.every(row => row.status === 'invalid'), 'duplicate names in one file are both rejected');

const addAgain = classifyImport(parseMatrix([
  ['name', 'price'],
  ['Rocket', '180'],
  ['New Item', '75'],
], 'list').rows, existingList, 'list');
const added = applyImport(existingList, addAgain, 'add');
assert(added.length === 2, 'add mode does not create a duplicate');
assert(added.some(item => item.name === 'New Item'), 'add mode inserts the new item');
assert(added.filter(item => item.name === 'Rocket').length === 1, 'existing rocket stays once');

const updated = applyImport(existingList, addAgain, 'update');
assert(updated.length === 2, 'update mode keeps one rocket and adds the new item');
assert(updated.find(item => item.id === 'rocket').price === 180, 'matched row updates the saved id');

const byId = classifyImport(parseMatrix([
  ['id', 'name', 'price', 'active'],
  ['rocket', 'Rocket Deluxe', '200', 'false'],
], 'list').rows, existingList, 'list');
const renamed = applyImport(existingList, byId, 'update');
assert(renamed.length === 1 && renamed[0].id === 'rocket' && renamed[0].name === 'Rocket Deluxe' && renamed[0].active === false, 'id match updates name, price, and visibility');

const conflict = classifyImport(parseMatrix([
  ['id', 'name', 'price'],
  ['rocket', 'Flower Pot', '10'],
], 'list').rows, [
  ...existingList,
  normalizeListItem({ id: 'flower-pot', name: 'Flower Pot', price: 20 }),
], 'list');
assert(conflict[0].status === 'invalid', 'one row cannot match two saved items');

const productRows = classifyImport(parseMatrix([
  ['Product Name', 'Selling Price', 'image', 'originalPrice'],
  ['Flower Pot', '260', '/photos/pot.png', '100'],
  ['Aerial Shell', 'abc', '', ''],
], 'products').rows, existingProducts, 'products');
assert(productRows[0].status === 'invalid', 'original price below selling price is rejected');
assert(productRows[1].status === 'invalid', 'non-numeric price is rejected');

const safeUpdate = classifyImport(parseMatrix([
  ['id', 'name', 'price'],
  ['flower-pot', 'Flower Pot', '240'],
], 'products').rows, existingProducts, 'products');
const kept = applyImport(existingProducts, safeUpdate, 'update');
assert(kept[0].highlights[0] === 'Keep me', 'update keeps fields that are not in the file');
assert(kept[0].image === '/image.png', 'blank image does not wipe the saved path');
assert(kept[0].price === 240, 'selling price updates');

const replaced = applyImport([
  ...existingList,
  normalizeListItem({ id: 'old-only', name: 'Old Only', price: 10 }),
], addAgain, 'replace');
assert(replaced.length === 2 && !replaced.some(item => item.name === 'Old Only'), 'replace drops saved items that are absent from the file');

const aliasWarnings = parseMatrix([
  ['name', 'price', 'notes'],
  ['Pencil', '55'],
], 'list');
assert(aliasWarnings.warnings[0].includes('notes'), 'unknown columns are reported');

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
  ['id', 'name', 'price', 'active'],
  ['rocket', 'Rocket', '180', 'true'],
  ['', 'Fresh Item', '60', ''],
  ['', '', '', ''],
]), 'Product List');
const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
const file = new File([buffer], 'list.xlsx');
const parsedFile = await readSpreadsheet(file, 'list');
assert(!parsedFile.error, `xlsx file parses (${parsedFile.error})`);
const fromFile = classifyImport(parsedFile.rows, existingList, 'list');
assert(fromFile.length === 2, 'blank excel rows are ignored');
const reimported = applyImport(existingList, fromFile, 'add');
assert(reimported.length === 2, 're-importing an existing id does not duplicate it');
assert(reimported.some(item => item.name === 'Fresh Item'), 'new workbook row is added');

const csv = new File(['name,price\nRocket,180\nColour Matches,65\n'], 'list.csv', { type: 'text/csv' });
const parsedCsv = await readSpreadsheet(csv, 'list');
const csvRows = classifyImport(parsedCsv.rows, existingList, 'list');
const csvApplied = applyImport(existingList, csvRows, 'add');
assert(csvApplied.filter(item => item.name === 'Rocket').length === 1, 'csv re-import does not duplicate');
assert(csvApplied.some(item => item.name === 'Colour Matches'), 'csv adds the new row');

const wrongType = await readSpreadsheet(new File(['hello'], 'notes.txt'), 'list');
assert(wrongType.error.includes('.xlsx'), 'other file types are rejected');

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('Catalog import checks passed');
