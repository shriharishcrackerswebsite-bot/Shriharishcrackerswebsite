import { useEffect } from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ open, title, message, confirmLabel, tone = 'primary', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-layer" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button className="confirm-backdrop" type="button" aria-label="Cancel" onClick={onCancel} />
      <section className="confirm-card">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="button ghost" type="button" onClick={onCancel}>Cancel</button>
          <button className={`button ${tone === 'danger' ? 'confirm-danger' : 'primary'}`} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
