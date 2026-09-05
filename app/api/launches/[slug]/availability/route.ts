import { NextResponse } from "next/server";
import { getLaunch } from "@/lib/launches";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const launch = await getLaunch(slug);
  if (!launch || launch.status !== "published") return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  const tier = launch.tiers.find((item) => item.status === "active");
  return NextResponse.json({ slug: launch.slug, status: launch.status, tier: tier ? { label: tier.label, amount: tier.amount_minor, remaining: Math.max(tier.capacity-tier.sold_count-tier.reserved_count,0), currency: launch.currency } : null });
}
