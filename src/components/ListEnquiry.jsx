import { useState } from 'react';
import { ChevronLeft, MessageCircle, Minus, Plus, Trash2, X } from 'lucide-react';
import { whatsappUrl } from '../data/business';
import { money } from '../lib/money';
import { buildProductListEnquiry, productListTotal, validateCustomer } from '../lib/enquiry';

export default function ListEnquiry({ open, step, items, onClose, onStep, onQuantity, onRemove }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [whatsappHref, setWhatsappHref] = useState('');
  const [whatsappReady, setWhatsappReady] = useState(false);
  const total = productListTotal(items);

  const submitEnquiry = event => {
    event.preventDefault();
    if (!items.length) {
      setErrors({ form: 'Select a quantity for at least one product.' });
      return;
    }
    const { errors: nextErrors, cleanName } = validateCustomer(name, phone);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const { message } = buildProductListEnquiry({ name: cleanName, phone, address, items });
    const href = whatsappUrl(message);
    setWhatsappHref(href);
    const whatsappWindow = window.open(href, '_blank');
    if (!whatsappWindow) {
      setErrors({ form: 'WhatsApp could not be opened. Please allow pop-ups or use the link below.' });
      return;
    }
    whatsappWindow.opener = null;
    setWhatsappReady(true);
    setErrors({});
  };

  return (
    <div className={`cart-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="cart-backdrop" onClick={onClose} />
      <aside className={`cart-drawer ${step === 'details' ? 'is-checkout' : ''}`} aria-label={step === 'details' ? 'Product list enquiry' : 'Review product list'}>
        <header>
          {step === 'details' ? (
            <>
              <button className="checkout-back" type="button" onClick={() => onStep('review')}><ChevronLeft size={19} />Review items</button>
              <button type="button" onClick={onClose} aria-label="Close enquiry form"><X /></button>
            </>
          ) : (
            <>
              <div><p>Product list</p><h2>Selected items</h2></div>
              <button type="button" onClick={onClose} aria-label="Close review"><X /></button>
            </>
          )}
        </header>
        {items.length === 0 ? (
          <div className="empty-cart">
            <h3>No quantities selected</h3>
            <p>Choose a quantity on the product list, then continue to enquiry.</p>
            <button className="button ghost" type="button" onClick={onClose}>Back to product list</button>
          </div>
        ) : step === 'review' ? (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{money.format(item.price)}</p>
                    <div className="stepper plist-stepper">
                      <button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={16} /></button>
                      <output>{item.quantity}</output>
                      <button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={16} /></button>
                    </div>
                  </div>
                  <button className="remove" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
            <footer>
              <div><span>Estimated total</span><strong>{money.format(total)}</strong></div>
              <button className="button primary" type="button" onClick={() => onStep('details')}>Continue to Enquiry</button>
              <button className="continue" type="button" onClick={onClose}>Back to product list</button>
            </footer>
          </>
        ) : (
          <form className="checkout-form" onSubmit={submitEnquiry} noValidate>
            <div className="checkout-scroll">
              <h2 className="checkout-title">Complete Your Enquiry</h2>
              <p className="plist-source-note">This enquiry includes product list quantities only. Your shop cart is sent separately, so nothing is duplicated.</p>
              <section className="checkout-summary" aria-label="Product list enquiry summary">
                <h3>Product List</h3>
                {items.map(item => (
                  <div className="checkout-summary__item" key={item.id}>
                    <span>{item.name} × {item.quantity}</span>
                    <strong>{money.format(item.price * item.quantity)}</strong>
                  </div>
                ))}
                <div className="checkout-summary__total"><span>Estimated Total</span><strong>{money.format(total)}</strong></div>
              </section>
              <label className="checkout-field">Full Name *
                <input autoComplete="name" name="name" type="text" value={name} onChange={event => { setName(event.target.value); setErrors(value => ({ ...value, name: '', form: '' })); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'list-name-error' : undefined} />
                {errors.name && <span className="checkout-error" id="list-name-error">{errors.name}</span>}
              </label>
              <label className="checkout-field">Phone Number *
                <input autoComplete="tel" inputMode="tel" name="phone" type="tel" value={phone} onChange={event => { setPhone(event.target.value); setErrors(value => ({ ...value, phone: '', form: '' })); }} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'list-phone-error' : undefined} />
                {errors.phone && <span className="checkout-error" id="list-phone-error">{errors.phone}</span>}
              </label>
              <label className="checkout-field">Delivery Address (Optional)
                <textarea autoComplete="street-address" name="address" rows="3" value={address} onChange={event => setAddress(event.target.value)} placeholder="Enter your delivery address if you would like to provide it" />
              </label>
            </div>
            <footer className="checkout-footer">
              {errors.form && <p className="checkout-error" role="alert">{errors.form}</p>}
              <button className="button primary" type="submit">Submit Enquiry <MessageCircle size={18} /></button>
              {whatsappReady && <p className="checkout-ready" role="status">Your enquiry is ready to send on WhatsApp. Please review it there and press Send.</p>}
              {whatsappHref && !whatsappReady && <a className="checkout-whatsapp-link" href={whatsappHref} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}
