import { useState } from 'react';
import { listItemFromForm, validateListForm } from '../../lib/catalog';

const emptyItem = { id: '', name: '', price: '', active: true };

export default function ProductListForm({ initial, items, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => initial ? {
    id: initial.id,
    name: initial.name,
    price: String(initial.price),
    active: initial.active !== false,
  } : emptyItem);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
  };

  const submit = event => {
    event.preventDefault();
    const nextErrors = validateListForm(draft, items);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(listItemFromForm(draft, items));
  };

  return (
    <form className="admin-form" onSubmit={submit} noValidate>
      <h2>{initial ? 'Edit list item' : 'Add list item'}</h2>
      <p className="admin-form-note">Product list items are name and price only. They do not use images.</p>
      <label className="admin-field">Product name *
        <input value={draft.name} onChange={event => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name && <span className="admin-error">{errors.name}</span>}
      </label>
      <label className="admin-field">Price (₹) *
        <input inputMode="decimal" value={draft.price} onChange={event => update('price', event.target.value)} aria-invalid={Boolean(errors.price)} />
        {errors.price && <span className="admin-error">{errors.price}</span>}
      </label>
      <label className="admin-check">
        <input type="checkbox" checked={draft.active} onChange={event => update('active', event.target.checked)} />
        Visible on the Product List page
      </label>
      <div className="admin-form-actions">
        <button className="button ghost" type="button" onClick={onCancel}>Cancel</button>
        <button className="button primary" type="submit">{initial ? 'Save item' : 'Add item'}</button>
      </div>
    </form>
  );
}
