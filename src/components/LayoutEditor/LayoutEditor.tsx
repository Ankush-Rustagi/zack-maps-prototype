import { useEffect } from 'react';
import { useStore, selectCurrentLocation } from '../../store';
import { LayoutEditHandles } from './LayoutEditHandles';
import { LayoutEditToolbar } from './LayoutEditToolbar';

/**
 * Top-level shell for state Z. Renders the editor banner + toolbar + SVG
 * handles overlay. Other chrome (rail, right panel, bottom toolbar) is hidden
 * by App.tsx checking curState === 'Z'. The map underneath stays interactive
 * (pan + zoom) so the user can frame the layout while editing.
 */
export function LayoutEditor() {
  const curState = useStore((s) => s.curState);
  const editing = useStore((s) => s.editingLayout);
  const commit = useStore((s) => s.commitLayoutEdit);
  const cancel = useStore((s) => s.cancelLayoutEdit);
  const location = useStore(selectCurrentLocation);

  // ESC cancels, ⌘/Ctrl+Enter saves — keyboard parity with the rest of the app.
  useEffect(() => {
    if (curState !== 'Z') return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
      if (e.key === 'Escape') cancel();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commit();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [curState, cancel, commit]);

  if (curState !== 'Z' || !editing) return null;

  const floor = location?.floors.find((f) => f.id === editing.floorId);

  return (
    <>
      <div className="layout-edit-banner">
        <span className="label">Positioning floorplan</span>
        <span className="sep">·</span>
        <span className="sub">{location?.name ?? 'Location'}</span>
        <span className="sep">·</span>
        <span className="sub">{floor?.name ?? 'Floor'}</span>
        <button className="ce-cancel" onClick={cancel}>Cancel</button>
        <button className="ce-save" onClick={commit}>Save</button>
      </div>

      <LayoutEditHandles />
      <LayoutEditToolbar />
    </>
  );
}
