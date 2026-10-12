import { useEffect, useMemo, useRef, useState } from 'react';
import { money } from '../../lib/money';
import { classifyImport, rowOutcome, summarizeImport } from '../../lib/catalog';
import { downloadTemplate, readSpreadsheet } from '../../lib/excel';
import ConfirmDialog from '../ConfirmDialog';

export default function ImportDialog({ open, kind, items, onClose, onApply }) {
  const applying = useRef(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState('add');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const summary = useMemo(() => summarizeImport(rows, mode, items), [rows, mode, items]);
  const canApply = rows.length > 0 && !fileError && !result && !busy && summary.add + (mode === 'update' ? summary.update : 0) > 0;

  if (!open) return null;

  const resetFile = () => {
    setFileName('');
    setFileError('');
    setWarnings([]);
    setRows([]);
    setResult('');
    setConfirming(false);
  };

  const onFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    resetFile();
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    const parsed = await readSpreadsheet(file, kind);
    setBusy(false);
    if (parsed.error) {
      setFileError(parsed.error);
      return;
    }
    setWarnings(parsed.warnings || []);
    setRows(classifyImport(parsed.rows, items, kind));
  };

  const confirmMessage = () => {
    const noun = count => `${count} item${count === 1 ? '' : 's'}`;
    if (mode === 'update') {
      return `Update ${noun(summary.update)} and add ${noun(summary.add)} in Firestore?\n\nRejected rows: ${summary.rejected}. Existing records stay in place except where a row matches by id or name. Nothing is deleted.`;
    }
    return `Add ${noun(summary.add)} to Firestore?\n\nRejected rows: ${summary.rejected}. Items that are already saved will not be added again, and existing records will not be overwritten.`;
  };

  const apply = async () => {
    if (applying.current) return;
    applying.current = true;
    setBusy(true);
    setFileError('');
    try {
      const outcome = await onApply({ rows, mode, summary });
      if (!outcome?.ok) {
        setFileError(outcome?.message || 'Firestore did not save this import.');
        setConfirming(false);
        return;
      }
      setResult(outcome.message);
      setConfirming(false);
    } catch (error) {
      setFileError(error.message || 'Firestore did not save this import.');
      setConfirming(false);
    } finally {
      applying.current = false;
      setBusy(false);
    }
  };

  const visibleRows = [
    ...rows.filter(row => row.status === 'invalid' || (mode === 'add' && row.status === 'update')),
    ...rows.filter(row => row.status !== 'invalid' && !(mode === 'add' && row.status === 'update')).slice(0, 40),
  ];
  const hiddenReady = Math.max(0, rows.length - visibleRows.length);

  return (
    <div className="import-layer" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <button className="confirm-backdrop" type="button" aria-label="Close import" onClick={onClose} />
      <section className="import-card">
        <header className="import-card__head">
          <div>
            <h2 id="import-title">Import Excel</h2>
            <p>{kind === 'products' ? 'Image-based products' : 'Text-only product list'}</p>
          </div>
          <button className="button ghost" type="button" onClick={onClose}>Close</button>
        </header>

        <div className="import-note">
          <p>A successful import is saved to Cloud Firestore. Success is shown only after Firestore accepts the write.</p>
          {kind === 'products' && <p>Image cells are file paths, such as /image.png. The workbook does not contain the pictures, so those files must already be on the site.</p>}
        </div>

        <div className="import-actions">
          <label className="button primary import-file">
            Choose .xlsx or .csv
            <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} />
          </label>
          <button className="button ghost" type="button" onClick={() => downloadTemplate(kind)}>Download template</button>
        </div>
        {fileName && <p className="import-file-name">{busy && !confirming ? `Reading ${fileName}…` : fileName}</p>}
        {busy && confirming && <p className="import-file-name" role="status">Saving to Firestore…</p>}
        {fileError && <p className="admin-error" role="alert">{fileError}</p>}
        {warnings.map(warning => <p className="import-warning" key={warning}>{warning}</p>)}

        {rows.length > 0 && !result && (
          <>
            <fieldset className="import-modes">
              <legend>How should matching items be handled?</legend>
              <label><input type="radio" name="import-mode" checked={mode === 'add'} onChange={() => setMode('add')} /> Add new items</label>
              <label><input type="radio" name="import-mode" checked={mode === 'update'} onChange={() => setMode('update')} /> Update matching items and add new ones</label>
            </fieldset>

            <dl className="import-counts">
              <div><dt>Ready to add</dt><dd>{summary.add}</dd></div>
              <div><dt>Ready to update</dt><dd>{mode === 'update' ? summary.update : 0}</dd></div>
              <div><dt>Rejected</dt><dd>{summary.rejected}</dd></div>
            </dl>

            <div className="import-table-wrap">
              <table>
                <thead>
                  <tr><th>Row</th><th>Name</th><th>Price</th><th>Result</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {visibleRows.map(row => (
                    <tr key={`${row.rowNumber}-${row.name}`} className={row.status === 'invalid' || (mode === 'add' && row.status === 'update') ? 'is-rejected' : ''}>
                      <td>{row.rowNumber}</td>
                      <td>{row.name || '—'}</td>
                      <td>{row.price == null ? '—' : money.format(row.price)}</td>
                      <td>{rowOutcome(row, mode)}</td>
                      <td>{[...row.issues, ...row.notes].join(' ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hiddenReady > 0 && <p className="import-warning">{hiddenReady} more ready rows are included in the counts above.</p>}
            <button className="button primary" type="button" disabled={!canApply} onClick={() => setConfirming(true)}>Apply import</button>
          </>
        )}

        {result && <p className="admin-success" role="status">{result}</p>}
        {result && rows.some(row => row.status === 'invalid' || (mode === 'add' && row.status === 'update')) && (
          <div className="import-table-wrap">
            <table>
              <thead>
                <tr><th>Row</th><th>Name</th><th>Result</th><th>Details</th></tr>
              </thead>
              <tbody>
                {rows.filter(row => row.status === 'invalid' || (mode === 'add' && row.status === 'update')).map(row => (
                  <tr key={`result-${row.rowNumber}-${row.name}`} className="is-rejected">
                    <td>{row.rowNumber}</td>
                    <td>{row.name || '—'}</td>
                    <td>{rowOutcome(row, mode)}</td>
                    <td>{row.issues.join(' ') || 'Already saved, so it was not added again.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ConfirmDialog
        open={confirming}
        title="Apply this import?"
        message={confirmMessage()}
        confirmLabel={busy ? 'Saving…' : 'Save to Firestore'}
        onCancel={() => { if (!busy) setConfirming(false); }}
        onConfirm={apply}
      />
    </div>
  );
}
