import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: comisionesEnCurso },
    { count: comisionesPlanificadas },
    { count: ticketsAbiertos },
    { data: equiposPorEstado },
    { data: vencimientos },
    { data: comisionesActivas },
  ] = await Promise.all([
    supabase.from("commissions").select("*", { count: "exact", head: true }).eq("status", "en_curso"),
    supabase.from("commissions").select("*", { count: "exact", head: true }).eq("status", "planificada"),
    supabase.from("tickets").select("*", { count: "exact", head: true }).neq("status", "resuelto"),
    supabase.from("installed_equipment").select("current_status"),
    supabase
      .from("v_upcoming_maintenance_due")
      .select("*")
      .lte("days_remaining", 30)
      .order("days_remaining", { ascending: true })
      .limit(6),
    supabase
      .from("commissions")
      .select("id, status, planned_departure_date, commission_airports(airport_iata)")
      .in("status", ["en_curso", "planificada"])
      .order("planned_departure_date", { ascending: false })
      .limit(6),
  ]);

  const equiposFueraServicio = (equiposPorEstado ?? []).filter((e) => e.current_status === "fuera_servicio").length;
  const estadoCounts = {
    en_servicio: (equiposPorEstado ?? []).filter((e) => e.current_status === "en_servicio").length,
    degradado: (equiposPorEstado ?? []).filter((e) => e.current_status === "degradado").length,
    fuera_servicio: equiposFueraServicio,
  };

  return (
    <div>
      <div className="crumbs">General</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Dashboard
      </h1>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="stat-label">Comisiones en curso</div>
          <div className="stat-value">{comisionesEnCurso ?? 0}</div>
          <div className="stat-delta">{comisionesPlanificadas ?? 0} planificadas</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Equipos fuera de servicio</div>
          <div className="stat-value crit">{equiposFueraServicio}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Vencimientos ≤ 30 días</div>
          <div className="stat-value warn">{vencimientos?.length ?? 0}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Tickets abiertos</div>
          <div className="stat-value">{ticketsAbiertos ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">
            Próximos vencimientos <small>v_upcoming_maintenance_due</small>
          </div>
          {vencimientos && vencimientos.length > 0 ? (
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th>Equipo</th>
                    <th>Aeropuerto</th>
                    <th>Tipo</th>
                    <th>Vence</th>
                    <th></th>
                  </tr>
                  {vencimientos.map((v) => (
                    <tr key={`${v.equipment_id}-${v.type}`}>
                      <td className="mono">{v.equipment_id?.slice(0, 8)}</td>
                      <td className="mono">{v.airport_iata}</td>
                      <td>
                        <span className="pill neutral">
                          <span className="dot"></span>
                          {v.type}
                        </span>
                      </td>
                      <td className="mono">{v.next_due_date}</td>
                      <td className="num warn">{v.days_remaining} días</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Sin vencimientos próximos registrados.</div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title">Estado de infraestructura</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="pill ok">
                  <span className="dot"></span>En servicio
                </span>
                <b className="mono">{estadoCounts.en_servicio}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="pill warn">
                  <span className="dot"></span>Degradado
                </span>
                <b className="mono">{estadoCounts.degradado}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="pill crit">
                  <span className="dot"></span>Fuera de servicio
                </span>
                <b className="mono">{estadoCounts.fuera_servicio}</b>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Comisiones activas</div>
            {comisionesActivas && comisionesActivas.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {comisionesActivas.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span className="mono">
                      {c.id.slice(0, 8)} ·{" "}
                      {(c.commission_airports as { airport_iata: string }[])
                        .map((a) => a.airport_iata)
                        .join(", ")}
                    </span>
                    <span className={`pill-status-strong ${c.status === "en_curso" ? "encurso" : "planificada"}`}>
                      {c.status === "en_curso" ? "En curso" : "Planificada"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">No hay comisiones en curso ni planificadas.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
