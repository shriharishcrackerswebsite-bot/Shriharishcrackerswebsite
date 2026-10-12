import { useState } from 'react';
import { categories } from '../../data/products';
import { productFromForm, validateProductForm } from '../../lib/catalog';

const emptyProduct = {
  id: '',
  name: '',
  price: '',
  originalPrice: '',
  description: '',
  category: '',
  image: '/image.png',
  badge: '',
  active: true,
};

export default function ProductForm({ initial, items, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => initial ? {
    id: initial.id,
    name: initial.name,
    price: String(initial.price),
    originalPrice: initial.originalPrice ?? '',
    description: initial.description || '',
    category: initial.category || '',
    image: initial.image || '/image.png',
    badge: initial.badge || '',
    active: initial.active !== false,
  } : emptyProduct);
  const [errors, setErrors] = useState({});
  const categoryOptions = categories.filter(category => category.id !== 'all');

  const update = (field, value) => {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
  };

  const submit = event => {
    event.preventDefault();
    const nextErrors = validateProductForm(draft, items);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(productFromForm(draft, items));
  };

  return (
    <form className="admin-form" onSubmit={submit} noValidate>
      <h2>{initial ? 'Edit product' : 'Add product'}</h2>
      <label className="admin-field">Product name *
        <input value={draft.name} onChange={event => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name && <span className="admin-error">{errors.name}</span>}
      </label>
      <div className="admin-form-grid">
        <label className="admin-field">Selling price (₹) *
          <input inputMode="decimal" value={draft.price} onChange={event => update('price', event.target.value)} aria-invalid={Boolean(errors.price)} />
          {errors.price && <span className="admin-error">{errors.price}</span>}
        </label>
        <label className="admin-field">Original price (₹)
          <input inputMode="decimal" value={draft.originalPrice} onChange={event => update('originalPrice', event.target.value)} aria-invalid={Boolean(errors.originalPrice)} />
          {errors.originalPrice && <span className="admin-error">{errors.originalPrice}</span>}
        </label>
      </div>
      <label className="admin-field">Category
        <input list="product-categories" value={draft.category} onChange={event => update('category', event.target.value)} />
        <datalist id="product-categories">
          {categoryOptions.map(category => <option key={category.id} value={category.name} />)}
        </datalist>
      </label>
      <label className="admin-field">Description
        <textarea rows="3" value={draft.description} onChange={event => update('description', event.target.value)} />
      </label>
      <label className="admin-field">Badge
        <input value={draft.badge} onChange={event => update('badge', event.target.value)} placeholder="Optional, such as Best Seller" />
      </label>
      <label className="admin-field">Image path *
        <input value={draft.image} onChange={event => update('image', event.target.value)} aria-invalid={Boolean(errors.image)} />
        {errors.image && <span className="admin-error">{errors.image}</span>}
        <small>Use a path that already exists on the site, such as /image.png. This does not upload a new image file.</small>
      </label>
      {draft.image && <img className="admin-preview" src={draft.image} alt="" />}
      <label className="admin-check">
        <input type="checkbox" checked={draft.active} onChange={event => update('active', event.target.checked)} />
        Visible on the shop
      </label>
      <div className="admin-form-actions">
        <button className="button ghost" type="button" onClick={onCancel}>Cancel</button>
        <button className="button primary" type="submit">{initial ? 'Save product' : 'Add product'}</button>
      </div>
    </form>
  );
}
