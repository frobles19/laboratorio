import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CierreWizard } from "./CierreWizard";

export const dynamic = "force-dynamic";

export default async function CierreComisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: commission } = await supabase
    .from("commissions")
    .select(
      "id, status, planned_arrival_date, actual_arrival_date, commission_airports(airport_iata, airports(name)), commission_technicians(technicians(id, full_name))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!commission) notFound();
  if (commission.status === "finalizada" || commission.status === "cancelada") {
    return (
      <div>
        <Link href={`/comisiones/${id}`} className="back-link">
          ‹ {commission.id.slice(0, 8)}
        </Link>
        <div className="card">
          <div className="empty" style={{ padding: "40px 0" }}>
            Esta comisión ya está {commission.status} y no admite más cambios de cierre.
          </div>
        </div>
      </div>
    );
  }

  const airportCodes = (commission.commission_airports as { airport_iata: string; airports: { name: string } | null }[]).map(
    (a) => a.airport_iata
  );
  const technicians = (commission.commission_technicians as { technicians: { id: string; full_name: string } | null }[])
    .map((t) => t.technicians)
    .filter((t): t is { id: string; full_name: string } => t !== null);

  const [{ data: equipment }, { data: commissionEquipment }, { data: maintenances }, { data: movements }, { data: toolChecklist }, { data: airportArticles }] =
    await Promise.all([
      airportCodes.length > 0
        ? supabase
            .from("installed_equipment")
            .select("id, airport_iata, model_catalog(brand, model, type)")
            .in("airport_iata", airportCodes)
        : Promise.resolve({ data: [] }),
      supabase.from("commission_equipment").select("equipment_id, intervened").eq("commission_id", id),
      supabase
        .from("maintenances")
        .select("id, equipment_id, type, performed_at, notes, con_alarmas, technicians(full_name)")
        .eq("commission_id", id),
      supabase
        .from("movements")
        .select("batch_id, asset_number, origin_type, origin_airport, destination_type, destination_airport, moved_at, articles(kind, model_name, physical_status)")
        .eq("commission_id", id)
        .order("moved_at"),
      supabase.from("commission_tool_checklist").select("asset_number, return_state").eq("commission_id", id),
      airportCodes.length > 0
        ? supabase
            .from("articles")
            .select("asset_number, model_name, current_location_airport, physical_status")
            .eq("current_location_type", "aeropuerto")
            .in("current_location_airport", airportCodes)
            .neq("physical_status", "baja")
        : Promise.resolve({ data: [] }),
    ]);

  const airportNameByCode = new Map(
    (commission.commission_airports as { airport_iata: string; airports: { name: string } | null }[]).map((a) => [
      a.airport_iata,
      a.airports?.name ?? a.airport_iata,
    ])
  );

  const intervenedByEquipment = new Map((commissionEquipment ?? []).map((ce) => [ce.equipment_id, ce.intervened]));

  const maintenancesByEquipment = new Map<string, typeof maintenances>();
  for (const m of maintenances ?? []) {
    const list = maintenancesByEquipment.get(m.equipment_id) ?? [];
    list.push(m);
    maintenancesByEquipment.set(m.equipment_id, list as never);
  }

  const equipmentByAirport = airportCodes.map((code) => ({
    airportCode: code,
    airportName: airportNameByCode.get(code) ?? code,
    equipment: (equipment ?? [])
      .filter((eq) => eq.airport_iata === code)
      .map((eq) => {
        const model = eq.model_catalog as unknown as { brand: string; model: string; type: string };
        return {
          id: eq.id,
          label: `${model.brand} ${model.model}`,
          type: model.type,
          intervened: intervenedByEquipment.get(eq.id) ?? false,
          tasks: (maintenancesByEquipment.get(eq.id) ?? []).map((t) => ({
            id: t!.id,
            type: t!.type,
            performedAt: t!.performed_at,
            notes: t!.notes,
            conAlarmas: t!.con_alarmas,
            technicianName: (t!.technicians as unknown as { full_name: string } | null)?.full_name ?? "—",
          })),
        };
      }),
  }));

  const toolReturnByAsset = new Map((toolChecklist ?? []).map((t) => [t.asset_number, t.return_state]));

  const batches = new Map<
    string,
    {
      batchId: string;
      route: string;
      date: string;
      articles: { assetNumber: string; modelName: string; kind: string; physicalStatus: string; toolReturnState: string | null }[];
    }
  >();
  for (const m of movements ?? []) {
    const article = m.articles as unknown as { kind: string; model_name: string; physical_status: string } | null;
    const entry = batches.get(m.batch_id) ?? {
      batchId: m.batch_id,
      route: `${m.origin_airport ?? m.origin_type} → ${m.destination_airport ?? m.destination_type}`,
      date: m.moved_at,
      articles: [],
    };
    entry.articles.push({
      assetNumber: m.asset_number,
      modelName: article?.model_name ?? m.asset_number,
      kind: article?.kind ?? "repuesto",
      physicalStatus: article?.physical_status ?? "en_servicio",
      toolReturnState: toolReturnByAsset.get(m.asset_number) ?? null,
    });
    batches.set(m.batch_id, entry);
  }

  const unintervenedCount = equipmentByAirport.reduce(
    (acc, g) => acc + g.equipment.filter((e) => !e.intervened).length,
    0
  );
  const pendingToolsCount = Array.from(batches.values())
    .flatMap((b) => b.articles)
    .filter((a) => a.kind === "herramienta" && a.toolReturnState !== "devuelta" && a.toolReturnState !== "no_devuelta").length;

  return (
    <div>
      <Link href={`/comisiones/${id}`} className="back-link">
        ‹ {commission.id.slice(0, 8)}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Cierre de comisión — {commission.id.slice(0, 8)}</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Conciliación operativa y logística. Se puede cerrar aunque queden ítems pendientes: quedan registrados como
        advertencia.
      </p>

      <CierreWizard
        commissionId={commission.id}
        plannedArrivalDate={commission.planned_arrival_date}
        actualArrivalDate={commission.actual_arrival_date}
        technicians={technicians}
        equipmentByAirport={equipmentByAirport}
        batches={Array.from(batches.values())}
        candidateArticles={(airportArticles ?? []).map((a) => ({
          asset_number: a.asset_number,
          model_name: a.model_name,
          current_location_airport: a.current_location_airport,
        }))}
        unintervenedCount={unintervenedCount}
        pendingToolsCount={pendingToolsCount}
      />
    </div>
  );
}
