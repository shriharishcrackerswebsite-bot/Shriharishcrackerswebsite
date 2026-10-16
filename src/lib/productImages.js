import { MAX_PRODUCT_IMAGES } from './catalog.js';
import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL } from './cloudinary.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function imageFileError(file) {
  if (!TYPES.has(file?.type)) return `${file?.name || 'That file'} must be a JPEG, PNG, WebP, or GIF.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} must be 5 MB or smaller.`;
  return '';
}

export function imageUploadError(error) {
  if (error?.message && !error.code) return error.message;
  return 'That image could not be uploaded, so the product was not saved.';
}

function cloudinaryMessage(payload) {
  const message = payload?.error?.message || payload?.message;
  return typeof message === 'string' && message.trim() ? message.trim() : '';
}

export function prepareProductImage(file, onProgress) {
  const problem = imageFileError(file);
  if (problem) return Promise.reject(new Error(problem));

  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const request = new XMLHttpRequest();
    request.open('POST', CLOUDINARY_UPLOAD_URL);
    request.upload.onprogress = event => {
      if (!event.lengthComputable) {
        onProgress?.(20);
        return;
      }
      onProgress?.(Math.max(5, Math.min(95, Math.round((event.loaded / event.total) * 100))));
    };
    request.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(request.responseText || '{}');
      } catch {
        payload = null;
      }
      if (request.status >= 200 && request.status < 300) {
        const url = String(payload?.secure_url || '').trim();
        if (!url.startsWith('https://')) {
          reject(new Error(`${file.name} uploaded, but Cloudinary did not return a usable image link.`));
          return;
        }
        onProgress?.(100);
        resolve(url);
        return;
      }
      reject(new Error(cloudinaryMessage(payload) || `Cloudinary rejected ${file.name}.`));
    };
    request.onerror = () => reject(new Error(`${file.name} could not reach Cloudinary. Check the connection and try again.`));
    request.onabort = () => reject(new Error(`${file.name} upload was cancelled.`));
    onProgress?.(5);
    request.send(body);
  });
}

export function imageLimitMessage() {
  return `A product can have up to ${MAX_PRODUCT_IMAGES} images.`;
}
