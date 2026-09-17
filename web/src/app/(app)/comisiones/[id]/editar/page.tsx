import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComisionEditForm } from "./ComisionEditForm";

export const dynamic = "force-dynamic";

export default async function EditarComisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: commission } = await supabase
    .from("commissions")
    .select(
      "id, status, planned_departure_date, planned_arrival_date, vehicle_id, commission_airports(airport_iata), commission_technicians(technician_id)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!commission) notFound();

  if (commission.status !== "planificada") {
    return (
      <div>
        <Link href={`/comisiones/${id}`} className="back-link">
          ‹ {commission.id.slice(0, 8)}
        </Link>
        <div className="card">
          <div className="empty" style={{ padding: "40px 0" }}>
            Esta comisión ya está {commission.status} y no se puede editar.
          </div>
        </div>
      </div>
    );
  }

  const [{ data: airports }, { data: technicians }, { data: vehicles }] = await Promise.all([
    supabase.from("airports").select("iata_code, name").order("iata_code"),
    supabase.from("technicians").select("id, full_name").order("full_name"),
    supabase.from("vehicles").select("id, license_plate, brand_model").order("license_plate"),
  ]);

  return (
    <div>
      <Link href={`/comisiones/${id}`} className="back-link">
        ‹ {commission.id.slice(0, 8)}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Editar comisión</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Actualizá la planificación del viaje.
      </p>

      <ComisionEditForm
        id={id}
        plannedDepartureDate={commission.planned_departure_date}
        plannedArrivalDate={commission.planned_arrival_date}
        vehicleId={commission.vehicle_id}
        selectedAirportIatas={(commission.commission_airports as { airport_iata: string }[]).map((a) => a.airport_iata)}
        selectedTechnicianIds={(commission.commission_technicians as { technician_id: string }[]).map((t) => t.technician_id)}
        airports={airports ?? []}
        technicians={technicians ?? []}
        vehicles={vehicles ?? []}
      />
    </div>
  );
}
