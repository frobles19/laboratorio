import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_PILL: Record<string, string> = {
  planificada: "planificada",
  en_curso: "encurso",
  finalizada: "finalizada",
  cancelada: "cancelada",
};

const STATUS_LABEL: Record<string, string> = {
  planificada: "Planificada",
  en_curso: "En curso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function ComisionesPage() {
  const supabase = await createClient();

  const { data: commissions } = await supabase
    .from("commissions")
    .select(
      "id, status, planned_departure_date, planned_arrival_date, vehicles(license_plate), commission_airports(airport_iata), commission_technicians(technicians(full_name))"
    )
    .order("status")
    .order("planned_departure_date", { ascending: false });

  return (
    <div>
      <div className="crumbs">Logística</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Comisiones
      </h1>

      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="role-note" style={{ maxWidth: "none" }}>
          {commissions?.length ?? 0} comisiones registradas.
        </div>
        <Link href="/comisiones/nueva" className="btn primary">
          + Nueva comisión
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Fechas</th>
                <th>Destinos</th>
                <th>Técnicos</th>
                <th>Transporte</th>
                <th>Estado</th>
                <th></th>
              </tr>
              {(commissions ?? []).map((c) => {
                const destinos = (c.commission_airports as { airport_iata: string }[]).map((a) => a.airport_iata);
                const tecnicos = (c.commission_technicians as { technicians: { full_name: string } | null }[])
                  .map((t) => t.technicians?.full_name)
                  .filter(Boolean);
                const vehicle = c.vehicles as { license_plate: string } | null;
                return (
                  <tr key={c.id} className="clickable">
                    <td>
                      <div className="flight-dates">
                        <div className="fd-row dep">
                          <span className="mono">{fmtDate(c.planned_departure_date)}</span>
                        </div>
                        <div className="fd-row arr">
                          <span className="mono">{fmtDate(c.planned_arrival_date)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{destinos.join(", ") || "—"}</td>
                    <td>
                      <div className="tech-textlist">
                        {tecnicos.length > 0 ? tecnicos.map((t, i) => <span key={i}>{t}</span>) : "—"}
                      </div>
                    </td>
                    <td className="mono">{vehicle?.license_plate ?? "Aéreo"}</td>
                    <td>
                      <span className={`pill-status-strong ${STATUS_PILL[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td>
                      <Link href={`/comisiones/${c.id}`} style={{ color: "inherit" }}>
                        ›
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!commissions || commissions.length === 0) && (
                <tr>
                  <td colSpan={6} className="empty">
                    No hay comisiones registradas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
