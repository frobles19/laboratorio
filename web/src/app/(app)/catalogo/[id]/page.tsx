import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_PILL: Record<string, string> = {
  ILS: "accent",
  VOR: "neutral",
  DME: "neutral",
};

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  en_servicio: { cls: "ok", label: "En servicio" },
  degradado: { cls: "warn", label: "Degradado" },
  fuera_servicio: { cls: "crit", label: "Fuera de servicio" },
};

export default async function ModeloDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: model } = await supabase.from("model_catalog").select("*").eq("id", id).maybeSingle();
  if (!model) notFound();

  const { data: equipment } = await supabase
    .from("installed_equipment")
    .select("id, airport_iata, current_status, aerial_verification_frequency_months, transmitters(label, status)")
    .eq("catalog_model_id", id);

  const total = equipment?.length ?? 0;
  const fueraServicio = (equipment ?? []).filter((e) => e.current_status === "fuera_servicio").length;

  return (
    <div>
      <Link href="/catalogo" className="back-link">
        ‹ Catálogo de modelos
      </Link>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          {model.brand} {model.model}{" "}
          <span className={`pill ${TYPE_PILL[model.type] ?? "neutral"}`}>
            <span className="dot"></span>
            {model.type}
          </span>
        </div>
        <div className="grid grid-3">
          <div className="kv">
            <span className="k">Preventivo base</span>
            <span className="v">cada {model.preventive_frequency_months} meses</span>
          </div>
          <div className="kv">
            <span className="k">Instalados en el país</span>
            <span className="v mono">{total}</span>
          </div>
          <div className="kv">
            <span className="k">Fuera de servicio</span>
            <span className="v" style={{ color: fueraServicio > 0 ? "var(--crit)" : undefined }}>
              {fueraServicio}
            </span>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>
        Equipos instalados de este modelo
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Aeropuerto</th>
                <th>Tx1</th>
                <th>Tx2</th>
                <th>Estado</th>
                <th>Verif. aérea</th>
                <th></th>
              </tr>
              {(equipment ?? []).map((eq) => {
                const txs = (eq.transmitters ?? []) as { label: string; status: string }[];
                const tx1 = txs.find((t) => t.label === "TX1");
                const tx2 = txs.find((t) => t.label === "TX2");
                const status = STATUS_PILL[eq.current_status] ?? STATUS_PILL.fuera_servicio;
                return (
                  <tr key={eq.id} className="clickable">
                    <td className="mono">
                      <Link href={`/equipos/${eq.id}`} style={{ color: "inherit" }}>
                        {eq.airport_iata}
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
                    <td className="num">{eq.aerial_verification_frequency_months} meses</td>
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
                    Todavía no hay equipos instalados de este modelo.
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
