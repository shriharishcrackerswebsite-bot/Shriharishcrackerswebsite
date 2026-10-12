import { useEffect, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { hasAcceptedNotice, NOTICE_STORAGE_KEY } from '../lib/exitEnquiry';
import './ImportantNotice.css';

export default function ImportantNotice() {
  const [open, setOpen] = useState(() => !hasAcceptedNotice());
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

  const acceptNotice = () => {
    try {
      window.localStorage.setItem(NOTICE_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Unable to save the important notice acknowledgement.', error);
    }
    window.dispatchEvent(new Event('shc-notice-accepted'));
    setOpen(false);
  };

  return (
    <>
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
