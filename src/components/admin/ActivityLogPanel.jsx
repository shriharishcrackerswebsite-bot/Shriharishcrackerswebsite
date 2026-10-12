import { describeChange } from '../../lib/adminIdentity';
import { useActivityLog } from '../../lib/adminAccess';

const actionLabel = {
  create: 'Added',
  update: 'Updated',
  delete: 'Deleted',
  'grant-admin': 'Granted admin access',
  'revoke-admin': 'Revoked admin access',
};

function formatWhen(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for timestamp';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function ActivityLogPanel() {
  const log = useActivityLog(true);

  return (
    <section className="admin-section">
      <header className="admin-section__head">
        <div>
          <h1>Activity Log</h1>
          <p>Every catalog and administrator change saved to Firestore is listed here.</p>
        </div>
      </header>
      {log.error && <p className="admin-error" role="alert">{log.error}</p>}
      {log.loading && <p className="admin-empty" role="status">Loading activity…</p>}
      {!log.loading && !log.error && log.entries.length === 0 && <p className="admin-empty">No activity has been recorded yet.</p>}
      {log.entries.length > 0 && (
        <div className="admin-activity">
          {log.entries.map(entry => (
            <article key={entry.id}>
              <strong>{actionLabel[entry.action] || entry.action}</strong>
              <p>{entry.targetName || entry.targetId}</p>
              <p>{entry.adminName} · {entry.adminEmail}</p>
              <p>{describeChange(entry.oldValue, entry.newValue)}</p>
              <p>{formatWhen(entry.createdAt)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
