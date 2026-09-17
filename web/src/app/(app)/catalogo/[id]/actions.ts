"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDeleteError } from "@/lib/dbErrors";
import type { Database } from "@/lib/supabase/types";

export type UpdateModeloState = { error: string | null };

export async function updateModelo(
  id: string,
  _prevState: UpdateModeloState,
  formData: FormData
): Promise<UpdateModeloState> {
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const type = String(formData.get("type") ?? "") as Database["public"]["Enums"]["equipment_type"];
  const preventiveFrequency = Number(formData.get("preventive_frequency_months"));

  if (!brand || !model || !type || !preventiveFrequency) {
    return { error: "Completá todos los campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("model_catalog")
    .update({ brand, model, type, preventive_frequency_months: preventiveFrequency })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect(`/catalogo/${id}`);
}

export async function deleteModelo(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("model_catalog").delete().eq("id", id);
  if (error) {
    return { error: friendlyDeleteError(error.message) };
  }
  revalidatePath("/catalogo");
  redirect("/catalogo");
}
