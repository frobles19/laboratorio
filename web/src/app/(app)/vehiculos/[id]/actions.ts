"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDeleteError } from "@/lib/dbErrors";

export type UpdateVehiculoState = { error: string | null };

export async function updateVehiculo(
  id: string,
  _prevState: UpdateVehiculoState,
  formData: FormData
): Promise<UpdateVehiculoState> {
  const licensePlate = String(formData.get("license_plate") ?? "").trim().toUpperCase();
  const brandModel = String(formData.get("brand_model") ?? "").trim();

  if (!licensePlate) {
    return { error: "Ingresá la patente del vehículo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ license_plate: licensePlate, brand_model: brandModel || null })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect("/vehiculos");
}

export async function deleteVehiculo(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) {
    return { error: friendlyDeleteError(error.message) };
  }
  revalidatePath("/vehiculos");
  redirect("/vehiculos");
}
