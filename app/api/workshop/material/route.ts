import { NextResponse } from "next/server";
import { serveWorkshopAsset } from "@/lib/workshop-asset-response";
import { isWorkshopAssetKey } from "@/lib/workshop-assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const asset = new URL(request.url).searchParams.get("asset") ?? "";
  if (!isWorkshopAssetKey(asset)) {
    return NextResponse.json({ error: "Recurso no disponible." }, { status: 404 });
  }
  return serveWorkshopAsset(request, asset);
}
