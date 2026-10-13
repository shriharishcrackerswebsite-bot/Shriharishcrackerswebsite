export const ADMIN_EMAIL = 'shriharishcrackerswebsite@gmail.com';

export function normalizeAdminEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isPlausibleEmail(value) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalizeAdminEmail(value));
}

export function isMainAdmin(user) {
  return user?.emailVerified === true && normalizeAdminEmail(user.email) === ADMIN_EMAIL;
}

export function actorFromUser(user) {
  const email = normalizeAdminEmail(user?.email);
  const name = String(user?.displayName || '').trim() || email;
  return { name: name.slice(0, 80), email };
}

export function describeChange(oldValue, newValue) {
  const show = value => {
    if (value == null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'visible' : 'hidden';
    if (typeof value === 'number') return `₹${value}`;
    if (Array.isArray(value)) return value.join(', ') || '—';
    return String(value);
  };
  const summarize = value => [value?.name || value?.email, value?.price != null ? `₹${value.price}` : ''].filter(Boolean).join(' · ') || 'record';
  if (!oldValue && newValue) return `New value: ${summarize(newValue)}`;
  if (oldValue && !newValue) return `Previous value: ${summarize(oldValue)}`;
  const labels = {
    name: 'Name',
    price: 'Price',
    originalPrice: 'Original price',
    active: 'Visibility',
    category: 'Category',
    image: 'Image',
    images: 'Images',
    badge: 'Badge',
    description: 'Description',
    email: 'Email',
    status: 'Status',
    displayOrder: 'Display order',
    listDisplayOrder: 'List order',
  };
  const changed = key => JSON.stringify(oldValue?.[key] ?? null) !== JSON.stringify(newValue?.[key] ?? null);
  const changes = Object.keys(labels).filter(changed);
  if (!changes.length) return 'No field changes';
  return changes.map(key => `${labels[key]}: ${show(oldValue?.[key])} → ${show(newValue?.[key])}`).join('; ');
}
