"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createAeropuerto } from "./actions";

const REGIONS = ["Buenos Aires", "Córdoba", "Cuyo", "Patagonia", "NOA", "NEA"];

export default function NuevoAeropuertoPage() {
  const [state, formAction, pending] = useActionState(createAeropuerto, { error: null });

  return (
    <div>
      <Link href="/aeropuertos" className="back-link">
        ‹ Aeropuertos
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nuevo aeropuerto</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Alta de un aeropuerto en el catálogo de infraestructura.
      </p>

      <form action={formAction} className="card form-page" style={{ maxWidth: 460 }}>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="iata_code">Código IATA</label>
          <input
            id="iata_code"
            name="iata_code"
            type="text"
            maxLength={3}
            placeholder="EZE"
            style={{ textTransform: "uppercase", letterSpacing: ".08em" }}
            required
          />
        </div>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="name">Nombre</label>
          <input id="name" name="name" type="text" placeholder="Ministro Pistarini" required />
        </div>
        <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
          <label htmlFor="region">Región</label>
          <select id="region" name="region" required defaultValue={REGIONS[0]}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {state.error && (
          <div className="warn-box" style={{ marginTop: 14 }}>
            {state.error}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar aeropuerto"}
          </button>
          <Link href="/aeropuertos" className="btn ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
