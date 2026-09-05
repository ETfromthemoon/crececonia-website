import { NextResponse } from "next/server";
import { createLaunch } from "@/lib/launches";
import { parseCreateLaunchInput } from "@/lib/launch-model";

export const dynamic = "force-dynamic";
const authorized = (request: Request) => Boolean(process.env.ADMIN_SECRET) && request.headers.get("x-admin-key") === process.env.ADMIN_SECRET;
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try { const launch = await createLaunch(parseCreateLaunchInput(await request.json().catch(()=>null))); return NextResponse.json({ launch }, { status: 201 }); }
  catch (reason) { console.error("[admin/launches/create]", reason); const message = reason instanceof Error ? reason.message : "No se pudo crear."; return NextResponse.json({ error: message.includes("unique") ? "Ya existe un lanzamiento con ese identificador." : message }, { status: 400 }); }
}
