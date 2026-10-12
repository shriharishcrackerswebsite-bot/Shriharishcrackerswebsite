import { useExitEnquiries } from '../../lib/exitEnquiry';

function formatWhen(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for timestamp';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const sourceLabel = {
  exit_popup: 'Exit popup',
};

export default function ExitEnquiriesPanel() {
  const enquiries = useExitEnquiries(true);

  return (
    <section className="admin-section">
      <header className="admin-section__head">
        <div>
          <h1>Exit Enquiries</h1>
          <p>Enquiries submitted when a visitor chose to leave the homepage.</p>
        </div>
      </header>
      {enquiries.error && <p className="admin-error" role="alert">{enquiries.error}</p>}
      {enquiries.loading && <p className="admin-empty" role="status">Loading enquiries…</p>}
      {!enquiries.loading && !enquiries.error && enquiries.entries.length === 0 && <p className="admin-empty">No exit enquiries have been submitted yet.</p>}
      {enquiries.entries.length > 0 && (
        <div className="admin-activity">
          {enquiries.entries.map(entry => (
            <article key={entry.id}>
              <strong>{entry.name}</strong>
              <p>{entry.phone}</p>
              <p>{formatWhen(entry.createdAt)}</p>
              <p>{sourceLabel[entry.source] || entry.source} · {entry.status}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
