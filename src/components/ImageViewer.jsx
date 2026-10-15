import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { imageSources } from '../lib/imageDelivery';

const FALLBACK = '/image.png';

export default function ImageViewer({ images, index, name, onIndex, onClose }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState('');
  const pinch = useRef(null);
  const drag = useRef(null);
  const stageRef = useRef(null);
  const source = imageSources(images[index], 'detail');
  const src = failed === 'logo'
    ? FALLBACK
    : failed === 'original'
      ? (source.original || FALLBACK)
      : source.zoom;

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setFailed('');
  }, [index]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = event => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 0.25 : -0.25);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && images.length > 1) onIndex((index + 1) % images.length);
      if (event.key === 'ArrowLeft' && images.length > 1) onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, index, onClose, onIndex]);

  const zoomBy = amount => {
    setScale(current => {
      const next = Math.min(4, Math.max(1, Math.round((current + amount) * 10) / 10));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const touchDistance = touches => {
    const [first, second] = touches;
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  };

  return (
    <div className="image-viewer" role="dialog" aria-modal="true" aria-label={`${name} photo`}>
      <button type="button" className="image-viewer__close" onClick={onClose} aria-label="Close photo">
        <X size={20} />
      </button>
      <div
        className="image-viewer__stage"
        ref={stageRef}
        onTouchStart={event => {
          if (event.touches.length === 2) {
            pinch.current = { distance: touchDistance(event.touches), scale };
            drag.current = null;
          } else if (event.touches.length === 1 && scale > 1) {
            drag.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, offset };
          }
        }}
        onTouchMove={event => {
          if (event.touches.length === 2 && pinch.current) {
            const next = pinch.current.scale * (touchDistance(event.touches) / pinch.current.distance);
            const clamped = Math.min(4, Math.max(1, next));
            setScale(clamped);
            if (clamped === 1) setOffset({ x: 0, y: 0 });
          } else if (event.touches.length === 1 && drag.current) {
            setOffset({
              x: drag.current.offset.x + event.touches[0].clientX - drag.current.x,
              y: drag.current.offset.y + event.touches[0].clientY - drag.current.y,
            });
          }
        }}
        onTouchEnd={() => {
          pinch.current = null;
          drag.current = null;
        }}
        onPointerDown={event => {
          if (event.pointerType === 'touch' || scale <= 1) return;
          drag.current = { x: event.clientX, y: event.clientY, offset, pointer: event.pointerId };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          if (!drag.current || drag.current.pointer !== event.pointerId) return;
          setOffset({
            x: drag.current.offset.x + event.clientX - drag.current.x,
            y: drag.current.offset.y + event.clientY - drag.current.y,
          });
        }}
        onPointerUp={() => { drag.current = null; }}
      >
        <img
          src={src}
          alt={name}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          draggable="false"
          onError={() => setFailed(current => (current !== 'original' && source.original && source.original !== source.zoom ? 'original' : 'logo'))}
        />
      </div>
      <div className="image-viewer__tools">
        {images.length > 1 && (
          <button type="button" onClick={() => onIndex((index - 1 + images.length) % images.length)} aria-label="Previous photo">
            <ChevronLeft size={18} />
          </button>
        )}
        <button type="button" onClick={() => zoomBy(-0.5)} disabled={scale <= 1} aria-label="Zoom out">
          <Minus size={18} />
        </button>
        <button type="button" onClick={() => zoomBy(0.5)} disabled={scale >= 4} aria-label="Zoom in">
          <Plus size={18} />
        </button>
        {images.length > 1 && (
          <button type="button" onClick={() => onIndex((index + 1) % images.length)} aria-label="Next photo">
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
