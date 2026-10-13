import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import app from './firebase.js';
import { MAX_PRODUCT_IMAGES } from './catalog.js';

const storage = getStorage(app);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function imageFileError(file) {
  if (!TYPES.has(file?.type)) return `${file?.name || 'That file'} must be a JPEG, PNG, WebP, or GIF.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} must be 5 MB or smaller.`;
  return '';
}

export function imageUploadError(error) {
  const code = String(error?.code || '');
  if (code.includes('unauthorized') || code.includes('permission-denied')) {
    return 'Image upload was refused. Sign in as an administrator. Storage rules must allow that account to upload.';
  }
  if (code.includes('canceled')) return 'Image upload was cancelled.';
  if (code.includes('retry-limit-exceeded') || code.includes('network')) {
    return 'Image upload could not reach Firebase Storage. Check the connection and try again.';
  }
  return 'That image could not be uploaded, so the product was not saved.';
}

export function uploadProductImage(productId, file, onProgress) {
  const safeId = String(productId || 'new').replace(/[^a-z0-9-]/gi, '').slice(0, 80) || 'new';
  const extension = String(file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  const path = `products/${safeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
  return new Promise((resolve, reject) => {
    task.on('state_changed', snapshot => {
      const total = snapshot.totalBytes || file.size || 1;
      onProgress?.(Math.round((snapshot.bytesTransferred / total) * 100));
    }, reject, async () => {
      resolve(await getDownloadURL(task.snapshot.ref));
    });
  });
}

export function imageLimitMessage() {
  return `A product can have up to ${MAX_PRODUCT_IMAGES} images.`;
}
