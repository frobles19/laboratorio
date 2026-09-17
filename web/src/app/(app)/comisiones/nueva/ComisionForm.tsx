"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createComision } from "./actions";

export function ComisionForm({
  airports,
  technicians,
  vehicles,
}: {
  airports: { iata_code: string; name: string }[];
  technicians: { id: string; full_name: string }[];
  vehicles: { id: string; license_plate: string; brand_model: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(createComision, { error: null });
  const [transporte, setTransporte] = useState<"terrestre" | "aereo">("terrestre");

  return (
    <form action={formAction} className="grid grid-2 form-page" style={{ alignItems: "start" }}>
      <div className="card">
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="planned_departure_date">Fecha de salida planificada</label>
          <input id="planned_departure_date" name="planned_departure_date" type="date" required />
        </div>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="planned_arrival_date">Fecha de llegada planificada</label>
          <input id="planned_arrival_date" name="planned_arrival_date" type="date" required />
        </div>
        <div className="field" style={{ maxWidth: "none" }}>
          <label>Transporte</label>
          <div className="seg" style={{ width: "fit-content" }}>
            <button
              type="button"
              className={`sel-yes${transporte === "terrestre" ? " on" : ""}`}
              onClick={() => setTransporte("terrestre")}
            >
              Terrestre
            </button>
            <button
              type="button"
              className={`sel-no${transporte === "aereo" ? " on" : ""}`}
              onClick={() => setTransporte("aereo")}
            >
              Aéreo
            </button>
          </div>
        </div>
        {transporte === "terrestre" && (
          <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
            <label htmlFor="vehicle_id">Vehículo</label>
            <select id="vehicle_id" name="vehicle_id" required>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.brand_model ?? "sin modelo"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          Destinos <small>aeropuertos a visitar</small>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {airports.map((a) => (
            <label key={a.iata_code} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" name="airport_iatas" value={a.iata_code} />
              <span className="mono">{a.iata_code}</span> — {a.name}
            </label>
          ))}
        </div>
        <div className="divider"></div>
        <div className="card-title">
          Técnicos <small>cuadrilla asignada</small>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {technicians.map((t) => (
            <label key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" name="technician_ids" value={t.id} />
              {t.full_name}
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <div className="warn-box" style={{ gridColumn: "1 / -1" }}>
          {state.error}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 4, gridColumn: "1 / -1" }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear comisión"}
        </button>
        <Link href="/comisiones" className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
