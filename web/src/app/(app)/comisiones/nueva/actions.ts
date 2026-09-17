"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateComisionState = { error: string | null };

export async function createComision(
  _prevState: CreateComisionState,
  formData: FormData
): Promise<CreateComisionState> {
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
  const { data, error } = await supabase.rpc("rpc_create_commission", {
    p_planned_departure_date: plannedDeparture,
    p_planned_arrival_date: plannedArrival,
    p_airport_iatas: airportIatas,
    p_technician_ids: technicianIds,
    p_vehicle_id: vehicleId,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/comisiones/${data}`);
}
