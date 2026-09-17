"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateVehiculoState = { error: string | null };

export async function createVehiculo(_prevState: CreateVehiculoState, formData: FormData): Promise<CreateVehiculoState> {
  const licensePlate = String(formData.get("license_plate") ?? "").trim().toUpperCase();
  const brandModel = String(formData.get("brand_model") ?? "").trim();

  if (!licensePlate) {
    return { error: "Ingresá la patente del vehículo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    license_plate: licensePlate,
    brand_model: brandModel || null,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/vehiculos");
}
