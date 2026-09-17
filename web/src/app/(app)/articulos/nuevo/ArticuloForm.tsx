"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createArticulo } from "./actions";

export function ArticuloForm({
  airports,
  models,
}: {
  airports: { iata_code: string; name: string }[];
  models: { id: string; brand: string; model: string; type: string }[];
}) {
  const [state, formAction, pending] = useActionState(createArticulo, { error: null });
  const [kind, setKind] = useState<"herramienta" | "repuesto">("herramienta");
  const [locationType, setLocationType] = useState<"panol" | "taller" | "aeropuerto">("panol");

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 520 }}>
      <div className="field" style={{ maxWidth: "none" }}>
        <label>Tipo de artículo</label>
        <input type="hidden" name="kind" value={kind} />
        <div className="seg" style={{ width: "fit-content" }}>
          <button
            type="button"
            className={`sel-yes${kind === "herramienta" ? " on" : ""}`}
            onClick={() => setKind("herramienta")}
          >
            Herramienta
          </button>
          <button
            type="button"
            className={`sel-no${kind === "repuesto" ? " on" : ""}`}
            onClick={() => setKind("repuesto")}
          >
            Repuesto
          </button>
        </div>
      </div>

      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="asset_number">N° de Activo</label>
        <input
          id="asset_number"
          name="asset_number"
          type="text"
          placeholder={kind === "herramienta" ? "HER-00043" : "RPT-00232"}
          style={{ textTransform: "uppercase" }}
          required
        />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="serial_number">N° de Serie</label>
        <input id="serial_number" name="serial_number" type="text" placeholder="SN-91827" required />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="model_name">Descripción</label>
        <input id="model_name" name="model_name" type="text" placeholder="Analizador de espectro portátil" required />
      </div>

      {kind === "herramienta" ? (
        <>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="tool_type">Tipo de herramienta</label>
            <input id="tool_type" name="tool_type" type="text" placeholder="Instrumento de medición" required />
          </div>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="calibration_due_date">Vencimiento de calibración</label>
            <input id="calibration_due_date" name="calibration_due_date" type="date" required />
          </div>
        </>
      ) : (
        <>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="spare_type">Tipo de repuesto</label>
            <input id="spare_type" name="spare_type" type="text" placeholder="Módulo RF" required />
          </div>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="catalog_model_id">Modelo al que aplica</label>
            <select id="catalog_model_id" name="catalog_model_id" required>
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
          onChange={(e) => setLocationType(e.target.value as typeof locationType)}
        >
          <option value="panol">Pañol Central</option>
          <option value="taller">Taller Central</option>
          <option value="aeropuerto">Aeropuerto…</option>
        </select>
      </div>
      {locationType === "aeropuerto" && (
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="location_airport">Aeropuerto</label>
          <select id="location_airport" name="location_airport" required>
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
        <select id="physical_status" name="physical_status" defaultValue="en_servicio">
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
          {pending ? "Guardando…" : "Guardar artículo"}
        </button>
        <Link href="/articulos" className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
