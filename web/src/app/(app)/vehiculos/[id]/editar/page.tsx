import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehiculoEditForm } from "./VehiculoEditForm";

export const dynamic = "force-dynamic";

export default async function EditarVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!vehicle) notFound();

  return (
    <div>
      <Link href="/vehiculos" className="back-link">
        ‹ Vehículos
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Editar vehículo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Actualizá los datos de este vehículo de la flota.
      </p>

      <VehiculoEditForm id={vehicle.id} licensePlate={vehicle.license_plate} brandModel={vehicle.brand_model} />
    </div>
  );
}
