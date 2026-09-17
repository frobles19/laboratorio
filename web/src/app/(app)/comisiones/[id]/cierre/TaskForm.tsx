"use client";

import { useActionState, useState } from "react";
import { recordTask, type RecordTaskState } from "./actions";

const MAINTENANCE_TYPES: { value: string; label: string }[] = [
  { value: "preventivo_mensual", label: "Preventivo mensual" },
  { value: "preventivo_trimestral", label: "Preventivo trimestral" },
  { value: "preventivo_semestral", label: "Preventivo semestral" },
  { value: "preventivo_anual", label: "Preventivo anual" },
  { value: "correctivo", label: "Correctivo" },
  { value: "verificacion_aerea", label: "Verificación aérea" },
];

export function TaskForm({
  commissionId,
  equipmentId,
  technicians,
  defaultDate,
}: {
  commissionId: string;
  equipmentId: string;
  technicians: { id: string; full_name: string }[];
  defaultDate: string;
}) {
  const action = recordTask.bind(null, commissionId, equipmentId);
  const [state, formAction, pending] = useActionState<RecordTaskState, FormData>(action, { error: null });
  const [type, setType] = useState("preventivo_semestral");

  return (
    <form action={formAction} className="tarea-row">
      <div className="field">
        <label>Tipo de tarea</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
          {MAINTENANCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {type === "verificacion_aerea" && (
          <div className="alarm-toggle" style={{ marginTop: 6 }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
              <input type="checkbox" name="con_alarmas" />
              Con alarmas
            </label>
          </div>
        )}
      </div>
      <div className="field">
        <label>Técnico</label>
        <select name="technician_id" required>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Fecha</label>
        <input type="date" name="performed_at" defaultValue={defaultDate} />
      </div>
      <div className="field">
        <label>Comentario</label>
        <input type="text" name="notes" placeholder="Observaciones de la tarea…" />
      </div>
      <button className="btn small" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "+ Agregar tarea"}
      </button>
      {state.error && <div style={{ color: "var(--crit)", fontSize: 11 }}>{state.error}</div>}
    </form>
  );
}
