import emailjs from '@emailjs/browser';
import { money } from './money.js';

const PUBLIC_KEY = '2_5MDhGicO2KsUa24';
const SERVICE_ID = 'service_p22rh8j';
const TEMPLATE_ID = 'template_6vllr2p';
const attempted = new Set();

export function orderEmailParams({ id, customerName, phone, address, items, total, statusLabel, placedAt }) {
  const lines = (items || []).map(item => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return `${item.name} × ${quantity} — ${money.format(price)} each — ${money.format(price * quantity)}`;
  });
  return {
    order_id: id,
    customer_name: customerName,
    customer_phone: phone,
    customer_address: address || 'Not provided',
    order_items: lines.join('\n'),
    order_total: money.format(total || 0),
    order_date: new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(placedAt),
    order_status: statusLabel,
  };
}

export async function sendOrderEmail(params) {
  const id = params?.order_id;
  if (!id || attempted.has(id)) return { sent: false, skipped: true };
  attempted.add(id);
  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY });
    const sent = result?.status === 200;
    if (!sent) console.error('The order was saved, but EmailJS did not confirm the shop notification.', result);
    return { sent };
  } catch (error) {
    console.error('The order was saved, but the shop email notification was not sent.', error);
    return { sent: false };
  }
}
