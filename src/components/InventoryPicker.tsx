import { useMemo, useState } from 'react';
import { rankInventoryByAddress } from '../data/inventory';
import type { InventoryBuilding, InventoryFloor } from '../data/inventory';

interface Props {
  open: boolean;
  /** Used to score "Suggested" match for the building list. */
  locationAddress?: string;
  /** Called with (floors, importDevices, sourceDeviceCount). */
  onImport: (floors: InventoryFloor[], importDevices: boolean, totalDevices: number) => void;
  onClose: () => void;
}

/**
 * Modal for picking existing platform buildings + floors to import into the
 * Maps location. If any imported floor has devices already plotted, a confirm
 * step asks whether to import those devices too.
 */
export function InventoryPicker({ open, locationAddress, onImport, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedFloors, setSelectedFloors] = useState<Record<string, Set<string>>>({});
  // After the user clicks "Add", we may need to confirm device import.
  const [pendingImport, setPendingImport] = useState<{
    floors: InventoryFloor[];
    totalDevices: number;
  } | null>(null);

  const ranked = useMemo(() => rankInventoryByAddress(locationAddress), [locationAddress]);
  const topScore = ranked[0]?.score ?? 0;

  if (!open) return null;

  function toggleFloor(buildingId: string, floorId: string) {
    setSelectedFloors((prev) => {
      const next = { ...prev };
      const set = new Set(next[buildingId] ?? []);
      if (set.has(floorId)) set.delete(floorId);
      else set.add(floorId);
      next[buildingId] = set;
      return next;
    });
  }

  function collectSelected(): { floors: InventoryFloor[]; totalDevices: number } {
    const floors: InventoryFloor[] = [];
    let totalDevices = 0;
    for (const { building } of ranked) {
      const ids = selectedFloors[building.id];
      if (!ids) continue;
      for (const f of building.floors) {
        if (ids.has(f.id)) {
          floors.push(f);
          totalDevices += f.deviceCount;
        }
      }
    }
    return { floors, totalDevices };
  }

  const { floors: selectedCount, totalDevices: pendingDevices } = collectSelected();

  function handleAddClick() {
    const result = collectSelected();
    if (result.floors.length === 0) return;
    if (result.totalDevices > 0) {
      // Two-step: confirm device import first.
      setPendingImport(result);
    } else {
      onImport(result.floors, false, 0);
      reset();
    }
  }

  function confirmImportYes() {
    if (!pendingImport) return;
    onImport(pendingImport.floors, true, pendingImport.totalDevices);
    reset();
  }
  function confirmImportNo() {
    if (!pendingImport) return;
    onImport(pendingImport.floors, false, 0);
    reset();
  }
  function reset() {
    setPendingImport(null);
    setSelectedFloors({});
    setExpandedId(null);
    onClose();
  }

  return (
    <div className="inv-modal-bg" onClick={() => reset()}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        {!pendingImport ? (
          <>
            <div className="inv-hdr">
              <div>
                <div className="inv-title">Import from existing buildings</div>
                <div className="inv-sub">
                  Pull buildings already set up in your Verkada platform into this Maps location.
                  {topScore >= 1 ? ' One match shown as Suggested.' : ''}
                </div>
              </div>
              <button className="btn-icon" onClick={() => reset()}>✕</button>
            </div>

            <div className="inv-body">
              {ranked.map(({ building, score }, i) => (
                <BuildingRow
                  key={building.id}
                  building={building}
                  isSuggested={i === 0 && score >= 1}
                  isExpanded={expandedId === building.id}
                  selectedFloorIds={selectedFloors[building.id] ?? new Set()}
                  onToggleExpand={() => setExpandedId((prev) => (prev === building.id ? null : building.id))}
                  onToggleFloor={(fid) => toggleFloor(building.id, fid)}
                />
              ))}
            </div>

            <div className="inv-footer">
              <div className="inv-progress">
                {selectedCount.length === 0
                  ? 'Select one or more floors to import'
                  : `${selectedCount.length} ${selectedCount.length === 1 ? 'floor' : 'floors'} selected${pendingDevices > 0 ? ` · ${pendingDevices} devices` : ''}`}
              </div>
              <div className="inv-actions">
                <button className="btn-s" onClick={() => reset()}>Cancel</button>
                <button className="btn-p" disabled={selectedCount.length === 0} onClick={handleAddClick}>
                  Add {selectedCount.length > 0 ? `(${selectedCount.length})` : ''}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="inv-hdr">
              <div>
                <div className="inv-title">Import devices too?</div>
                <div className="inv-sub">
                  These floors already have devices plotted in your platform. Importing brings
                  them into the Maps view as placed devices.
                </div>
              </div>
              <button className="btn-icon" onClick={() => reset()}>✕</button>
            </div>

            <div className="inv-body">
              {pendingImport.floors
                .filter((f) => f.deviceCount > 0)
                .map((f) => (
                  <div className="inv-floor-summary" key={f.id}>
                    <div className="inv-floor-summary-name">{f.name}</div>
                    <div className="inv-floor-summary-count">
                      {f.deviceCount} device{f.deviceCount === 1 ? '' : 's'}
                    </div>
                  </div>
                ))}
            </div>

            <div className="inv-footer">
              <div className="inv-progress">
                {pendingImport.totalDevices} {pendingImport.totalDevices === 1 ? 'device' : 'devices'} total
              </div>
              <div className="inv-actions">
                <button className="btn-s" onClick={confirmImportNo}>Skip devices</button>
                <button className="btn-p" onClick={confirmImportYes}>Import devices</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BuildingRow({
  building,
  isSuggested,
  isExpanded,
  selectedFloorIds,
  onToggleExpand,
  onToggleFloor,
}: {
  building: InventoryBuilding;
  isSuggested: boolean;
  isExpanded: boolean;
  selectedFloorIds: Set<string>;
  onToggleExpand: () => void;
  onToggleFloor: (floorId: string) => void;
}) {
  const totalDevices = building.floors.reduce((sum, f) => sum + f.deviceCount, 0);

  return (
    <div className={`inv-building${isExpanded ? ' expanded' : ''}`}>
      <div className="inv-building-row" onClick={onToggleExpand}>
        <div className="inv-building-info">
          <div className="inv-building-name">
            {building.name}
            {isSuggested && <span className="inv-suggested-badge">Suggested</span>}
          </div>
          <div className="inv-building-addr">{building.address}</div>
        </div>
        <div className="inv-building-stats">
          {building.floors.length} {building.floors.length === 1 ? 'floor' : 'floors'} · {totalDevices} devices
        </div>
        <span className="inv-expand-caret">{isExpanded ? '▾' : '▸'}</span>
      </div>

      {isExpanded && (
        <div className="inv-floor-list">
          {building.floors.map((f) => (
            <label className="inv-floor-row" key={f.id}>
              <input
                type="checkbox"
                checked={selectedFloorIds.has(f.id)}
                onChange={() => onToggleFloor(f.id)}
              />
              <span className="inv-floor-name">{f.name}</span>
              <span className="inv-floor-devices">
                {f.deviceCount === 0 ? 'No devices' : `${f.deviceCount} device${f.deviceCount === 1 ? '' : 's'}`}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
