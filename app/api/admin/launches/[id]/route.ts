import { NextResponse } from "next/server";
import { LAUNCH_STATUSES, LAUNCH_TASK_STATUSES, type LaunchStatus, type LaunchTaskStatus } from "@/lib/launch-model";
import { advanceLaunchTier, createLaunchDmAutomation, createLaunchPublicationDraft, syncLaunchWithZernio, transitionLaunch, updateLaunch, updateLaunchTask } from "@/lib/launches";

export const dynamic = "force-dynamic";
const authorized = (request: Request) => Boolean(process.env.ADMIN_SECRET) && request.headers.get("x-admin-key") === process.env.ADMIN_SECRET;
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const [{ id }, body] = await Promise.all([params, request.json().catch(()=>null)]);
  try {
    if (body?.action === "task") { if (!LAUNCH_TASK_STATUSES.includes(body.status as LaunchTaskStatus)) throw new Error("Estado de tarea inválido."); await updateLaunchTask(id, String(body.taskId), body.status); }
    else if (body?.action === "advance_tier") await advanceLaunchTier(id);
    else if (body?.action === "transition") { if (!LAUNCH_STATUSES.includes(body.status as LaunchStatus)) throw new Error("Estado inválido."); await transitionLaunch(id, body.status); }
    else if (body?.action === "update") await updateLaunch(id, { ctaUrl: body.ctaUrl || null, ctaLabel: String(body.ctaLabel || "Quiero participar").slice(0,80), dmKeyword: body.dmKeyword || null, adCampaignName: body.adCampaignName || null, automationNotes: body.automationNotes || null });
    else if (body?.action === "sync_zernio") await syncLaunchWithZernio(id);
    else if (body?.action === "zernio_post_draft") await createLaunchPublicationDraft(id, { title: String(body.title || ""), content: String(body.content || ""), accountIds: Array.isArray(body.accountIds) ? body.accountIds.map(String) : [] });
    else if (body?.action === "zernio_dm") await createLaunchDmAutomation(id, { accountId: String(body.accountId || ""), keyword: String(body.keyword || ""), dmMessage: String(body.dmMessage || ""), commentReply: body.commentReply ? String(body.commentReply) : null });
    else throw new Error("Operación inválida.");
    return NextResponse.json({ message: "Cambios guardados." });
  } catch (reason) { console.error("[admin/launches/update]", reason); return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo guardar." }, { status: 400 }); }
}
