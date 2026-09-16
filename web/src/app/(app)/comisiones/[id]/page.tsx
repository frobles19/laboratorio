import Link from "next/link";
import { notFound } from "next/navigation";
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

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function ComisionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: commission } = await supabase
    .from("commissions")
    .select(
      "id, status, planned_departure_date, planned_arrival_date, actual_arrival_date, vehicles(license_plate), commission_airports(airport_iata), commission_technicians(technicians(id, full_name))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!commission) notFound();

  const airportCodes = (commission.commission_airports as { airport_iata: string }[]).map((a) => a.airport_iata);

  const [{ data: equipment }, { data: movements }] = await Promise.all([
    airportCodes.length > 0
      ? supabase
          .from("installed_equipment")
          .select("id, airport_iata, model_catalog(brand, model, type)")
          .in("airport_iata", airportCodes)
      : Promise.resolve({ data: [] }),
    supabase
      .from("movements")
      .select("batch_id, origin_type, origin_airport, destination_type, destination_airport, moved_at, asset_number")
      .eq("commission_id", id),
  ]);

  const byAirport = new Map<string, typeof equipment>();
  for (const eq of equipment ?? []) {
    const list = byAirport.get(eq.airport_iata) ?? [];
    list.push(eq);
    byAirport.set(eq.airport_iata, list as never);
  }

  const batches = new Map<string, { count: number; route: string; date: string }>();
  for (const m of movements ?? []) {
    const key = m.batch_id;
    const entry = batches.get(key) ?? {
      count: 0,
      route: `${m.origin_airport ?? m.origin_type} → ${m.destination_airport ?? m.destination_type}`,
      date: fmtDate(m.moved_at?.slice(0, 10) ?? null),
    };
    entry.count += 1;
    batches.set(key, entry);
  }

  return (
    <div>
      <Link href="/comisiones" className="back-link">
        ‹ Comisiones
      </Link>

      <div className="grid grid-2" style={{ marginBottom: 14, alignItems: "start" }}>
        <div className="card">
          <div className="card-title">
            {commission.id.slice(0, 8)}{" "}
            <span className={`pill-status-strong ${STATUS_PILL[commission.status]}`}>
              {STATUS_LABEL[commission.status]}
            </span>
          </div>
          <div className="grid grid-3">
            <div className="kv">
              <span className="k">Destinos</span>
              <span className="v mono">{airportCodes.join(", ") || "—"}</span>
            </div>
            <div className="kv">
              <span className="k">Transporte</span>
              <span className="v mono">
                {(commission.vehicles as { license_plate: string } | null)?.license_plate ?? "Aéreo"}
              </span>
            </div>
            <div className="kv">
              <span className="k">Salida</span>
              <span className="v mono">{fmtDate(commission.planned_departure_date)}</span>
            </div>
            <div className="kv">
              <span className="k">Llegada planificada</span>
              <span className="v mono">{fmtDate(commission.planned_arrival_date)}</span>
            </div>
            <div className="kv">
              <span className="k">Llegada real</span>
              <span className="v mono">{fmtDate(commission.actual_arrival_date)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            Técnicos <small>{(commission.commission_technicians as unknown[]).length}</small>
          </div>
          {(commission.commission_technicians as { technicians: { id: string; full_name: string } | null }[]).map(
            (t) =>
              t.technicians && (
                <div className="name-list-row" key={t.technicians.id}>
                  <div>
                    <div className="name-list-title">{t.technicians.full_name}</div>
                    <div className="name-list-sub">Técnico</div>
                  </div>
                </div>
              )
          )}
          {(commission.commission_technicians as unknown[]).length === 0 && (
            <div className="empty">Sin técnicos asignados.</div>
          )}
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>
        Equipos de los aeropuertos visitados
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        {airportCodes.length === 0 && <div className="empty">Esta comisión no tiene destinos cargados.</div>}
        {airportCodes.map((code) => (
          <div key={code} style={{ marginBottom: 14 }}>
            <div className="airport-group-label">{code}</div>
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th>Sistema</th>
                    <th>Equipo</th>
                    <th></th>
                  </tr>
                  {(byAirport.get(code) ?? []).map((eq) => {
                    const model = eq!.model_catalog as unknown as { brand: string; model: string; type: string };
                    return (
                      <tr key={eq!.id} className="clickable">
                        <td>
                          <span className="pill neutral">
                            <span className="dot"></span>
                            {model.type}
                          </span>
                        </td>
                        <td>
                          {model.brand} {model.model}
                        </td>
                        <td>
                          <Link href={`/equipos/${eq!.id}`} style={{ color: "inherit" }}>
                            ›
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {(byAirport.get(code) ?? []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">
                        Sin equipos instalados en {code}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Movimientos asociados</div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Ruta</th>
                <th>Fecha</th>
                <th>Artículos</th>
              </tr>
              {Array.from(batches.entries()).map(([batchId, b]) => (
                <tr key={batchId}>
                  <td className="mono">{b.route}</td>
                  <td className="mono">{b.date}</td>
                  <td>
                    <span className="pill neutral">
                      <span className="dot"></span>
                      {b.count} artículo{b.count === 1 ? "" : "s"}
                    </span>
                  </td>
                </tr>
              ))}
              {batches.size === 0 && (
                <tr>
                  <td colSpan={3} className="empty">
                    No hay movimientos asociados a esta comisión.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {commission.status !== "finalizada" && commission.status !== "cancelada" && (
        <Link href={`/comisiones/${commission.id}/cierre`} className="btn primary">
          Abrir asistente de cierre
        </Link>
      )}
    </div>
  );
}
