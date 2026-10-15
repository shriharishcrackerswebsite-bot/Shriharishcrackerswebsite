import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imageSources } from '../lib/imageDelivery';
import { instagramThumbnail, instagramVideo, productVideo } from '../lib/productMedia';
import ProductImage from './ProductImage';
import ImageViewer from './ImageViewer';

const FALLBACK = '/image.png';

function photoAlt(name, index, total, primaryIndex) {
  if (total === 1) return name;
  if (index === primaryIndex) return `${name}, homepage photo`;
  return `${name}, photo ${index + 1}`;
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm4.5 4.7A5.3 5.3 0 1 0 17.3 12 5.3 5.3 0 0 0 12 6.7zm6.4-1.2a1.25 1.25 0 1 0 1.25 1.25A1.25 1.25 0 0 0 18.4 5.5zM12 8.8A3.2 3.2 0 1 1 8.8 12 3.2 3.2 0 0 1 12 8.8z" />
    </svg>
  );
}

function InstagramThumb({ productName, post, preview }) {
  const previewSource = preview ? imageSources(preview, 'thumb') : null;
  const sources = [previewSource?.src, previewSource?.original, post.thumbnail]
    .filter((url, index, list) => url && list.indexOf(url) === index);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const src = sources[step] || '';

  useEffect(() => {
    setReady(false);
  }, [src]);

  return (
    <a className="is-instagram" href={post.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${productName} on Instagram`}>
      {src && (
        <img
          src={src}
          alt=""
          hidden={!ready}
          referrerPolicy="no-referrer"
          onLoad={() => setReady(true)}
          onError={() => setStep(value => value + 1)}
        />
      )}
      {!ready && <span className="instagram-fallback">Instagram</span>}
      <i><InstagramMark /></i>
    </a>
  );
}

function ProductVideo({ name, video }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  if (video.kind === 'file') {
    return (
      <div className="product-video">
        <video controls playsInline preload="metadata" src={video.src} onError={() => setHidden(true)} />
      </div>
    );
  }
  return (
    <div className="product-video">
      <iframe
        src={video.src}
        title={`${name} video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function ProductGallery({ product }) {
  const images = product.images?.length ? product.images : [product.image || FALLBACK];
  const primaryIndex = Math.max(0, images.indexOf(product.image));
  const instagram = instagramVideo(product.instagramVideoUrl);
  const preview = instagramThumbnail(product.instagramThumbnailUrl);
  const video = productVideo(product.productVideoUrl);
  const [index, setIndex] = useState(primaryIndex);
  const [zoomed, setZoomed] = useState(false);
  const startX = useRef(null);
  const swiped = useRef(false);
  const current = images[index] || FALLBACK;
  const multiple = images.length > 1;
  const showThumbs = multiple || Boolean(instagram);
  const go = next => setIndex((next + images.length) % images.length);

  return (
    <div className="modal-media">
      <div
        className="modal-image"
        onTouchStart={event => { startX.current = event.changedTouches[0].clientX; }}
        onTouchEnd={event => {
          if (!multiple || startX.current == null) return;
          const delta = event.changedTouches[0].clientX - startX.current;
          if (Math.abs(delta) > 40) {
            swiped.current = true;
            go(index + (delta < 0 ? 1 : -1));
          }
          startX.current = null;
        }}
      >
        {product.badge ? <span>{product.badge}</span> : null}
        <button type="button" className="modal-zoom-open" onClick={() => { if (swiped.current) { swiped.current = false; return; } setZoomed(true); }} aria-label={`View ${product.name} photo larger`}>
          <ProductImage
            url={current}
            preset="detail"
            alt={photoAlt(product.name, index, images.length, primaryIndex)}
          />
        </button>
        {showThumbs && (
          <div className="modal-gallery">
            {multiple && (
              <button type="button" onClick={() => go(index - 1)} aria-label={`Previous ${product.name} photo`}>
                <ChevronLeft size={18} />
              </button>
            )}
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
                  <ProductImage
                    url={url}
                    preset="thumb"
                    alt={photoAlt(product.name, thumbIndex, images.length, primaryIndex)}
                  />
                </button>
              ))}
              {instagram && <InstagramThumb productName={product.name} post={instagram} preview={preview} />}
            </div>
            {multiple && (
              <button type="button" onClick={() => go(index + 1)} aria-label={`Next ${product.name} photo`}>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
      {video && <ProductVideo name={product.name} video={video} />}
      {zoomed && (
        <ImageViewer
          images={images}
          index={index}
          name={product.name}
          onIndex={setIndex}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  );
}
