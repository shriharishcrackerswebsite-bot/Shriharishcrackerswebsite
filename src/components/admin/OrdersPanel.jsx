import { useState } from 'react';
import { ORDER_STATUSES, orderStatusLabel, useAdminOrders } from '../../lib/orders';
import { money } from '../../lib/money';
import ConfirmDialog from '../ConfirmDialog';

const sourceLabel = {
  products: 'Products',
  productList: 'Product List',
};

function formatWhen(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for timestamp';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function OrdersPanel({ actor }) {
  const directory = useAdminOrders(true);
  const [busyId, setBusyId] = useState('');
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const changeStatus = async (order, status) => {
    setFeedback(null);
    setBusyId(order.id);
    try {
      await directory.updateStatus(actor, order, status);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusyId('');
    }
  };

  const remove = async () => {
    if (!pending) return;
    setBusyId(pending.id);
    setFeedback(null);
    try {
      await directory.remove(actor, pending);
      setFeedback({ type: 'success', text: `Removed the order for ${pending.customerName}.` });
      setPending(null);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
      setPending(null);
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="admin-section">
      <header className="admin-section__head">
        <div>
          <h1>Customer Orders</h1>
          <p>Shop and product-list enquiries saved in Firestore. Status updates appear on the customer’s enquiry confirmation.</p>
        </div>
      </header>
      {feedback && <p className={feedback.type === 'error' ? 'admin-error' : 'admin-success'} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      {directory.error && <p className="admin-error" role="alert">{directory.error}</p>}
      {directory.loading && <p className="admin-empty" role="status">Loading orders…</p>}
      {!directory.loading && !directory.error && directory.orders.length === 0 && <p className="admin-empty">No customer orders have been submitted yet.</p>}
      {directory.orders.length > 0 && (
        <div className="admin-activity">
          {directory.orders.map(order => (
            <article key={order.id}>
              <strong>{order.customerName}</strong>
              <p>{order.phone} · {sourceLabel[order.source] || order.source}</p>
              <p>{formatWhen(order.createdAt)} · {money.format(order.total || 0)}</p>
              {order.address ? <p>{order.address}</p> : null}
              <ul>
                {(order.items || []).map(item => (
                  <li key={`${order.id}-${item.id}`}>{item.name} × {item.quantity} · {money.format((item.price || 0) * (item.quantity || 0))}</li>
                ))}
              </ul>
              <label className="admin-field">Status
                <select value={order.status || 'received'} disabled={busyId === order.id} onChange={event => changeStatus(order, event.target.value)}>
                  {ORDER_STATUSES.map(status => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}
                </select>
              </label>
              <button type="button" disabled={Boolean(busyId)} onClick={() => setPending(order)}>Delete</button>
            </article>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this order?"
        message={pending ? `${pending.customerName}’s order will be removed from Firestore.` : ''}
        confirmLabel={busyId ? 'Removing…' : 'Delete'}
        tone="danger"
        onCancel={() => { if (!busyId) setPending(null); }}
        onConfirm={remove}
      />
    </section>
  );
}
