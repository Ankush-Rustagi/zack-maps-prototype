export function CommandBar() {
  return (
    <div className="cmd-bar">
      <div className="cmd-waffle">
        {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
      </div>
      <div className="cmd-breadcrumb">
        <span>Verkada Command</span>
        <span className="sep">/</span>
        <span className="current">Maps</span>
      </div>
      <div className="cmd-right">
        <span className="cmd-user">ankush.rustagi</span>
        <button className="avatar">AR</button>
      </div>
    </div>
  );
}
