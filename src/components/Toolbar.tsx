import { useEffect, useRef, useState } from 'react';
import { useStore, selectFlyoutOpen, selectIsEditor, selectIsSettings } from '../store';
import { geocode } from '../data/geocode';
import type { GeocodeResult } from '../data/geocode';

export function Toolbar() {
  const curState = useStore((s) => s.curState);
  const goState = useStore((s) => s.goState);
  const openDropdown = useStore((s) => s.openDropdown);
  const toggleDropdown = useStore((s) => s.toggleDropdown);
  const closeAllDropdowns = useStore((s) => s.closeAllDropdowns);
  const openEvent = useStore((s) => s.openEvent);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const flyTo = useStore((s) => s.flyTo);
  const setCreateOpen = useStore((s) => s.setCreateOpen);
  const flyoutOpen = useStore(selectFlyoutOpen);
  const isEditor = useStore(selectIsEditor);
  const isSettings = useStore(selectIsSettings);

  // Debounced geocoding lookup
  const [addressResults, setAddressResults] = useState<GeocodeResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (curState !== 'J' || q.length < 2) {
      setAddressResults([]);
      setGeocoding(false);
      return;
    }
    setGeocoding(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(async () => {
      try {
        const results = await geocode(q, ctrl.signal);
        if (!ctrl.signal.aborted) {
          setAddressResults(results);
          setGeocoding(false);
        }
      } catch {
        if (!ctrl.signal.aborted) setGeocoding(false);
      }
    }, 280);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [searchQuery, curState]);

  if (isEditor || isSettings) return null;

  const searchActive = curState === 'J';
  const isEmpty = curState === 'T';
  const cls = `toolbar${flyoutOpen ? ' shifted' : ''}`;

  function handleSearchClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!searchActive) {
      setSearchQuery('');
      goState('J');
    }
  }
  function clearSearch(e: React.MouseEvent) {
    e.stopPropagation();
    setSearchQuery('');
    setAddressResults([]);
    goState('A');
  }
  function pickAddress(r: GeocodeResult) {
    flyTo({ lng: r.lng, lat: r.lat, zoom: 17 });
    setSearchQuery(r.fullAddress || r.name);
    goState('A');
  }

  return (
    <>
    <button
      className={`add-loc-btn${flyoutOpen ? ' shifted' : ''}`}
      onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setCreateOpen(true); }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add location
    </button>
    <div className={cls} onClick={(e) => e.stopPropagation()}>
      <div className={`tb-search${searchActive ? ' active' : ''}`} onClick={handleSearchClick}>
        <svg className="tb-search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {searchActive ? (
          <>
            <input
              className="tb-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places, devices, addresses…"
              autoFocus
            />
            <button className="tb-clear" onClick={clearSearch}>✕</button>
          </>
        ) : (
          <span className="tb-placeholder">Search places, devices, addresses…</span>
        )}
      </div>

      <div className="tb-divider" />

      <button
        className={`tb-icon-btn${openDropdown === 'site' ? ' active' : ''}`}
        title="Filter by site"
        onClick={(e) => { e.stopPropagation(); toggleDropdown('site'); }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      <div className="tb-divider" />

      <button
        className={`tb-icon-btn last${openDropdown === 'alerts' ? ' active' : ''}`}
        title="Alerts & Events"
        onClick={(e) => { e.stopPropagation(); toggleDropdown('alerts'); }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {!isEmpty && <span className="tb-badge">2</span>}
      </button>

      {searchActive && (
        <div className="search-drop" onClick={(e) => e.stopPropagation()}>
          <div className="sd-scope">
            Scoped by <strong>Site: HQ-MAIN</strong> · <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>change in the filter</span>
          </div>
          <div className="sd-chips">
            <div className="chips" style={{ margin: 0 }}>
              <span className="chip on">All</span>
              <span className="chip">Devices</span>
              <span className="chip">Addresses</span>
              <span className="chip">Places</span>
              <span className="chip">Collections</span>
            </div>
          </div>

          {/* Address results from Mapbox Geocoding */}
          {addressResults.length > 0 && (
            <>
              <div className="sd-label">Addresses{geocoding ? ' · searching…' : ''}</div>
              <div className="sd-results">
                {addressResults.map((r) => (
                  <div className="sd-row" key={r.id} onClick={() => pickAddress(r)}>
                    <div className="radio-dot" style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent)' }} />
                    <div className="li-body">
                      <div className="li-name">{r.name} <span className="tbadge">{r.placeType}</span></div>
                      <div className="li-sub">{r.fullAddress}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Mock devices/places — filtered by query as a lightweight contains-match */}
          {(() => {
            const q = searchQuery.trim().toLowerCase();
            const mock = [
              { name: 'Cam-Lobby-01', kind: 'Camera', sub: 'HQ › Main Bldg › Floor 3 › Lobby', go: 'Q' as const },
              { name: 'Cam-Lobby-02', kind: 'Camera', sub: 'HQ › Main Bldg › Floor 3 › Lobby', go: 'Q' as const },
              { name: 'Cam-Dock-04',  kind: 'Camera', sub: 'Warehouse A › Dock 4 (Area)',     go: 'Q' as const },
              { name: 'Floor 3',      kind: 'Floor',  sub: 'HQ › Main Bldg',                  go: 'G' as const },
            ];
            const matches = q ? mock.filter(m => m.name.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)) : mock;
            if (matches.length === 0) return null;
            return (
              <>
                <div className="sd-label">Places &amp; devices</div>
                <div className="sd-results">
                  {matches.map((m) => (
                    <div className="sd-row" key={m.name} onClick={() => goState(m.go)}>
                      <div className="radio-dot" />
                      <div className="li-body">
                        <div className="li-name">{m.name} <span className="tbadge">{m.kind}</span></div>
                        <div className="li-sub">{m.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Empty fallback */}
          {searchQuery.trim().length >= 2 && !geocoding && addressResults.length === 0 && (
            <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No matches for "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {openDropdown === 'site' && (
        <div className="site-picker" onClick={(e) => e.stopPropagation()}>
          <div className="sp-hdr">
            <div>
              <div className="sp-title">Filter by Site</div>
              <div className="sp-desc">Sites with map presence in the current view. Multi-select to widen visibility.</div>
            </div>
            <button className="btn-icon" onClick={closeAllDropdowns}>✕</button>
          </div>
          <div className="sp-body">
            <input className="sp-filter" type="text" placeholder="Filter sites…" />
            <div className="sp-row"><div className="sp-check on" /> HQ-MAIN <span className="sp-places">12 places</span></div>
            <div className="sp-row"><div className="sp-check" /> HQ-LAB <span className="sp-places">4 places</span></div>
            <div className="sp-row"><div className="sp-check" /> WAREHOUSE-A <span className="sp-places">6 places</span></div>
            <div className="sp-row"><div className="sp-check" /> WAREHOUSE-B <span className="sp-places">8 places</span></div>
            <div className="sp-row"><div className="sp-check" /> RETAIL-PA <span className="sp-places">2 places</span></div>
            <div className="sp-row"><div className="sp-check" /> RETAIL-MV <span className="sp-places">2 places</span></div>
          </div>
          <div className="sp-footer">
            Don't see a site? Sites only appear after they've been tied to a Place. <a href="#" onClick={(e) => e.preventDefault()}>Go to Maps setup</a>
          </div>
        </div>
      )}

      {openDropdown === 'alerts' && (
        <div className="alerts-dd" onClick={(e) => e.stopPropagation()}>
          <div className="alerts-dd-site" onClick={() => toggleDropdown('site')}>
            <div className="site-dot" />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sites:</span>
            <span style={{ fontWeight: 600 }}>HQ-MAIN</span>
            <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 7px', fontSize: 11, color: 'var(--text-muted)' }}>12 places</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11 }}>▼</span>
          </div>
          <div className="alerts-dd-hdr">
            <div className="alerts-dot" />
            <span style={{ fontWeight: 500 }}>Alerts & Events</span>
            {!isEmpty && (
              <span style={{ background: '#2563eb', borderRadius: 9, minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', padding: '0 4px' }}>2</span>
            )}
          </div>
          {isEmpty ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No alerts yet. Once you've placed devices on the map, alerts will land here.
            </div>
          ) : (
            <>
              <div className="alert-item" onClick={() => openEvent('door-forced', 'alerts')}>
                <div className="alert-meta">
                  <span className="badge badge-active">Active</span>
                  <span className="alert-time">3 min</span>
                </div>
                <div className="alert-name">Door forced open</div>
                <div className="alert-loc">HQ › Floor 2 › Lobby</div>
              </div>
              <div className="alert-item" onClick={() => openEvent('after-hours', 'alerts')}>
                <div className="alert-meta">
                  <span className="badge badge-recent">Recent</span>
                  <span className="alert-time">17 min</span>
                </div>
                <div className="alert-name">After-hours motion</div>
                <div className="alert-loc">Warehouse A › Dock 4</div>
              </div>
              <div className="alerts-footer">Showing alerts scoped to <em>HQ-MAIN</em>.</div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
