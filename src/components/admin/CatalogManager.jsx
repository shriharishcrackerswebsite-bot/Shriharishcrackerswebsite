import { useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { products } from '../../data/products';
import { productList } from '../../data/productList';
import { money } from '../../lib/money';
import { normalizeListItem, normalizeProduct } from '../../lib/catalog';
import { useAdminCatalog } from '../../lib/firestoreCatalog';
import { downloadCatalog } from '../../lib/excel';
import ConfirmDialog from '../ConfirmDialog';
import ImportDialog from './ImportDialog';
import ProductForm from './ProductForm';
import ProductListForm from './ProductListForm';

const copy = {
  products: {
    seed: products,
    normalize: normalizeProduct,
    title: 'Manage Products',
    intro: 'These are the image-based products shown in the shop offers. This catalog is separate from the text-only product list.',
    add: 'Add product',
    empty: 'No products are in Firestore yet. Add one, import an Excel file, or add the starter items that are not already saved.',
    searchEmpty: 'No products match your search.',
    noun: 'product',
  },
  list: {
    seed: productList,
    normalize: normalizeListItem,
    title: 'Manage Product List',
    intro: 'This text-only list is shown on the Product List page. It does not use images and it is not the shop product catalog.',
    add: 'Add list item',
    empty: 'No list items are in Firestore yet. Add one, import an Excel file, or add the starter items that are not already saved.',
    searchEmpty: 'No list items match your search.',
    noun: 'list item',
  },
};

export default function CatalogManager({ kind, actor }) {
  const config = copy[kind];
  const catalog = useAdminCatalog(kind, actor);
  const saving = useRef(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [starterOpen, setStarterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return catalog.items;
    return catalog.items.filter(item => `${item.name} ${item.category || ''}`.toLowerCase().includes(term));
  }, [catalog.items, query]);

  const starter = useMemo(
    () => config.seed.map(config.normalize).filter(item => !catalog.items.some(current => current.id === item.id)),
    [catalog.items, config],
  );

  const notify = (type, text) => setFeedback({ type, text });
  const locked = catalog.loading || Boolean(catalog.error) || busy;

  const run = async (action, success) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      await action();
      if (success) notify('success', success);
    } catch (error) {
      notify('error', error.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const saveItem = item => run(async () => {
    const exists = catalog.items.some(current => current.id === item.id);
    if (exists) await catalog.updateItem(item);
    else await catalog.createItem(item);
    setForm(null);
  }, `Saved “${item.name}” in Firestore.`);

  const removeItem = () => run(async () => {
    await catalog.deleteItem(pendingDelete.id);
    setPendingDelete(null);
  }, `Deleted “${pendingDelete.name}” from Firestore.`);

  const addStarter = () => run(async () => {
    const outcome = await catalog.importMissing(starter);
    setStarterOpen(false);
    if (!outcome.ok) throw new Error(outcome.message);
    notify('success', outcome.message);
  });

  return (
    <section className="admin-section">
      <header className="admin-section__head">
        <div>
          <h1>{config.title}</h1>
          <p>{config.intro}</p>
          <p className="admin-local">{catalog.loading ? 'Loading from Firestore…' : 'Showing the Firestore catalog.'}</p>
        </div>
        <div className="admin-section__actions">
          <button className="button primary" type="button" disabled={locked} onClick={() => { setForm({ mode: 'new' }); setFeedback(null); }}><Plus size={16} />{config.add}</button>
          <button className="button ghost" type="button" disabled={locked} onClick={() => { setImportOpen(true); setFeedback(null); }}>Import Excel</button>
          <button className="button ghost" type="button" disabled={catalog.loading || busy} onClick={() => downloadCatalog(kind, catalog.items)}>Export Excel</button>
        </div>
      </header>

      {feedback && <p className={feedback.type === 'error' ? 'admin-error' : 'admin-success'} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      {catalog.error && <p className="admin-error" role="alert">{catalog.error}</p>}
      {catalog.invalidCount > 0 && <p className="admin-error">{catalog.invalidCount} Firestore {catalog.invalidCount === 1 ? 'record was' : 'records were'} skipped because the name or price is invalid.</p>}

      <label className="admin-search">
        <Search size={16} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name" aria-label={`Search ${config.title}`} />
      </label>

      {form && (
        kind === 'products'
          ? <ProductForm initial={form.mode === 'edit' ? form.item : null} items={catalog.items} onCancel={() => setForm(null)} onSave={saveItem} />
          : <ProductListForm initial={form.mode === 'edit' ? form.item : null} items={catalog.items} onCancel={() => setForm(null)} onSave={saveItem} />
      )}

      {catalog.loading && <p className="admin-empty" role="status">Loading from Firestore…</p>}
      {!catalog.loading && !catalog.error && catalog.items.length === 0 && <p className="admin-empty">{config.empty}</p>}
      {!catalog.loading && catalog.items.length > 0 && filtered.length === 0 && <p className="admin-empty">{config.searchEmpty}</p>}

      {filtered.length > 0 && (
        <div className={`admin-list admin-list--${kind}`} role="table" aria-label={config.title}>
          <div className="admin-list__head" role="row">
            {kind === 'products' && <span>Image</span>}
            <span>Name</span>
            <span>Price</span>
            {kind === 'products' && <span>Category</span>}
            <span>Visible</span>
            <span>Actions</span>
          </div>
          {filtered.map(item => (
            <article className={`admin-list__row ${kind}`} role="row" key={item.id}>
              {kind === 'products' && (
                <div data-label="Image"><img src={item.image || '/image.png'} alt="" /></div>
              )}
              <div data-label="Name">
                <strong>{item.name}</strong>
                {item.badge && <small>{item.badge}</small>}
              </div>
              <div data-label="Price">
                <b>{money.format(item.price)}</b>
                {kind === 'products' && item.originalPrice > item.price && <small><s>{money.format(item.originalPrice)}</s></small>}
              </div>
              {kind === 'products' && <div data-label="Category">{item.category || '—'}</div>}
              <div data-label="Visible">{item.active === false ? 'Hidden' : 'Visible'}</div>
              <div className="admin-row-actions" data-label="Actions">
                <button type="button" disabled={busy} onClick={() => { setForm({ mode: 'edit', item }); setFeedback(null); }}><Pencil size={15} />Edit</button>
                <button type="button" disabled={busy} onClick={() => setPendingDelete(item)}><Trash2 size={15} />Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <button className="admin-reset" type="button" disabled={locked || starter.length === 0} onClick={() => setStarterOpen(true)}>
        {starter.length ? `Add ${starter.length} starter ${starter.length === 1 ? 'item' : 'items'} missing from Firestore` : 'Starter items are already in Firestore'}
      </button>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete this ${config.noun}?`}
        message={pendingDelete ? `“${pendingDelete.name}” will be deleted from Firestore. Visitors will stop seeing it.` : ''}
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
        tone="danger"
        onCancel={() => { if (!busy) setPendingDelete(null); }}
        onConfirm={removeItem}
      />
      <ConfirmDialog
        open={starterOpen}
        title="Add missing starter items?"
        message={`This adds ${starter.length} starter ${starter.length === 1 ? 'item' : 'items'} whose ids are not already in Firestore. Existing products are left unchanged and nothing is deleted.`}
        confirmLabel={busy ? 'Saving…' : 'Add to Firestore'}
        onCancel={() => { if (!busy) setStarterOpen(false); }}
        onConfirm={addStarter}
      />
      <ImportDialog
        open={importOpen}
        kind={kind}
        items={catalog.items}
        onClose={() => { if (!busy) setImportOpen(false); }}
        onApply={async ({ rows, mode }) => {
          const outcome = await catalog.importRows(rows, mode);
          notify(outcome.ok ? 'success' : 'error', outcome.message);
          return outcome;
        }}
      />
    </section>
  );
}
