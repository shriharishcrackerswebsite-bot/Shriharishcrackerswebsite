import { useEffect, useState } from 'react';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import { ADMIN_EMAIL, isPlausibleEmail, normalizeAdminEmail } from './adminIdentity.js';
import { firestoreErrorMessage, queueActivity } from './firestoreCatalog.js';

export function useAdminDirectory(enabled) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = onSnapshot(collection(db, 'adminAccess'), snapshot => {
      const next = [];
      snapshot.forEach(entry => next.push({ id: entry.id, email: entry.data().email || entry.id }));
      next.sort((left, right) => left.email.localeCompare(right.email));
      setAdmins(next);
      setLoading(false);
      setError('');
    }, failure => {
      setAdmins([]);
      setLoading(false);
      setError(firestoreErrorMessage(failure));
    });
    return unsubscribe;
  }, [enabled]);

  const grant = async (actor, email) => {
    const normalized = normalizeAdminEmail(email);
    if (!isPlausibleEmail(normalized)) throw new Error('Enter a valid email address.');
    if (normalized === ADMIN_EMAIL) throw new Error('That account already has permanent administrator access.');
    const ref = doc(db, 'adminAccess', normalized);
    const existing = await getDoc(ref).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (existing.exists()) throw new Error('That email already has administrator access.');
    const batch = writeBatch(db);
    batch.set(ref, { email: normalized, grantedBy: actor.email, createdAt: serverTimestamp() });
    queueActivity(batch, actor, 'grant-admin', 'adminAccess', normalized, normalized, null, { email: normalized });
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  };

  const revoke = async (actor, email) => {
    const normalized = normalizeAdminEmail(email);
    if (normalized === ADMIN_EMAIL) throw new Error('The main administrator cannot be removed.');
    const ref = doc(db, 'adminAccess', normalized);
    const existing = await getDoc(ref).catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
    if (!existing.exists()) throw new Error('That email is not an administrator.');
    const batch = writeBatch(db);
    batch.delete(ref);
    queueActivity(batch, actor, 'revoke-admin', 'adminAccess', normalized, normalized, { email: normalized }, null);
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  };

  return { admins, loading, error, grant, revoke };
}

export function useActivityLog(enabled) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    const source = query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'), limit(200));
    const unsubscribe = onSnapshot(source, snapshot => {
      setEntries(snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() })));
      setLoading(false);
      setError('');
    }, failure => {
      setEntries([]);
      setLoading(false);
      setError(firestoreErrorMessage(failure));
    });
    return unsubscribe;
  }, [enabled]);

  return { entries, loading, error };
}
