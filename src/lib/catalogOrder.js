export function orderField(kind) {
  if (kind === 'products') return 'displayOrder';
  if (kind === 'list') return 'listDisplayOrder';
  throw new Error('Unknown catalog.');
}

export function storedOrder(kind, item) {
  const value = item?.[orderField(kind)];
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export function compareCatalog(kind, left, right) {
  const leftRank = storedOrder(kind, left) ?? Number.POSITIVE_INFINITY;
  const rightRank = storedOrder(kind, right) ?? Number.POSITIVE_INFINITY;
  if (leftRank !== rightRank) return leftRank - rightRank;
  const byName = String(left?.name || '').localeCompare(String(right?.name || ''), 'en');
  if (byName) return byName;
  return String(left?.id || '').localeCompare(String(right?.id || ''));
}

export function sortCatalog(kind, items) {
  return [...items].sort((left, right) => compareCatalog(kind, left, right));
}

function orderChanges(kind, sequence) {
  const field = orderField(kind);
  return sequence.flatMap((item, position) => {
    const from = storedOrder(kind, item);
    if (from === position) return [];
    return [{ id: item.id, name: item.name, field, from, to: position }];
  });
}

export function planMove(kind, items, id, direction) {
  const sorted = sortCatalog(kind, items);
  const index = sorted.findIndex(item => item.id === id);
  if (index < 0) return { ok: false, message: 'That item is no longer in the catalog.' };
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (nextIndex < 0) return { ok: false, message: 'That item is already first.' };
  if (nextIndex >= sorted.length) return { ok: false, message: 'That item is already last.' };
  const sequence = sorted.slice();
  const [moved] = sequence.splice(index, 1);
  sequence.splice(nextIndex, 0, moved);
  const changes = orderChanges(kind, sequence);
  return {
    ok: true,
    changes,
    moved: changes.find(change => change.id === id) || { id, name: moved.name, field: orderField(kind), from: storedOrder(kind, moved), to: nextIndex },
    sequence,
  };
}

export function planCreateOrder(kind, items) {
  const sorted = sortCatalog(kind, items);
  return { backfill: orderChanges(kind, sorted), nextOrder: sorted.length };
}

export function planDeleteOrder(kind, items, id) {
  return orderChanges(kind, sortCatalog(kind, items).filter(item => item.id !== id));
}

export function planImportOrders(kind, existingItems, createIds) {
  const sorted = sortCatalog(kind, existingItems);
  return {
    backfill: orderChanges(kind, sorted),
    assignments: createIds.map((id, offset) => ({ id, order: sorted.length + offset })),
  };
}

export function moveControlState(index, count, searching) {
  return {
    up: Boolean(searching) || index <= 0,
    down: Boolean(searching) || index < 0 || index >= count - 1,
  };
}
