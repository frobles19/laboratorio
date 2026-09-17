"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createEquipo } from "./actions";

type Model = { id: string; brand: string; model: string; type: "ILS" | "VOR" | "DME" };

export function EquipoForm({
  airportIata,
  airportLabel,
  models,
}: {
  airportIata: string;
  airportLabel: string;
  models: Model[];
}) {
  const [state, formAction, pending] = useActionState(createEquipo, { error: null });

  const mainModels = useMemo(() => models.filter((m) => m.type === "ILS" || m.type === "VOR"), [models]);
  const dmeModels = useMemo(() => models.filter((m) => m.type === "DME"), [models]);

  const [mainModelId, setMainModelId] = useState(mainModels[0]?.id ?? "");
  const mainModel = mainModels.find((m) => m.id === mainModelId);
  const dmeRequired = mainModel?.type === "ILS";
  const [includeDme, setIncludeDme] = useState(dmeRequired);

  return (
    <form action={formAction} className="card form-page" style={{ maxWidth: 520 }}>
      <input type="hidden" name="airport_iata" value={airportIata} />

      <div className="field" style={{ maxWidth: "none" }}>
        <label>Aeropuerto</label>
        <input type="text" value={airportLabel} disabled style={{ opacity: 0.7 }} />
      </div>

      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="catalog_model_id">Sistema principal</label>
        <select
          id="catalog_model_id"
          name="catalog_model_id"
          value={mainModelId}
          onChange={(e) => {
            setMainModelId(e.target.value);
            const type = mainModels.find((m) => m.id === e.target.value)?.type;
            if (type === "ILS") setIncludeDme(true);
          }}
          required
        >
          {mainModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.type} — {m.brand} {m.model}
            </option>
          ))}
        </select>
      </div>

      <div className="field" style={{ maxWidth: "none" }}>
        <label htmlFor="aerial_verification_frequency_months">Frecuencia de verificación aérea de este equipo</label>
        <select id="aerial_verification_frequency_months" name="aerial_verification_frequency_months" required defaultValue="6">
          <option value="6">Cada 6 meses</option>
          <option value="12">Cada 12 meses</option>
        </select>
      </div>

      {!dmeRequired && (
        <div className="field" style={{ maxWidth: "none" }}>
          <label>DME asociado</label>
          <div className="seg" style={{ width: "fit-content" }}>
            <button type="button" className={`sel-yes${includeDme ? " on" : ""}`} onClick={() => setIncludeDme(true)}>
              Con DME
            </button>
            <button type="button" className={`sel-no${!includeDme ? " on" : ""}`} onClick={() => setIncludeDme(false)}>
              Sin DME
            </button>
          </div>
        </div>
      )}

      {includeDme && (
        <>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="dme_catalog_model_id">
              Modelo del DME{" "}
              {dmeRequired ? (
                <span style={{ textTransform: "none", fontWeight: 400, color: "var(--warn)" }}>
                  (obligatorio — todo ILS lleva su DME)
                </span>
              ) : null}
            </label>
            <select id="dme_catalog_model_id" name="dme_catalog_model_id" required>
              {dmeModels.map((m) => (
                <option key={m.id} value={m.id}>
                  DME — {m.brand} {m.model}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ maxWidth: "none" }}>
            <label htmlFor="dme_aerial_verification_frequency_months">Frecuencia de verificación aérea del DME</label>
            <select
              id="dme_aerial_verification_frequency_months"
              name="dme_aerial_verification_frequency_months"
              required
              defaultValue="6"
            >
              <option value="6">Cada 6 meses</option>
              <option value="12">Cada 12 meses</option>
            </select>
          </div>
        </>
      )}

      <p style={{ color: "var(--text-faint)", fontSize: 12, maxWidth: 520, marginTop: 12 }}>
        Al guardar se crean los equipos instalados vinculados, cada uno con sus dos transmisores TX1/TX2 en estado
        &quot;fuera de servicio&quot; hasta la primera puesta en marcha.
      </p>

      {state.error && (
        <div className="warn-box" style={{ marginTop: 14 }}>
          {state.error}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar equipo"}
        </button>
        <Link href={`/aeropuertos/${airportIata}`} className="btn ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
