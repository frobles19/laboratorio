"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDeleteError } from "@/lib/dbErrors";

export type UpdateEquipoState = { error: string | null };

export async function updateEquipo(
  id: string,
  _prevState: UpdateEquipoState,
  formData: FormData
): Promise<UpdateEquipoState> {
  const aerialFrequency = Number(formData.get("aerial_verification_frequency_months"));

  if (!aerialFrequency) {
    return { error: "Elegí la frecuencia de verificación aérea." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("installed_equipment")
    .update({ aerial_verification_frequency_months: aerialFrequency })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect(`/equipos/${id}`);
}

export async function deleteEquipo(id: string, airportIata: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_delete_equipment", { p_equipment_id: id });
  if (error) {
    return { error: friendlyDeleteError(error.message) };
  }
  revalidatePath(`/aeropuertos/${airportIata}`);
  redirect(`/aeropuertos/${airportIata}`);
}
