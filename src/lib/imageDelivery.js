const CLOUDINARY = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/i;
const TRANSFORM = /^(?:a|ac|af|ar|b|bo|c|co|cs|d|dn|du|e|eo|f|fl|g|h|l|o|pg|q|r|so|sp|t|u|w|x|y|z)_.+/;

function isTransform(part) {
  return part.split(',').every(piece => TRANSFORM.test(piece));
}

function parseCloudinary(value) {
  const url = String(value || '').trim();
  const match = url.match(CLOUDINARY);
  if (!match) return null;
  const parts = match[2].split('/');
  if (parts.some(part => part.startsWith('s--'))) return null;
  const transforms = [];
  let index = 0;
  while (index < parts.length - 1) {
    const part = parts[index];
    if (/^v\d+$/.test(part) || !isTransform(part)) break;
    transforms.push(part);
    index += 1;
  }
  const publicPath = parts.slice(index).join('/');
  if (!publicPath) return null;
  const base = `https://res.cloudinary.com/${match[1]}/image/upload`;
  return {
    transformed: transforms.length > 0,
    original: `${base}/${publicPath}`,
    url(width) {
      const transform = width ? `f_auto,q_auto,c_limit,w_${width}` : 'f_auto,q_auto';
      return `${base}/${transform}/${publicPath}`;
    },
  };
}

export function imageSources(url, preset = 'card') {
  const safe = String(url || '').trim() || '/image.png';
  const plain = { src: safe, zoom: safe, original: safe };
  if (safe.startsWith('data:') || safe.startsWith('/')) return plain;
  const cloud = parseCloudinary(safe);
  if (!cloud) return plain;
  const zoom = cloud.url(0);
  if (preset === 'thumb') return { src: cloud.url(192), zoom, original: cloud.original };
  const widths = preset === 'card' ? [480, 960] : [960, 1440, 2000];
  const sizes = preset === 'card'
    ? '(max-width: 660px) 46vw, 300px'
    : '(max-width: 660px) 100vw, 640px';
  return {
    src: cloud.url(widths[widths.length - 1]),
    srcSet: widths.map(width => `${cloud.url(width)} ${width}w`).join(', '),
    sizes,
    zoom,
    original: cloud.original,
  };
}
