import { useStore } from '../store';

const NAV_ITEMS: { icon: string; label: string; count: number; on?: boolean }[] = [
  { icon: '⊟', label: 'Map view', count: 5, on: true },
  { icon: '✦', label: 'Navigation', count: 4 },
  { icon: '✏', label: 'Editor', count: 8 },
  { icon: '◎', label: 'Devices & data', count: 4 },
  { icon: '◇', label: 'Alerts', count: 3 },
  { icon: '↑', label: 'Sharing & BoM', count: 3 },
  { icon: '◐', label: 'Accessibility', count: 4 },
  { icon: '⊙', label: 'Account', count: 3 },
];

export function Settings() {
  const curState = useStore((s) => s.curState);
  const goState = useStore((s) => s.goState);
  if (curState !== 'P') return null;
  return (
    <div className="settings">
      <div className="settings-nav">
        <div className="settings-nav-hdr">
          <div className="settings-nav-title">Settings</div>
          <div className="settings-nav-meta">26 user · 8 org · 8 categories</div>
        </div>
        <div className="settings-tabs">
          <button className="stab on">All (34)</button>
          <button className="stab">User (26)</button>
          <button className="stab">Org admin (8)</button>
        </div>
        {NAV_ITEMS.map((it) => (
          <div key={it.label} className={`s-nav-item${it.on ? ' on' : ''}`}>
            <span>{it.icon}</span>
            <span>{it.label}</span>
            <span className="s-nav-cnt">{it.count}</span>
          </div>
        ))}
      </div>
      <div className="settings-content">
        <button className="btn-icon settings-close" onClick={() => goState('A')}>✕</button>
        <div className="sc-title">Map view</div>
        <div className="sc-desc">Defaults for how the map renders when you open Command.</div>

        <SettingRow name="Default basemap" badges={[['ORG · ADMIN', 'src-org'], ['GOOGLE MAPS', 'src-google']]}
          desc="Org house style. Maps Admins set this once; users can still flip basemaps for their own session."
          control={<select className="s-select"><option>Streets</option><option>Satellite</option><option>Dark</option></select>} />
        <SettingRow name="Theme" badges={[['USER', 'src-user'], ['GOOGLE MAPS', 'src-google']]}
          desc="System follows OS preference."
          control={<select className="s-select"><option>System</option><option>Light</option><option>Dark</option></select>} />
        <SettingRow name="Show traffic by default" badges={[['USER', 'src-user'], ['GOOGLE MAPS', 'src-google']]}
          desc="Real-time traffic layer for outdoor sites near roads."
          control={<button className="toggle-sw off" />} />
        <SettingRow name="Show 3D buildings" badges={[['USER', 'src-user'], ['GOOGLE MAPS', 'src-google']]}
          desc="Hover-elevation in supported regions. Adds GPU cost."
          control={<button className="toggle-sw on" />} />
        <SettingRow name="Auto-rotate to north on idle" badges={[['USER', 'src-user'], ['NEW', 'src-new']]}
          desc="Snaps the heading back to north after 5s of no input."
          control={<button className="toggle-sw off" />} />
      </div>
    </div>
  );
}

function SettingRow({ name, badges, desc, control }: { name: string; badges: [string, string][]; desc: string; control: React.ReactNode }) {
  return (
    <div className="s-row">
      <div className="s-info">
        <div className="s-name">
          {name}
          {badges.map(([label, cls]) => (
            <span key={label} className={`src-badge ${cls}`}>{label}</span>
          ))}
        </div>
        <div className="s-desc">{desc}</div>
      </div>
      <div className="s-ctrl">{control}</div>
    </div>
  );
}
