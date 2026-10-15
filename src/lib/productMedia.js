function httpUrl(value) {
  const url = String(value || '').trim();
  if (!url || url.length > 500 || /\s/.test(url)) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return url;
  } catch {
    return '';
  }
}

function youtubeId(parsed) {
  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || '';
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return '';
  const fromQuery = parsed.searchParams.get('v');
  if (fromQuery) return fromQuery;
  const parts = parsed.pathname.split('/').filter(Boolean);
  const marker = parts.findIndex(part => ['embed', 'shorts', 'live', 'v'].includes(part));
  return marker >= 0 ? parts[marker + 1] || '' : '';
}

export function productVideo(value) {
  const url = httpUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  const youtube = youtubeId(parsed);
  if (youtube && /^[\w-]{6,}$/.test(youtube)) {
    return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}` };
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.split('/').filter(part => /^\d+$/.test(part)).pop();
    if (!id) return null;
    return { kind: 'embed', src: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm|ogg|ogv|mov)$/i.test(parsed.pathname)) return { kind: 'file', src: url };
  return null;
}

export function instagramVideo(value) {
  const url = httpUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host !== 'instagram.com' && host !== 'instagr.am') return null;
  if (parsed.pathname === '/' || parsed.pathname === '') return null;
  const match = parsed.pathname.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]{5,})/);
  if (!match) return { href: url, thumbnail: '' };
  const code = match[1];
  const kind = /\/(?:p|tv)\//.test(parsed.pathname) ? 'p' : 'reel';
  return {
    href: `https://www.instagram.com/${kind}/${code}/`,
    thumbnail: `https://www.instagram.com/p/${encodeURIComponent(code)}/media/?size=l`,
  };
}

export function instagramThumbnail(value) {
  const url = httpUrl(value);
  if (!url || url.startsWith('data:')) return '';
  return url;
}
