"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateComision, type UpdateComisionState } from "../actions";
import { MultiSelect } from "@/components/MultiSelect";

export function ComisionEditForm({
  id,
  plannedDepartureDate,
  plannedArrivalDate,
  vehicleId,
  selectedAirportIatas,
  selectedTechnicianIds,
  airports,
  technicians,
  vehicles,
}: {
  id: string;
  plannedDepartureDate: string;
  plannedArrivalDate: string;
  vehicleId: string | null;
  selectedAirportIatas: string[];
  selectedTechnicianIds: string[];
  airports: { iata_code: string; name: string }[];
  technicians: { id: string; full_name: string }[];
  vehicles: { id: string; license_plate: string; brand_model: string | null }[];
}) {
  const action = updateComision.bind(null, id);
  const [state, formAction, pending] = useActionState<UpdateComisionState, FormData>(action, { error: null });
  const [transporte, setTransporte] = useState<"terrestre" | "aereo">(vehicleId ? "terrestre" : "aereo");

  return (
    <form action={formAction} className="grid grid-2 form-page" style={{ alignItems: "start" }}>
      <div className="card">
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="planned_departure_date">Fecha de salida planificada</label>
          <input
            id="planned_departure_date"
            name="planned_departure_date"
            type="date"
            defaultValue={plannedDepartureDate}
            required
          />
        </div>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="planned_arrival_date">Fecha de llegada planificada</label>
          <input
            id="planned_arrival_date"
            name="planned_arrival_date"
            type="date"
            defaultValue={plannedArrivalDate}
            required
          />
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
            <select id="vehicle_id" name="vehicle_id" required defaultValue={vehicleId ?? ""}>
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
        <MultiSelect
          name="airport_iatas"
          placeholder="Buscar por nombre o código IATA…"
          items={airports.map((a) => ({ id: a.iata_code, label: `${a.iata_code} — ${a.name}` }))}
          defaultSelectedIds={selectedAirportIatas}
        />
        <div className="divider"></div>
        <div className="card-title">
          Técnicos <small>cuadrilla asignada</small>
        </div>
        <MultiSelect
          name="technician_ids"
          placeholder="Buscar técnico por nombre…"
          items={technicians.map((t) => ({ id: t.id, label: t.full_name }))}
          defaultSelectedIds={selectedTechnicianIds}
        />
      </div>

      {state.error && (
        <div className="warn-box" style={{ gridColumn: "1 / -1" }}>
          {state.error}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 4, gridColumn: "1 / -1" }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <Link href={`/comisiones/${id}`} className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
