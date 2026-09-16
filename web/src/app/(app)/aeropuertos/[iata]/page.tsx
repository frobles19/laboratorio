import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  en_servicio: { cls: "ok", label: "En servicio" },
  degradado: { cls: "warn", label: "Degradado" },
  fuera_servicio: { cls: "crit", label: "Fuera de servicio" },
};

export default async function AeropuertoDetallePage({
  params,
}: {
  params: Promise<{ iata: string }>;
}) {
  const { iata } = await params;
  const supabase = await createClient();

  const { data: airport } = await supabase
    .from("airports")
    .select("*")
    .eq("iata_code", iata.toUpperCase())
    .maybeSingle();

  if (!airport) notFound();

  const { data: equipment } = await supabase
    .from("installed_equipment")
    .select("id, current_status, model_catalog(brand, model, type), transmitters(label, status)")
    .eq("airport_iata", airport.iata_code);

  return (
    <div>
      <Link href="/aeropuertos" className="back-link">
        ‹ Aeropuertos
      </Link>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="kv">
            <span className="k">IATA</span>
            <span className="v mono">{airport.iata_code}</span>
          </div>
        </div>
        <div className="card">
          <div className="kv">
            <span className="k">Región</span>
            <span className="v">{airport.region}</span>
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title" style={{ margin: 0 }}>
          Equipos instalados
        </div>
        <Link href={`/aeropuertos/${airport.iata_code}/equipos/nuevo`} className="btn primary small">
          + Agregar equipo
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Tipo</th>
                <th>Modelo</th>
                <th>Tx1</th>
                <th>Tx2</th>
                <th>Estado</th>
                <th></th>
              </tr>
              {(equipment ?? []).map((eq) => {
                const model = eq.model_catalog as unknown as { brand: string; model: string; type: string } | null;
                const txs = (eq.transmitters ?? []) as { label: string; status: string }[];
                const tx1 = txs.find((t) => t.label === "TX1");
                const tx2 = txs.find((t) => t.label === "TX2");
                const status = STATUS_PILL[eq.current_status] ?? STATUS_PILL.fuera_servicio;
                return (
                  <tr key={eq.id} className="clickable">
                    <td>
                      <span className="pill neutral">
                        <span className="dot"></span>
                        {model?.type}
                      </span>
                    </td>
                    <td>
                      <Link href={`/equipos/${eq.id}`} style={{ color: "inherit" }}>
                        {model?.brand} {model?.model}
                      </Link>
                    </td>
                    <td>
                      {tx1 ? (
                        <span className={`pill ${STATUS_PILL[tx1.status]?.cls}`}>
                          <span className="dot"></span>
                          {STATUS_PILL[tx1.status]?.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {tx2 ? (
                        <span className={`pill ${STATUS_PILL[tx2.status]?.cls}`}>
                          <span className="dot"></span>
                          {STATUS_PILL[tx2.status]?.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`pill ${status.cls}`}>
                        <span className="dot"></span>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <Link href={`/equipos/${eq.id}`} style={{ color: "inherit" }}>
                        ›
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!equipment || equipment.length === 0) && (
                <tr>
                  <td colSpan={6} className="empty">
                    Este aeropuerto todavía no tiene equipos instalados.
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
