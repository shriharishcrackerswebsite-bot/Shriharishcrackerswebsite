import { sanitizeRichText } from './richText.js';

export const PRODUCT_FIELDS = ['id', 'name', 'price', 'originalPrice', 'description', 'category', 'image', 'badge', 'active'];
export const MAX_PRODUCT_IMAGES = 8;
export const LIST_FIELDS = ['id', 'name', 'price', 'active'];

const ALIASES = {
  id: ['id', 'productid', 'itemid', 'sku'],
  name: ['name', 'productname', 'product', 'item', 'itemname'],
  price: ['price', 'sellingprice', 'rate', 'amount', 'saleprice'],
  originalPrice: ['originalprice', 'mrp', 'listprice', 'strikeprice'],
  description: ['description', 'desc', 'details'],
  category: ['category', 'cat', 'categoryname'],
  image: ['image', 'imagepath', 'photo', 'img', 'picture'],
  badge: ['badge'],
  active: ['active', 'visible', 'enabled', 'status'],
};

function headerKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function canonicalField(header, fields) {
  const key = headerKey(header);
  return fields.find(field => headerKey(field) === key || ALIASES[field].includes(key)) || '';
}

export function stableId(value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (slug) return slug;

  const source = String(value || '').trim();
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  return `item-${hash.toString(36)}`;
}

export function uniqueId(name, items) {
  const base = stableId(name);
  if (!items.some(item => item.id === base)) return base;
  let suffix = 2;
  while (items.some(item => item.id === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function discountFor(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}

export function parsePrice(value) {
  const text = String(value ?? '').trim();
  if (!text) return { ok: false, empty: true };
  const cleaned = text.replace(/₹/g, '').replace(/,/g, '').replace(/\s/g, '').replace(/^rs\.?/i, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return { ok: false, empty: false };
  const number = Number(cleaned);
  if (!Number.isFinite(number) || number < 0) return { ok: false, empty: false };
  const rounded = Math.round(number);
  return { ok: true, empty: false, value: rounded, rounded: rounded !== number };
}

export function parseActive(value) {
  const text = String(value ?? '').trim();
  if (!text) return { ok: true, empty: true, value: true };
  const token = text.toLowerCase();
  if (['true', 'yes', 'y', '1', 'active', 'enabled', 'visible'].includes(token)) return { ok: true, empty: false, value: true };
  if (['false', 'no', 'n', '0', 'inactive', 'disabled', 'hidden'].includes(token)) return { ok: true, empty: false, value: false };
  return { ok: false, empty: false };
}

export function isStoredImageUrl(value) {
  const url = String(value || '').trim();
  if (!url || url.length > 2000 || /\s/.test(url)) return false;
  if (url.startsWith('/')) return !url.startsWith('//') && !url.includes('..') && !url.includes('\\');
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function productGallery(raw) {
  const urls = [];
  const add = value => {
    const url = String(value || '').trim();
    if (!isStoredImageUrl(url) || urls.includes(url)) return;
    urls.push(url);
  };
  if (Array.isArray(raw?.images)) raw.images.forEach(add);
  add(raw?.image);
  if (!urls.length) urls.push('/image.png');
  const requested = String(raw?.image || '').trim();
  return {
    image: urls.includes(requested) ? requested : urls[0],
    images: urls.slice(0, MAX_PRODUCT_IMAGES),
  };
}

export function normalizeProduct(raw) {
  const price = Math.round(Number(raw.price));
  const originalRaw = raw.originalPrice;
  const hasOriginal = originalRaw !== '' && originalRaw != null && Number.isFinite(Number(originalRaw));
  const originalPrice = hasOriginal ? Math.round(Number(originalRaw)) : null;
  const gallery = productGallery(raw);
  return {
    highlights: [],
    theme: 'purple',
    featured: false,
    ...raw,
    id: String(raw.id || stableId(raw.name)),
    name: String(raw.name || '').trim(),
    category: String(raw.category || '').trim(),
    image: gallery.image,
    images: gallery.images,
    price,
    originalPrice,
    discount: discountFor(price, originalPrice),
    description: sanitizeRichText(String(raw.description || '').trim()),
    badge: String(raw.badge || '').trim(),
    active: raw.active !== false && String(raw.active).toLowerCase() !== 'false',
  };
}

export function normalizeListItem(raw) {
  return {
    id: String(raw.id || stableId(raw.name)),
    name: String(raw.name || '').trim(),
    price: Math.round(Number(raw.price)),
    active: raw.active !== false && String(raw.active).toLowerCase() !== 'false',
  };
}

export function parseMatrix(matrix, kind) {
  const grid = Array.isArray(matrix) ? matrix : [];
  const headerIndex = grid.findIndex(row => Array.isArray(row) && row.some(cell => String(cell ?? '').trim() !== ''));
  if (headerIndex < 0) return { error: 'The file is empty.', rows: [], warnings: [] };

  const fields = kind === 'products' ? PRODUCT_FIELDS : LIST_FIELDS;
  const columns = new Map();
  const unknown = [];
  let duplicateColumn = '';

  grid[headerIndex].forEach((cell, index) => {
    const header = String(cell ?? '').trim();
    if (!header) return;
    const canonical = canonicalField(header, fields);
    if (!canonical) {
      unknown.push(header);
      return;
    }
    if (columns.has(canonical)) duplicateColumn = header;
    else columns.set(canonical, index);
  });

  if (duplicateColumn) return { error: `The column "${duplicateColumn}" is repeated.`, rows: [], warnings: [] };

  const missing = ['name', 'price'].filter(field => !columns.has(field));
  if (missing.length) {
    return {
      error: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Download the template and keep those column names.`,
      rows: [],
      warnings: [],
    };
  }

  const rows = [];
  grid.forEach((source, index) => {
    if (index <= headerIndex || !Array.isArray(source)) return;
    if (source.every(cell => String(cell ?? '').trim() === '')) return;
    const row = { __present: {}, __rowNumber: index + 1 };
    fields.forEach(field => {
      const column = columns.get(field);
      const value = column == null ? '' : String(source[column] ?? '').trim();
      row[field] = value;
      row.__present[field] = column != null && value !== '';
    });
    rows.push(row);
  });

  if (!rows.length) return { error: 'The file has column names but no product rows.', rows: [], warnings: [] };

  const warnings = unknown.length ? [`Ignored unknown columns: ${unknown.join(', ')}.`] : [];
  return { error: '', rows, warnings };
}

function validateMappedRow(row, kind) {
  const issues = [];
  const notes = [];
  const name = String(row.name || '').trim();
  if (!name) issues.push('Product name is required.');
  else if (name.length > 120) issues.push('Product name must be 120 characters or fewer.');

  const price = parsePrice(row.price);
  if (price.empty) issues.push('Selling price is required.');
  else if (!price.ok) issues.push('Selling price must be a number of zero or more.');
  else if (price.rounded) notes.push('Selling price was rounded to the nearest rupee.');

  let original = null;
  if (kind === 'products' && row.__present?.originalPrice) {
    const parsedOriginal = parsePrice(row.originalPrice);
    if (!parsedOriginal.ok) issues.push('Original price must be a number of zero or more, or be left blank.');
    else if (price.ok && parsedOriginal.value < price.value) issues.push('Original price cannot be less than the selling price.');
    else original = parsedOriginal.value;
    if (parsedOriginal.ok && parsedOriginal.rounded) notes.push('Original price was rounded to the nearest rupee.');
  }

  let active = true;
  if (row.__present?.active) {
    const parsedActive = parseActive(row.active);
    if (!parsedActive.ok) issues.push('Active must be true or false.');
    else active = parsedActive.value;
  }

  return { issues, notes, name, price: price.ok ? price.value : null, original, active };
}

function buildProduct(entry, match) {
  const present = entry.row.__present || {};
  const originalPrice = present.originalPrice
    ? entry.original
    : (match && match.originalPrice != null && match.originalPrice !== '' ? match.originalPrice : null);

  return normalizeProduct({
    ...(match || {}),
    id: match?.id || entry.id,
    name: entry.name,
    price: entry.price,
    originalPrice,
    description: present.description ? String(entry.row.description).trim() : (match?.description || ''),
    category: present.category ? String(entry.row.category).trim() : (match?.category || ''),
    image: present.image ? String(entry.row.image).trim() : (match?.image || '/image.png'),
    badge: present.badge ? String(entry.row.badge).trim() : (match?.badge || ''),
    active: present.active ? entry.active : (match ? match.active !== false : true),
  });
}

function buildListItem(entry, match) {
  const present = entry.row.__present || {};
  return normalizeListItem({
    id: match?.id || entry.id,
    name: entry.name,
    price: entry.price,
    active: present.active ? entry.active : (match ? match.active !== false : true),
  });
}

export function classifyImport(mappedRows, existing, kind) {
  const prepared = mappedRows.map(row => {
    const checked = validateMappedRow(row, kind);
    const providedId = String(row.id || '').trim();
    const id = providedId ? stableId(providedId) : (checked.name ? stableId(checked.name) : '');
    return {
      ...checked,
      row,
      rowNumber: row.__rowNumber,
      nameKey: normalizeName(checked.name),
      providedId: Boolean(providedId),
      id,
    };
  });

  const nameCounts = new Map();
  const idCounts = new Map();
  prepared.forEach(entry => {
    if (entry.nameKey) nameCounts.set(entry.nameKey, (nameCounts.get(entry.nameKey) || 0) + 1);
    if (entry.id) idCounts.set(entry.id, (idCounts.get(entry.id) || 0) + 1);
  });

  const classified = prepared.map(entry => {
    const issues = [...entry.issues];
    if (entry.nameKey && nameCounts.get(entry.nameKey) > 1) issues.push('Duplicate product name in this file.');
    if (entry.id && idCounts.get(entry.id) > 1) issues.push('Duplicate id in this file.');

    const base = {
      rowNumber: entry.rowNumber,
      notes: entry.notes,
      name: entry.name,
      price: entry.price,
      item: null,
      matchId: null,
    };

    if (issues.length) return { ...base, status: 'invalid', issues };

    const byId = existing.find(item => item.id === entry.id);
    const byName = existing.find(item => normalizeName(item.name) === entry.nameKey);
    if (byId && byName && byId.id !== byName.id) {
      return {
        ...base,
        status: 'invalid',
        issues: ['This id and name match two different saved items. Use the id of the item you want to update.'],
      };
    }

    const match = byId || byName || null;
    const item = kind === 'products' ? buildProduct(entry, match) : buildListItem(entry, match);
    return {
      ...base,
      status: match ? 'update' : 'add',
      issues: [],
      name: item.name,
      price: item.price,
      item,
      matchId: match ? match.id : null,
    };
  });

  const matchCounts = new Map();
  classified.forEach(row => {
    if (row.matchId) matchCounts.set(row.matchId, (matchCounts.get(row.matchId) || 0) + 1);
  });

  return classified.map(row => {
    if (!row.matchId || matchCounts.get(row.matchId) < 2) return row;
    return {
      ...row,
      status: 'invalid',
      item: null,
      issues: ['More than one row matches the same saved item.'],
    };
  });
}

export function summarizeImport(rows, mode, existing) {
  const invalid = rows.filter(row => row.status === 'invalid');
  const updates = rows.filter(row => row.status === 'update');
  const adds = rows.filter(row => row.status === 'add');

  if (mode === 'add') {
    return {
      add: adds.length,
      update: 0,
      rejected: invalid.length + updates.length,
      invalid: invalid.length,
      alreadySaved: updates.length,
      remove: 0,
    };
  }

  if (mode === 'update') {
    return {
      add: adds.length,
      update: updates.length,
      rejected: invalid.length,
      invalid: invalid.length,
      alreadySaved: 0,
      remove: 0,
    };
  }

  const keptIds = new Set(rows.filter(row => row.item).map(row => row.item.id));
  return {
    add: adds.length + updates.length,
    update: 0,
    rejected: invalid.length,
    invalid: invalid.length,
    alreadySaved: 0,
    remove: existing.filter(item => !keptIds.has(item.id)).length,
  };
}

export function applyImport(existing, rows, mode) {
  if (mode === 'replace') return rows.filter(row => row.status !== 'invalid').map(row => row.item);

  const next = existing.map(item => {
    if (mode !== 'update') return item;
    const match = rows.find(row => row.status === 'update' && row.matchId === item.id);
    return match ? match.item : item;
  });

  rows.forEach(row => {
    if (row.status === 'add') next.push(row.item);
  });
  return next;
}

export function importResultMessage(kind, mode, summary, savedCount) {
  const label = kind === 'products' ? 'products' : 'product list items';
  if (mode === 'replace') {
    return `Replaced the ${label} saved in this browser with ${savedCount}. Removed ${summary.remove} that were not in the file. Rejected ${summary.rejected}.`;
  }
  const already = summary.alreadySaved
    ? ` ${summary.alreadySaved} rejected ${summary.alreadySaved === 1 ? 'row was' : 'rows were'} already saved, so ${summary.alreadySaved === 1 ? 'it was' : 'they were'} not added again.`
    : '';
  return `Imported ${summary.add}. Updated ${summary.update}. Rejected ${summary.rejected}.${already}`;
}

function duplicateName(items, name, exceptId) {
  const key = normalizeName(name);
  return items.some(item => item.id !== exceptId && normalizeName(item.name) === key);
}

export function validateProductForm(draft, items) {
  const errors = {};
  const name = String(draft.name || '').trim();
  if (!name) errors.name = 'Enter a product name.';
  else if (name.length > 120) errors.name = 'Use 120 characters or fewer.';
  else if (duplicateName(items, name, draft.id)) errors.name = 'A product with this name is already saved.';

  const price = parsePrice(draft.price);
  if (!price.ok) errors.price = 'Enter a selling price of zero or more.';

  if (String(draft.originalPrice ?? '').trim()) {
    const original = parsePrice(draft.originalPrice);
    if (!original.ok) errors.originalPrice = 'Enter an original price of zero or more, or leave it blank.';
    else if (price.ok && original.value < price.value) errors.originalPrice = 'Original price cannot be less than the selling price.';
  }

  const images = Array.isArray(draft.images) ? draft.images.map(url => String(url || '').trim()).filter(Boolean) : [];
  if (!images.length) errors.images = 'Add at least one product image.';
  else if (images.length > MAX_PRODUCT_IMAGES) errors.images = `Use ${MAX_PRODUCT_IMAGES} images or fewer.`;
  else if (images.some(url => !isStoredImageUrl(url))) errors.images = 'Remove any image that does not have a valid address.';
  else if (draft.image && !images.includes(String(draft.image).trim())) errors.images = 'Choose the homepage image from the uploaded pictures.';
  return errors;
}

export function productFromForm(draft, items) {
  const existing = items.find(item => item.id === draft.id);
  const originalText = String(draft.originalPrice ?? '').trim();
  return normalizeProduct({
    ...(existing || {}),
    id: existing?.id || uniqueId(draft.name, items),
    name: String(draft.name).trim(),
    price: parsePrice(draft.price).value,
    originalPrice: originalText ? parsePrice(originalText).value : null,
    description: sanitizeRichText(String(draft.description || '').trim()),
    category: String(draft.category || '').trim(),
    image: String(draft.image || '').trim(),
    images: Array.isArray(draft.images) ? draft.images : [],
    badge: String(draft.badge || '').trim(),
    active: Boolean(draft.active),
  });
}

export function validateListForm(draft, items) {
  const errors = {};
  const name = String(draft.name || '').trim();
  if (!name) errors.name = 'Enter a product name.';
  else if (name.length > 120) errors.name = 'Use 120 characters or fewer.';
  else if (duplicateName(items, name, draft.id)) errors.name = 'A list item with this name is already saved.';

  if (!parsePrice(draft.price).ok) errors.price = 'Enter a price of zero or more.';
  return errors;
}

export function listItemFromForm(draft, items) {
  const existing = items.find(item => item.id === draft.id);
  return normalizeListItem({
    id: existing?.id || uniqueId(draft.name, items),
    name: String(draft.name).trim(),
    price: parsePrice(draft.price).value,
    active: Boolean(draft.active),
  });
}

export function rowOutcome(row, mode) {
  if (row.status === 'invalid') return 'Rejected';
  if (mode === 'replace') return 'Included';
  if (row.status === 'update' && mode === 'add') return 'Already saved';
  if (row.status === 'update') return 'Will update';
  return 'Will add';
}
