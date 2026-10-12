import { useState } from 'react';
import { ADMIN_EMAIL } from '../../lib/adminIdentity';
import { useAdminDirectory } from '../../lib/adminAccess';
import ConfirmDialog from '../ConfirmDialog';

export default function AdminAccessPanel({ actor }) {
  const directory = useAdminDirectory(true);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const grant = async event => {
    event.preventDefault();
    setFeedback(null);
    setBusy(true);
    try {
      await directory.grant(actor, email);
      setEmail('');
      setFeedback({ type: 'success', text: 'Administrator access was saved in Firestore.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await directory.revoke(actor, pending);
      setFeedback({ type: 'success', text: `Removed administrator access for ${pending}.` });
      setPending('');
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
      setPending('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-section">
      <header className="admin-section__head">
        <div>
          <h1>Admin Access</h1>
          <p>Grant or revoke administrator access by email. Only these Google accounts, plus the main administrator, can sign in and change the catalog.</p>
        </div>
      </header>
      {feedback && <p className={feedback.type === 'error' ? 'admin-error' : 'admin-success'} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      {directory.error && <p className="admin-error" role="alert">{directory.error}</p>}
      <form className="admin-form" onSubmit={grant}>
        <h2>Grant access</h2>
        <label className="admin-field">Email
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" required />
        </label>
        <div className="admin-form-actions">
          <button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Grant access'}</button>
        </div>
      </form>
      {directory.loading && <p className="admin-empty" role="status">Loading administrators…</p>}
      <div className="admin-list" role="table" aria-label="Administrators">
        <article className="admin-list__row list" role="row">
          <div data-label="Email"><strong>{ADMIN_EMAIL}</strong><small>Main administrator</small></div>
          <div data-label="Access">Permanent</div>
        </article>
        {directory.admins.map(admin => (
          <article className="admin-list__row list" role="row" key={admin.id}>
            <div data-label="Email"><strong>{admin.email}</strong></div>
            <div className="admin-row-actions" data-label="Access">
              <button type="button" disabled={busy} onClick={() => setPending(admin.email)}>Revoke</button>
            </div>
          </article>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Revoke administrator access?"
        message={pending ? `${pending} will no longer be able to sign in or change products.` : ''}
        confirmLabel={busy ? 'Removing…' : 'Revoke'}
        tone="danger"
        onCancel={() => { if (!busy) setPending(''); }}
        onConfirm={revoke}
      />
    </section>
  );
}
