"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateModelo, type UpdateModeloState } from "../actions";

export function ModeloEditForm({
  id,
  brand,
  model,
  type,
  preventiveFrequencyMonths,
  typeLocked,
}: {
  id: string;
  brand: string;
  model: string;
  type: string;
  preventiveFrequencyMonths: number;
  typeLocked: boolean;
}) {
  const action = updateModelo.bind(null, id);
  const [state, formAction, pending] = useActionState<UpdateModeloState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 460 }}>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="brand">Marca</label>
        <input id="brand" name="brand" type="text" defaultValue={brand} required />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="model">Modelo</label>
        <input id="model" name="model" type="text" defaultValue={model} required />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="type">
          Tipo de equipo{" "}
          {typeLocked && (
            <span style={{ textTransform: "none", fontWeight: 400, color: "var(--text-faint)" }}>
              (no se puede cambiar — ya hay equipos instalados de este modelo)
            </span>
          )}
        </label>
        {typeLocked && <input type="hidden" name="type" value={type} />}
        <select id="type" name={typeLocked ? undefined : "type"} required defaultValue={type} disabled={typeLocked}>
          <option value="ILS">ILS</option>
          <option value="VOR">VOR</option>
          <option value="DME">DME</option>
        </select>
      </div>
      <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
        <label htmlFor="preventive_frequency_months">Frecuencia de mantenimiento preventivo base</label>
        <select id="preventive_frequency_months" name="preventive_frequency_months" required defaultValue={String(preventiveFrequencyMonths)}>
          <option value="1">Mensual</option>
          <option value="3">Trimestral</option>
          <option value="6">Semestral</option>
          <option value="12">Anual</option>
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
        <Link href={`/catalogo/${id}`} className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
