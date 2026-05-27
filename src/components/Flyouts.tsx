import { useStore } from '../store';
import { PlaceCard } from './RightPanels';

/* Each flyout renders only when its state is active (or in the case of L→F). */

export function Flyouts() {
  const curState = useStore((s) => s.curState);
  const selectedLocationId = useStore((s) => s.selectedLocationId);
  // Location detail (formerly the right-side PlaceCard) is now a "second page"
  // of the left panel. Keep it mounted while a device (Q) or event (R) panel
  // is open so the user retains location context.
  const showLocationDetail =
    (curState === 'V' || curState === 'Q' || curState === 'R') && !!selectedLocationId;
  return (
    <>
      {curState === 'C' && <RecentsFlyout />}
      {curState === 'D' && <LocationsFlyout />}
      {curState === 'E' && <CollectionsFlyout />}
      {(curState === 'F' || curState === 'L') && <FilesFlyout />}
      {curState === 'O' && <CollectionDetailFlyout />}
      {showLocationDetail && <PlaceCard inFlyout />}
    </>
  );
}

function FlyoutShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="flyout">
      <div className="flyout-hdr">
        <span className="flyout-title">{title}</span>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>
      <div className="flyout-body">{children}</div>
    </div>
  );
}

function useClose() {
  return useStore((s) => s.closeFlyout);
}
function useGo() {
  return useStore((s) => s.goState);
}

function RecentsFlyout() {
  return (
    <FlyoutShell title="Recents" onClose={useClose()}>
      <input className="flyout-input" placeholder="Filter this list…" />
      <div className="chips">
        <span className="chip on">All</span>
        <span className="chip">Places</span>
        <span className="chip">Devices</span>
        <span className="chip">Collections</span>
      </div>
      <div className="flyout-meta"><span>5 recents</span><span>Sort: Most recent</span></div>
      <div className="flyout-scope">Filtered by <strong>Site: HQ-MAIN</strong></div>
      {[
        ['Floor 3', 'Floor', 'HQ Campus › Main Bldg', '2 min ago'],
        ['Lobby', 'Area', 'HQ Campus › Main Bldg › Floor 1', '12 min ago'],
        ['Dock 4', 'Area', 'Warehouse A › Building 1 › Floor 1', 'Yesterday'],
        ['Storefront', 'Building', 'Retail · Palo Alto', 'Mon'],
        ['Roof', 'Floor', 'HQ Campus › Main Bldg', 'Last week'],
      ].map(([name, kind, sub, time]) => (
        <div className="list-item" key={name + sub}>
          <div className="li-body">
            <div className="li-name">{name} <span className="tbadge">{kind}</span></div>
            <div className="li-sub">{sub}</div>
          </div>
          <span className="li-time">{time}</span>
        </div>
      ))}
    </FlyoutShell>
  );
}

function LocationsFlyout() {
  const close = useClose();
  const locations = useStore((s) => s.locations);
  const selectLocation = useStore((s) => s.selectLocation);
  const setCreateOpen = useStore((s) => s.setCreateOpen);
  const setHoverLocationId = useStore((s) => s.setHoverLocationId);

  const pending = locations.filter((l) => l.setupStatus === 'pending');
  const configured = locations.filter((l) => l.setupStatus === 'configured');

  return (
    <FlyoutShell title="Locations" onClose={close}>
      <input className="flyout-input" placeholder="Filter this list…" />
      <div className="flyout-meta">
        <span>{locations.length} {locations.length === 1 ? 'location' : 'locations'}</span>
        <span>Sort: A–Z</span>
      </div>

      {locations.length === 0 && (
        <div className="pc-empty-cta" style={{ marginTop: 12 }}>
          <div>No locations yet.</div>
          <button className="btn-p" style={{ marginTop: 10 }} onClick={() => { close(); setCreateOpen(true); }}>Add a location</button>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="unplaced-hdr" style={{ marginTop: 10 }}>Pending setup · {pending.length}</div>
          {pending.map((l) => (
            <div
              key={l.id}
              className="list-item"
              onClick={() => selectLocation(l.id)}
              onMouseEnter={() => setHoverLocationId(l.id)}
              onMouseLeave={() => setHoverLocationId(null)}
            >
              <div className="li-body">
                <div className="li-name">{l.name} <span className="tbadge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Pending</span></div>
                <div className="li-sub">{l.address ?? `${l.lng.toFixed(4)}, ${l.lat.toFixed(4)}`}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {configured.length > 0 && (
        <>
          <div className="unplaced-hdr" style={{ marginTop: pending.length > 0 ? 14 : 10 }}>Configured · {configured.length}</div>
          {configured.map((l) => (
            <div
              key={l.id}
              className="list-item"
              onClick={() => selectLocation(l.id)}
              onMouseEnter={() => setHoverLocationId(l.id)}
              onMouseLeave={() => setHoverLocationId(null)}
            >
              <div className="li-body">
                <div className="li-name">{l.name} <span className="tbadge">Location</span></div>
                <div className="li-sub">{l.deviceCount} devices · {l.floors.length} {l.floors.length === 1 ? 'floor' : 'floors'} · {l.siteIds.length === 0 ? 'no site' : l.siteIds.join(', ')}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </FlyoutShell>
  );
}

function CollectionsFlyout() {
  const go = useGo();
  return (
    <FlyoutShell title="Collections" onClose={useClose()}>
      <input className="flyout-input" placeholder="Filter this list…" />
      <div className="chips">
        <span className="chip on">All</span>
        <span className="chip">Mine</span>
        <span className="chip">Shared</span>
        <span className="chip">Pinned</span>
      </div>
      <div className="flyout-meta"><span>3 collections</span><span>Sort: Last edited</span></div>
      <div className="flyout-scope">Filtered by <strong>Site: HQ-MAIN</strong></div>
      <div className="list-item" onClick={() => go('O')}>
        <div className="li-body">
          <div className="li-name">Lobbies (all sites) <span className="tbadge">Collection</span></div>
          <div className="li-sub">5 places · Floors + Areas, mixed</div>
        </div>
        <span className="li-num">5</span>
      </div>
      <div className="list-item">
        <div className="li-body">
          <div className="li-name">Warehouses <span className="tbadge">Collection</span></div>
          <div className="li-sub">5 places · Locations + sub-areas</div>
        </div>
        <span className="li-num">5</span>
      </div>
      <div className="list-item">
        <div className="li-body">
          <div className="li-name">Q2 Roadmap pilot sites <span className="tbadge">Collection</span></div>
          <div className="li-sub">4 places · Shared with PM org</div>
        </div>
        <span className="li-num">4</span>
      </div>
    </FlyoutShell>
  );
}

function FilesFlyout() {
  const go = useGo();
  return (
    <FlyoutShell title="Files" onClose={useClose()}>
      <input className="flyout-input" placeholder="Filter this list…" />
      <div className="chips">
        <span className="chip on">All</span>
        <span className="chip on">Unplaced</span>
        <span className="chip">Active</span>
      </div>
      <div className="flyout-meta"><span>3 unplaced · 3 active</span><span>Sort: Newest</span></div>
      <div className="flyout-scope">Filtered by <strong>Site: HQ-MAIN</strong></div>
      <div className="drop-zone">
        <div className="drop-zone-label">Drag floorplans here, or upload</div>
        <button className="btn-p" style={{ fontSize: 12, padding: '5px 18px' }}>Upload</button>
      </div>
      <div className="unplaced-hdr">Unplaced</div>
      {['main-bldg-floor-2-DRAFT.pdf', 'main-bldg-floor-4.pdf', 'warehouse-b-layout-v1.pdf'].map((file) => (
        <div className="list-item" key={file}>
          <div className="li-body">
            <div className="li-name">{file}</div>
            <div style={{ marginTop: 4 }}>
              <button className="btn-s" style={{ fontSize: 11, padding: '2px 9px' }} onClick={() => go('N')}>Bind to Place</button>
            </div>
          </div>
        </div>
      ))}
    </FlyoutShell>
  );
}

function CollectionDetailFlyout() {
  const go = useGo();
  return (
    <div className="flyout">
      <div className="flyout-hdr">
        <span className="flyout-title">Lobbies (all sites)</span>
        <button className="btn-icon" onClick={() => go('E')}>✕</button>
      </div>
      <div className="flyout-body">
        <div className="coll-crumb"><span className="crumb-link" onClick={() => go('E')}>← All Collections</span></div>
        <div className="chips" style={{ marginBottom: 8 }}><span className="chip on">Lobbies (all sites)</span></div>
        <input className="flyout-input" placeholder="Filter this list…" />
        <div className="chips">
          <span className="chip on">All</span>
          <span className="chip">Locations</span>
          <span className="chip">Buildings</span>
          <span className="chip">Floors</span>
          <span className="chip">Areas</span>
        </div>
        <div className="flyout-meta"><span>5 items</span><span>Sort: A–Z</span></div>
        <div className="flyout-scope">Filtered by <strong>Site: HQ-MAIN</strong></div>
        {[
          ['Lobby', 'HQ Campus › Main Bldg › Floor 1'],
          ['Lobby', 'HQ Campus › Main Bldg › Floor 3'],
          ['Storefront entry', 'Retail · Palo Alto › Storefront'],
          ['Storefront entry', 'Retail · Mountain View › Storefront'],
          ['Lobby', 'Warehouse A › Main Building › Ground'],
        ].map(([name, sub], i) => (
          <div className="list-item" key={i} onClick={() => go('G')}>
            <div className="li-body">
              <div className="li-name">{name} <span className="tbadge">Area</span></div>
              <div className="li-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
