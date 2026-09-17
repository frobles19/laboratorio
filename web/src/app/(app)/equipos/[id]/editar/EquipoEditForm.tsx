"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateEquipo, type UpdateEquipoState } from "../actions";

export function EquipoEditForm({
  id,
  label,
  aerialVerificationFrequencyMonths,
}: {
  id: string;
  label: string;
  aerialVerificationFrequencyMonths: number;
}) {
  const action = updateEquipo.bind(null, id);
  const [state, formAction, pending] = useActionState<UpdateEquipoState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 420 }}>
      <div className="field" style={{ maxWidth: "none" }}>
        <label>Equipo</label>
        <input type="text" value={label} disabled style={{ opacity: 0.7 }} />
      </div>
      <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
        <label htmlFor="aerial_verification_frequency_months">Frecuencia de verificación aérea</label>
        <select
          id="aerial_verification_frequency_months"
          name="aerial_verification_frequency_months"
          required
          defaultValue={String(aerialVerificationFrequencyMonths)}
        >
          <option value="6">Cada 6 meses</option>
          <option value="12">Cada 12 meses</option>
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
        <Link href={`/equipos/${id}`} className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
