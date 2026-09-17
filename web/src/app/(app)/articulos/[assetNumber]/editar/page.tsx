import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArticuloEditForm } from "./ArticuloEditForm";

export const dynamic = "force-dynamic";

export default async function EditarArticuloPage({
  params,
}: {
  params: Promise<{ assetNumber: string }>;
}) {
  const { assetNumber } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*, tools(tool_type), spare_parts(spare_type, catalog_model_id)")
    .eq("asset_number", assetNumber)
    .maybeSingle();

  if (!article) notFound();

  const [{ data: airports }, { data: models }] = await Promise.all([
    supabase.from("airports").select("iata_code, name").order("iata_code"),
    supabase.from("model_catalog").select("id, brand, model, type").order("type").order("brand"),
  ]);

  const tool = article.tools as unknown as { tool_type: string } | null;
  const sparePart = article.spare_parts as unknown as { spare_type: string; catalog_model_id: string } | null;

  return (
    <div>
      <Link href={`/articulos/${assetNumber}`} className="back-link">
        ‹ {assetNumber}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Editar artículo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Actualizá los datos de este artículo del inventario.
      </p>

      <ArticuloEditForm
        assetNumber={article.asset_number}
        kind={article.kind}
        serialNumber={article.serial_number}
        modelName={article.model_name}
        locationType={article.current_location_type}
        locationAirport={article.current_location_airport}
        physicalStatus={article.physical_status}
        toolType={tool?.tool_type ?? null}
        spareType={sparePart?.spare_type ?? null}
        catalogModelId={sparePart?.catalog_model_id ?? null}
        airports={airports ?? []}
        models={models ?? []}
      />
    </div>
  );
}
