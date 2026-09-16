import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AeropuertosPage() {
  const supabase = await createClient();

  const [{ data: airports }, { data: equipment }] = await Promise.all([
    supabase.from("airports").select("*").order("iata_code"),
    supabase.from("installed_equipment").select("airport_iata, current_status"),
  ]);

  const summaryByAirport = new Map<string, { total: number; fueraServicio: number; degradado: number }>();
  for (const e of equipment ?? []) {
    const entry = summaryByAirport.get(e.airport_iata) ?? { total: 0, fueraServicio: 0, degradado: 0 };
    entry.total += 1;
    if (e.current_status === "fuera_servicio") entry.fueraServicio += 1;
    if (e.current_status === "degradado") entry.degradado += 1;
    summaryByAirport.set(e.airport_iata, entry);
  }

  return (
    <div>
      <div className="crumbs">Infraestructura</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Aeropuertos
      </h1>

      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="role-note" style={{ maxWidth: "none" }}>
          {equipment?.length ?? 0} equipos instalados en {airports?.length ?? 0} aeropuertos.
        </div>
        <Link href="/aeropuertos/nuevo" className="btn primary">
          + Nuevo aeropuerto
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>IATA</th>
                <th>Aeropuerto</th>
                <th>Región</th>
                <th>Equipos</th>
                <th>Estado</th>
                <th></th>
              </tr>
              {(airports ?? []).map((a) => {
                const summary = summaryByAirport.get(a.iata_code);
                return (
                  <tr key={a.iata_code} className="clickable">
                    <td className="mono">
                      <Link href={`/aeropuertos/${a.iata_code}`} style={{ color: "inherit" }}>
                        {a.iata_code}
                      </Link>
                    </td>
                    <td>{a.name}</td>
                    <td>{a.region}</td>
                    <td className="num">{summary?.total ?? 0}</td>
                    <td>
                      {!summary || summary.total === 0 ? (
                        <span className="pill neutral">
                          <span className="dot"></span>Sin equipos
                        </span>
                      ) : summary.fueraServicio > 0 ? (
                        <span className="pill crit">
                          <span className="dot"></span>
                          {summary.fueraServicio} fuera de servicio
                        </span>
                      ) : summary.degradado > 0 ? (
                        <span className="pill warn">
                          <span className="dot"></span>
                          {summary.degradado} degradado
                        </span>
                      ) : (
                        <span className="pill ok">
                          <span className="dot"></span>Todo OK
                        </span>
                      )}
                    </td>
                    <td>
                      <Link href={`/aeropuertos/${a.iata_code}`} style={{ color: "inherit" }}>
                        ›
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!airports || airports.length === 0) && (
                <tr>
                  <td colSpan={6} className="empty">
                    No hay aeropuertos cargados todavía.
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
