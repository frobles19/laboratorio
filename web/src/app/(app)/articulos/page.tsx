import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KIND_PILL: Record<string, string> = {
  herramienta: "neutral",
  repuesto: "accent",
};

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

export default async function ArticulosPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase.from("articles").select("*").order("asset_number");

  return (
    <div>
      <div className="crumbs">Inventario</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Artículos
      </h1>

      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="role-note" style={{ maxWidth: "none" }}>
          {articles?.length ?? 0} artículos en inventario.
        </div>
        <Link href="/articulos/nuevo" className="btn primary">
          + Nuevo artículo
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>N° Activo</th>
                <th>Descripción</th>
                <th>N° Serie</th>
                <th>Tipo</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th></th>
              </tr>
              {(articles ?? []).map((a) => {
                const status = STATUS_PILL[a.physical_status] ?? STATUS_PILL.en_servicio;
                const kind = a.kind;
                return (
                  <tr key={a.asset_number} className="clickable">
                    <td className="mono">
                      <Link href={`/articulos/${a.asset_number}`} style={{ color: "inherit" }}>
                        {a.asset_number}
                      </Link>
                    </td>
                    <td>{a.model_name}</td>
                    <td className="mono">{a.serial_number}</td>
                    <td>
                      <span className={`pill ${KIND_PILL[kind] ?? "neutral"}`}>
                        <span className="dot"></span>
                        {KIND_LABEL[kind] ?? kind}
                      </span>
                    </td>
                    <td className="mono">{locationLabel(a.current_location_type, a.current_location_airport)}</td>
                    <td>
                      <span className={`pill ${status.cls}`}>
                        <span className="dot"></span>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <Link href={`/articulos/${a.asset_number}`} style={{ color: "inherit" }}>
                        ›
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!articles || articles.length === 0) && (
                <tr>
                  <td colSpan={7} className="empty">
                    No hay artículos cargados todavía.
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
