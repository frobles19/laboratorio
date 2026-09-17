"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type CreateModeloState = { error: string | null };

export async function createModelo(_prevState: CreateModeloState, formData: FormData): Promise<CreateModeloState> {
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const type = String(formData.get("type") ?? "") as Database["public"]["Enums"]["equipment_type"];
  const aerialFrequency = Number(formData.get("aerial_verification_frequency_months"));

  if (!brand || !model || !type || !aerialFrequency) {
    return { error: "Completá todos los campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("model_catalog").insert({
    brand,
    model,
    type,
    aerial_verification_frequency_months: aerialFrequency,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/catalogo");
}
