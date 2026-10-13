export const SITE_ORIGIN = 'https://shriharishcrackers.com';

const pages = {
  '/': {
    title: 'Shri Harish Crackers Valliyur | Crackers Shop in Valliyur',
    description: 'Shri Harish Crackers is a crackers shop in Valliyur, Tamil Nadu, on Eruvadi Main Road near Rotary Club. Enquire about Diwali crackers and fireworks in Valliyur, also known as Valiyoor, by phone or WhatsApp.',
    robots: 'index, follow',
  },
  '/product-list': {
    title: 'Product List | Shri Harish Crackers, Valliyur',
    description: 'Browse the Shri Harish Crackers product list in Valliyur, choose quantities, and send an enquiry for Diwali crackers and fireworks.',
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
  setContent('property', 'og:title', page.title);
  setContent('property', 'og:description', page.description);
  setContent('property', 'og:url', url);
  setContent('property', 'og:image', image);
  setContent('property', 'og:image:secure_url', image);
  setContent('name', 'twitter:title', page.title);
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
