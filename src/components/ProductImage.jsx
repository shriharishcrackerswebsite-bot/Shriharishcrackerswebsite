import { imageSources } from '../lib/imageDelivery';

const FALLBACK = '/image.png';

export default function ProductImage({ url, alt, preset = 'card' }) {
  const sources = imageSources(url, preset);
  return (
    <img
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sources.sizes}
      alt={alt}
      loading={preset === 'detail' ? 'eager' : 'lazy'}
      decoding="async"
      onError={event => {
        const image = event.currentTarget;
        if (image.dataset.fallback === 'logo') return;
        const original = sources.original;
        if (original && image.dataset.fallback !== 'original' && image.src !== original) {
          image.dataset.fallback = 'original';
          image.removeAttribute('srcset');
          image.removeAttribute('sizes');
          image.src = original;
          return;
        }
        image.dataset.fallback = 'logo';
        image.removeAttribute('srcset');
        image.src = FALLBACK;
      }}
    />
  );
}
