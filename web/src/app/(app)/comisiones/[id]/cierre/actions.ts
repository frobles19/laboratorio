"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type RpcResult = { error: string | null };

export type SetArrivalState = { error: string | null };

export async function setArrival(
  commissionId: string,
  _prevState: SetArrivalState,
  formData: FormData
): Promise<SetArrivalState> {
  const actualArrivalDate = String(formData.get("actual_arrival_date") ?? "");
  if (!actualArrivalDate) {
    return { error: "Ingresá la fecha real de llegada." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_set_commission_arrival", {
    p_commission_id: commissionId,
    p_actual_arrival_date: actualArrivalDate,
  });

  if (error) return { error: error.message };

  revalidatePath(`/comisiones/${commissionId}/cierre`);
  return { error: null };
}

export type RecordTaskState = { error: string | null };

export async function recordTask(
  commissionId: string,
  equipmentId: string,
  _prevState: RecordTaskState,
  formData: FormData
): Promise<RecordTaskState> {
  const type = String(formData.get("type") ?? "") as Database["public"]["Enums"]["maintenance_type"];
  const technicianId = String(formData.get("technician_id") ?? "");
  const performedAt = String(formData.get("performed_at") ?? "") || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const conAlarmas = type === "verificacion_aerea" ? formData.get("con_alarmas") === "on" : undefined;

  if (!type || !technicianId) {
    return { error: "Elegí el tipo de tarea y el técnico." };
  }

  const supabase = await createClient();
  const { error: maintenanceError } = await supabase.rpc("rpc_record_maintenance", {
    p_commission_id: commissionId,
    p_equipment_id: equipmentId,
    p_type: type,
    p_technician_id: technicianId,
    p_notes: notes,
    p_performed_at: performedAt,
    p_con_alarmas: conAlarmas,
  });

  if (maintenanceError) return { error: maintenanceError.message };

  const { error: intervenedError } = await supabase.rpc("rpc_set_equipment_intervened", {
    p_commission_id: commissionId,
    p_equipment_id: equipmentId,
    p_intervened: true,
  });

  if (intervenedError) return { error: intervenedError.message };

  revalidatePath(`/comisiones/${commissionId}/cierre`);
  return { error: null };
}

export async function consumeSparePart(commissionId: string, assetNumber: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_consume_spare_part", {
    p_commission_id: commissionId,
    p_asset_number: assetNumber,
  });
  if (error) return { error: error.message };
  revalidatePath(`/comisiones/${commissionId}/cierre`);
  return { error: null };
}

export async function checkToolReturn(
  commissionId: string,
  assetNumber: string,
  returned: boolean
): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_check_tool_return", {
    p_commission_id: commissionId,
    p_asset_number: assetNumber,
    p_returned: returned,
  });
  if (error) return { error: error.message };
  revalidatePath(`/comisiones/${commissionId}/cierre`);
  return { error: null };
}

export type ReturnToWorkshopState = { error: string | null };

export async function returnToWorkshop(
  commissionId: string,
  _prevState: ReturnToWorkshopState,
  formData: FormData
): Promise<ReturnToWorkshopState> {
  const assetNumber = String(formData.get("asset_number") ?? "");
  const destinationType = String(formData.get("destination_type") ?? "taller") as Database["public"]["Enums"]["location_type"];
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!assetNumber) {
    return { error: "Elegí un artículo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_return_article_to_workshop", {
    p_commission_id: commissionId,
    p_asset_number: assetNumber,
    p_destination_type: destinationType,
    p_notes: notes,
  });

  if (error) return { error: error.message };

  revalidatePath(`/comisiones/${commissionId}/cierre`);
  return { error: null };
}

export async function closeCommission(commissionId: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_close_commission", {
    p_commission_id: commissionId,
  });
  if (error) return { error: error.message };
  redirect(`/comisiones/${commissionId}`);
}
