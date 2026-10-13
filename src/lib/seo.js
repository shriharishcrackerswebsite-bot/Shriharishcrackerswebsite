export const SITE_ORIGIN = 'https://shriharishcracker.web.app';

const pages = {
  '/': {
    title: 'Shri Harish Crackers | Diwali Crackers in Valliyur',
    description: 'Shri Harish Crackers in Valliyur, Tamil Nadu, offers Diwali and festival crackers for family celebrations. Send an enquiry and the shop confirms by WhatsApp or phone.',
    robots: 'index, follow',
  },
  '/product-list': {
    title: 'Product List | Shri Harish Crackers, Valliyur',
    description: 'Browse the Shri Harish Crackers product list in Valliyur, choose quantities, and send an enquiry for Diwali and festival crackers.',
    robots: 'index, follow',
  },
  '/admin': {
    title: 'Admin – Shri Harish Crackers',
    description: 'Private catalog administration for Shri Harish Crackers.',
    robots: 'noindex, nofollow',
  },
};

function ensureMeta(attribute, key) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  return element;
}

function setContent(attribute, key, value) {
  ensureMeta(attribute, key).setAttribute('content', value);
}

export function applyPageMeta(path) {
  const page = pages[path] || pages['/'];
  const url = `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
  const image = `${SITE_ORIGIN}/og-image.jpg`;
  document.title = page.title;
  setContent('name', 'description', page.description);
  setContent('name', 'robots', page.robots);
  setContent('property', 'og:title', path === '/admin' ? page.title : 'Shri Harish Crackers');
  setContent('property', 'og:description', page.description);
  setContent('property', 'og:url', url);
  setContent('property', 'og:image', image);
  setContent('property', 'og:image:secure_url', image);
  setContent('name', 'twitter:title', path === '/admin' ? page.title : 'Shri Harish Crackers');
  setContent('name', 'twitter:description', page.description);
  setContent('name', 'twitter:image', image);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}
