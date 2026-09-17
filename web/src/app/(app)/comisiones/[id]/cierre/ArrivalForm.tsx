"use client";

import { useActionState } from "react";
import { setArrival, type SetArrivalState } from "./actions";

export function ArrivalForm({ commissionId, actualArrivalDate }: { commissionId: string; actualArrivalDate: string | null }) {
  const action = setArrival.bind(null, commissionId);
  const [state, formAction, pending] = useActionState<SetArrivalState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="field" style={{ maxWidth: 320 }}>
      <label htmlFor="actual_arrival_date">Fecha real de llegada</label>
      <input
        id="actual_arrival_date"
        name="actual_arrival_date"
        type="date"
        defaultValue={actualArrivalDate ?? ""}
        required
      />
      {state.error && (
        <div className="warn-box" style={{ marginTop: 10 }}>
          {state.error}
        </div>
      )}
      <button className="btn primary small" type="submit" disabled={pending} style={{ marginTop: 10 }}>
        {pending ? "Guardando…" : "Guardar fecha de llegada"}
      </button>
    </form>
  );
}
