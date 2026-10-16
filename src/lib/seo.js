import { blogPosts, getBlogPost } from '../data/blogPosts';

export const SITE_ORIGIN = 'https://shriharishcrackers.com';
export const LOGO_URL = `${SITE_ORIGIN}/logo.png`;
export const OG_IMAGE_URL = `${SITE_ORIGIN}/og-image.jpg`;

const HOME_DESCRIPTION = 'Shri Harish Crackers is a crackers shop in Valliyur, Tirunelveli district, Tamil Nadu, near Rotary Club on Eruvadi Main Road. Enquire for Diwali crackers in Valliyur by phone or WhatsApp.';

const pages = {
  '/': {
    title: 'Shri Harish Crackers Valliyur | Crackers Shop in Valliyur',
    description: HOME_DESCRIPTION,
    robots: 'index, follow',
    ogType: 'website',
  },
  '/product-list': {
    title: 'Product List | Shri Harish Crackers Valliyur',
    description: 'Browse the Shri Harish Crackers product list in Valliyur, compare Diwali crackers and fireworks, choose quantities, and send an enquiry by phone or WhatsApp.',
    robots: 'index, follow',
    ogType: 'website',
  },
  '/blog': {
    title: 'Crackers Guides for Valliyur | Shri Harish Crackers',
    description: 'Read practical guides on choosing Diwali crackers, planning your shopping, and handling fireworks safely from Shri Harish Crackers in Valliyur.',
    robots: 'index, follow',
    ogType: 'website',
  },
  '/admin': {
    title: 'Admin – Shri Harish Crackers',
    description: 'Private catalog administration for Shri Harish Crackers.',
    robots: 'noindex, nofollow',
    ogType: 'website',
  },
};

export function getPageMeta(path) {
  if (pages[path]) return { ...pages[path], path };
  if (path.startsWith('/blog/')) {
    const slug = path.slice('/blog/'.length);
    const post = getBlogPost(slug);
    if (!post) {
      return {
        path,
        title: 'Guide not found | Shri Harish Crackers',
        description: 'That crackers guide could not be found on Shri Harish Crackers.',
        robots: 'noindex, follow',
        ogType: 'website',
      };
    }
    return {
      path,
      title: post.metaTitle,
      description: post.metaDescription,
      robots: 'index, follow',
      ogType: 'article',
      article: post,
    };
  }
  return { ...pages['/'], path: '/' };
}

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

function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function articleJsonLd(post) {
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.published,
    dateModified: post.updated || post.published,
    mainEntityOfPage: url,
    url,
    image: [OG_IMAGE_URL, LOGO_URL],
    author: {
      '@type': 'Organization',
      name: 'Shri Harish Crackers',
      url: `${SITE_ORIGIN}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Shri Harish Crackers',
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
  };
}

export function applyPageMeta(path) {
  const page = getPageMeta(path);
  const canonicalPath = page.path === '/' ? '/' : page.path;
  const url = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;
  document.title = page.title;
  setContent('name', 'description', page.description);
  setContent('name', 'robots', page.robots);
  setContent('property', 'og:site_name', 'Shri Harish Crackers');
  setContent('property', 'og:title', page.title);
  setContent('property', 'og:description', page.description);
  setContent('property', 'og:type', page.ogType || 'website');
  setContent('property', 'og:url', url);
  setContent('property', 'og:image', OG_IMAGE_URL);
  setContent('property', 'og:image:secure_url', OG_IMAGE_URL);
  setContent('property', 'og:image:alt', 'Shri Harish Crackers, Valliyur');
  setContent('property', 'og:locale', 'en_IN');
  setContent('name', 'twitter:card', 'summary_large_image');
  setContent('name', 'twitter:title', page.title);
  setContent('name', 'twitter:description', page.description);
  setContent('name', 'twitter:image', OG_IMAGE_URL);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);

  if (page.article) {
    setContent('property', 'article:published_time', page.article.published);
    setContent('property', 'article:modified_time', page.article.updated || page.article.published);
    setJsonLd('page-jsonld', articleJsonLd(page.article));
  } else {
    document.head.querySelector('meta[property="article:published_time"]')?.remove();
    document.head.querySelector('meta[property="article:modified_time"]')?.remove();
    setJsonLd('page-jsonld', null);
  }
}

export { HOME_DESCRIPTION, blogPosts };
