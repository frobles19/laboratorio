"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateVehiculo, type UpdateVehiculoState } from "../actions";

export function VehiculoEditForm({
  id,
  licensePlate,
  brandModel,
}: {
  id: string;
  licensePlate: string;
  brandModel: string | null;
}) {
  const action = updateVehiculo.bind(null, id);
  const [state, formAction, pending] = useActionState<UpdateVehiculoState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 420 }}>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="license_plate">Patente</label>
        <input
          id="license_plate"
          name="license_plate"
          type="text"
          defaultValue={licensePlate}
          style={{ textTransform: "uppercase" }}
          required
        />
      </div>
      <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
        <label htmlFor="brand_model">Marca / Modelo</label>
        <input id="brand_model" name="brand_model" type="text" defaultValue={brandModel ?? ""} />
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
        <Link href="/vehiculos" className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
