import { useEffect, useRef, useState } from 'react';
import { categories } from '../../data/products';
import { MAX_PRODUCT_IMAGES, isStoredImageUrl, productFromForm, productGallery, validateProductForm } from '../../lib/catalog';
import { imageFileError, imageLimitMessage, imageUploadError, prepareProductImage } from '../../lib/productImages';
import { imageSources } from '../../lib/imageDelivery';
import DescriptionEditor from './DescriptionEditor';

const emptyProduct = {
  id: '',
  name: '',
  price: '',
  originalPrice: '',
  description: '',
  category: '',
  badge: '',
  productVideoUrl: '',
  instagramVideoUrl: '',
  instagramThumbnailUrl: '',
  active: true,
};

function savedImages(initial) {
  if (!initial) return [];
  const gallery = productGallery(initial);
  return gallery.images.map((url, index) => ({
    key: `saved-${index}`,
    url,
    preview: url,
    progress: 100,
    error: '',
  }));
}

function isUploading(image) {
  return Boolean(image.file) && !image.url && !image.error;
}

export default function ProductForm({ initial, items, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => initial ? {
    id: initial.id,
    name: initial.name,
    price: String(initial.price),
    originalPrice: initial.originalPrice ?? '',
    description: initial.description || '',
    category: initial.category || '',
    badge: initial.badge || '',
    productVideoUrl: initial.productVideoUrl || '',
    instagramVideoUrl: initial.instagramVideoUrl || '',
    instagramThumbnailUrl: initial.instagramThumbnailUrl || '',
    active: initial.active !== false,
  } : emptyProduct);
  const [images, setImages] = useState(() => savedImages(initial));
  const [primaryKey, setPrimaryKey] = useState(() => {
    const saved = savedImages(initial);
    const primary = saved.find(image => image.url === initial?.image) || saved[0];
    return primary?.key || '';
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const categoryOptions = categories.filter(category => category.id !== 'all');
  const uploading = images.some(isUploading);
  const hasUploadError = images.some(image => image.error);

  useEffect(() => () => {
    imagesRef.current.forEach(image => {
      if (image.preview?.startsWith('blob:')) URL.revokeObjectURL(image.preview);
    });
  }, []);

  const update = (field, value) => {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
  };

  const uploadFile = async (key, file) => {
    try {
      const url = await prepareProductImage(file, progress => {
        setImages(current => current.map(item => (item.key === key ? { ...item, progress, error: '' } : item)));
      });
      setImages(current => current.map(item => {
        if (item.key !== key) return item;
        if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
        return {
          key: item.key,
          url,
          preview: url,
          progress: 100,
          error: '',
        };
      }));
      setStatus('');
      setErrors(current => ({ ...current, images: '' }));
    } catch (error) {
      setImages(current => current.map(item => (
        item.key === key
          ? { ...item, progress: 0, error: imageUploadError(error) }
          : item
      )));
      setStatus(imageUploadError(error));
    }
  };

  const addFiles = event => {
    const selected = [...event.target.files || []];
    event.target.value = '';
    const problems = [];
    const next = [];
    selected.forEach(file => {
      const problem = imageFileError(file);
      if (problem) {
        problems.push(problem);
        return;
      }
      if (images.length + next.length >= MAX_PRODUCT_IMAGES) {
        problems.push(imageLimitMessage());
        return;
      }
      next.push({
        key: `file-${Date.now()}-${next.length}-${file.name}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        error: '',
      });
    });
    if (next.length) {
      setImages(current => [...current, ...next]);
      setPrimaryKey(current => current || next[0].key);
      setErrors(current => ({ ...current, images: '' }));
      next.forEach(image => uploadFile(image.key, image.file));
    }
    setStatus(problems[0] || '');
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!isStoredImageUrl(url) || url.startsWith('data:')) {
      setStatus('Enter a valid image link.');
      return;
    }
    if (images.length >= MAX_PRODUCT_IMAGES) {
      setStatus(imageLimitMessage());
      return;
    }
    if (images.some(image => image.url === url)) {
      setStatus('That image link is already added.');
      return;
    }
    const item = { key: `url-${Date.now()}`, url, preview: url, progress: 100, error: '' };
    setImages(current => [...current, item]);
    setPrimaryKey(current => current || item.key);
    setImageUrl('');
    setStatus('');
    setErrors(current => ({ ...current, images: '' }));
  };

  const removeImage = key => {
    const image = images.find(item => item.key === key);
    if (image?.preview?.startsWith('blob:')) URL.revokeObjectURL(image.preview);
    const remaining = images.filter(item => item.key !== key);
    setImages(remaining);
    setPrimaryKey(primary => (primary === key ? remaining[0]?.key || '' : primary));
    if (!remaining.some(item => item.error || isUploading(item))) setStatus('');
  };

  const moveImage = (key, direction) => {
    setImages(current => {
      const index = current.findIndex(image => image.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [image] = next.splice(index, 1);
      next.splice(target, 0, image);
      return next;
    });
  };

  const submit = async event => {
    event.preventDefault();
    if (saving || uploading) return;
    if (!images.length) {
      setErrors(current => ({ ...current, images: 'Add at least one product image.' }));
      return;
    }
    if (hasUploadError || images.some(image => !image.url)) {
      setErrors(current => ({
        ...current,
        images: 'Wait for every photo to finish uploading, or remove any photo that failed.',
      }));
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const urls = images.map(image => image.url).filter(Boolean);
      const primary = images.find(image => image.key === primaryKey)?.url || urls[0];
      const nextDraft = {
        ...draft,
        image: primary,
        images: urls,
        productVideoUrl: draft.productVideoUrl,
        instagramVideoUrl: draft.instagramVideoUrl,
        instagramThumbnailUrl: draft.instagramThumbnailUrl,
      };
      const nextErrors = validateProductForm(nextDraft, items);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      await onSave(productFromForm(nextDraft, items));
    } catch (error) {
      setStatus(imageUploadError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={submit} noValidate>
      <h2>{initial ? 'Edit product' : 'Add product'}</h2>
      <label className="admin-field">Product name *
        <input value={draft.name} onChange={event => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name && <span className="admin-error">{errors.name}</span>}
      </label>
      <div className="admin-form-grid">
        <label className="admin-field">Selling price (₹) *
          <input inputMode="decimal" value={draft.price} onChange={event => update('price', event.target.value)} aria-invalid={Boolean(errors.price)} />
          {errors.price && <span className="admin-error">{errors.price}</span>}
        </label>
        <label className="admin-field">Original price (₹)
          <input inputMode="decimal" value={draft.originalPrice} onChange={event => update('originalPrice', event.target.value)} aria-invalid={Boolean(errors.originalPrice)} />
          {errors.originalPrice && <span className="admin-error">{errors.originalPrice}</span>}
        </label>
      </div>
      <label className="admin-field">Category
        <input list="product-categories" value={draft.category} onChange={event => update('category', event.target.value)} />
        <datalist id="product-categories">
          {categoryOptions.map(category => <option key={category.id} value={category.name} />)}
        </datalist>
      </label>
      <div className="admin-field">Description
        <DescriptionEditor value={draft.description} onChange={value => update('description', value)} />
      </div>
      <label className="admin-field">Badge
        <input value={draft.badge} onChange={event => update('badge', event.target.value)} placeholder="Optional, such as Best Seller" />
      </label>
      <div className="admin-field">Images *
        <label className="admin-file">
          Add images
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={saving || uploading || images.length >= MAX_PRODUCT_IMAGES} onChange={addFiles} />
        </label>
        <div className="admin-image-url">
          <input
            value={imageUrl}
            onChange={event => setImageUrl(event.target.value)}
            placeholder="Optional existing image URL"
            disabled={saving || uploading || images.length >= MAX_PRODUCT_IMAGES}
            onKeyDown={event => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              addImageUrl();
            }}
          />
          <button type="button" disabled={saving || uploading || images.length >= MAX_PRODUCT_IMAGES} onClick={addImageUrl}>Add URL</button>
        </div>
        <small>Add up to {MAX_PRODUCT_IMAGES} photos. Selected photos upload to Cloudinary automatically and only the image link is saved with the product. Existing image links stay unchanged until you replace or remove them. Choose one as the homepage image.</small>
        {errors.images && <span className="admin-error">{errors.images}</span>}
        {status && <span className="admin-error">{status}</span>}
        {images.length > 0 && (
          <ul className="admin-images">
            {images.map((image, index) => (
              <li key={image.key} className={image.key === primaryKey ? 'is-primary' : ''}>
                <img src={image.file || !image.url ? image.preview : imageSources(image.url, 'thumb').src} alt="" />
                <div>
                  <strong>{image.key === primaryKey ? 'Homepage image' : `Image ${index + 1}`}</strong>
                  {isUploading(image) && <small>Uploading {image.progress || 0}%</small>}
                  {image.error && <small className="admin-error">{image.error}</small>}
                  <div className="admin-image-actions">
                    <button type="button" disabled={saving || uploading || !image.url || image.key === primaryKey} onClick={() => setPrimaryKey(image.key)}>Use on homepage</button>
                    <button type="button" disabled={saving || uploading || index === 0} onClick={() => moveImage(image.key, -1)}>Earlier</button>
                    <button type="button" disabled={saving || uploading || index === images.length - 1} onClick={() => moveImage(image.key, 1)}>Later</button>
                    <button type="button" disabled={saving} onClick={() => removeImage(image.key)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="admin-field">Product Video URL
        <input value={draft.productVideoUrl} onChange={event => update('productVideoUrl', event.target.value)} placeholder="YouTube, Vimeo, or a direct video link" aria-invalid={Boolean(errors.productVideoUrl)} />
        {errors.productVideoUrl && <span className="admin-error">{errors.productVideoUrl}</span>}
      </label>
      <label className="admin-field">Instagram Video/Reel URL
        <input value={draft.instagramVideoUrl} onChange={event => update('instagramVideoUrl', event.target.value)} placeholder="https://www.instagram.com/reel/…" aria-invalid={Boolean(errors.instagramVideoUrl)} />
        {errors.instagramVideoUrl && <span className="admin-error">{errors.instagramVideoUrl}</span>}
      </label>
      <label className="admin-field">Instagram thumbnail image URL
        <input value={draft.instagramThumbnailUrl} onChange={event => update('instagramThumbnailUrl', event.target.value)} placeholder="Optional preview image if Instagram does not provide one" aria-invalid={Boolean(errors.instagramThumbnailUrl)} />
        {errors.instagramThumbnailUrl && <span className="admin-error">{errors.instagramThumbnailUrl}</span>}
      </label>
      <label className="admin-check">
        <input type="checkbox" checked={draft.active} onChange={event => update('active', event.target.checked)} />
        Visible on the shop
      </label>
      <div className="admin-form-actions">
        <button className="button ghost" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="button primary" type="submit" disabled={saving || uploading || hasUploadError}>
          {saving ? 'Saving…' : uploading ? 'Uploading…' : initial ? 'Save product' : 'Add product'}
        </button>
      </div>
    </form>
  );
}
