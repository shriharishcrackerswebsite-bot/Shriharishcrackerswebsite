import { isRichText, sanitizeRichText } from '../lib/richText';

export default function ProductDescription({ text }) {
  const value = String(text || '').trim();
  if (!value) return null;
  if (!isRichText(value)) return <p className="modal-description">{value}</p>;
  return <div className="modal-description is-rich" dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }} />;
}
