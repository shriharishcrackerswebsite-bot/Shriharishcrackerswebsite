import { useEffect, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { hasAcceptedNotice, NOTICE_STORAGE_KEY } from '../lib/exitEnquiry';
import './ImportantNotice.css';

const LAUNCH_COLORS = ['#ff944e', '#ffd15c', '#ef6c91', '#f05b69', '#7cf0c4', '#8ec5ff', '#fff'];

function launchParticles() {
  return Array.from({ length: 18 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 18;
    return {
      x: Math.cos(angle) * 46,
      y: Math.sin(angle) * -42 - 8,
      color: LAUNCH_COLORS[index % LAUNCH_COLORS.length],
      delay: `${0.08 + (index % 6) * 0.04}s`,
    };
  });
}

function LaunchAnimation() {
  return (
    <div className="launch-overlay" role="status" aria-live="polite" aria-label="Opening the website">
      <div className="launch-blast" />
      {launchParticles().map(particle => (
        <span
          key={`${particle.x}-${particle.y}`}
          className="launch-particle"
          style={{ '--x': particle.x, '--y': particle.y, '--delay': particle.delay, background: particle.color }}
        />
      ))}
      <div className="launch-rocket" aria-hidden="true">
        <svg viewBox="0 0 80 140" width="72" height="126">
          <path d="M40 8c16 18 22 42 22 68 0 10-4 18-10 24H28c-6-6-10-14-10-24 0-26 6-50 22-68z" fill="#fff8f5" />
          <path d="M28 92c-14 6-20 18-22 30 10-4 18-6 22-6h22c4 0 12 2 22 6-2-12-8-24-22-30H28z" fill="#ff944e" />
          <circle cx="40" cy="58" r="10" fill="#38235f" />
          <circle cx="40" cy="58" r="5" fill="#8ec5ff" />
          <path d="M32 118c4 10 8 16 8 16s4-6 8-16" fill="#ffd15c" />
          <path d="M36 122c2 8 4 12 4 12s2-4 4-12" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}

export default function ImportantNotice() {
  const [open, setOpen] = useState(() => !hasAcceptedNotice());
  const [launching, setLaunching] = useState(false);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    headingRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!launching) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setLaunching(false), reduced ? 420 : 2400);
    return () => window.clearTimeout(timer);
  }, [launching]);

  const acceptNotice = () => {
    try {
      window.localStorage.setItem(NOTICE_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Unable to save the important notice acknowledgement.', error);
    }
    window.dispatchEvent(new Event('shc-notice-accepted'));
    setOpen(false);
    setLaunching(true);
  };

  return (
    <>
      {launching && <LaunchAnimation />}
      <aside className="enquiry-notice" aria-label="Firecracker enquiry notice">
        <div className="enquiry-notice__inner">
          <TriangleAlert className="enquiry-notice__icon" size={21} aria-hidden="true" />
          <p className="enquiry-notice__message">
            <strong>Enquiry only.</strong> <span>No online firecracker sales.</span>
          </p>
          <button
            className="enquiry-notice__details"
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
          >
            Details
          </button>
        </div>
      </aside>

      <dialog
        ref={dialogRef}
        className="important-notice"
        aria-labelledby="important-notice-heading"
        aria-describedby="important-notice-copy"
        onCancel={event => event.preventDefault()}
      >
        <header className="important-notice__header">
          <TriangleAlert className="important-notice__icon" size={30} aria-hidden="true" />
          <h2 id="important-notice-heading" ref={headingRef} tabIndex="-1">
            IMPORTANT NOTICE
          </h2>
        </header>

        <div className="important-notice__content" id="important-notice-copy">
          <p>
            As per the 2018 Supreme Court order, online sale of firecrackers is not permitted. We
            value our customers and, at the same time, respect jurisdiction.
          </p>
          <p>
            Add the required products to your cart and submit them through the enquiry button. We
            will contact you within 24 hours and confirm the order through WhatsApp or a phone call.
          </p>
          <p>
            Please submit your enquiry and enjoy your Diwali with Shri Harish Crackers.
          </p>
          <p>
            Shri Harish Crackers follows legal and statutory compliances. Our shops and go-downs
            are maintained under the applicable explosive acts, and parcels are sent through
            registered transport providers.
          </p>
        </div>

        <footer className="important-notice__footer">
          <button className="important-notice__accept" type="button" onClick={acceptNotice}>
            I Agree &amp; Continue
          </button>
        </footer>
      </dialog>
    </>
  );
}
