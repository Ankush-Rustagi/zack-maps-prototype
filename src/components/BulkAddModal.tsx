import { useRef, useState } from 'react';
import { useStore } from '../store';
import { csvToBulkRows } from '../data/csv';
import type { BulkRow } from '../data/csv';
import { geocode } from '../data/geocode';

type RowStatus =
  | { state: 'queued' }
  | { state: 'searching' }
  | { state: 'ok'; lng: number; lat: number; resolvedAddress: string }
  | { state: 'err'; reason: string };

interface ParsedRow extends BulkRow {
  status: RowStatus;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Bulk-add locations from a CSV. Accepts either a file upload or pasted text.
 * Format: 2 columns (address, name). If a header row is present, "name" and
 * "address" column positions are detected automatically.
 *
 * Flow:
 *   1. Parse → preview table with all rows (status: queued).
 *   2. Click "Geocode & save" → run geocoding sequentially, updating each row.
 *   3. On finish, successful rows are committed as pending locations and the
 *      modal closes.
 */
export function BulkAddModal({ open, onClose }: Props) {
  const addLocation = useStore((s) => s.addLocation);
  const centerOnAllLocations = useStore((s) => s.centerOnAllLocations);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [running, setRunning] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  function loadCsv(text: string) {
    const parsed = csvToBulkRows(text);
    setRows(parsed.map((r) => ({ ...r, status: { state: 'queued' as const } })));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((text) => { setPasteValue(text); loadCsv(text); });
  }

  function onPasteChange(value: string) {
    setPasteValue(value);
    if (value.trim()) loadCsv(value);
    else setRows([]);
  }

  async function runGeocoding() {
    setRunning(true);
    const out = [...rows];
    for (let i = 0; i < out.length; i++) {
      // Skip rows already resolved (in case user retries).
      if (out[i].status.state === 'ok') continue;
      out[i] = { ...out[i], status: { state: 'searching' } };
      setRows([...out]);
      try {
        const results = await geocode(out[i].address);
        if (results.length === 0) {
          out[i] = { ...out[i], status: { state: 'err', reason: 'No match' } };
        } else {
          const top = results[0];
          out[i] = {
            ...out[i],
            status: { state: 'ok', lng: top.lng, lat: top.lat, resolvedAddress: top.fullAddress || top.name },
          };
        }
      } catch (e) {
        out[i] = { ...out[i], status: { state: 'err', reason: (e as Error).message || 'Failed' } };
      }
      setRows([...out]);
    }
    // Commit successful rows.
    out.forEach((r) => {
      if (r.status.state === 'ok') {
        addLocation({
          name: r.name,
          address: r.status.resolvedAddress,
          lng: r.status.lng,
          lat: r.status.lat,
        });
      }
    });
    setRunning(false);
    // If anything succeeded, center the map on all locations so the user sees the haul.
    const successCount = out.filter((r) => r.status.state === 'ok').length;
    if (successCount > 0) setTimeout(() => centerOnAllLocations(), 350);
    // Auto-close if everything succeeded; otherwise keep open so user sees errors.
    if (successCount === out.length && successCount > 0) {
      setTimeout(onClose, 800);
    }
  }

  const queued = rows.filter((r) => r.status.state === 'queued').length;
  const ok = rows.filter((r) => r.status.state === 'ok').length;
  const err = rows.filter((r) => r.status.state === 'err').length;
  const searching = rows.filter((r) => r.status.state === 'searching').length;

  return (
    <div className="bulk-modal-bg" onClick={onClose}>
      <div className="bulk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bulk-hdr">
          <div>
            <div className="bulk-title">Bulk add locations</div>
            <div className="bulk-sub">
              Upload or paste a CSV with two columns — <strong>address</strong> and <strong>name</strong>.
              We'll geocode each row via Mapbox and add successful ones as pending locations.
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="bulk-body">
          <div className="bulk-pick-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              style={{ display: 'none' }}
              onChange={onFile}
            />
            <button className="bulk-file-btn" onClick={() => fileInputRef.current?.click()}>
              Choose CSV file…
            </button>
            <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>or paste below</span>
          </div>

          <textarea
            className="bulk-paste"
            placeholder={`address,name\n"405 E 4th Ave, San Mateo, CA",HQ\n"180 Concourse Dr, San Mateo, CA",Lab`}
            value={pasteValue}
            onChange={(e) => onPasteChange(e.target.value)}
          />

          {rows.length > 0 && (
            <div className="bulk-table-wrap">
              <div className="bulk-table-hdr">
                <div>#</div>
                <div>Name</div>
                <div>Address</div>
                <div style={{ textAlign: 'right' }}>Status</div>
              </div>
              {rows.map((r, i) => (
                <div className="bulk-row" key={i}>
                  <div className="row-num">{i + 1}</div>
                  <div className="name">{r.name}</div>
                  <div className="addr">
                    {r.address}
                    {r.status.state === 'ok' && r.status.resolvedAddress !== r.address && (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>→ {r.status.resolvedAddress}</div>
                    )}
                    {r.status.state === 'err' && (
                      <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>{r.status.reason}</div>
                    )}
                  </div>
                  <div className={`status ${r.status.state}`}>
                    {r.status.state === 'queued' && 'Queued'}
                    {r.status.state === 'searching' && '…'}
                    {r.status.state === 'ok' && '✓ Found'}
                    {r.status.state === 'err' && '✗ Failed'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bulk-footer">
          <div className="bulk-progress">
            {rows.length === 0 ? 'Paste or upload a CSV to preview rows' : (
              running
                ? `Working… ${ok + err}/${rows.length} (${searching} in flight)`
                : `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} parsed${ok ? ` · ${ok} added` : ''}${err ? ` · ${err} failed` : ''}`
            )}
          </div>
          <div className="bulk-actions">
            <button className="btn-s" onClick={onClose}>Close</button>
            <button
              className="btn-p"
              onClick={runGeocoding}
              disabled={running || rows.length === 0 || queued === 0}
            >
              {running ? 'Geocoding…' : `Geocode & save ${queued > 0 ? `(${queued})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
