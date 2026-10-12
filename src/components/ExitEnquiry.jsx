import { useEffect, useRef, useState } from 'react';
import { validateCustomer } from '../lib/enquiry';
import { exitEnquiryResolved, exitEnquiryWhatsAppUrl, hasAcceptedNotice, rememberExitEnquiry, saveExitEnquiry } from '../lib/exitEnquiry';
import './ExitEnquiry.css';

const guardState = { shcExit: true };

function readAccepted() {
  return hasAcceptedNotice();
}

export default function ExitEnquiry({ active }) {
  const [accepted, setAccepted] = useState(readAccepted);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [whatsappHref, setWhatsappHref] = useState('');
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const allowedLeave = useRef(exitEnquiryResolved());
  const acceptedRef = useRef(accepted);
  const activeRef = useRef(active);
  const openRef = useRef(open);

  useEffect(() => { acceptedRef.current = accepted; }, [accepted]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    const sync = () => setAccepted(true);
    window.addEventListener('shc-notice-accepted', sync);
    return () => window.removeEventListener('shc-notice-accepted', sync);
  }, []);

  useEffect(() => {
    if (!active || !accepted || allowedLeave.current) return undefined;
    if (window.history.state?.shcExit) return undefined;
    window.history.pushState(guardState, '');
    return undefined;
  }, [active, accepted]);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/';
      if (!activeRef.current || !acceptedRef.current || allowedLeave.current || path !== '/') return;
      if (document.querySelector('.important-notice[open]')) return;
      if (window.history.state?.shcExit) return;
      setOpen(true);
      window.history.pushState(guardState, '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    headingRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const leave = () => {
    allowedLeave.current = 'skip';
    rememberExitEnquiry('skip');
    setOpen(false);
    window.history.back();
  };

  const submit = async event => {
    event.preventDefault();
    if (status === 'saving' || status === 'success') return;
    const { errors: nextErrors, cleanName, cleanPhone } = validateCustomer(name, phone);
    if (cleanName.length > 120) nextErrors.name = 'Please enter a shorter name.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (allowedLeave.current === 'sent') {
      setStatus('success');
      setMessage('This enquiry was already sent during this visit.');
      setWhatsappHref(exitEnquiryWhatsAppUrl(cleanName, cleanPhone));
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      await saveExitEnquiry({ name: cleanName, phone: cleanPhone });
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'The enquiry could not be saved. Please try again.');
      return;
    }
    allowedLeave.current = 'sent';
    rememberExitEnquiry('sent');
    const href = exitEnquiryWhatsAppUrl(cleanName, cleanPhone);
    setWhatsappHref(href);
    setStatus('success');
    const popup = window.open(href, '_blank', 'noopener,noreferrer');
    setMessage(popup ? 'Enquiry saved. WhatsApp is opening with your name and phone number.' : 'Enquiry saved. If WhatsApp did not open, use the button below.');
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="exit-enquiry"
      aria-labelledby="exit-enquiry-heading"
      onCancel={event => {
        event.preventDefault();
        setOpen(false);
      }}
    >
      <form onSubmit={submit}>
        <h2 id="exit-enquiry-heading" ref={headingRef} tabIndex="-1">Before You Leave</h2>
        <p>Share your name and phone number if you would like Shri Harish Crackers to contact you about your enquiry.</p>
        {message && <p className={status === 'error' ? 'exit-enquiry__error' : 'exit-enquiry__status'} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
        <label>Full Name
          <input value={name} onChange={event => setName(event.target.value)} autoComplete="name" aria-invalid={errors.name ? 'true' : undefined} disabled={status === 'saving' || status === 'success'} />
        </label>
        {errors.name && <span className="exit-enquiry__error">{errors.name}</span>}
        <label>Phone Number
          <input value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" aria-invalid={errors.phone ? 'true' : undefined} disabled={status === 'saving' || status === 'success'} />
        </label>
        {errors.phone && <span className="exit-enquiry__error">{errors.phone}</span>}
        <div className="exit-enquiry__actions">
          <button className="exit-enquiry__submit" type="submit" disabled={status === 'saving' || status === 'success'}>{status === 'saving' ? 'Saving…' : 'Submit Enquiry'}</button>
          {whatsappHref && <a className="exit-enquiry__whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
          <button className="exit-enquiry__skip" type="button" onClick={leave} disabled={status === 'saving'}>Skip &amp; Leave</button>
        </div>
      </form>
    </dialog>
  );
}
