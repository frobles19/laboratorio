import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_PILL: Record<string, string> = {
  ILS: "accent",
  VOR: "neutral",
  DME: "neutral",
};

export default async function CatalogoPage() {
  const supabase = await createClient();

  const [{ data: models }, { data: equipment }] = await Promise.all([
    supabase.from("model_catalog").select("*").order("type").order("brand"),
    supabase.from("installed_equipment").select("catalog_model_id"),
  ]);

  const installedByModel = new Map<string, number>();
  for (const e of equipment ?? []) {
    installedByModel.set(e.catalog_model_id, (installedByModel.get(e.catalog_model_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="crumbs">Infraestructura</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Catálogo de modelos
      </h1>

      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="role-note" style={{ maxWidth: "none" }}>
          Define marca, modelo y frecuencia de verificación aérea exigida.
        </div>
        <Link href="/catalogo/nuevo" className="btn primary">
          + Nuevo modelo
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Instalados en el país</th>
                <th></th>
              </tr>
              {(models ?? []).map((m) => (
                <tr key={m.id} className="clickable">
                  <td>
                    <Link href={`/catalogo/${m.id}`} style={{ color: "inherit" }}>
                      <span className={`pill ${TYPE_PILL[m.type] ?? "neutral"}`}>
                        <span className="dot"></span>
                        {m.type}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Link href={`/catalogo/${m.id}`} style={{ color: "inherit" }}>
                      {m.brand} {m.model}
                    </Link>
                  </td>
                  <td className="num">{installedByModel.get(m.id) ?? 0}</td>
                  <td>
                    <Link href={`/catalogo/${m.id}`} style={{ color: "inherit" }}>
                      ›
                    </Link>
                  </td>
                </tr>
              ))}
              {(!models || models.length === 0) && (
                <tr>
                  <td colSpan={4} className="empty">
                    No hay modelos cargados todavía.
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
