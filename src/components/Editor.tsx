import { useStore, selectCurrentLocation } from '../store';
import { MOCK_DEVICES_FOR_LOCATION, KIND_ORDER } from '../data/devices';

export function Editor() {
  const curState = useStore((s) => s.curState);
  return (
    <>
      {curState === 'H' && <EditorEntry />}
      {curState === 'I' && <EditorMode />}
      {curState === 'M' && <DropHint />}
      {curState === 'N' && <AttachModal />}
    </>
  );
}

function EditorEntry() {
  const goState = useStore((s) => s.goState);
  return (
    <div className="editor-entry">
      <div className="ee-icon">→</div>
      <div>
        <div className="ee-title">Entering Editor mode</div>
        <div className="ee-desc">
          Editor is scoped to <strong>Floor 3</strong>. Click the pulsing "Open in Editor" button to confirm.
        </div>
        <div className="ee-actions">
          <button className="btn-p" onClick={() => goState('I')}>Enter editor</button>
          <button className="btn-s" onClick={() => goState('G')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function EditorMode() {
  const goState = useStore((s) => s.goState);
  const location = useStore(selectCurrentLocation);
  const selectedFloorId = useStore((s) => s.selectedFloorId);
  const floor = location?.floors.find((f) => f.id === selectedFloorId) ?? location?.floors[0];
  // Where to return when the user exits the editor. If they came from V,
  // bounce back there; otherwise the locations list.
  const exitTarget = location ? 'V' : 'D';

  const groups = KIND_ORDER
    .map(({ kind, plural, icon }) => {
      const items = MOCK_DEVICES_FOR_LOCATION
        .filter((d) => d.kind === kind)
        .sort((a, b) => Number(a.placed) - Number(b.placed));
      return { kind, plural, icon, items, unplaced: items.filter((d) => !d.placed).length };
    })
    .filter((g) => g.items.length > 0);

  const unplacedTotal = MOCK_DEVICES_FOR_LOCATION.filter((d) => !d.placed).length;

  return (
    <>
      <div className="editor-topbar">
        <span className="editor-badge">Editor</span>
        <span className="editor-crumb">
          {location ? `${location.name}${floor ? ` › ${floor.name}` : ''}` : 'HQ › Main Bldg › Floor 3'}
        </span>
        <span className="undo-redo"><span>↩</span><span>↪</span></span>
        <span className="unsaved">Unsaved</span>
        <button className="exit-btn" onClick={() => goState(exitTarget)}>Exit editor</button>
      </div>

      <div className="editor-toolbelt">
        <button className="tool-btn on">↖</button>
        <button className="tool-btn">◎</button>
        <button className="tool-btn">□</button>
        <button className="tool-btn">⌐</button>
        <button className="tool-btn">▦</button>
        <div className="tool-divider" />
        <button className="tool-btn">+</button>
        <button className="tool-btn">↑</button>
        <div className="tool-divider" />
        <button className="tool-btn" onClick={() => goState('P')}>⚙</button>
        <button className="tool-btn">?</button>
      </div>

      <div className="editor-sel">
        <div className="esel-hdr">
          <div>
            <div className="esel-name">Place devices</div>
            <div className="esel-crumb">
              {unplacedTotal} not placed yet · click a row to drop on the map
            </div>
          </div>
        </div>
        <div className="esel-device-list">
          {groups.map(({ kind, plural, icon, items, unplaced }) => (
            <div className="pc-device-group" key={kind}>
              <div className="pc-section-hdr">
                <span>{plural} · {items.length}</span>
                {unplaced > 0 && <span className="pc-section-hint pc-todo-badge">{unplaced} to place</span>}
              </div>
              {items.map((d) => (
                <div key={d.name} className={`pc-device-row${!d.placed ? ' is-unplaced' : ''}`}>
                  <div className="pc-device-ico">{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pc-device-name">{d.name}</div>
                    <div className="pc-device-status">
                      <span className={d.placed ? '' : 'pc-device-todo'}>
                        {d.placed ? 'Placed on map' : 'Not on map'}
                      </span>
                    </div>
                  </div>
                  <button className={`pc-device-place${d.placed ? ' is-placed' : ''}`}>
                    {d.placed ? 'Re-place' : 'Place →'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DropHint() {
  const goState = useStore((s) => s.goState);
  return (
    <div className="drop-hint">
      <div className="dh-title">Drop here to add a layout to Floor 3</div>
      <div className="dh-sub">
        The file will upload, attach to Floor 3, and jump to alignment.<br />Release to attach. Drag off the map to cancel.
      </div>
      <div className="dh-actions">
        <button className="btn-p" onClick={() => goState('N')}>Simulate release (drop)</button>
        <button className="btn-s" onClick={() => goState('G')}>Cancel drag</button>
      </div>
    </div>
  );
}

function AttachModal() {
  const goState = useStore((s) => s.goState);
  return (
    <div className="attach-modal">
      <div className="am-hdr">
        <div>
          <div className="am-title">Attaching file</div>
          <div className="am-file">main-bldg-floor-4.pdf</div>
        </div>
        <button className="btn-icon" onClick={() => goState('A')}>✕</button>
      </div>
      <div className="am-steps">
        <div><span className="step-done">Uploaded</span> <span className="step-lbl">2.4 MB · 100%</span></div>
        <div><span className="step-done">Attached</span> <span className="step-lbl">to Floor 3</span></div>
      </div>
      <div className="am-next">Next: align this floorplan</div>
      <div className="am-desc">
        Drag the corners of the placed image to match real-world geometry. Use the Align tool in the floating editor toolbar.
      </div>
      <div className="am-actions">
        <button className="btn-p" onClick={() => goState('I')}>Start aligning</button>
        <button className="btn-s" onClick={() => goState('G')}>Skip for now</button>
      </div>
    </div>
  );
}
