import { useEffect, useState } from 'react';

export function normalizePath(pathname) {
  const path = String(pathname || '/').split('?')[0].replace(/\/+$/, '');
  return path || '/';
}

export function navigate(path) {
  const next = normalizePath(path);
  if (normalizePath(window.location.pathname) === next) {
    window.scrollTo(0, 0);
    return;
  }
  window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function usePathname() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const sync = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return path;
}

export function goSection(id) {
  if (id === 'product-list') {
    navigate('/product-list');
    return;
  }
  if (id === 'blog') {
    navigate('/blog');
    return;
  }

  if (normalizePath(window.location.pathname) !== '/') {
    window.location.assign(id === 'home' ? '/' : `/#${id}`);
    return;
  }

  const element = document.getElementById(id);
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function isBlogPath(path) {
  return path === '/blog' || path.startsWith('/blog/');
}
