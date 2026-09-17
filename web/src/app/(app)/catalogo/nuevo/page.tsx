"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createModelo } from "./actions";

export default function NuevoModeloPage() {
  const [state, formAction, pending] = useActionState(createModelo, { error: null });

  return (
    <div>
      <Link href="/catalogo" className="back-link">
        ‹ Catálogo de modelos
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nuevo modelo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Alta de un modelo en el catálogo. Después se instalan equipos físicos de este modelo en cada aeropuerto.
      </p>

      <form action={formAction} className="card form-page" style={{ maxWidth: 460 }}>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="brand">Marca</label>
          <input id="brand" name="brand" type="text" placeholder="Thales" required />
        </div>
        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="model">Modelo</label>
          <input id="model" name="model" type="text" placeholder="420" required />
        </div>
        <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
          <label htmlFor="type">Tipo de equipo</label>
          <select id="type" name="type" required defaultValue="ILS">
            <option value="ILS">ILS</option>
            <option value="VOR">VOR</option>
            <option value="DME">DME</option>
          </select>
        </div>

        {state.error && (
          <div className="warn-box" style={{ marginTop: 14 }}>
            {state.error}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar modelo"}
          </button>
          <Link href="/catalogo" className="btn ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
