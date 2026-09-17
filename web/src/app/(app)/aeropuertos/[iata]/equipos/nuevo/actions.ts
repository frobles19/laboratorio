"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateEquipoState = { error: string | null };

export async function createEquipo(_prevState: CreateEquipoState, formData: FormData): Promise<CreateEquipoState> {
  const airportIata = String(formData.get("airport_iata") ?? "").trim().toUpperCase();
  const catalogModelId = String(formData.get("catalog_model_id") ?? "").trim();
  const aerialFrequency = Number(formData.get("aerial_verification_frequency_months"));
  const dmeCatalogModelId = String(formData.get("dme_catalog_model_id") ?? "").trim() || undefined;
  const dmeAerialFrequency = formData.get("dme_aerial_verification_frequency_months")
    ? Number(formData.get("dme_aerial_verification_frequency_months"))
    : undefined;

  if (!airportIata || !catalogModelId || !aerialFrequency) {
    return { error: "Elegí el sistema principal y su frecuencia de verificación aérea." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_create_equipment", {
    p_airport_iata: airportIata,
    p_catalog_model_id: catalogModelId,
    p_aerial_verification_frequency_months: aerialFrequency,
    p_dme_catalog_model_id: dmeCatalogModelId,
    p_dme_aerial_verification_frequency_months: dmeAerialFrequency,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/aeropuertos/${airportIata}`);
}
