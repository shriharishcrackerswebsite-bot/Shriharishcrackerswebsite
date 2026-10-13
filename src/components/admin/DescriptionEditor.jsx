import { useEffect, useRef } from 'react';
import { editorHtml, sanitizeRichText } from '../../lib/richText';

function apply(command, value = null) {
  document.execCommand(command, false, value);
}

export default function DescriptionEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!editorRef.current || loaded.current) return undefined;
    editorRef.current.innerHTML = editorHtml(value);
    loaded.current = true;
    return undefined;
  }, [value]);

  const sync = () => {
    const html = editorRef.current?.innerHTML || '';
    onChange(sanitizeRichText(html));
  };

  const run = (command, commandValue) => {
    editorRef.current?.focus();
    apply('defaultParagraphSeparator', 'p');
    apply(command, commandValue);
    sync();
  };

  const addLink = () => {
    const href = window.prompt('Enter a link address starting with https://, mailto:, or tel:');
    const clean = String(href || '').trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(clean)) return;
    run('createLink', clean);
  };

  return (
    <div className="description-editor">
      <div className="description-editor__tools" role="toolbar" aria-label="Description formatting">
        <button type="button" onClick={() => run('bold')} aria-label="Bold"><b>B</b></button>
        <button type="button" onClick={() => run('italic')} aria-label="Italic"><i>I</i></button>
        <button type="button" onClick={() => run('formatBlock', 'p')}>Paragraph</button>
        <button type="button" onClick={() => run('formatBlock', 'h3')}>Heading</button>
        <button type="button" onClick={() => run('insertUnorderedList')}>Bullets</button>
        <button type="button" onClick={() => run('insertOrderedList')}>Numbers</button>
        <button type="button" onClick={addLink}>Link</button>
      </div>
      <div
        ref={editorRef}
        className="description-editor__body"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Product description"
        onInput={sync}
        onPaste={event => {
          event.preventDefault();
          const text = event.clipboardData?.getData('text/plain') || '';
          apply('insertText', text);
          sync();
        }}
      />
    </div>
  );
}
