"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateAeropuertoState = { error: string | null };

export async function createAeropuerto(
  _prevState: CreateAeropuertoState,
  formData: FormData
): Promise<CreateAeropuertoState> {
  const iataCode = String(formData.get("iata_code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (iataCode.length !== 3 || !name || !region) {
    return { error: "El código IATA debe tener 3 letras y los demás campos son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("airports").insert({
    iata_code: iataCode,
    name,
    region,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/aeropuertos/${iataCode}`);
}
