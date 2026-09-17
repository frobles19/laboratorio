"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type CreateModeloState = { error: string | null };

export async function createModelo(_prevState: CreateModeloState, formData: FormData): Promise<CreateModeloState> {
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const type = String(formData.get("type") ?? "") as Database["public"]["Enums"]["equipment_type"];

  if (!brand || !model || !type) {
    return { error: "Completá todos los campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("model_catalog").insert({
    brand,
    model,
    type,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/catalogo");
}
