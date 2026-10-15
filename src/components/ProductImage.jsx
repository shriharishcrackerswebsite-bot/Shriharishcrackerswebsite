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
      loading="lazy"
      decoding="async"
      onError={event => {
        const image = event.currentTarget;
        if (image.dataset.fallback) return;
        image.dataset.fallback = '1';
        image.removeAttribute('srcset');
        image.src = FALLBACK;
      }}
    />
  );
}
