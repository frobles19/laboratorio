import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VehiculosPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: commissions }] = await Promise.all([
    supabase.from("vehicles").select("*").order("license_plate"),
    supabase
      .from("commissions")
      .select("id, vehicle_id, status")
      .in("status", ["planificada", "en_curso"])
      .not("vehicle_id", "is", null),
  ]);

  const commissionByVehicle = new Map<string, { id: string; status: string }>();
  for (const c of commissions ?? []) {
    if (c.vehicle_id) commissionByVehicle.set(c.vehicle_id, { id: c.id, status: c.status });
  }

  return (
    <div>
      <div className="crumbs">Logística</div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Vehículos
      </h1>

      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="role-note" style={{ maxWidth: "none" }}>
          Si un vehículo ya está en uso, se avisa pero se permite igual asignarlo.
        </div>
        <Link href="/vehiculos/nuevo" className="btn primary">
          + Nuevo vehículo
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Patente</th>
                <th>Modelo</th>
                <th>En uso</th>
                <th>Comisión actual</th>
              </tr>
              {(vehicles ?? []).map((v) => {
                const commission = commissionByVehicle.get(v.id);
                return (
                  <tr key={v.id}>
                    <td className="mono">{v.license_plate}</td>
                    <td>{v.brand_model ?? "—"}</td>
                    <td>
                      {commission ? (
                        <span className="pill warn">
                          <span className="dot"></span>En uso
                        </span>
                      ) : (
                        <span className="pill neutral">
                          <span className="dot"></span>Libre
                        </span>
                      )}
                    </td>
                    <td className="mono">
                      {commission ? (
                        <Link href={`/comisiones/${commission.id}`} style={{ color: "inherit" }}>
                          {commission.id.slice(0, 8)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!vehicles || vehicles.length === 0) && (
                <tr>
                  <td colSpan={4} className="empty">
                    No hay vehículos cargados todavía.
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
