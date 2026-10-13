import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navigate } from '../../lib/navigate';
import { useAdminSession } from '../../lib/firestoreCatalog';
import AdminLogin from '../../components/admin/AdminLogin';
import CatalogManager from '../../components/admin/CatalogManager';
import AdminAccessPanel from '../../components/admin/AdminAccessPanel';
import ActivityLogPanel from '../../components/admin/ActivityLogPanel';
import ExitEnquiriesPanel from '../../components/admin/ExitEnquiriesPanel';
import OrdersPanel from '../../components/admin/OrdersPanel';
import './admin.css';

const sections = [
  ['products', 'Manage Products'],
  ['list', 'Manage Product List'],
  ['orders', 'Customer Orders'],
  ['enquiries', 'Exit Enquiries'],
  ['access', 'Admin Access'],
  ['activity', 'Activity Log'],
];

export default function AdminPage() {
  const session = useAdminSession();
  const [section, setSection] = useState('products');
  const [menuOpen, setMenuOpen] = useState(false);

  const choose = next => {
    setSection(next);
    setMenuOpen(false);
  };

  return (
    <div className="admin-shell">
      {menuOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <p className="admin-sidebar__eyebrow">Shri Harish Crackers</p>
        <strong>Catalog admin</strong>
        <nav aria-label="Admin sections">
          {sections.filter(([id]) => id !== 'access' || session.main).map(([id, label]) => (
            <button key={id} type="button" className={section === id ? 'is-current' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => choose(id)} disabled={!session.admin}>{label}</button>
          ))}
        </nav>
        {session.user && <button className="admin-sidebar__shop" type="button" onClick={() => session.endSession()}>Sign out</button>}
        <button className="admin-sidebar__shop" type="button" onClick={() => navigate('/')}>Back to shop</button>
        <button className="admin-sidebar__shop" type="button" onClick={() => navigate('/product-list')}>Open Product List</button>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="admin-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
            Menu
          </button>
        </div>
        {!session.ready && <p className="admin-empty" role="status">Checking administrator access…</p>}
        {session.ready && !session.admin && <AdminLogin onSignIn={session.signInWithGoogle} notice={session.error} />}
        {session.admin && (
          <>
            <aside className="admin-limitation">
              <h2>Firestore catalog</h2>
              <p>Signed in as {session.user?.email}. Product changes are saved to Cloud Firestore. Visitors see active products as they change. Image cells remain file paths; this page does not upload pictures.</p>
            </aside>
            {(section === 'products' || section === 'list') && <CatalogManager key={section} kind={section} actor={session.actor} />}
            {section === 'orders' && <OrdersPanel actor={session.actor} />}
            {section === 'enquiries' && <ExitEnquiriesPanel />}
            {session.main && section === 'access' && <AdminAccessPanel actor={session.actor} />}
            {section === 'activity' && <ActivityLogPanel />}
          </>
        )}
      </div>
    </div>
  );
}
