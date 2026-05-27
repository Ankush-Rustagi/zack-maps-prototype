import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectFlyoutOpen } from '../store';
import { geocode, reverseGeocode } from '../data/geocode';
import type { GeocodeResult } from '../data/geocode';
import { INVENTORY } from '../data/inventory';
import { BulkAddModal } from './BulkAddModal';

/**
 * Anchored popover triggered by the toolbar's "Add location" button.
 * Two-step flow inline:
 *   1. Type address → pick from autocomplete suggestions → pin drops on map.
 *   2. Name the location → Save (form resets so you can add another).
 */
export function CreateLocationPopover() {
  const open = useStore((s) => s.createOpen);
  const setOpen = useStore((s) => s.setCreateOpen);
  const flyoutOpen = useStore(selectFlyoutOpen);
  const addLocation = useStore((s) => s.addLocation);
  const flyTo = useStore((s) => s.flyTo);
  const setDraftPin = useStore((s) => s.setDraftPin);
  const selectLocation = useStore((s) => s.selectLocation);

  const locations = useStore((s) => s.locations);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<GeocodeResult | null>(null);
  const [name, setName] = useState('');
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loadingDetected, setLoadingDetected] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const queryInputRef = useRef<HTMLInputElement | null>(null);

  // "Detected addresses" — distinct inventory addresses not yet added as
  // locations. These are buildings the user has in their broader Verkada
  // platform but hasn't yet placed on the map.
  const detected = useMemo(() => {
    const taken = new Set(locations.map((l) => (l.address ?? '').toLowerCase().trim()));
    const seen = new Set<string>();
    const list: { address: string; building: string }[] = [];
    for (const b of INVENTORY) {
      const key = b.address.toLowerCase().trim();
      if (taken.has(key) || seen.has(key)) continue;
      seen.add(key);
      list.push({ address: b.address, building: b.name });
    }
    return list;
  }, [locations]);

  // Reset everything when the popover closes.
  useEffect(() => {
    if (!open) {
      setQuery(''); setResults([]); setPicked(null); setName(''); setJustSaved(null);
      setLocating(false); setLoadingDetected(null);
    }
  }, [open]);

  // Autofocus the right input when state changes
  useEffect(() => {
    if (!open) return;
    if (picked) nameInputRef.current?.focus();
    else queryInputRef.current?.focus();
  }, [open, picked]);

  // Debounced geocoding.
  useEffect(() => {
    if (!open || picked) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(async () => {
      try {
        const r = await geocode(q, ctrl.signal);
        if (!ctrl.signal.aborted) { setResults(r); setSearching(false); }
      } catch { if (!ctrl.signal.aborted) setSearching(false); }
    }, 280);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [query, open, picked]);

  if (!open) return null;

  function pickResult(r: GeocodeResult) {
    setPicked(r);
    setResults([]);
    setQuery(r.fullAddress || r.name);
    // Drop a preview pin on the map immediately — disappears on Save (replaced
    // by the real pending pin) or on Change / Close.
    setDraftPin({ lng: r.lng, lat: r.lat });
    flyTo({ lng: r.lng, lat: r.lat, zoom: 15 });
    // Seed name with the place's short name as a sensible default.
    if (!name) setName(r.name);
  }

  function clearPick() {
    setPicked(null);
    setQuery('');
    setResults([]);
    setDraftPin(null);
  }

  function useMyLocation() {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        try {
          const r = await reverseGeocode(lng, lat);
          if (r) {
            pickResult(r);
          } else {
            pickResult({
              id: `loc-${Date.now()}`,
              name: 'My current location',
              fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              placeType: 'place',
              lng, lat,
            });
          }
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function pickDetected(address: string, buildingName: string) {
    if (loadingDetected) return;
    setLoadingDetected(address);
    try {
      const matches = await geocode(address);
      const r = matches[0];
      if (r) {
        pickResult({ ...r, name: buildingName, fullAddress: r.fullAddress || address });
      }
    } finally {
      setLoadingDetected(null);
    }
  }

  function save() {
    if (!picked || !name.trim()) return;
    addLocation({
      name: name.trim(),
      lng: picked.lng,
      lat: picked.lat,
      address: picked.fullAddress || picked.name,
    });
    setJustSaved(name.trim());
    // Reset form for the next add.
    setQuery(''); setResults([]); setPicked(null); setName('');
    // Clear the toast after a moment.
    setTimeout(() => setJustSaved(null), 2400);
    queryInputRef.current?.focus();
  }

  function saveAndClose() {
    if (!picked || !name.trim()) return;
    const id = addLocation({
      name: name.trim(),
      lng: picked.lng,
      lat: picked.lat,
      address: picked.fullAddress || picked.name,
    });
    setOpen(false);
    // Open the new location's panel immediately so the user can keep configuring.
    selectLocation(id);
  }

  return (
    <div className={`create-pop${flyoutOpen ? ' shifted' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="cp-hdr">
        <div className="cp-title">Create a location</div>
        <button className="btn-icon" onClick={() => setOpen(false)}>✕</button>
      </div>

      {!picked && (
        <>
          <div>
            <div className="cp-step-label">Step 1 · Find an address</div>
            <div className="cp-search-wrap">
              <input
                ref={queryInputRef}
                className="cp-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search an address…"
              />
              {(results.length > 0 || searching) && (
                <div className="cp-suggest">
                  {searching && results.length === 0 && (
                    <div className="cp-suggest-row" style={{ color: 'var(--text-muted)', cursor: 'default', fontSize: 12 }}>
                      Searching…
                    </div>
                  )}
                  {results.map((r) => (
                    <div key={r.id} className="cp-suggest-row" onClick={() => pickResult(r)}>
                      <div className="cp-suggest-name">{r.name}</div>
                      <div className="cp-suggest-addr">{r.fullAddress}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="cp-quick-btn"
              onClick={useMyLocation}
              disabled={locating}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              <span>{locating ? 'Locating…' : 'Use my current location'}</span>
            </button>

            {detected.length > 0 && (
              <div className="cp-detected">
                <div className="cp-detected-label">
                  Detected addresses
                  <span className="cp-detected-hint">from your Verkada platform</span>
                </div>
                <div className="cp-detected-list">
                  {detected.map((d) => (
                    <button
                      type="button"
                      key={d.address}
                      className="cp-detected-row"
                      onClick={() => pickDetected(d.address, d.building)}
                      disabled={loadingDetected !== null}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 3v18" />
                      </svg>
                      <div className="cp-detected-text">
                        <div className="cp-detected-name">{d.building}</div>
                        <div className="cp-detected-addr">{d.address}</div>
                      </div>
                      <span className="cp-detected-chev">
                        {loadingDetected === d.address ? '…' : '+'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {picked && (
        <>
          <div>
            <div className="cp-step-label">Step 1 · Address</div>
            <div className="cp-selected">
              <span className="icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div className="label">
                <div className="name">{picked.name}</div>
                <div className="addr">{picked.fullAddress}</div>
              </div>
              <button className="change" onClick={clearPick}>Change</button>
            </div>
          </div>
          <div>
            <div className="cp-step-label">Step 2 · Name this location</div>
            <input
              ref={nameInputRef}
              className="cp-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HQ Campus, Warehouse SF…"
              onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            />
          </div>
        </>
      )}

      {justSaved && (
        <div className="cp-just-saved">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Saved "{justSaved}" · ready for the next one
        </div>
      )}

      <div className="cp-actions">
        <button className="btn-s" onClick={saveAndClose} disabled={!picked || !name.trim()}>Save & close</button>
        <button className="btn-p" onClick={save} disabled={!picked || !name.trim()}>Save &amp; add another</button>
      </div>

      <div className="cp-bulk-link" onClick={() => setBulkOpen(true)}>
        Adding many at once? Upload a CSV →
      </div>

      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  );
}
