import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { STATES } from '../states';

export function StatesSidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const openSidebar = useStore((s) => s.openSidebar);
  const closeSidebar = useStore((s) => s.closeSidebar);
  const curState = useStore((s) => s.curState);
  const goState = useStore((s) => s.goState);
  const closeAllDropdowns = useStore((s) => s.closeAllDropdowns);
  const seedMode = useStore((s) => s.seedMode);
  const setSeedMode = useStore((s) => s.setSeedMode);
  const topBarVisible = useStore((s) => s.topBarVisible);
  const setTopBarVisible = useStore((s) => s.setTopBarVisible);
  const chromeMode = useStore((s) => s.chromeMode);
  const setChromeMode = useStore((s) => s.setChromeMode);
  const devicePanelSide = useStore((s) => s.devicePanelSide);
  const setDevicePanelSide = useStore((s) => s.setDevicePanelSide);

  const [tooltip, setTooltip] = useState<{ id: string; name: string; desc: string; top: number } | null>(null);

  // Keyboard shortcuts: S to toggle sidebar, Esc to close everything
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
      if (e.key === 's' || e.key === 'S') {
        if (sidebarOpen) closeSidebar(); else openSidebar();
      }
      if (e.key === 'Escape') {
        closeSidebar();
        closeAllDropdowns();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, openSidebar, closeSidebar, closeAllDropdowns]);

  return (
    <>
      <div className={`state-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="ss-hdr">
          <span className="ss-title">Jump to State</span>
          <button className="btn-icon" onClick={closeSidebar}>✕</button>
        </div>
        <div className="ss-hint">Hover ⓘ for description</div>
        <div className="ss-list">
          {STATES.map((s) => (
            <div
              key={s.id}
              className={`ss-item${curState === s.id ? ' on' : ''}`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.ss-info')) return;
                goState(s.id);
                closeSidebar();
              }}
            >
              <div className="ss-letter">{s.id}</div>
              <div className="ss-name">{s.name}</div>
              <button
                className="ss-info"
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.closest('.ss-item') as HTMLElement).getBoundingClientRect();
                  setTooltip({ id: s.id, name: s.name, desc: s.desc, top: rect.top + 2 });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                i
              </button>
            </div>
          ))}
        </div>
        <div className="ss-footer">
          <div className="ss-footer-label">
            <span>Top bar</span>
            <span className="hint">show / hide</span>
          </div>
          <div className="theme-seg" style={{ marginBottom: 10 }}>
            <button className={topBarVisible ? 'on' : ''} onClick={() => setTopBarVisible(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="10" rx="1" /></svg>
              Show
            </button>
            <button className={!topBarVisible ? 'on' : ''} onClick={() => setTopBarVisible(false)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="1" /></svg>
              Hide
            </button>
          </div>

          <div className="ss-footer-label">
            <span>Layout</span>
            <span className="hint">pinned / floating</span>
          </div>
          <div className="theme-seg" style={{ marginBottom: 10 }}>
            <button className={chromeMode === 'pinned' ? 'on' : ''} onClick={() => setChromeMode('pinned')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="18" rx="1" /><rect x="11" y="3" width="10" height="18" rx="1" /></svg>
              Pinned
            </button>
            <button className={chromeMode === 'floating' ? 'on' : ''} onClick={() => setChromeMode('floating')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="5" height="11" rx="1.5" /><rect x="11" y="4" width="9" height="14" rx="1.5" /></svg>
              Floating
            </button>
          </div>

          <div className="ss-footer-label">
            <span>Device panel</span>
            <span className="hint">right / left</span>
          </div>
          <div className="theme-seg" style={{ marginBottom: 10 }}>
            <button className={devicePanelSide === 'right' ? 'on' : ''} onClick={() => setDevicePanelSide('right')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="10" height="18" rx="1" /><rect x="15" y="3" width="6" height="18" rx="1" fill="currentColor"/></svg>
              Right
            </button>
            <button className={devicePanelSide === 'left' ? 'on' : ''} onClick={() => setDevicePanelSide('left')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="18" rx="1" fill="currentColor"/><rect x="11" y="3" width="10" height="18" rx="1" /></svg>
              Left
            </button>
          </div>

          <div className="ss-footer-label">
            <span>Dev · seed data</span>
            <span className="hint">persists</span>
          </div>
          <div className="theme-seg">
            <button className={seedMode === 'empty' ? 'on' : ''} onClick={() => setSeedMode('empty')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5 5l14 14"/></svg>
              Empty
            </button>
            <button className={seedMode === 'seeded' ? 'on' : ''} onClick={() => setSeedMode('seeded')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
              Seeded
            </button>
          </div>
        </div>
      </div>
      {sidebarOpen && <div className="ss-backdrop" onClick={closeSidebar} />}
      {tooltip && (
        <div className="ss-tooltip" style={{ top: tooltip.top }}>
          <div className="sst-title">{tooltip.id} · {tooltip.name}</div>
          <div>{tooltip.desc}</div>
        </div>
      )}
    </>
  );
}
