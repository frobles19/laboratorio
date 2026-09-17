"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDeleteError } from "@/lib/dbErrors";

export type UpdateAeropuertoState = { error: string | null };

export async function updateAeropuerto(
  iataCode: string,
  _prevState: UpdateAeropuertoState,
  formData: FormData
): Promise<UpdateAeropuertoState> {
  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (!name || !region) {
    return { error: "Completá todos los campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("airports").update({ name, region }).eq("iata_code", iataCode);

  if (error) {
    return { error: error.message };
  }

  redirect(`/aeropuertos/${iataCode}`);
}

export async function deleteAeropuerto(iataCode: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("airports").delete().eq("iata_code", iataCode);
  if (error) {
    return { error: friendlyDeleteError(error.message) };
  }
  revalidatePath("/aeropuertos");
  redirect("/aeropuertos");
}
