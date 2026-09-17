"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createVehiculo } from "./actions";

export default function NuevoVehiculoPage() {
  const [state, formAction, pending] = useActionState(createVehiculo, { error: null });

  return (
    <div>
      <Link href="/vehiculos" className="back-link">
        ‹ Vehículos
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nuevo vehículo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Alta de una camioneta de la flota para asignar a comisiones.
      </p>

      <form action={formAction} className="card form-page" style={{ maxWidth: 420 }}>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="license_plate">Patente</label>
          <input
            id="license_plate"
            name="license_plate"
            type="text"
            placeholder="AC-114 KX"
            style={{ textTransform: "uppercase" }}
            required
          />
        </div>
        <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
          <label htmlFor="brand_model">Marca / Modelo</label>
          <input id="brand_model" name="brand_model" type="text" placeholder="Toyota Hilux" />
        </div>

        {state.error && (
          <div className="warn-box" style={{ marginTop: 14 }}>
            {state.error}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar vehículo"}
          </button>
          <Link href="/vehiculos" className="btn ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
