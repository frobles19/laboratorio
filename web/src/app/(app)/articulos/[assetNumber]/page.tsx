import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  herramienta: "Herramienta",
  repuesto: "Repuesto",
};

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  en_servicio: { cls: "ok", label: "En servicio" },
  fuera_servicio: { cls: "warn", label: "Fuera de servicio" },
  baja: { cls: "crit", label: "Baja" },
};

function locationLabel(type: string, airport: string | null) {
  if (type === "aeropuerto") return airport ?? "—";
  if (type === "panol") return "Pañol Central";
  if (type === "taller") return "Taller Central";
  return "—";
}

function fmtDateTime(iso: string) {
  return iso.slice(0, 16).replace("T", " ");
}

export default async function ArticuloDetallePage({
  params,
}: {
  params: Promise<{ assetNumber: string }>;
}) {
  const { assetNumber } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*, tools(tool_type, calibration_due_date), spare_parts(spare_type, model_catalog(brand, model, type))")
    .eq("asset_number", assetNumber)
    .maybeSingle();

  if (!article) notFound();

  const [{ data: movements }, { data: statusEvents }] = await Promise.all([
    supabase
      .from("movements")
      .select("moved_at, origin_type, origin_airport, destination_type, destination_airport, commission_id")
      .eq("asset_number", assetNumber)
      .order("moved_at", { ascending: false }),
    supabase
      .from("status_history")
      .select("changed_at, previous_status, new_status, manual_edit, reason, commission_id")
      .eq("article_id", assetNumber)
      .order("changed_at", { ascending: false }),
  ]);

  type HistoryRow =
    | { kind: "movimiento"; at: string; detail: string; commissionId: string | null }
    | { kind: "estado"; at: string; detail: string; commissionId: string | null };

  const history: HistoryRow[] = [
    ...(movements ?? []).map((m) => ({
      kind: "movimiento" as const,
      at: m.moved_at,
      detail: `${locationLabel(m.origin_type, m.origin_airport)} → ${locationLabel(m.destination_type, m.destination_airport)}`,
      commissionId: m.commission_id,
    })),
    ...(statusEvents ?? []).map((s) => ({
      kind: "estado" as const,
      at: s.changed_at,
      detail: `${s.previous_status ?? "—"} → ${s.new_status}${s.reason ? ` · ${s.reason}` : ""}`,
      commissionId: s.commission_id,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  const status = STATUS_PILL[article.physical_status] ?? STATUS_PILL.en_servicio;
  const tool = article.tools as unknown as { tool_type: string; calibration_due_date: string | null } | null;
  const sparePart = article.spare_parts as unknown as {
    spare_type: string;
    model_catalog: { brand: string; model: string; type: string } | null;
  } | null;

  return (
    <div>
      <Link href="/articulos" className="back-link">
        ‹ Artículos
      </Link>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {article.asset_number}{" "}
          <span className={`pill ${status.cls}`}>
            <span className="dot"></span>
            {status.label}
          </span>
        </div>
        <div className="grid grid-3">
          <div className="kv">
            <span className="k">Tipo</span>
            <span className="v">{KIND_LABEL[article.kind] ?? article.kind}</span>
          </div>
          <div className="kv">
            <span className="k">N° Serie</span>
            <span className="v mono">{article.serial_number}</span>
          </div>
          <div className="kv">
            <span className="k">Ubicación actual</span>
            <span className="v mono">{locationLabel(article.current_location_type, article.current_location_airport)}</span>
          </div>
          {tool && (
            <>
              <div className="kv">
                <span className="k">Tipo de herramienta</span>
                <span className="v">{tool.tool_type}</span>
              </div>
              <div className="kv">
                <span className="k">Vence calibración</span>
                <span className="v mono">{tool.calibration_due_date ?? "—"}</span>
              </div>
            </>
          )}
          {sparePart && (
            <>
              <div className="kv">
                <span className="k">Tipo de repuesto</span>
                <span className="v">{sparePart.spare_type}</span>
              </div>
              <div className="kv">
                <span className="k">Modelo al que aplica</span>
                <span className="v">
                  {sparePart.model_catalog
                    ? `${sparePart.model_catalog.type} — ${sparePart.model_catalog.brand} ${sparePart.model_catalog.model}`
                    : "—"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section-title">
        Historial{" "}
        <small style={{ fontWeight: 400, color: "var(--text-faint)" }}>
          movimientos y cambios de estado
        </small>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Detalle</th>
                <th>Comisión</th>
              </tr>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="mono">{fmtDateTime(h.at)}</td>
                  <td>
                    <span className={`pill-event ${h.kind === "movimiento" ? "mov" : "status"}`}>
                      <span className="dot"></span>
                      {h.kind === "movimiento" ? "Movimiento" : "Cambio de estado"}
                    </span>
                  </td>
                  <td className="mono">{h.detail}</td>
                  <td className="mono">{h.commissionId ? h.commissionId.slice(0, 8) : "—"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    Sin historial registrado.
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
