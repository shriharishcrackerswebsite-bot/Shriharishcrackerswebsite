import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from './firebase.js';
import { normalizeListItem, normalizeProduct, productGallery } from './catalog.js';
import { compareCatalog, orderField, planCreateOrder, planDeleteOrder, planImportOrders, planMove } from './catalogOrder.js';
import { actorFromUser, ADMIN_EMAIL, isMainAdmin, normalizeAdminEmail } from './adminIdentity.js';

export const COLLECTIONS = {
  products: 'products',
  list: 'productList',
};

const BATCH_LIMIT = 200;
export { ADMIN_EMAIL };
const ACCESS_DENIED = 'Access denied. This Google account is not authorized to manage Shri Harish Crackers.';

export function firestoreErrorMessage(error) {
  const code = String(error?.code || '');
  if (code === 'permission-denied') {
    return 'Firestore refused this request. Public visitors can only read active products. Changes require the authorized Google administrator, and the Firestore security rules must be deployed.';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'network-request-failed') {
    return 'Firestore could not be reached. Check the connection and try again.';
  }
  if (code === 'unauthenticated') return 'Sign in with an administrator account before changing the catalog.';
  if (code === 'not-found') return 'That Firestore record no longer exists.';
  return error?.message || 'Firestore could not complete this request.';
}

export function authErrorMessage(error) {
  const code = String(error?.code || '');
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Google sign-in was cancelled.';
  if (code === 'auth/popup-blocked') return 'The Google sign-in window was blocked. Allow pop-ups for this site and try again.';
  if (code === 'auth/unauthorized-domain') return 'This website is not an authorized domain for Google sign-in. Add it under Firebase Authentication settings.';
  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not turned on for this Firebase project. In the Firebase console, open Authentication and enable the Google provider.';
  }
  if (code === 'auth/account-exists-with-different-credential') return 'This email is already registered with a different sign-in method.';
  if (code === 'auth/too-many-requests') return 'Too many sign-in attempts. Wait a moment and try again.';
  if (code === 'auth/network-request-failed') return 'Firebase Authentication could not be reached. Check the connection and try again.';
  return error?.message || 'Google sign-in could not be completed.';
}

export function isAuthorizedAdmin(user) {
  return isMainAdmin(user);
}

function requireActor(actor) {
  if (!actor?.email || !actor?.name) throw new Error('Sign in again before changing the catalog.');
  return actor;
}

function activityImageValue(url) {
  const value = String(url || '');
  if (!value.startsWith('data:image/')) return value;
  const kilobytes = Math.max(1, Math.round(value.length / 1024));
  let hash = 0;
  for (let index = 0; index < value.length; index += 128) hash = (hash + value.charCodeAt(index)) % 1000000;
  return `Saved photo (${kilobytes} KB #${hash})`;
}

function snapshotValue(kind, source) {
  if (!source) return null;
  const numeric = Number(source.price);
  const price = Number.isFinite(numeric) ? Math.round(numeric) : null;
  if (kind === 'list') {
    return {
      name: String(source.name || ''),
      price,
      active: source.active !== false,
    };
  }
  const originalNumeric = Number(source.originalPrice);
  const original = Number.isFinite(originalNumeric) ? Math.round(originalNumeric) : null;
  const gallery = productGallery(source);
  return {
    name: String(source.name || ''),
    price,
    originalPrice: original != null && price != null && original >= price ? original : null,
    description: String(source.description || ''),
    category: String(source.category || ''),
    image: activityImageValue(gallery.image),
    images: gallery.images.map(activityImageValue),
    badge: String(source.badge || ''),
    productVideoUrl: String(source.productVideoUrl || ''),
    instagramVideoUrl: String(source.instagramVideoUrl || ''),
    instagramThumbnailUrl: String(source.instagramThumbnailUrl || ''),
    active: source.active !== false,
  };
}

export function queueActivity(batch, actor, action, targetType, targetId, targetName, oldValue, newValue) {
  const identity = requireActor(actor);
  batch.set(doc(collection(db, 'activityLogs')), {
    adminName: identity.name,
    adminEmail: identity.email,
    action,
    targetType,
    targetId: String(targetId),
    targetName: String(targetName || '').slice(0, 120),
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    createdAt: serverTimestamp(),
  });
}

function collectionName(kind) {
  const name = COLLECTIONS[kind];
  if (!name) throw new Error('Unknown catalog.');
  return name;
}

function parseDoc(kind, snapshot) {
  const data = snapshot.data() || {};
  const price = Number(data.price);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name || !Number.isFinite(price) || price < 0) {
    return { invalid: true, id: snapshot.id };
  }
  const raw = {
    ...data,
    id: snapshot.id,
    name,
    price,
    active: data.active !== false,
  };
  const item = kind === 'products' ? normalizeProduct(raw) : normalizeListItem(raw);
  const field = orderField(kind);
  const order = data[field];
  if (Number.isInteger(order) && order >= 0) item[field] = order;
  else delete item[field];
  return { invalid: false, item };
}

function usableId(id) {
  return typeof id === 'string' && id.length > 0 && id !== '.' && id !== '..' && !id.includes('/') && !/^__.*__$/.test(id);
}

function productData(item, creating) {
  const price = Math.round(Number(item.price));
  const original = Number.isFinite(Number(item.originalPrice)) ? Math.round(Number(item.originalPrice)) : null;
  const data = {
    name: item.name,
    price,
    originalPrice: original != null && original >= price ? original : null,
    description: item.description || '',
    category: item.category || '',
    image: productGallery(item).image,
    images: productGallery(item).images,
    badge: item.badge || '',
    productVideoUrl: String(item.productVideoUrl || '').trim(),
    instagramVideoUrl: String(item.instagramVideoUrl || '').trim(),
    instagramThumbnailUrl: String(item.instagramThumbnailUrl || '').trim(),
    active: item.active !== false,
    discount: item.discount || 0,
    highlights: Array.isArray(item.highlights) ? item.highlights : [],
    theme: item.theme || 'purple',
    featured: Boolean(item.featured),
    updatedAt: serverTimestamp(),
  };
  if (creating) data.createdAt = serverTimestamp();
  return data;
}

function listData(item, creating) {
  const data = {
    name: item.name,
    price: Math.round(Number(item.price)),
    active: item.active !== false,
    updatedAt: serverTimestamp(),
  };
  if (creating) data.createdAt = serverTimestamp();
  return data;
}

function documentData(kind, item, creating) {
  return kind === 'products' ? productData(item, creating) : listData(item, creating);
}

function orderLog(field, value) {
  return { [field]: value == null ? 'unset' : String(value) };
}

async function loadCatalogItems(kind) {
  const snapshot = await getDocs(collection(db, collectionName(kind)));
  const items = [];
  snapshot.forEach(entry => {
    const parsed = parseDoc(kind, entry);
    if (!parsed.invalid) items.push(parsed.item);
  });
  return items;
}

async function writeOrderPositions(kind, changes) {
  const field = orderField(kind);
  const name = collectionName(kind);
  for (let index = 0; index < changes.length; index += BATCH_LIMIT) {
    const chunk = changes.slice(index, index + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach(change => {
      batch.update(doc(db, name, change.id), { [field]: change.to, updatedAt: serverTimestamp() });
    });
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  }
}

function listen(kind, adminView, onData, onError) {
  const ref = collection(db, collectionName(kind));
  const source = adminView ? ref : query(ref, where('active', '==', true));
  return onSnapshot(source, snapshot => {
    const items = [];
    let invalidCount = 0;
    snapshot.forEach(entry => {
      const parsed = parseDoc(kind, entry);
      if (parsed.invalid) invalidCount += 1;
      else items.push(parsed.item);
    });
    items.sort((left, right) => compareCatalog(kind, left, right));
    onData({ items, invalidCount });
  }, error => onError(firestoreErrorMessage(error)));
}

export function usePublicCatalog(kind) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = listen(kind, false, data => {
      setItems(data.items);
      setLoading(false);
      setError('');
    }, message => {
      setItems([]);
      setLoading(false);
      setError(message);
    });
    return unsubscribe;
  }, [kind]);

  return { items, loading, error };
}

export function useAdminCatalog(kind, actor) {
  const [items, setItems] = useState([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = listen(kind, true, data => {
      setItems(data.items);
      setInvalidCount(data.invalidCount);
      setLoading(false);
      setError('');
    }, message => {
      setItems([]);
      setInvalidCount(0);
      setLoading(false);
      setError(message);
    });
    return unsubscribe;
  }, [kind]);

  const createItem = async item => {
    if (!usableId(item.id)) throw new Error('That product id cannot be stored in Firestore.');
    const ref = doc(db, collectionName(kind), item.id);
    const existing = await getDoc(ref).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (existing.exists()) throw new Error('A record with this id is already in Firestore. It was not overwritten.');
    const current = await loadCatalogItems(kind).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    const planned = planCreateOrder(kind, current);
    if (planned.backfill.length) await writeOrderPositions(kind, planned.backfill);
    const data = documentData(kind, item, true);
    data[orderField(kind)] = planned.nextOrder;
    const batch = writeBatch(db);
    batch.set(ref, data);
    queueActivity(batch, actor, 'create', collectionName(kind), item.id, item.name, null, snapshotValue(kind, item));
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  };

  const moveItem = async (id, direction) => {
    const current = await loadCatalogItems(kind).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    const planned = planMove(kind, current, id, direction);
    if (!planned.ok) throw new Error(planned.message);
    if (!planned.changes.length) return;
    const field = orderField(kind);
    const name = collectionName(kind);
    const moved = planned.moved;
    const withLog = planned.changes.slice(0, BATCH_LIMIT - 1);
    const rest = planned.changes.slice(withLog.length);
    const batch = writeBatch(db);
    withLog.forEach(change => {
      batch.update(doc(db, name, change.id), { [field]: change.to, updatedAt: serverTimestamp() });
    });
    queueActivity(batch, actor, 'update', name, moved.id, moved.name, orderLog(field, moved.from), orderLog(field, moved.to));
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (rest.length) await writeOrderPositions(kind, rest);
  };

  const updateItem = async item => {
    if (!usableId(item.id)) throw new Error('That product id cannot be stored in Firestore.');
    const ref = doc(db, collectionName(kind), item.id);
    const existing = await getDoc(ref).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (!existing.exists()) throw new Error('That product is no longer in Firestore.');
    const batch = writeBatch(db);
    batch.set(ref, documentData(kind, item, false), { merge: true });
    queueActivity(batch, actor, 'update', collectionName(kind), item.id, item.name, snapshotValue(kind, existing.data()), snapshotValue(kind, item));
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  };

  const deleteItem = async id => {
    const ref = doc(db, collectionName(kind), id);
    const existing = await getDoc(ref).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (!existing.exists()) throw new Error('That product is no longer in Firestore.');
    const current = await loadCatalogItems(kind).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    const compact = planDeleteOrder(kind, current, id);
    const field = orderField(kind);
    const name = collectionName(kind);
    const inline = compact.slice(0, BATCH_LIMIT - 2);
    const rest = compact.slice(inline.length);
    const batch = writeBatch(db);
    batch.delete(ref);
    inline.forEach(change => {
      batch.update(doc(db, name, change.id), { [field]: change.to, updatedAt: serverTimestamp() });
    });
    queueActivity(batch, actor, 'delete', collectionName(kind), id, existing.data().name || id, snapshotValue(kind, existing.data()), null);
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (rest.length) await writeOrderPositions(kind, rest);
  };

  const importRows = (rows, mode) => writeImport(kind, rows, mode, actor);

  const importMissing = missing => writeImport(kind, missing.map(item => ({
    status: 'add',
    item,
    matchId: null,
  })), 'add', actor);

  return { items, invalidCount, loading, error, createItem, updateItem, deleteItem, moveItem, importRows, importMissing };
}

export async function writeImport(kind, rows, mode, actor) {
  const writes = [];
  const failures = [];
  rows.forEach(row => {
    const include = mode === 'update' ? row.status === 'add' || row.status === 'update' : row.status === 'add';
    if (!include || !row.item) return;
    const id = row.matchId || row.item.id;
    if (!usableId(id)) {
      failures.push(`“${row.item.name || id}” was not written because its id cannot be stored in Firestore.`);
      return;
    }
    writes.push({
      id: row.matchId || row.item.id,
      item: { ...row.item, id: row.matchId || row.item.id },
      creating: row.status === 'add',
    });
  });

  if (!writes.length) {
    return {
      ok: failures.length === 0,
      written: 0,
      failed: failures.length,
      message: failures.join(' ') || 'Nothing was written to Firestore.',
    };
  }

  let pending;
  const existingById = new Map();
  try {
    const snapshot = await getDocs(collection(db, collectionName(kind)));
    snapshot.forEach(entry => existingById.set(entry.id, entry.data()));
    pending = writes.filter(entry => {
      if (entry.creating && existingById.has(entry.id)) {
        failures.push(`“${entry.item.name}” already exists in Firestore and was not overwritten.`);
        return false;
      }
      return true;
    });
  } catch (error) {
    return { ok: false, written: 0, failed: writes.length, message: firestoreErrorMessage(error) };
  }

  if (!pending.length) {
    return {
      ok: false,
      written: 0,
      failed: failures.length,
      message: failures.join(' ') || 'Nothing was written to Firestore.',
    };
  }

  const existingItems = [];
  existingById.forEach((data, id) => {
    const parsed = parseDoc(kind, { id, data: () => data });
    if (!parsed.invalid) existingItems.push(parsed.item);
  });
  const importedOrders = planImportOrders(kind, existingItems, pending.filter(entry => entry.creating).map(entry => entry.id));
  const orderById = new Map(importedOrders.assignments.map(entry => [entry.id, entry.order]));
  if (importedOrders.backfill.length) {
    try {
      await writeOrderPositions(kind, importedOrders.backfill);
    } catch (error) {
      return { ok: false, written: 0, failed: pending.length, message: error.message };
    }
  }

  let written = 0;
  let added = 0;
  let updated = 0;
  for (let index = 0; index < pending.length; index += BATCH_LIMIT) {
    const chunk = pending.slice(index, index + BATCH_LIMIT);
    const batchNumber = Math.floor(index / BATCH_LIMIT) + 1;
    try {
      const batch = writeBatch(db);
      chunk.forEach(entry => {
        const ref = doc(db, collectionName(kind), entry.id);
        const data = documentData(kind, entry.item, entry.creating);
        if (entry.creating) data[orderField(kind)] = orderById.get(entry.id);
        if (entry.creating) batch.set(ref, data);
        else batch.set(ref, data, { merge: true });
        const previous = existingById.get(entry.id);
        queueActivity(
          batch,
          actor,
          entry.creating ? 'create' : 'update',
          collectionName(kind),
          entry.id,
          entry.item.name,
          entry.creating ? null : snapshotValue(kind, previous),
          snapshotValue(kind, entry.item),
        );
      });
      await batch.commit();
      const created = chunk.filter(entry => entry.creating).length;
      written += chunk.length;
      added += created;
      updated += chunk.length - created;
    } catch (error) {
      failures.push(`Batch ${batchNumber} (${chunk.length} records) failed: ${firestoreErrorMessage(error)}`);
    }
  }

  if (written === 0) {
    return {
      ok: false,
      written: 0,
      failed: pending.length,
      message: failures.join(' ') || 'Firestore did not save this import.',
    };
  }

  const saved = `Firestore saved ${written} record${written === 1 ? '' : 's'} (${added} new, ${updated} updated).`;
  if (!failures.length) return { ok: true, written, failed: 0, message: saved };
  return {
    ok: false,
    written,
    failed: pending.length - written,
    message: `${saved} ${failures.join(' ')}`,
  };
}

export function useAdminSession() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [main, setMain] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const deniedMessage = useRef('');

  useEffect(() => {
    let active = true;
    let accessUnsub = () => {};
    const unsubscribe = onAuthStateChanged(auth, async next => {
      accessUnsub();
      accessUnsub = () => {};
      if (!next) {
        if (!active) return;
        setUser(null);
        setAdmin(false);
        setMain(false);
        setError(deniedMessage.current);
        setReady(true);
        return;
      }
      const email = normalizeAdminEmail(next.email);
      const mainAdmin = isMainAdmin(next);
      let allowed = mainAdmin;
      if (!mainAdmin && next.emailVerified && email) {
        try {
          const record = await getDoc(doc(db, 'adminAccess', email));
          allowed = record.exists();
        } catch {
          allowed = false;
        }
      }
      if (!allowed) {
        deniedMessage.current = ACCESS_DENIED;
        if (active) {
          setUser(null);
          setAdmin(false);
          setMain(false);
          setError(ACCESS_DENIED);
          setReady(true);
        }
        try {
          await signOut(auth);
        } catch {
          if (!active) return;
          setError(ACCESS_DENIED);
          setReady(true);
        }
        return;
      }
      deniedMessage.current = '';
      if (!active) return;
      setUser(next);
      setAdmin(true);
      setMain(mainAdmin);
      setError('');
      setReady(true);
      if (!mainAdmin) {
        accessUnsub = onSnapshot(doc(db, 'adminAccess', email), snapshot => {
          if (!active || snapshot.exists()) return;
          deniedMessage.current = ACCESS_DENIED;
          signOut(auth);
        }, () => {
          if (!active) return;
          deniedMessage.current = ACCESS_DENIED;
          signOut(auth);
        });
      }
    });
    return () => {
      active = false;
      accessUnsub();
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    deniedMessage.current = '';
    setError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (signInError) {
      throw new Error(authErrorMessage(signInError), { cause: signInError });
    }
  };

  const endSession = () => {
    deniedMessage.current = '';
    setError('');
    return signOut(auth);
  };

  return { user, admin, main, actor: user ? actorFromUser(user) : null, ready, error, signInWithGoogle, endSession };
}
