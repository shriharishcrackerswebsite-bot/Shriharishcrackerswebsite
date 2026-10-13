import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { money } from '../lib/money';
import { usePublicCatalog } from '../lib/firestoreCatalog';
import { useListQuantities } from '../lib/storage';
import ListEnquiry from '../components/ListEnquiry';
import ConfirmDialog from '../components/ConfirmDialog';
import './ProductList.css';

export default function ProductListPage({ shopCartOpen, onCloseShopCart }) {
  const catalog = usePublicCatalog('list');
  const { quantities, setQuantity, reset } = useListQuantities();
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState('');
  const [feedback, setFeedback] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [cartWasOpen, setCartWasOpen] = useState(shopCartOpen);
  if (shopCartOpen !== cartWasOpen) {
    setCartWasOpen(shopCartOpen);
    if (shopCartOpen) setPanel('');
  }

  const visible = useMemo(
    () => catalog.items.filter(item => item.active !== false),
    [catalog.items],
  );
  const term = query.trim().toLowerCase();
  const shown = term ? visible.filter(item => item.name.toLowerCase().includes(term)) : visible;
  const selected = visible
    .map(item => ({ ...item, quantity: quantities[item.id] || 0 }))
    .filter(item => item.quantity > 0);
  const total = selected.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const openPanel = next => {
    if (!selected.length) {
      setFeedback('Select a quantity for at least one product.');
      return;
    }
    setFeedback('');
    onCloseShopCart();
    setPanel(next);
  };

  const enquiryOpen = Boolean(panel) && !shopCartOpen;

  return (
    <section className="plist">
      <header className="plist-intro">
        <h1>Product List</h1>
        <p>Browse the Shri Harish Crackers product list in Valliyur, choose quantities, and send an enquiry.</p>
      </header>

      <div className="plist-toolbar">
        <input
          className="plist-search"
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by product name"
          aria-label="Search by product name"
        />
        <div className="plist-summary">
          <p>{selected.length} selected · {money.format(total)}</p>
          <button className="button ghost" type="button" onClick={() => openPanel('review')}>Review selection</button>
          <button className="button ghost" type="button" onClick={() => (selected.length ? setResetOpen(true) : reset())}>Reset</button>
          <button className="button primary" type="button" onClick={() => openPanel('details')}>Continue to Enquiry</button>
        </div>
        {feedback && <p className="plist-feedback" role="alert">{feedback}</p>}
        {term && <p className="plist-count">Showing {shown.length} of {visible.length}</p>}
      </div>

      {catalog.loading && <p className="plist-empty" role="status">Loading products…</p>}
      {catalog.error && <p className="plist-empty" role="alert">{catalog.error}</p>}
      {!catalog.loading && !catalog.error && visible.length === 0 && <p className="plist-empty">No products are available right now.</p>}
      {!catalog.loading && !catalog.error && visible.length > 0 && shown.length === 0 && <p className="plist-empty">No products match your search.</p>}

      {shown.length > 0 && (
        <div className="plist-table">
          <div className="plist-columns" aria-hidden="true">
            <span>Product name</span>
            <span>Price</span>
            <span>Quantity</span>
          </div>
          <ul>
            {shown.map(item => {
              const quantity = quantities[item.id] || 0;
              return (
                <li className="plist-row" key={item.id}>
                  <h2 className="plist-name">{item.name}</h2>
                  <p className="plist-price">{money.format(item.price)}</p>
                  <div className="stepper plist-stepper">
                    <button type="button" onClick={() => setQuantity(item.id, quantity - 1)} disabled={quantity === 0} aria-label={`Decrease ${item.name} quantity`}>
                      <Minus size={16} />
                    </button>
                    <output aria-label={`${item.name} quantity`}>{quantity}</output>
                    <button type="button" onClick={() => setQuantity(item.id, quantity + 1)} aria-label={`Increase ${item.name} quantity`}>
                      <Plus size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ListEnquiry
        open={enquiryOpen}
        step={panel || 'review'}
        items={selected}
        onClose={() => setPanel('')}
        onStep={setPanel}
        onQuantity={setQuantity}
        onRemove={id => setQuantity(id, 0)}
      />
      <ConfirmDialog
        open={resetOpen}
        title="Reset quantities?"
        message="This clears every quantity you have selected on the product list."
        confirmLabel="Reset"
        tone="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          reset();
          setResetOpen(false);
          setPanel('');
          setFeedback('');
        }}
      />
    </section>
  );
}
