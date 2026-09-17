"use client";

import { useState } from "react";
import { ArrivalForm } from "./ArrivalForm";
import { TaskForm } from "./TaskForm";
import { NuevoMovimientoForm } from "./NuevoMovimientoForm";
import { RpcButton } from "@/components/RpcButton";
import { consumeSparePart, checkToolReturn, closeCommission } from "./actions";

const MAINTENANCE_TYPE_LABEL: Record<string, string> = {
  preventivo_mensual: "Preventivo mensual",
  preventivo_trimestral: "Preventivo trimestral",
  preventivo_semestral: "Preventivo semestral",
  preventivo_anual: "Preventivo anual",
  correctivo: "Correctivo",
  verificacion_aerea: "Verificación aérea",
};

type Technician = { id: string; full_name: string };
type Task = { id: string; type: string; performedAt: string; notes: string | null; conAlarmas: boolean | null; technicianName: string };
type Equipo = { id: string; label: string; type: string; intervened: boolean; tasks: Task[] };
type AirportGroup = { airportCode: string; airportName: string; equipment: Equipo[] };
type Article = { assetNumber: string; modelName: string; kind: string; physicalStatus: string; toolReturnState: string | null };
type Batch = { batchId: string; route: string; date: string; articles: Article[] };
type CandidateArticle = { asset_number: string; model_name: string; current_location_airport: string | null };

const STEPS = ["Llegada", "Equipos intervenidos", "Conciliación de inventario", "Resumen y cierre"];

export function CierreWizard({
  commissionId,
  plannedArrivalDate,
  actualArrivalDate,
  technicians,
  equipmentByAirport,
  batches,
  candidateArticles,
  unintervenedCount,
  pendingToolsCount,
}: {
  commissionId: string;
  plannedArrivalDate: string;
  actualArrivalDate: string | null;
  technicians: Technician[];
  equipmentByAirport: AirportGroup[];
  batches: Batch[];
  candidateArticles: CandidateArticle[];
  unintervenedCount: number;
  pendingToolsCount: number;
}) {
  const [step, setStep] = useState(1);
  const defaultTaskDate = (actualArrivalDate ?? plannedArrivalDate).slice(0, 10);

  return (
    <div>
      <div className="steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} style={{ display: "contents" }}>
              <div className={`step${n < step ? " done" : ""}${n === step ? " current" : ""}`}>
                <div className="step-num">{n < step ? "✓" : n}</div>
                <div className="step-label">{label}</div>
              </div>
              {n < STEPS.length && <div className="step-line"></div>}
            </div>
          );
        })}
      </div>

      <div className="card wizard-panel">
        {step === 1 && (
          <div className="wstep active">
            <ArrivalForm commissionId={commissionId} actualArrivalDate={actualArrivalDate} />
          </div>
        )}

        {step === 2 && (
          <div className="wstep active">
            <p style={{ color: "var(--text-dim)", fontSize: 12.5, margin: "0 0 14px" }}>
              Un equipo puede tener más de una tarea. Un equipo sin tareas queda registrado como no intervenido.
            </p>
            {equipmentByAirport.map((g) => (
              <div key={g.airportCode} style={{ marginBottom: 18 }}>
                <div className="airport-group-label">
                  {g.airportCode} — {g.airportName}
                </div>
                {g.equipment.map((eq) => (
                  <div className="equipo-block" key={eq.id}>
                    <div className="equipo-head">
                      <div>
                        <div className="equipo-title">{eq.label}</div>
                        <div className="equipo-sub">{eq.type}</div>
                      </div>
                      {!eq.intervened && eq.tasks.length === 0 && (
                        <span className="pending-note">⚠ No intervenido</span>
                      )}
                    </div>

                    {eq.tasks.map((t) => (
                      <div className="mov-row" key={t.id}>
                        <div className="cr-main">
                          <div className="cr-title">{MAINTENANCE_TYPE_LABEL[t.type] ?? t.type}</div>
                          <div className="mov-route">
                            {t.performedAt} · {t.technicianName}
                            {t.conAlarmas !== null && t.conAlarmas !== undefined && (
                              <> · {t.conAlarmas ? "Con alarmas" : "Sin alarmas"}</>
                            )}
                            {t.notes && <> · {t.notes}</>}
                          </div>
                        </div>
                      </div>
                    ))}

                    <TaskForm
                      commissionId={commissionId}
                      equipmentId={eq.id}
                      technicians={technicians}
                      defaultDate={defaultTaskDate}
                    />
                  </div>
                ))}
                {g.equipment.length === 0 && <div className="empty">Sin equipos instalados en {g.airportCode}.</div>}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="wstep active">
            <div className="section-title" style={{ marginTop: 0 }}>
              Movimientos de la comisión
            </div>
            {batches.length === 0 && <div className="empty">Sin movimientos asociados a esta comisión.</div>}
            {batches.map((b) => (
              <div key={b.batchId} style={{ marginBottom: 14 }}>
                <div className="airport-group-label">
                  {b.route} · {b.date.slice(0, 10)} · {b.articles.length} artículo{b.articles.length === 1 ? "" : "s"}
                </div>
                {b.articles.map((a) => (
                  <div className="mov-row" key={a.assetNumber}>
                    <div className="cr-main">
                      <div className="cr-title mono">{a.assetNumber}</div>
                      <div className="mov-route">{a.modelName}</div>
                    </div>
                    {a.kind === "repuesto" ? (
                      a.physicalStatus === "baja" ? (
                        <span className="pill crit">
                          <span className="dot"></span>Cerrado · consumido
                        </span>
                      ) : (
                        <RpcButton
                          action={() => consumeSparePart(commissionId, a.assetNumber)}
                          label="Marcar usado (baja)"
                        />
                      )
                    ) : a.toolReturnState === "devuelta" ? (
                      <span className="pill ok">
                        <span className="dot"></span>Devuelta
                      </span>
                    ) : a.toolReturnState === "no_devuelta" ? (
                      <span className="pill crit">
                        <span className="dot"></span>No vuelve
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <RpcButton
                          action={() => checkToolReturn(commissionId, a.assetNumber, true)}
                          label="Devuelta"
                          className="btn small"
                        />
                        <RpcButton
                          action={() => checkToolReturn(commissionId, a.assetNumber, false)}
                          label="No vuelve"
                          className="btn small"
                        />
                        <span className="pill warn">
                          <span className="dot"></span>Pendiente
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div className="section-title">
              Nuevo movimiento{" "}
              <small style={{ fontWeight: 400, color: "var(--text-faint)" }}>
                traer un elemento del aeropuerto visitado al taller o al pañol
              </small>
            </div>
            {candidateArticles.length === 0 ? (
              <div className="empty">No hay artículos disponibles en los aeropuertos de esta comisión.</div>
            ) : (
              <NuevoMovimientoForm commissionId={commissionId} articles={candidateArticles} />
            )}
          </div>
        )}

        {step === 4 && (
          <div className="wstep active">
            {(unintervenedCount > 0 || pendingToolsCount > 0) && (
              <div className="warn-box">⚠ Se puede cerrar igual — quedan advertencias registradas para seguimiento posterior.</div>
            )}
            <div className="summary-box">
              <div className="summary-line">
                <span>Equipos sin intervenir</span>
                <b className="mono" style={{ color: unintervenedCount > 0 ? "var(--warn)" : undefined }}>
                  {unintervenedCount}
                </b>
              </div>
              <div className="summary-line">
                <span>Herramientas con checklist pendiente</span>
                <b className="mono" style={{ color: pendingToolsCount > 0 ? "var(--warn)" : undefined }}>
                  {pendingToolsCount}
                </b>
              </div>
            </div>
            <RpcButton action={() => closeCommission(commissionId)} label="Cerrar comisión" className="btn primary" />
          </div>
        )}
      </div>

      <div className="btn-row" style={{ marginTop: 16, justifyContent: "space-between" }}>
        <button className="btn ghost" type="button" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          ‹ Anterior
        </button>
        {step < STEPS.length && (
          <button className="btn primary" type="button" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>
            Siguiente ›
          </button>
        )}
      </div>
    </div>
  );
}
