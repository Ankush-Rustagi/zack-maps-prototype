import { useEffect, useRef, useState } from 'react';
import { useStore, selectCurrentLocation } from '../store';
import { SITES } from '../data/sites';
import type { LocationFloor } from '../data/locations';
import { defaultLayoutCorners } from '../data/locations';
import { InventoryPicker } from './InventoryPicker';
import { INVENTORY } from '../data/inventory';
import type { InventoryBuilding, InventoryFloor } from '../data/inventory';
import { MOCK_DEVICES_FOR_LOCATION, KIND_ORDER } from '../data/devices';
import type { LocationDevice } from '../data/devices';

export function RightPanels() {
  const curState = useStore((s) => s.curState);
  // V (location detail) now renders in the LEFT flyout, see <Flyouts />.
  const showPlaceCard = ['G', 'H', 'M'].includes(curState);
  return (
    <>
      {showPlaceCard && <PlaceCard />}
      {curState === 'Q' && <DevicePanel />}
      {curState === 'R' && <EventPanel />}
    </>
  );
}

type PcTab = 'devices' | 'layouts';

export function PlaceCard({ inFlyout = false }: { inFlyout?: boolean } = {}) {
  const curState = useStore((s) => s.curState);
  const goState = useStore((s) => s.goState);
  const closeFlyout = useStore((s) => s.closeFlyout);
  const openDeviceMarker = useStore((s) => s.openDeviceMarker);
  const updateLocation = useStore((s) => s.updateLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const location = useStore(selectCurrentLocation);
  const selectedFloorId = useStore((s) => s.selectedFloorId);
  const setSelectedFloor = useStore((s) => s.setSelectedFloor);
  const [tab, setTab] = useState<PcTab>('devices');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(location?.name ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const pulse = curState === 'H';
  // When mounted in the left flyout, treat the panel as the location view
  // regardless of whether we're in V/Q/R — the device & event panels float
  // on top of (or beside) it, so the location context should stay rendered.
  const inLocationView = curState === 'V' || inFlyout;

  useEffect(() => {
    setEditingName(false);
    setNameDraft(location?.name ?? '');
    setConfirmingDelete(false);
  }, [location?.id]);

  // Pending locations get a minimal "Set up this location" panel — no tabs.
  if (location && location.setupStatus === 'pending' && inLocationView) {
    return <PendingPlaceCard inFlyout={inFlyout} />;
  }

  function commitName() {
    if (location && nameDraft.trim() && nameDraft.trim() !== location.name) {
      updateLocation(location.id, { name: nameDraft.trim() });
    }
    setEditingName(false);
  }
  function confirmDelete() {
    if (location) deleteLocation(location.id);
  }

  // Legacy single-place fallback (states G/H/M) keeps the original copy.
  const name = location?.name ?? 'Floor 3';
  const kind = location ? 'Location' : 'Floor';
  const crumb = location
    ? `${location.address ?? location.name}${location.siteIds.length ? ' · ' + location.siteIds.join(', ') : ''}`
    : 'HQ › Main Bldg › Floor 3 · Site: HQ-MAIN';
  const floors = location?.floors ?? [];
  const deviceCount = location?.deviceCount ?? 47;

  return (
    <div className={`place-card${inFlyout ? ' place-card--flyout' : ''}`}>
      {inFlyout && (
        <div className="pc-back-row">
          <button className="pc-back-link" onClick={() => goState('D')}>‹ All Locations</button>
        </div>
      )}
      <div className="pc-hdr">
        <div className="pc-name-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="pc-name-row" style={{ width: '100%' }}>
            {editingName && location ? (
              <input
                className="pc-name-edit"
                value={nameDraft}
                autoFocus
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') { setNameDraft(location.name); setEditingName(false); }
                }}
                spellCheck={false}
              />
            ) : (
              <span
                className="pc-name"
                style={{ cursor: location ? 'text' : 'default' }}
                onClick={() => { if (location) { setNameDraft(location.name); setEditingName(true); } }}
              >
                {name}
              </span>
            )}
            {!location && <span className="tbadge">{kind}</span>}
            {location && !editingName && (
              <button
                className="pc-name-pencil"
                onClick={() => { setNameDraft(location.name); setEditingName(true); }}
                title="Rename"
              >✎</button>
            )}
          </div>
          <div className="pc-crumb">{crumb}</div>
        </div>
        <div className="pc-hdr-right">
          <button className="pc-hdr-icon" title="Save to favorites">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="pc-hdr-icon" title="Share">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button
            className="pc-hdr-icon"
            onClick={() => (inFlyout ? goState('D') : closeFlyout())}
            title={inFlyout ? 'Back to Locations' : 'Close'}
          >✕</button>
        </div>
      </div>

      {location && inLocationView ? (
        <LocationDetailBody
          location={location}
          deviceCount={deviceCount}
          tab={tab}
          setTab={setTab}
          onOpenDevice={openDeviceMarker}
          confirmingDelete={confirmingDelete}
          setConfirmingDelete={setConfirmingDelete}
          confirmDelete={confirmDelete}
        />
      ) : (
        <>
          {inLocationView && floors.length > 0 && (
            <div className="pc-floor-row">
              <span className="pc-floor-label">Floor</span>
              <select
                className="pc-floor-select"
                value={selectedFloorId ?? floors[0]?.id ?? ''}
                onChange={(e) => setSelectedFloor(e.target.value)}
              >
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pc-tabs">
            <div className={`pc-tab${tab === 'devices' ? ' on' : ''}`} onClick={() => setTab('devices')}>Devices ({deviceCount})</div>
            <div className={`pc-tab${tab === 'layouts' ? ' on' : ''}`} onClick={() => setTab('layouts')}>Layouts</div>
          </div>
          <div className="pc-body">
            {tab === 'devices' && <DevicesTab onOpenDevice={openDeviceMarker} locationId={location?.id} deviceCount={deviceCount} onlineCount={location?.onlineCount ?? deviceCount} />}
            {tab === 'layouts' && <LayoutsTab />}
          </div>

          <div className="pc-footer">
            <button className={`btn-p${pulse ? ' pulse' : ''}`} style={{ width: '100%', padding: '10px 14px' }} onClick={() => goState('H')}>
              Open in Editor
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Two-tab body for a configured location (V state). Tabs: Devices (default)
 *  / Layouts. The "Place devices" CTA jumps to the editor (state I). */
function LocationDetailBody({
  location,
  deviceCount,
  tab,
  setTab,
  onOpenDevice,
  confirmingDelete,
  setConfirmingDelete,
  confirmDelete,
}: {
  location: NonNullable<ReturnType<typeof selectCurrentLocation>>;
  deviceCount: number;
  tab: PcTab;
  setTab: (t: PcTab) => void;
  onOpenDevice: (name: string, kind?: LocationDevice['kind'], fromLocationId?: string | null) => void;
  confirmingDelete: boolean;
  setConfirmingDelete: (v: boolean) => void;
  confirmDelete: () => void;
}) {
  const goState = useStore((s) => s.goState);
  const unplaced = MOCK_DEVICES_FOR_LOCATION.filter((d) => !d.placed).length;

  return (
    <>
      <div className="pc-tabs">
        <div className={`pc-tab${tab === 'devices' ? ' on' : ''}`} onClick={() => setTab('devices')}>
          Devices ({deviceCount})
          {unplaced > 0 && <span className="pc-tab-badge">{unplaced}</span>}
        </div>
        <div className={`pc-tab${tab === 'layouts' ? ' on' : ''}`} onClick={() => setTab('layouts')}>
          Layouts ({location.floors.length})
        </div>
      </div>
      <div className="pc-body">
        {tab === 'devices' && (
          <DevicesView
            location={location}
            deviceCount={deviceCount}
            unplaced={unplaced}
            onOpenDevice={onOpenDevice}
            onEnterPlacement={() => goState('I')}
          />
        )}
        {tab === 'layouts' && <LayoutsView location={location} />}

        {!confirmingDelete && (
          <button className="pc-delete-link" onClick={() => setConfirmingDelete(true)}>
            Delete this location
          </button>
        )}
        {confirmingDelete && (
          <div className="pc-delete-confirm">
            <div>Delete "<strong>{location.name}</strong>"? This can't be undone.</div>
            <div className="pc-delete-confirm-actions">
              <button className="btn-s" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              <button className="btn-p" style={{ background: 'var(--amber)' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DevicesView({
  location,
  deviceCount,
  unplaced,
  onOpenDevice,
  onEnterPlacement,
}: {
  location: NonNullable<ReturnType<typeof selectCurrentLocation>>;
  deviceCount: number;
  unplaced: number;
  onOpenDevice: (name: string, kind?: LocationDevice['kind'], fromLocationId?: string | null) => void;
  onEnterPlacement: () => void;
}) {
  const groups = KIND_ORDER
    .map(({ kind, plural, icon }) => {
      const items = MOCK_DEVICES_FOR_LOCATION
        .filter((d) => d.kind === kind)
        .sort((a, b) => Number(a.placed) - Number(b.placed));
      return { kind, plural, icon, items, unplaced: items.filter((d) => !d.placed).length };
    })
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="pc-sec-row" style={{ marginBottom: 10 }}>
        <span className="pc-sec-meta">{deviceCount} total{unplaced > 0 ? ` · ${unplaced} not placed yet` : ''}</span>
      </div>
      <button className="pc-primary-cta" onClick={onEnterPlacement}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        Place devices
        <span className="pc-primary-cta-arrow">→</span>
      </button>

      <div style={{ marginTop: 8 }}>
        {groups.map(({ kind, plural, icon, items, unplaced: gUnp }) => (
          <div className="pc-device-group" key={kind}>
            <div className="pc-section-hdr">
              <span>{plural} · {items.length}</span>
              {gUnp > 0 && <span className="pc-section-hint pc-todo-badge">{gUnp} not placed yet</span>}
            </div>
            {items.map((d) => (
              <div
                key={d.name}
                className={`pc-device-row${!d.placed ? ' is-unplaced' : ''}`}
                onClick={() => onOpenDevice(d.name, d.kind, location.id)}
              >
                <div className="pc-device-ico">{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pc-device-name">{d.name}</div>
                  <div className="pc-device-status">
                    <span className={d.online ? 'online' : 'offline'}>
                      <span className="pc-dot" /> {d.online ? 'Online' : 'Offline'}
                    </span>
                    <span className="pc-device-sep">·</span>
                    <span className={d.placed ? '' : 'pc-device-todo'}>
                      {d.placed ? 'Placed on map' : 'Not on map'}
                    </span>
                  </div>
                </div>
                {!d.placed && (
                  <button
                    className="pc-device-place"
                    onClick={(e) => { e.stopPropagation(); onEnterPlacement(); }}
                  >Place</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function LayoutsView({ location }: { location: NonNullable<ReturnType<typeof selectCurrentLocation>> }) {
  const setFloorLayout = useStore((s) => s.setFloorLayout);
  const startLayoutEdit = useStore((s) => s.startLayoutEdit);
  const setSelectedFloor = useStore((s) => s.setSelectedFloor);
  const updateLocation = useStore((s) => s.updateLocation);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pendingFloorRef = useRef<string | null>(null);

  function placeLayoutFor(floorId: string) {
    const floor = location.floors.find((f) => f.id === floorId);
    if (!floor) return;
    setSelectedFloor(floorId);
    if (floor.layout) {
      startLayoutEdit(location.id, floor.id);
    } else {
      pendingFloorRef.current = floorId;
      fileRef.current?.click();
    }
  }
  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const floorId = pendingFloorRef.current;
    e.target.value = '';
    if (!file || !floorId) return;
    const floor = location.floors.find((f) => f.id === floorId);
    if (!floor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const corners = defaultLayoutCorners(location.lng, location.lat);
      setFloorLayout(location.id, floor.id, {
        imageUrl: dataUrl,
        filename: file.name,
        corners,
        opacity: 0.85,
        crop: null,
      });
      startLayoutEdit(location.id, floor.id);
    };
    reader.readAsDataURL(file);
  }
  function addFloor() {
    const n = location.floors.length + 1;
    updateLocation(location.id, {
      floors: [...location.floors, { id: `f-${Date.now().toString(36)}`, name: `Floor ${n}` }],
    });
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={onFileChosen}
      />
      <div className="pc-sec-row" style={{ marginBottom: 10 }}>
        <span className="pc-sec-meta">{location.floors.length} {location.floors.length === 1 ? 'floor' : 'floors'}</span>
        <button className="pc-sec-action" onClick={addFloor}>+ Add floor</button>
      </div>
      <div className="pc-floor-cards">
        {location.floors.map((f) => {
          const hasLayout = !!f.layout;
          return (
            <button
              key={f.id}
              className={`pc-floor-card${hasLayout ? ' has-layout' : ''}`}
              onClick={() => placeLayoutFor(f.id)}
            >
              {hasLayout ? (
                <div className="pc-floor-card-thumb">
                  <img src={f.layout!.imageUrl} alt="" />
                </div>
              ) : (
                <div className="pc-floor-card-thumb is-empty">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 3v18" />
                  </svg>
                </div>
              )}
              <div className="pc-floor-card-body">
                <div className="pc-floor-card-name">{f.name}</div>
                <div className="pc-floor-card-sub">
                  {hasLayout ? (f.layout!.filename ?? 'Floorplan placed') : 'No layout yet'}
                </div>
              </div>
              <span className="pc-floor-card-action">
                {hasLayout ? 'Edit →' : 'Place →'}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PendingPlaceCard({ inFlyout = false }: { inFlyout?: boolean } = {}) {
  const location = useStore(selectCurrentLocation);
  const goState = useStore((s) => s.goState);
  const closeFlyout = useStore((s) => s.closeFlyout);
  const updateLocation = useStore((s) => s.updateLocation);
  const graduateLocation = useStore((s) => s.graduateLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const startPerimeterEdit = useStore((s) => s.startPerimeterEdit);

  const [name, setName] = useState(location?.name ?? '');
  const [siteIds, setSiteIds] = useState<string[]>(location?.siteIds ?? []);
  const [floors, setFloors] = useState<LocationFloor[]>(location?.floors ?? []);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!location) return;
    setName(location.name);
    setSiteIds(location.siteIds ?? []);
    setFloors(location.floors);
    setConfirmingDelete(false);
  }, [location?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!location) return null;

  const canConfigure = name.trim().length > 0 && siteIds.length > 0 && floors.length > 0;

  function commitName() {
    if (location && name.trim() && name.trim() !== location.name) {
      updateLocation(location.id, { name: name.trim() });
    }
  }
  function toggleSite(id: string) {
    if (!location) return;
    const next = siteIds.includes(id) ? siteIds.filter((s) => s !== id) : [...siteIds, id];
    setSiteIds(next);
    updateLocation(location.id, { siteIds: next });
  }
  function addBlankFloor() {
    if (!location) return;
    const n = floors.length + 1;
    const next = [...floors, { id: `f-${Date.now().toString(36)}`, name: `Floor ${n}` }];
    setFloors(next);
    updateLocation(location.id, { floors: next });
  }
  function importBuilding(b: InventoryBuilding) {
    if (!location) return;
    const newFloors: LocationFloor[] = b.floors.map((f) => ({
      id: `f-${Date.now().toString(36)}-${f.id}`,
      name: `${b.name} · ${f.name}`,
    }));
    const next = [...floors, ...newFloors];
    setFloors(next);
    updateLocation(location.id, { floors: next });
  }
  function renameFloor(id: string, newName: string) {
    setFloors(floors.map((f) => (f.id === id ? { ...f, name: newName } : f)));
  }
  function deleteFloor(id: string) {
    const next = floors.filter((f) => f.id !== id);
    setFloors(next);
    if (location) updateLocation(location.id, { floors: next });
  }
  function commitFloors() {
    if (!location) return;
    updateLocation(location.id, { floors });
  }
  function configure() {
    if (!location || !canConfigure) return;
    graduateLocation(location.id, { name: name.trim(), siteIds, floors });
  }
  /* Kept for the legacy "advanced" inventory picker path (devices opt-in,
     individual floor selection). The new dropdown imports whole buildings. */
  function importFromInventory(imported: InventoryFloor[], importDevices: boolean, totalDevices: number) {
    if (!location) return;
    const newFloors: LocationFloor[] = imported.map((f) => ({
      id: `f-${Date.now().toString(36)}-${f.id}`,
      name: f.name,
    }));
    const nextFloors = [...floors, ...newFloors];
    setFloors(nextFloors);
    updateLocation(location.id, {
      floors: nextFloors,
      ...(importDevices && totalDevices > 0
        ? {
            deviceCount: (location.deviceCount ?? 0) + totalDevices,
            onlineCount: (location.onlineCount ?? 0) + totalDevices,
          }
        : {}),
    });
  }
  function confirmDelete() {
    if (!location) return;
    deleteLocation(location.id);
  }

  return (
    <div className={`place-card${inFlyout ? ' place-card--flyout' : ''}`}>
      {inFlyout && (
        <div className="pc-back-row">
          <button className="pc-back-link" onClick={() => goState('D')}>‹ All Locations</button>
        </div>
      )}
      <div className="pc-hdr">
        <div className="pc-name-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="pc-name-row" style={{ width: '100%' }}>
            <input
              className="pc-name-edit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              spellCheck={false}
            />
            <span className="tbadge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Pending</span>
          </div>
          <div className="pc-crumb" style={{ marginLeft: -4 }}>{location.address ?? `${location.lng.toFixed(4)}, ${location.lat.toFixed(4)}`}</div>
        </div>
        <div className="pc-hdr-right">
          <button
            className="btn-icon"
            onClick={() => (inFlyout ? goState('D') : closeFlyout())}
          >✕</button>
        </div>
      </div>

      <div className="pc-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="pc-form-section">
          <div className="pc-form-label"><span>Sites</span></div>
          <SitesDropdown selected={siteIds} onToggle={toggleSite} />
        </div>

        <div className="pc-form-section">
          <div className="pc-form-label"><span>Perimeter</span></div>
          <button className="pc-perim-btn" onClick={() => startPerimeterEdit(location.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4l8 4 10-4v14l-10 4-8-4z" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left' }}>
              {location.perimeter ? 'Edit perimeter' : 'Draw on the map'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
          </button>
        </div>

        <div className="pc-form-section">
          <div className="pc-form-label"><span>Floors</span></div>
          <AddFloorDropdown
            onAddBlank={addBlankFloor}
            onImportBuilding={importBuilding}
            onOpenAdvanced={() => setPickerOpen(true)}
          />
          {floors.length > 0 && (
            <div className="pc-floor-list" style={{ marginTop: 8 }}>
              {floors.map((f) => (
                <div className="pc-floor-item" key={f.id}>
                  <input
                    className="pc-floor-input"
                    value={f.name}
                    onChange={(e) => renameFloor(f.id, e.target.value)}
                    onBlur={commitFloors}
                    spellCheck={false}
                  />
                  <button
                    className="pc-floor-del"
                    onClick={() => deleteFloor(f.id)}
                    title="Remove floor"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-p"
          style={{ width: '100%', padding: '10px 14px' }}
          disabled={!canConfigure}
          onClick={configure}
        >
          Mark as configured
        </button>

        <InventoryPicker
          open={pickerOpen}
          locationAddress={location.address}
          onImport={importFromInventory}
          onClose={() => setPickerOpen(false)}
        />

        {!confirmingDelete && (
          <button className="pc-delete-link" onClick={() => setConfirmingDelete(true)}>
            Delete this location
          </button>
        )}

        {confirmingDelete && (
          <div className="pc-delete-confirm">
            <div>Delete "<strong>{location.name}</strong>"? This can't be undone.</div>
            <div className="pc-delete-confirm-actions">
              <button className="btn-s" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              <button className="btn-p" style={{ background: 'var(--amber)' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SitesDropdown({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const summary =
    selected.length === 0
      ? 'Select sites…'
      : selected.length <= 2
        ? selected.map((id) => SITES.find((s) => s.id === id)?.name ?? id).join(', ')
        : `${selected.length} sites selected`;

  return (
    <div className="pc-dd" ref={wrapRef}>
      <button
        type="button"
        className="pc-dd-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`pc-dd-summary${selected.length === 0 ? ' is-placeholder' : ''}`}>{summary}</span>
        <span className="pc-dd-caret">▾</span>
      </button>
      {open && (
        <div className="pc-dd-panel">
          {SITES.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                className={`pc-dd-row${checked ? ' on' : ''}`}
                onClick={() => onToggle(s.id)}
              >
                <span className={`pc-dd-check${checked ? ' on' : ''}`}>{checked ? '✓' : ''}</span>
                <span className="pc-dd-row-name">{s.name}</span>
                <span className="pc-dd-row-meta">{s.places}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddFloorDropdown({
  onAddBlank,
  onImportBuilding,
  onOpenAdvanced,
}: {
  onAddBlank: () => void;
  onImportBuilding: (b: InventoryBuilding) => void;
  onOpenAdvanced: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="pc-dd" ref={wrapRef}>
      <button
        type="button"
        className="pc-dd-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="pc-dd-summary">+ Add floor</span>
        <span className="pc-dd-caret">▾</span>
      </button>
      {open && (
        <div className="pc-dd-panel">
          <button
            type="button"
            className="pc-dd-row"
            onClick={() => { onAddBlank(); setOpen(false); }}
          >
            <span className="pc-dd-row-icon">+</span>
            <span className="pc-dd-row-name">New blank floor</span>
          </button>
          {INVENTORY.length > 0 && (
            <div className="pc-dd-section">From your platform</div>
          )}
          {INVENTORY.map((b) => {
            const devices = b.floors.reduce((sum, f) => sum + f.deviceCount, 0);
            return (
              <button
                type="button"
                key={b.id}
                className="pc-dd-row"
                onClick={() => { onImportBuilding(b); setOpen(false); }}
              >
                <span className="pc-dd-row-icon">▦</span>
                <span className="pc-dd-row-name">{b.name}</span>
                <span className="pc-dd-row-meta">{b.floors.length} floors · {devices} devices</span>
              </button>
            );
          })}
          <button
            type="button"
            className="pc-dd-row pc-dd-row-link"
            onClick={() => { onOpenAdvanced(); setOpen(false); }}
          >
            <span className="pc-dd-row-name">Browse all…</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DevicesTab({
  onOpenDevice,
  locationId,
}: {
  onOpenDevice: (name: string, kind?: LocationDevice['kind'], fromLocationId?: string | null) => void;
  locationId: string | undefined;
  deviceCount: number;
  onlineCount: number;
}) {
  const groups = KIND_ORDER
    .map(({ kind, plural, icon }) => {
      const items = MOCK_DEVICES_FOR_LOCATION
        .filter((d) => d.kind === kind)
        .sort((a, b) => Number(a.placed) - Number(b.placed)); // not placed first
      const unplaced = items.filter((d) => !d.placed).length;
      return { kind, plural, icon, items, unplaced };
    })
    .filter((g) => g.items.length > 0);

  function renderRow(d: typeof MOCK_DEVICES_FOR_LOCATION[0], icon: string) {
    return (
      <div
        key={d.name}
        className={`pc-device-row${!d.placed ? ' is-unplaced' : ''}`}
        onClick={() => onOpenDevice(d.name, d.kind, locationId ?? null)}
      >
        <div className="pc-device-ico">{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pc-device-name">{d.name}</div>
          <div className="pc-device-status">
            <span className={d.online ? 'online' : 'offline'}>
              <span className="pc-dot" /> {d.online ? 'Online' : 'Offline'}
            </span>
            <span className="pc-device-sep">·</span>
            <span className={d.placed ? '' : 'pc-device-todo'}>
              {d.placed ? 'Placed on map' : 'Not on map'}
            </span>
          </div>
        </div>
        {!d.placed && (
          <button
            className="pc-device-place"
            onClick={(e) => { e.stopPropagation(); onOpenDevice(d.name, d.kind, locationId ?? null); }}
          >Place</button>
        )}
      </div>
    );
  }

  return (
    <>
      {groups.map(({ kind, plural, icon, items, unplaced }) => (
        <div className="pc-device-group" key={kind}>
          <div className="pc-section-hdr">
            <span>{plural} · {items.length}</span>
            {unplaced > 0 && (
              <span className="pc-section-hint pc-todo-badge">
                {unplaced} not placed yet
              </span>
            )}
          </div>
          {items.map((d) => renderRow(d, icon))}
        </div>
      ))}
    </>
  );
}

function LayoutsTab() {
  const location = useStore(selectCurrentLocation);
  const selectedFloorId = useStore((s) => s.selectedFloorId);
  const setFloorLayout = useStore((s) => s.setFloorLayout);
  const clearFloorLayout = useStore((s) => s.clearFloorLayout);
  const startLayoutEdit = useStore((s) => s.startLayoutEdit);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!location) return null;

  // Identify the currently-active floor; fall back to the first.
  const floor = location.floors.find((f) => f.id === selectedFloorId) ?? location.floors[0];
  if (!floor) {
    return (
      <div className="pc-empty-cta">
        <div>Add a floor first.</div>
      </div>
    );
  }

  function handleFileChosen(file: File) {
    if (!file || !location || !floor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const corners = defaultLayoutCorners(location.lng, location.lat);
      setFloorLayout(location.id, floor.id, {
        imageUrl: dataUrl,
        filename: file.name,
        corners,
        opacity: 0.85,
        crop: null,
      });
    };
    reader.readAsDataURL(file);
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileChosen(f);
    // Reset input so the same file can be picked twice in a row.
    e.target.value = '';
  }

  return (
    <>
      <div className="pc-floor-pill">
        Editing layout for <strong>{floor.name}</strong>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={pickFile}
      />

      {!floor.layout && (
        <div className="pc-layout-dropzone" onClick={() => fileRef.current?.click()}>
          <div className="pc-layout-dropzone-label">+ Upload floorplan</div>
          <div className="pc-layout-dropzone-hint">PNG or JPG. Drops at a default size — you'll orient it next.</div>
        </div>
      )}

      {floor.layout && (
        <>
          <div className="pc-layout-card">
            <div className="pc-layout-thumb">
              <img src={floor.layout.imageUrl} alt="Floorplan thumbnail" />
            </div>
            <div className="pc-layout-info">
              <div className="pc-layout-name">{floor.layout.filename ?? 'Floorplan'}</div>
              <div className="pc-layout-sub">
                Opacity {Math.round(floor.layout.opacity * 100)}% · {floor.layout.crop ? 'cropped' : 'no crop'}
              </div>
            </div>
            <div className="pc-layout-actions">
              <button
                className="pc-layout-mini-btn"
                onClick={() => startLayoutEdit(location.id, floor.id)}
              >Edit position</button>
              <button
                className="pc-layout-mini-btn"
                onClick={() => {
                  // Open the editor in Crop sub-mode.
                  startLayoutEdit(location.id, floor.id);
                  setTimeout(() => useStore.getState().updateEditingLayout({ mode: 'crop' }), 0);
                }}
              >Edit crop</button>
              <button className="pc-layout-mini-btn" onClick={() => fileRef.current?.click()}>Replace</button>
              <button
                className="pc-layout-mini-btn amber"
                onClick={() => clearFloorLayout(location.id, floor.id)}
              >Remove</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const DOOR_EVENTS = [
  { kind: 'unlock', key: 'unlock-remote', name: 'Remote Unlock', who: 'Tim Wang' },
  { kind: 'unlock', key: 'unlock-remote', name: 'Remote Unlock', who: 'Tim Wang' },
  { kind: 'unlock', key: 'unlock-remote', name: 'Remote Unlock', who: 'Tim Wang' },
  { kind: 'unlock', key: 'unlock-remote', name: 'Remote Unlock', who: 'Tim Wang' },
  { kind: 'unlock', key: 'unlock-remote', name: 'Remote Unlock', who: 'Tim Wang' },
];
const CAMERA_EVENTS = [
  { kind: 'person',   key: 'person-detected',  name: 'Person detected',  who: 'Front entrance' },
  { kind: 'motion',   key: 'motion-detected',  name: 'Motion detected',  who: 'Loading dock' },
  { kind: 'vehicle',  key: 'vehicle-detected', name: 'Vehicle detected', who: 'Side parking' },
  { kind: 'person',   key: 'person-detected',  name: 'Person detected',  who: 'Lobby' },
  { kind: 'tamper',   key: 'tamper-alert',     name: 'Tamper alert',     who: 'Roof exit' },
];

function DevicePanel() {
  const deviceTitle = useStore((s) => s.deviceTitle);
  const deviceKind = useStore((s) => s.deviceKind);
  const dismissDevicePanel = useStore((s) => s.dismissDevicePanel);
  const openEvent = useStore((s) => s.openEvent);
  const deviceBackTo = useStore((s) => s.deviceBackTo);
  const locations = useStore((s) => s.locations);
  const selectLocation = useStore((s) => s.selectLocation);
  const devicePanelSide = useStore((s) => s.devicePanelSide);
  const backLocation = deviceBackTo ? locations.find((l) => l.id === deviceBackTo) : null;
  const isCamera = deviceKind === 'Camera';
  const events = isCamera ? CAMERA_EVENTS : DOOR_EVENTS;
  const footerCta = isCamera ? 'Camera Details' : deviceKind === 'Door' ? 'Door Details' : 'Device Details';

  return (
    <div className={`device-panel${devicePanelSide === 'left' ? ' device-panel--left' : ''}`}>
      {/* Back to the location we came from, if any. */}
      {backLocation && (
        <button className="dp-back" onClick={() => selectLocation(backLocation.id)}>
          ‹ Back to {backLocation.name}
        </button>
      )}

      {/* Camera footage — full-bleed at the top, with the close X overlaying. */}
      <div className="dp-camera-bleed">
        <div className="dp-camera">
          <button className="dp-camera-nav prev">‹</button>
          <button className="dp-camera-nav next">›</button>
          <div className="dp-camera-name"><span className="dot" />{isCamera ? deviceTitle : 'Linked camera'}</div>
        </div>
        <button className="dp-camera-close" onClick={dismissDevicePanel} title="Close">✕</button>
      </div>

      {/* Name + online + … menu */}
      <div className="dp-name-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="dp-name">{deviceTitle}</div>
          <div className="dp-name-online"><span className="dot" />Online · {deviceKind}</div>
        </div>
        <button className="dp-name-menu" title="More">⋯</button>
      </div>

      {/* Door-only status card */}
      {!isCamera && (
        <div className="dp-status-card">
          <div>
            <div className="label">Door Status</div>
            <div className="pills">
              <span className="pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                </svg>
                Closed
              </span>
              <span className="sep">|</span>
              <span className="pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Locked
              </span>
            </div>
          </div>
          <button className="lock-btn" title="Toggle lock">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>
        </div>
      )}

      <div className="dp-body">
        {/* Door-only schedule */}
        {!isCamera && (
          <div className="dp-section">
            <div className="dp-section-hdr">
              <div className="dp-section-title">Door Schedule</div>
              <span className="dp-section-link">Add override</span>
            </div>
            <div className="dp-info-row">
              <span className="ico">▦</span>
              <span>Unlocked until 12:37 PM</span>
              <span className="chev">›</span>
            </div>
          </div>
        )}

        <div className="dp-section">
          <div className="dp-section-hdr">
            <div className="dp-section-title">Events</div>
            <span className="dp-section-link">›</span>
          </div>
          {events.map((ev, i) => (
            <div key={i} className="dp-events-row" onClick={() => openEvent(ev.key, 'device')}>
              <div className={`dp-event-icon ${ev.kind}`}>●</div>
              <div className="dp-event-body">
                <div className={`dp-event-name ${ev.kind}`}>{ev.name}</div>
                <div className="dp-event-user">{ev.who}</div>
              </div>
              <div className="dp-event-time">
                <div className="dp-event-time-t">6:25 AM</div>
                <div className="dp-event-time-d">12/12/2022</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dp-footer">
        <button className="btn-p" style={{ width: '100%', padding: '10px 14px' }}>
          {footerCta}
        </button>
      </div>
    </div>
  );
}

function EventPanel() {
  const ev = useStore((s) => s.currentEvent);
  const eventBackTo = useStore((s) => s.eventBackTo);
  const backFromEvent = useStore((s) => s.backFromEvent);
  const dismissEventPanel = useStore((s) => s.dismissEventPanel);
  const devicePanelSide = useStore((s) => s.devicePanelSide);
  if (!ev) return null;
  const badgeCls = ev.badge === 'Active' ? 'badge-active' : ev.badge === 'Recent' ? 'badge-recent' : '';
  return (
    <div className={`event-panel${devicePanelSide === 'left' ? ' event-panel--left' : ''}`}>
      {eventBackTo && (
        <button className="ev-back" onClick={backFromEvent}>‹ Back to device</button>
      )}
      <div className="ev-hdr">
        <div className="ev-title-wrap">
          <div className="ev-title">
            {ev.title}
            {ev.badge && <span className={`badge ${badgeCls}`}>{ev.badge}</span>}
          </div>
          <div className="ev-subtitle">{ev.subtitle}</div>
        </div>
        <button className="btn-icon" onClick={dismissEventPanel}>✕</button>
      </div>
      <div className="ev-body">
        <div className="dp-camera-wrap">
          <div className="dp-camera" style={{ height: 200 }}>
            <button className="dp-camera-nav prev">‹</button>
            <button className="dp-camera-nav next">›</button>
            <div className="dp-camera-name"><span className="dot" />{ev.cam}</div>
          </div>
        </div>
        <div className="ev-meta">
          <div className="ev-meta-sec">Event</div>
          <div className="ev-meta-row"><span className="ev-meta-k">Type</span><span className="ev-meta-v">{ev.type}</span></div>
          <div className="ev-meta-row"><span className="ev-meta-k">Severity</span><span className="ev-meta-v">{ev.severity}</span></div>
          <div className="ev-meta-row"><span className="ev-meta-k">Status</span><span className="ev-meta-v">{ev.status}</span></div>
          <div className="ev-meta-row"><span className="ev-meta-k">When</span><span className="ev-meta-v">{ev.when}</span></div>
          <div className="ev-meta-sec">Device</div>
          <div className="ev-meta-row"><span className="ev-meta-k">Source</span><span className="ev-meta-v">{ev.source}</span></div>
          <div className="ev-meta-row"><span className="ev-meta-k">Kind</span><span className="ev-meta-v">Door controller (AC42)</span></div>
          <div className="ev-meta-row"><span className="ev-meta-k">Linked camera</span><span className="ev-meta-v">{ev.linked}</span></div>
          <div className="ev-meta-sec">Location</div>
          <div className="ev-meta-row"><span className="ev-meta-k">Site</span><span className="ev-meta-v">HQ-MAIN</span></div>
          <div className="ev-meta-row"><span className="ev-meta-k">Place</span><span className="ev-meta-v">{ev.place}</span></div>
        </div>
      </div>
      <div className="ev-actions">
        <button className="btn-p" style={{ flex: 1 }}>Acknowledge</button>
        <button className="btn-s">View footage</button>
      </div>
    </div>
  );
}
