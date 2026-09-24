import { NextResponse } from "next/server";
import { getPublicSkill } from "@/lib/public-catalog";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!getPublicSkill(slug)) return NextResponse.json({ detail: "Skill no encontrada." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
