import { NextResponse } from "next/server";
import { getEbookSoldCount } from "@/lib/ebook-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const sold = await getEbookSoldCount().catch(() => null);
  return NextResponse.json(
    { sold: sold ?? 66 },
    {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    }
  );
}
