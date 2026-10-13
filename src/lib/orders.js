import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import { firestoreErrorMessage, queueActivity } from './firestoreCatalog.js';
import { orderEmailParams, sendOrderEmail } from './orderEmail.js';

export const ORDER_STATUSES = ['received', 'accepted', 'processing', 'dispatched', 'completed', 'cancelled'];

export const ORDER_CATEGORIES = [
  { id: 'all', label: 'All Orders' },
  { id: 'received', label: 'New / Received' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'processing', label: 'Processing' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Rejected / Cancelled' },
];

const statusLabels = {
  received: 'New / Received',
  confirmed: 'Accepted',
  accepted: 'Accepted',
  processing: 'Processing',
  dispatched: 'Dispatched',
  completed: 'Completed',
  cancelled: 'Rejected / Cancelled',
  rejected: 'Rejected / Cancelled',
};

export function orderStatusLabel(status) {
  return statusLabels[status] || status || 'New / Received';
}

export function orderCategory(status) {
  if (status === 'confirmed' || status === 'accepted') return 'accepted';
  if (status === 'processing') return 'processing';
  if (status === 'dispatched') return 'dispatched';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled' || status === 'rejected') return 'cancelled';
  return 'received';
}

export function statusChoice(status) {
  const category = orderCategory(status);
  return ORDER_STATUSES.includes(category) ? category : 'received';
}

function orderItems(items) {
  return items.map(item => ({
    id: String(item.id || '').slice(0, 120),
    name: String(item.name || '').trim().slice(0, 120),
    quantity: Math.round(Number(item.quantity)),
    price: Math.round(Number(item.price)),
  }));
}

export async function saveOrder({ customerName, phone, address, source, items }) {
  const lines = orderItems(items);
  const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const ref = doc(collection(db, 'orders'));
  await setDoc(ref, {
    customerName,
    phone,
    address: String(address || '').slice(0, 240),
    source,
    items: lines,
    total,
    status: 'received',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(error => {
    throw new Error(firestoreErrorMessage(error), { cause: error });
  });
  await sendOrderEmail(orderEmailParams({
    id: ref.id,
    customerName,
    phone,
    address: String(address || '').slice(0, 240),
    items: lines,
    total,
    statusLabel: orderStatusLabel('received'),
    placedAt: new Date(),
  }));
  return ref.id;
}

export function useCustomerOrder(orderId) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return undefined;
    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), snapshot => {
      setStatus(snapshot.exists() ? snapshot.data().status || '' : '');
      setError('');
    }, failure => {
      setStatus('');
      setError(firestoreErrorMessage(failure));
    });
    return unsubscribe;
  }, [orderId]);

  return { status, error };
}

export function useAdminOrders(enabled) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    const source = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(source, snapshot => {
      setOrders(snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() })));
      setLoading(false);
      setError('');
    }, failure => {
      setOrders([]);
      setLoading(false);
      setError(firestoreErrorMessage(failure));
    });
    return unsubscribe;
  }, [enabled]);

  const updateStatus = async (actor, order, status) => {
    if (!ORDER_STATUSES.includes(status) || order.status === status) return;
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', order.id), { status, updatedAt: serverTimestamp() });
    queueActivity(batch, actor, 'update', 'orders', order.id, order.customerName, { status: order.status }, { status });
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  };

  const remove = async (actor, order) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'orders', order.id));
    queueActivity(batch, actor, 'delete', 'orders', order.id, order.customerName, { name: order.customerName, status: order.status }, null);
    await batch.commit().catch(error => {
      throw new Error(firestoreErrorMessage(error), { cause: error });
    });
  };

  return { orders, loading, error, updateStatus, remove };
}
