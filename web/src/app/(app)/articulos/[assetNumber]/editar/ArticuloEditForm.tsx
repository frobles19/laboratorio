"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateArticulo, type UpdateArticuloState } from "../actions";
import type { Database } from "@/lib/supabase/types";

type Kind = Database["public"]["Enums"]["article_kind"];
type LocationType = Database["public"]["Enums"]["location_type"];

export function ArticuloEditForm({
  assetNumber,
  kind,
  serialNumber,
  modelName,
  locationType: initialLocationType,
  locationAirport,
  physicalStatus,
  toolType,
  spareType,
  catalogModelId,
  airports,
  models,
}: {
  assetNumber: string;
  kind: Kind;
  serialNumber: string;
  modelName: string;
  locationType: LocationType;
  locationAirport: string | null;
  physicalStatus: string;
  toolType: string | null;
  spareType: string | null;
  catalogModelId: string | null;
  airports: { iata_code: string; name: string }[];
  models: { id: string; brand: string; model: string; type: string }[];
}) {
  const action = updateArticulo.bind(null, assetNumber, kind);
  const [state, formAction, pending] = useActionState<UpdateArticuloState, FormData>(action, { error: null });
  const [locationType, setLocationType] = useState<LocationType>(initialLocationType);

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 520 }}>
      <div className="field" style={{ maxWidth: "none" }}>
        <label>N° de Activo</label>
        <input type="text" value={assetNumber} disabled style={{ opacity: 0.7 }} />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="serial_number">N° de Serie</label>
        <input id="serial_number" name="serial_number" type="text" defaultValue={serialNumber} required />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="model_name">Descripción</label>
        <input id="model_name" name="model_name" type="text" defaultValue={modelName} required />
      </div>

      {kind === "herramienta" ? (
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="tool_type">Tipo de herramienta</label>
          <input id="tool_type" name="tool_type" type="text" defaultValue={toolType ?? ""} required />
        </div>
      ) : (
        <>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="spare_type">Tipo de repuesto</label>
            <input id="spare_type" name="spare_type" type="text" defaultValue={spareType ?? ""} required />
          </div>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="catalog_model_id">Modelo al que aplica</label>
            <select id="catalog_model_id" name="catalog_model_id" defaultValue={catalogModelId ?? ""} required>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.type} — {m.brand} {m.model}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="location_type">Ubicación actual</label>
        <select
          id="location_type"
          name="location_type"
          value={locationType}
          onChange={(e) => setLocationType(e.target.value as LocationType)}
        >
          <option value="panol">Pañol Central</option>
          <option value="taller">Taller Central</option>
          <option value="aeropuerto">Aeropuerto…</option>
        </select>
      </div>
      {locationType === "aeropuerto" && (
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="location_airport">Aeropuerto</label>
          <select id="location_airport" name="location_airport" defaultValue={locationAirport ?? ""} required>
            {airports.map((a) => (
              <option key={a.iata_code} value={a.iata_code}>
                {a.iata_code} — {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
        <label htmlFor="physical_status">Estado físico</label>
        <select id="physical_status" name="physical_status" defaultValue={physicalStatus}>
          <option value="en_servicio">En servicio</option>
          <option value="fuera_servicio">Fuera de servicio</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {state.error && (
        <div className="warn-box" style={{ marginTop: 14 }}>
          {state.error}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <Link href={`/articulos/${assetNumber}`} className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
