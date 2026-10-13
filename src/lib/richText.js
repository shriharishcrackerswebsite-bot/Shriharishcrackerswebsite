const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h3', 'a']);

export function isRichText(value) {
  return /<\/?[a-z][\s\S]*?>/i.test(String(value || ''));
}

function safeHref(value) {
  const href = String(value || '').trim();
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) return '';
  if (/[\s"'<>]/.test(href) || /^javascript:/i.test(href)) return '';
  return href;
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function editorHtml(value) {
  const source = String(value || '').trim();
  if (!source) return '<p><br></p>';
  if (isRichText(source)) return sanitizeRichText(source) || '<p><br></p>';
  return source
    .split(/\n{2,}/)
    .map(block => `<p>${escapeText(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function sanitizeRichText(value) {
  const source = String(value ?? '').trim();
  if (!source) return '';
  if (!isRichText(source)) return source;
  if (typeof DOMParser === 'undefined') return source.replace(/<[^>]+>/g, '');

  const doc = new DOMParser().parseFromString(source, 'text/html');
  const clean = node => {
    const fragment = doc.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        fragment.append(child.cloneNode());
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const tag = child.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object') return;
      if (tag === 'h2' || tag === 'h1' || tag === 'h4') {
        const heading = doc.createElement('h3');
        heading.append(clean(child));
        fragment.append(heading);
        return;
      }
      if (tag === 'div') {
        const paragraph = doc.createElement('p');
        paragraph.append(clean(child));
        fragment.append(paragraph);
        return;
      }
      if (!ALLOWED.has(tag)) {
        fragment.append(clean(child));
        return;
      }
      const element = doc.createElement(tag);
      if (tag === 'a') {
        const href = safeHref(child.getAttribute('href'));
        if (!href) {
          fragment.append(clean(child));
          return;
        }
        element.setAttribute('href', href);
        element.setAttribute('rel', 'noopener noreferrer');
        if (/^https?:/i.test(href)) element.setAttribute('target', '_blank');
      }
      element.append(clean(child));
      fragment.append(element);
    });
    return fragment;
  };

  const holder = doc.createElement('div');
  holder.append(clean(doc.body));
  const html = holder.innerHTML.trim();
  if (!html || html === '<br>' || html === '<p><br></p>' || html === '<p></p>') return '';
  return html;
}
