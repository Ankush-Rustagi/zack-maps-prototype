import { useStore } from '../store';
import type { Basemap, Theme } from '../store';

export function LayersUi() {
  const layersOpen = useStore((s) => s.layersOpen);
  const toggleLayers = useStore((s) => s.toggleLayers);
  const openSidebar = useStore((s) => s.openSidebar);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const basemap = useStore((s) => s.basemap);
  const setBasemap = useStore((s) => s.setBasemap);

  return (
    <>
      {layersOpen && (
        <div className="layers-popup">
          <div className="lp-hdr">
            <div>
              <div className="lp-title"><span>◐</span> Layers</div>
              <div className="lp-sub">31 devices · None</div>
            </div>
            <button className="btn-icon" onClick={toggleLayers}>✕</button>
          </div>
          <div className="lp-body">
            <div className="l-col">
              <div className="l-col-hdr">Devices <span>multi</span></div>
              <div className="l-row"><div className="l-check">✓</div> Cameras <span className="l-cnt">12</span></div>
              <div className="l-row sub"><div className="l-check">✓</div> Show FOV</div>
              <div className="l-row sub"><div className="l-check">✓</div> Show direction</div>
              <div className="l-row"><div className="l-check">✓</div> Doors <span className="l-cnt">6</span></div>
              <div className="l-row"><div className="l-check">✓</div> Access readers <span className="l-cnt">9</span></div>
              <div className="l-row"><div className="l-check off" /> Motion sensors <span className="l-cnt">4</span></div>
            </div>
            <div className="l-col">
              <div className="l-col-hdr">Data overlay <span>single</span></div>
              <div className="l-row"><div className="l-radio sel" /> None</div>
              <div className="l-row"><div className="l-radio off" /> Device health</div>
              <div className="l-row"><div className="l-radio off" /> Alert density</div>
              <div className="l-row"><div className="l-radio off" /> Coverage gaps</div>
            </div>
          </div>

          <div className="l-divider" />
          <div className="l-col-hdr">Basemap <span>single</span></div>
          <BasemapSeg value={basemap} onChange={setBasemap} />

          <div className="l-divider" />
          <div className="l-col-hdr">Appearance <span>theme</span></div>
          <ThemeSeg value={theme} onChange={setTheme} />
        </div>
      )}

      <div className="bl-toolbar">
        <button className={`bl-btn${layersOpen ? ' active' : ''}`} onClick={toggleLayers}>
          <div className="bl-btn-dot" />
          Layers
        </button>
        <div className="bl-divider" />
        <button className="bl-btn" onClick={openSidebar}>
          <div className="bl-btn-dot" style={{ background: 'var(--accent)' }} />
          States
          <span className="bl-btn-key">S</span>
        </button>
      </div>
    </>
  );
}

function BasemapSeg({ value, onChange }: { value: Basemap; onChange: (b: Basemap) => void }) {
  return (
    <div className="theme-seg" style={{ marginBottom: 4 }}>
      <button className={value === 'street' ? 'on' : ''} onClick={() => onChange('street')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v16M15 6v16" />
        </svg>
        Street
      </button>
      <button className={value === 'satellite' ? 'on' : ''} onClick={() => onChange('satellite')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        Satellite
      </button>
      <button className={value === 'none' ? 'on' : ''} onClick={() => onChange('none')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M5 5l14 14" />
        </svg>
        None
      </button>
    </div>
  );
}

function ThemeSeg({ value, onChange }: { value: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="theme-seg">
      <button className={value === 'dark' ? 'on' : ''} onClick={() => onChange('dark')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        Dark
      </button>
      <button className={value === 'light' ? 'on' : ''} onClick={() => onChange('light')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        Light
      </button>
    </div>
  );
}
