"use client";

import { useActionState } from "react";
import { returnToWorkshop, type ReturnToWorkshopState } from "./actions";

export function NuevoMovimientoForm({
  commissionId,
  articles,
}: {
  commissionId: string;
  articles: { asset_number: string; model_name: string; current_location_airport: string | null }[];
}) {
  const action = returnToWorkshop.bind(null, commissionId);
  const [state, formAction, pending] = useActionState<ReturnToWorkshopState, FormData>(action, { error: null });

  if (articles.length === 0) return null;

  return (
    <form action={formAction} className="newmov-form">
      <div className="field">
        <label>Artículo (en aeropuerto de la comisión)</label>
        <select name="asset_number" required>
          {articles.map((a) => (
            <option key={a.asset_number} value={a.asset_number}>
              {a.asset_number} — {a.model_name} · {a.current_location_airport}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Destino</label>
        <select name="destination_type" defaultValue="taller">
          <option value="taller">Taller Central</option>
          <option value="panol">Pañol Central</option>
        </select>
      </div>
      <div className="field">
        <label>Notas</label>
        <input type="text" name="notes" placeholder="Motivo del retorno…" />
      </div>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Generando…" : "Generar movimiento"}
      </button>
      {state.error && <div style={{ color: "var(--crit)", fontSize: 11 }}>{state.error}</div>}
    </form>
  );
}
