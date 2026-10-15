import { MAX_INLINE_IMAGE_CHARS, MAX_PRODUCT_IMAGES } from './catalog.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_EDGE = 1200;

export function imageFileError(file) {
  if (!TYPES.has(file?.type)) return `${file?.name || 'That file'} must be a JPEG, PNG, WebP, or GIF.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} must be 5 MB or smaller.`;
  return '';
}

export function imageUploadError(error) {
  if (error?.message && !error.code) return error.message;
  return 'That image could not be prepared, so the product was not saved.';
}

function drawJpeg(source, edge, quality) {
  const longest = Math.max(source.width, source.height) || 1;
  const scale = Math.min(1, edge / longest);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ source: image, close: () => URL.revokeObjectURL(objectUrl) });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`${file.name} could not be read.`));
    };
    image.src = objectUrl;
  });
}

function loadImage(file) {
  if (typeof createImageBitmap !== 'function') return loadImageElement(file);
  return createImageBitmap(file)
    .then(bitmap => ({ source: bitmap, close: () => bitmap.close?.() }))
    .catch(() => loadImageElement(file));
}

async function compressProductImage(file) {
  const loaded = await loadImage(file);
  try {
    let edge = Math.min(MAX_EDGE, Math.max(loaded.source.width, loaded.source.height) || MAX_EDGE);
    let quality = 0.82;
    let dataUrl = '';
    for (let attempt = 0; attempt < 8; attempt += 1) {
      dataUrl = drawJpeg(loaded.source, edge, quality);
      if (dataUrl.length <= MAX_INLINE_IMAGE_CHARS) return dataUrl;
      if (quality > 0.45) quality = Math.round((quality - 0.08) * 100) / 100;
      else edge = Math.round(edge * 0.75);
      if (edge < 180) break;
    }
    throw new Error(`${file.name} is still too large after resizing. Choose a smaller photo.`);
  } finally {
    loaded.close();
  }
}

export async function prepareProductImage(file, onProgress) {
  const problem = imageFileError(file);
  if (problem) throw new Error(problem);
  onProgress?.(20);
  const dataUrl = await compressProductImage(file);
  if (!dataUrl.startsWith('data:image/jpeg;base64,') || dataUrl.length > MAX_INLINE_IMAGE_CHARS) {
    throw new Error(`${file.name} is still too large after resizing. Choose a smaller photo.`);
  }
  onProgress?.(100);
  return dataUrl;
}

export function imageLimitMessage() {
  return `A product can have up to ${MAX_PRODUCT_IMAGES} images.`;
}
