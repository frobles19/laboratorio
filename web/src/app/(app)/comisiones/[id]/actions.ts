"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDeleteError } from "@/lib/dbErrors";

export type UpdateComisionState = { error: string | null };

export async function updateComision(
  id: string,
  _prevState: UpdateComisionState,
  formData: FormData
): Promise<UpdateComisionState> {
  const plannedDeparture = String(formData.get("planned_departure_date") ?? "");
  const plannedArrival = String(formData.get("planned_arrival_date") ?? "");
  const vehicleId = String(formData.get("vehicle_id") ?? "").trim() || undefined;
  const airportIatas = formData.getAll("airport_iatas").map(String);
  const technicianIds = formData.getAll("technician_ids").map(String);

  if (!plannedDeparture || !plannedArrival) {
    return { error: "Completá las fechas de salida y llegada planificadas." };
  }
  if (airportIatas.length === 0) {
    return { error: "Elegí al menos un aeropuerto destino." };
  }
  if (technicianIds.length === 0) {
    return { error: "Asigná al menos un técnico." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_update_commission", {
    p_commission_id: id,
    p_planned_departure_date: plannedDeparture,
    p_planned_arrival_date: plannedArrival,
    p_airport_iatas: airportIatas,
    p_technician_ids: technicianIds,
    p_vehicle_id: vehicleId,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/comisiones/${id}`);
}

export async function deleteComision(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("commissions").delete().eq("id", id);
  if (error) {
    return { error: friendlyDeleteError(error.message) };
  }
  revalidatePath("/comisiones");
  redirect("/comisiones");
}
