"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDeleteError } from "@/lib/dbErrors";
import type { Database } from "@/lib/supabase/types";

export type UpdateArticuloState = { error: string | null };

export async function updateArticulo(
  assetNumber: string,
  kind: Database["public"]["Enums"]["article_kind"],
  _prevState: UpdateArticuloState,
  formData: FormData
): Promise<UpdateArticuloState> {
  const serialNumber = String(formData.get("serial_number") ?? "").trim();
  const modelName = String(formData.get("model_name") ?? "").trim();
  const locationType = String(formData.get("location_type") ?? "") as Database["public"]["Enums"]["location_type"];
  const locationAirport = String(formData.get("location_airport") ?? "").trim().toUpperCase() || null;
  const physicalStatus = String(formData.get("physical_status") ?? "en_servicio") as Database["public"]["Enums"]["article_physical_status"];
  const toolType = String(formData.get("tool_type") ?? "").trim() || null;
  const spareType = String(formData.get("spare_type") ?? "").trim() || null;
  const catalogModelId = String(formData.get("catalog_model_id") ?? "").trim() || null;

  if (!serialNumber || !modelName || !locationType) {
    return { error: "Completá todos los campos obligatorios." };
  }
  if (locationType === "aeropuerto" && !locationAirport) {
    return { error: "Indicá el aeropuerto." };
  }

  const supabase = await createClient();

  const { error: articleError } = await supabase
    .from("articles")
    .update({
      serial_number: serialNumber,
      model_name: modelName,
      current_location_type: locationType,
      current_location_airport: locationType === "aeropuerto" ? locationAirport : null,
      physical_status: physicalStatus,
    })
    .eq("asset_number", assetNumber);

  if (articleError) {
    return { error: articleError.message };
  }

  if (kind === "herramienta") {
    const { error } = await supabase.from("tools").update({ tool_type: toolType ?? "" }).eq("asset_number", assetNumber);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("spare_parts")
      .update({ spare_type: spareType ?? "", catalog_model_id: catalogModelId ?? undefined })
      .eq("asset_number", assetNumber);
    if (error) return { error: error.message };
  }

  redirect(`/articulos/${assetNumber}`);
}

export async function deleteArticulo(assetNumber: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("asset_number", assetNumber);
  if (error) {
    return { error: friendlyDeleteError(error.message) };
  }
  revalidatePath("/articulos");
  redirect("/articulos");
}
