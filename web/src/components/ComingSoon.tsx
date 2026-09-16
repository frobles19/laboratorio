export function ComingSoon({ title, crumb }: { title: string; crumb: string }) {
  return (
    <div>
      <div className="crumbs">{crumb}</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        {title}
      </h1>
      <div className="card">
        <div className="empty" style={{ padding: "40px 0" }}>
          Esta pantalla todavía no está conectada a datos reales — llega en la próxima fase.
        </div>
      </div>
    </div>
  );
}
