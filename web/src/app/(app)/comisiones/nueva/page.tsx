import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ComisionForm } from "./ComisionForm";

export const dynamic = "force-dynamic";

export default async function NuevaComisionPage() {
  const supabase = await createClient();

  const [{ data: airports }, { data: technicians }, { data: vehicles }] = await Promise.all([
    supabase.from("airports").select("iata_code, name").order("iata_code"),
    supabase.from("technicians").select("id, full_name").order("full_name"),
    supabase.from("vehicles").select("id, license_plate, brand_model").order("license_plate"),
  ]);

  return (
    <div>
      <Link href="/comisiones" className="back-link">
        ‹ Comisiones
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nueva comisión</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Planificación del viaje: destinos, cuadrilla, transporte y fechas.
      </p>

      <ComisionForm airports={airports ?? []} technicians={technicians ?? []} vehicles={vehicles ?? []} />
    </div>
  );
}
