import { useState } from 'react';
import { ORDER_CATEGORIES, ORDER_STATUSES, orderCategory, orderStatusLabel, statusChoice, useAdminOrders } from '../../lib/orders';
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
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const orders = directory.orders;
  const shown = filter === 'all' ? orders : orders.filter(order => orderCategory(order.status) === filter);

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
      {!directory.loading && !directory.error && orders.length === 0 && <p className="admin-empty">No customer orders have been submitted yet.</p>}
      {!directory.loading && !directory.error && orders.length > 0 && (
        <>
          <div className="order-filters" role="tablist" aria-label="Order status">
            {ORDER_CATEGORIES.map(category => {
              const count = category.id === 'all' ? orders.length : orders.filter(order => orderCategory(order.status) === category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === category.id}
                  className={filter === category.id ? 'is-current' : ''}
                  onClick={() => setFilter(category.id)}
                >
                  {category.label}
                  <b>{count}</b>
                </button>
              );
            })}
          </div>
          {shown.length === 0 && <p className="admin-empty">No orders in this category.</p>}
          {shown.length > 0 && (
            <div className="admin-activity">
              {shown.map(order => {
                const open = openId === order.id;
                return (
                  <article key={order.id}>
                    <div className="order-summary">
                      <div>
                        <strong>{order.customerName}</strong>
                        <p>Order {order.id}</p>
                        <p>{order.phone} · {formatWhen(order.createdAt)}</p>
                        <p>{money.format(order.total || 0)} · {orderStatusLabel(order.status)}</p>
                      </div>
                      <button type="button" onClick={() => setOpenId(open ? '' : order.id)} aria-expanded={open}>
                        {open ? 'Hide details' : 'View details'}
                      </button>
                    </div>
                    {open && (
                      <div className="order-details">
                        <p>{sourceLabel[order.source] || order.source}</p>
                        {order.address ? <p>{order.address}</p> : <p>No address provided</p>}
                        <ul>
                          {(order.items || []).map(item => (
                            <li key={`${order.id}-${item.id}`}>
                              {item.name} × {item.quantity} · {money.format(item.price || 0)} each · {money.format((item.price || 0) * (item.quantity || 0))}
                            </li>
                          ))}
                        </ul>
                        <label className="admin-field">Status
                          <select value={statusChoice(order.status)} disabled={busyId === order.id} onChange={event => changeStatus(order, event.target.value)}>
                            {ORDER_STATUSES.map(status => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}
                          </select>
                        </label>
                        <button type="button" disabled={Boolean(busyId)} onClick={() => setPending(order)}>Delete</button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
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
