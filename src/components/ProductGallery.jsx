import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK = '/image.png';

function photoAlt(name, index, total, primaryIndex) {
  if (total === 1) return name;
  if (index === primaryIndex) return `${name}, homepage photo`;
  return `${name}, photo ${index + 1}`;
}

export default function ProductGallery({ product }) {
  const images = product.images?.length ? product.images : [product.image || FALLBACK];
  const primaryIndex = Math.max(0, images.indexOf(product.image));
  const [index, setIndex] = useState(primaryIndex);
  const [failed, setFailed] = useState({});
  const startX = useRef(null);
  const current = failed[index] ? FALLBACK : (images[index] || FALLBACK);
  const multiple = images.length > 1;
  const go = next => setIndex((next + images.length) % images.length);

  return (
    <div
      className="modal-image"
      onTouchStart={event => { startX.current = event.changedTouches[0].clientX; }}
      onTouchEnd={event => {
        if (!multiple || startX.current == null) return;
        const delta = event.changedTouches[0].clientX - startX.current;
        if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
        startX.current = null;
      }}
    >
      {product.badge ? <span>{product.badge}</span> : null}
      <img
        src={current}
        alt={photoAlt(product.name, index, images.length, primaryIndex)}
        onError={() => setFailed(value => ({ ...value, [index]: true }))}
      />
      {multiple && (
        <div className="modal-gallery">
          <button type="button" onClick={() => go(index - 1)} aria-label={`Previous ${product.name} photo`}>
            <ChevronLeft size={18} />
          </button>
          <div className="modal-thumbs">
            {images.map((url, thumbIndex) => (
              <button
                type="button"
                key={`${url}-${thumbIndex}`}
                className={thumbIndex === index ? 'is-current' : ''}
                aria-label={photoAlt(product.name, thumbIndex, images.length, primaryIndex)}
                aria-current={thumbIndex === index ? 'true' : undefined}
                onClick={() => setIndex(thumbIndex)}
              >
                <img
                  src={failed[thumbIndex] ? FALLBACK : url}
                  alt={photoAlt(product.name, thumbIndex, images.length, primaryIndex)}
                  onError={() => setFailed(value => ({ ...value, [thumbIndex]: true }))}
                />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label={`Next ${product.name} photo`}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
