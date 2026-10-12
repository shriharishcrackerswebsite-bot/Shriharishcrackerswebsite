import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { firestoreErrorMessage } from './firestoreCatalog.js';
import { whatsappUrl } from '../data/business.js';

export const EXIT_SOURCE = 'exit_popup';
export const NOTICE_STORAGE_KEY = 'shriHarishNoticeAccepted';
const resolvedKey = 'shcExitResolved';

export function hasAcceptedNotice() {
  try {
    return window.localStorage.getItem(NOTICE_STORAGE_KEY) === 'true';
  } catch (error) {
    console.error('Unable to read the important notice acknowledgement.', error);
    return false;
  }
}

export function exitEnquiryResolved() {
  try {
    return window.sessionStorage.getItem(resolvedKey) || '';
  } catch {
    return '';
  }
}

export function rememberExitEnquiry(value) {
  try {
    window.sessionStorage.setItem(resolvedKey, value);
  } catch {
    // The visitor can still leave. Remembering only avoids asking again.
  }
}

export function exitEnquiryMessage(name, phone) {
  return [
    'Hello Shri Harish Crackers,',
    '',
    'I was about to leave the website and would like to enquire.',
    '',
    `Name: ${name}`,
    `Phone: ${phone}`,
  ].join('\n');
}

export function exitEnquiryWhatsAppUrl(name, phone) {
  return whatsappUrl(exitEnquiryMessage(name, phone));
}

export async function saveExitEnquiry({ name, phone }) {
  const ref = doc(collection(db, 'exitEnquiries'));
  await setDoc(ref, {
    name,
    phone,
    source: EXIT_SOURCE,
    status: 'submitted',
    createdAt: serverTimestamp(),
  }).catch(error => {
    throw new Error(firestoreErrorMessage(error), { cause: error });
  });
  return ref.id;
}

export function useExitEnquiries(enabled) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    const source = query(collection(db, 'exitEnquiries'), orderBy('createdAt', 'desc'), limit(100));
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
