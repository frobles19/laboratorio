"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type CreateArticuloState = { error: string | null };

export async function createArticulo(
  _prevState: CreateArticuloState,
  formData: FormData
): Promise<CreateArticuloState> {
  const kind = String(formData.get("kind") ?? "") as Database["public"]["Enums"]["article_kind"];
  const assetNumber = String(formData.get("asset_number") ?? "").trim().toUpperCase();
  const serialNumber = String(formData.get("serial_number") ?? "").trim();
  const modelName = String(formData.get("model_name") ?? "").trim();
  const locationType = String(formData.get("location_type") ?? "") as Database["public"]["Enums"]["location_type"];
  const locationAirport = String(formData.get("location_airport") ?? "").trim().toUpperCase() || null;
  const physicalStatus = String(formData.get("physical_status") ?? "en_servicio") as Database["public"]["Enums"]["article_physical_status"];

  const toolType = String(formData.get("tool_type") ?? "").trim() || null;
  const calibrationDueDate = String(formData.get("calibration_due_date") ?? "").trim() || null;
  const spareType = String(formData.get("spare_type") ?? "").trim() || null;
  const catalogModelId = String(formData.get("catalog_model_id") ?? "").trim() || null;

  if (!assetNumber || !serialNumber || !modelName || !kind || !locationType) {
    return { error: "Completá todos los campos obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_create_article", {
    p_asset_number: assetNumber,
    p_serial_number: serialNumber,
    p_kind: kind,
    p_model_name: modelName,
    p_location_type: locationType,
    p_location_airport: (locationType === "aeropuerto" ? locationAirport : null) ?? undefined,
    p_physical_status: physicalStatus,
    p_tool_type: (kind === "herramienta" ? toolType : null) ?? undefined,
    p_calibration_due_date: (kind === "herramienta" ? calibrationDueDate : null) ?? undefined,
    p_spare_type: (kind === "repuesto" ? spareType : null) ?? undefined,
    p_catalog_model_id: (kind === "repuesto" ? catalogModelId : null) ?? undefined,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/articulos/${assetNumber}`);
}
