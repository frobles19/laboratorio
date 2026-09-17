"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateAeropuerto, type UpdateAeropuertoState } from "../actions";

const REGIONS = ["EZEIZA", "CORDOBA", "COMODORO RIVADAVIA", "MENDOZA", "RESISTENCIA"];

export function AeropuertoEditForm({
  iataCode,
  name,
  region,
}: {
  iataCode: string;
  name: string;
  region: string;
}) {
  const action = updateAeropuerto.bind(null, iataCode);
  const [state, formAction, pending] = useActionState<UpdateAeropuertoState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 460 }}>
      <div className="field" style={{ maxWidth: "none" }}>
        <label>Código IATA</label>
        <input type="text" value={iataCode} disabled style={{ opacity: 0.7 }} />
      </div>
      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" type="text" defaultValue={name} required />
      </div>
      <div className="field" style={{ maxWidth: "none", marginBottom: 0 }}>
        <label htmlFor="region">Región</label>
        <select id="region" name="region" required defaultValue={region}>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          {!REGIONS.includes(region) && <option value={region}>{region}</option>}
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
        <Link href={`/aeropuertos/${iataCode}`} className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
