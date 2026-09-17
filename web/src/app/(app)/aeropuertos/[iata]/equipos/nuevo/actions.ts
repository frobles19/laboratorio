"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateEquipoState = { error: string | null };

export async function createEquipo(_prevState: CreateEquipoState, formData: FormData): Promise<CreateEquipoState> {
  const airportIata = String(formData.get("airport_iata") ?? "").trim().toUpperCase();
  const catalogModelId = String(formData.get("catalog_model_id") ?? "").trim();
  const dmeCatalogModelId = String(formData.get("dme_catalog_model_id") ?? "").trim() || null;
  const installedAt = String(formData.get("installed_at") ?? "").trim() || undefined;

  if (!airportIata || !catalogModelId) {
    return { error: "Elegí el sistema principal a instalar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_create_equipment", {
    p_airport_iata: airportIata,
    p_catalog_model_id: catalogModelId,
    p_dme_catalog_model_id: dmeCatalogModelId ?? undefined,
    p_installed_at: installedAt,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/aeropuertos/${airportIata}`);
}
