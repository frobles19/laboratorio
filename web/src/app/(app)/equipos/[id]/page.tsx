import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  en_servicio: { cls: "ok", label: "En servicio" },
  degradado: { cls: "warn", label: "Degradado" },
  fuera_servicio: { cls: "crit", label: "Fuera de servicio" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function EquipoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: equipment } = await supabase
    .from("installed_equipment")
    .select(
      "id, airport_iata, installed_at, current_status, aerial_verification_frequency_months, model_catalog(brand, model, type, preventive_frequency_months), transmitters(id, label, status)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!equipment) notFound();

  const model = equipment.model_catalog as unknown as {
    brand: string;
    model: string;
    type: string;
    preventive_frequency_months: number;
  };

  const [{ data: history }, { data: tickets }, { data: lastVerification }, { data: lastPreventive }] =
    await Promise.all([
      supabase
        .from("status_history")
        .select("changed_at, entity_type, previous_status, new_status, manual_edit, commission_id")
        .or(`equipment_id.eq.${id},transmitter_id.in.(${(equipment.transmitters ?? []).map((t) => t.id).join(",") || "00000000-0000-0000-0000-000000000000"})`)
        .order("changed_at", { ascending: false })
        .limit(10),
      supabase.from("tickets").select("id, description, status").eq("equipment_id", id).neq("status", "resuelto"),
      supabase
        .from("maintenances")
        .select("performed_at, next_due_date, con_alarmas")
        .eq("equipment_id", id)
        .eq("type", "verificacion_aerea")
        .order("performed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("maintenances")
        .select("performed_at, next_due_date, type")
        .eq("equipment_id", id)
        .in("type", ["preventivo_mensual", "preventivo_trimestral", "preventivo_semestral", "preventivo_anual"])
        .order("performed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const tx1 = (equipment.transmitters ?? []).find((t) => t.label === "TX1");
  const tx2 = (equipment.transmitters ?? []).find((t) => t.label === "TX2");
  const status = STATUS_PILL[equipment.current_status];

  return (
    <div>
      <Link href={`/aeropuertos/${equipment.airport_iata}`} className="back-link">
        ‹ {equipment.airport_iata}
      </Link>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title">
              {model.brand} {model.model}{" "}
              <span className={`pill ${status?.cls}`}>
                <span className="dot"></span>
                {status?.label}
              </span>
            </div>
            <div className="grid grid-3">
              <div className="kv">
                <span className="k">Sistema</span>
                <span className="v">{model.type}</span>
              </div>
              <div className="kv">
                <span className="k">Instalado</span>
                <span className="v mono">{fmtDate(equipment.installed_at)}</span>
              </div>
              <div className="kv">
                <span className="k">Aeropuerto</span>
                <span className="v mono">{equipment.airport_iata}</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[tx1, tx2].map((tx, i) => (
                <div className="card" style={{ background: "var(--surface-2)" }} key={i}>
                  <div className="card-title" style={{ marginBottom: 8 }}>
                    TX{i + 1}
                  </div>
                  {tx ? (
                    <span className={`pill ${STATUS_PILL[tx.status]?.cls}`}>
                      <span className="dot"></span>
                      {STATUS_PILL[tx.status]?.label}
                    </span>
                  ) : (
                    <span className="pill neutral">
                      <span className="dot"></span>—
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Historial de estados</div>
            {history && history.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <th>Fecha</th>
                      <th>Entidad</th>
                      <th>Anterior → Nuevo</th>
                      <th>Contexto</th>
                    </tr>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td className="mono">{h.changed_at.slice(0, 16).replace("T", " ")}</td>
                        <td>{h.entity_type}</td>
                        <td>
                          {h.previous_status ?? "—"} → {h.new_status}
                        </td>
                        <td>
                          {h.commission_id ? (
                            <span className="pill accent">
                              <span className="dot"></span>
                              {h.commission_id.slice(0, 8)}
                            </span>
                          ) : (
                            <span className="pill neutral">
                              <span className="dot"></span>Edición manual
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">Sin cambios de estado registrados.</div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title">
              Verificación aérea <small>frecuencia: {equipment.aerial_verification_frequency_months} meses</small>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="kv">
                <span className="k">Última realizada</span>
                <span className="v mono">{fmtDate(lastVerification?.performed_at ?? null)}</span>
              </div>
              <div className="kv">
                <span className="k">Próximo vencimiento</span>
                <span className="v mono">{fmtDate(lastVerification?.next_due_date ?? null)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title">
              Mantenimiento preventivo <small>frecuencia base: {model.preventive_frequency_months} meses</small>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="kv">
                <span className="k">Último realizado</span>
                <span className="v mono">{fmtDate(lastPreventive?.performed_at ?? null)}</span>
              </div>
              <div className="kv">
                <span className="k">Próximo vencimiento</span>
                <span className="v mono">{fmtDate(lastPreventive?.next_due_date ?? null)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              Tickets abiertos <small>{tickets?.length ?? 0}</small>
            </div>
            {tickets && tickets.length > 0 ? (
              tickets.map((t) => (
                <div className="checklist-row" key={t.id} style={{ padding: "0 0 10px" }}>
                  <div className="cr-main">
                    <div className="cr-title">{t.description}</div>
                  </div>
                  <span className="pill warn">
                    <span className="dot"></span>
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty">Sin tickets abiertos.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
