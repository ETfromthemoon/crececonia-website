import "server-only";
import { getActiveCatalogEntries, getCatalogEntry } from "@/lib/ebook-catalog";
import { queryDatabase } from "@/lib/database";
import { buildLaunchTasks, canPublishLaunch, type CreateLaunchInput, type LaunchStatus, type LaunchTaskStatus } from "@/lib/launch-model";
import { createZernioDmAutomation, createZernioPostDraft, getZernioConnection, type ZernioAccount } from "@/lib/zernio";

export type LaunchProduct = { id: string; resource: string; title_snapshot: string; role: string; sort_order: number };
export type LaunchTier = { id: string; label: string; amount_minor: number; capacity: number; sold_count: number; reserved_count: number; sort_order: number; status: "planned" | "active" | "retired" };
export type LaunchTask = { id: string; category: string; task_key: string; title: string; instructions: string; required: boolean; status: LaunchTaskStatus; owner: string; sort_order: number };
export type LaunchPublication = { id: string; title: string; content: string; targets: Array<{ accountId: string; platform: string }>; status: string; zernio_post_id: string | null; zernio_error: string | null; created_at: string | Date };
export type LaunchDmAutomation = { id: string; name: string; account_id: string; platform: string; keyword: string; dm_message: string; comment_reply: string | null; status: string; zernio_automation_id: string | null; zernio_error: string | null; created_at: string | Date };
export type LaunchRecord = {
  id: string; slug: string; name: string; launch_type: string; status: LaunchStatus; headline: string; description: string;
  starts_at: string | Date | null; ends_at: string | Date | null; timezone: string; cta_label: string; cta_url: string | null;
  currency: string; start_price_minor: number | null; price_step_minor: number; tier_capacity: number; source_template: string;
  zernio_required: boolean; zernio_status: "pending" | "connected" | "error" | "ready"; zernio_profile_id: string | null;
  zernio_accounts: ZernioAccount[]; zernio_last_synced_at: string | Date | null; zernio_sync_error: string | null;
  dm_keyword: string | null; ad_campaign_name: string | null; automation_notes: string | null; created_at: string | Date; updated_at: string | Date;
};
export type LaunchDetail = LaunchRecord & { products: LaunchProduct[]; tiers: LaunchTier[]; tasks: LaunchTask[]; publications: LaunchPublication[]; dmAutomations: LaunchDmAutomation[] };

const numberFields = <T extends Record<string, unknown>>(row: T): T => {
  const normalized = { ...row } as Record<string, unknown>;
  for (const key of ["amount_minor", "capacity", "sold_count", "reserved_count", "sort_order", "start_price_minor", "price_step_minor", "tier_capacity", "task_total", "task_ready", "blocked_count"]) {
    if (typeof normalized[key] === "string") normalized[key] = Number(normalized[key]);
  }
  return normalized as T;
};

export async function listLaunches(): Promise<Array<LaunchRecord & { task_total: number; task_ready: number; blocked_count: number }>> {
  const rows = await queryDatabase<LaunchRecord & { task_total: number; task_ready: number; blocked_count: number }>(`
    select l.*,
      count(t.id)::int as task_total,
      count(t.id) filter (where t.status in ('ready','not_applicable'))::int as task_ready,
      count(t.id) filter (where t.status = 'blocked')::int as blocked_count
    from public.launches l left join public.launch_tasks t on t.launch_id = l.id
    group by l.id order by l.created_at desc`);
  return rows.map(numberFields);
}

export async function getLaunch(identifier: string): Promise<LaunchDetail | null> {
  const launches = await queryDatabase<LaunchRecord>(`select * from public.launches where id::text = $1 or slug = $1 limit 1`, [identifier]);
  const launch = launches[0];
  if (!launch) return null;
  const [products, tiers, tasks, publications, dmAutomations] = await Promise.all([
    queryDatabase<LaunchProduct>(`select id, resource, title_snapshot, role, sort_order from public.launch_products where launch_id = $1 order by sort_order`, [launch.id]),
    queryDatabase<LaunchTier>(`select id, label, amount_minor, capacity, sold_count, reserved_count, sort_order, status from public.launch_price_tiers where launch_id = $1 order by sort_order`, [launch.id]),
    queryDatabase<LaunchTask>(`select id, category, task_key, title, instructions, required, status, owner, sort_order from public.launch_tasks where launch_id = $1 order by sort_order`, [launch.id]),
    queryDatabase<LaunchPublication>(`select id,title,content,targets,status,zernio_post_id,zernio_error,created_at from public.launch_publications where launch_id=$1 order by created_at desc`, [launch.id]),
    queryDatabase<LaunchDmAutomation>(`select id,name,account_id,platform,keyword,dm_message,comment_reply,status,zernio_automation_id,zernio_error,created_at from public.launch_dm_automations where launch_id=$1 order by created_at desc`, [launch.id]),
  ]);
  return { ...numberFields(launch), zernio_accounts: Array.isArray(launch.zernio_accounts) ? launch.zernio_accounts : [], products: products.map(numberFields), tiers: tiers.map(numberFields), tasks: tasks.map(numberFields), publications, dmAutomations };
}

export async function createLaunch(input: CreateLaunchInput): Promise<LaunchDetail> {
  const catalog = getActiveCatalogEntries();
  const selected = input.productResources.map((resource) => catalog.find((entry) => entry.resource === resource)).filter(Boolean);
  if (selected.length !== input.productResources.length) throw new Error("Uno de los ebooks seleccionados ya no está disponible.");
  const products = selected.map((entry, index) => ({ resource: entry!.resource, title: entry!.title, role: index === 0 ? "primary" : "included", sortOrder: index }));
  const tasks = buildLaunchTasks(input);
  const tiers = input.startPriceMinor === null ? [] : [0, 1, 2].map((position) => ({
    label: position === 0 ? "Tramo inicial" : `Tramo ${position + 1}`,
    amount: input.startPriceMinor! + input.priceStepMinor * position,
    capacity: input.tierCapacity,
    sortOrder: position,
    status: position === 0 ? "active" : "planned",
  }));
  const rows = await queryDatabase<{ id: string }>(`
    with created as (
      insert into public.launches (slug,name,launch_type,headline,description,starts_at,ends_at,cta_label,cta_url,start_price_minor,price_step_minor,tier_capacity,zernio_status,zernio_profile_id,dm_keyword,ad_campaign_name,automation_notes)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13,$14,$15,$16)
      returning id
    ), products as (
      insert into public.launch_products (launch_id,resource,title_snapshot,role,sort_order)
      select created.id, p.resource, p.title, p.role, p.sort_order from created,
      jsonb_to_recordset($17::jsonb) as p(resource text,title text,role text,sort_order int)
    ), tiers as (
      insert into public.launch_price_tiers (launch_id,label,amount_minor,capacity,sort_order,status)
      select created.id, t.label, t.amount, t.capacity, t.sort_order, t.status from created,
      jsonb_to_recordset($18::jsonb) as t(label text,amount int,capacity int,sort_order int,status text)
    ), tasks as (
      insert into public.launch_tasks (launch_id,category,task_key,title,instructions,required,owner,sort_order)
      select created.id, t.category, t.task_key, t.title, t.instructions, t.required, t.owner, t.sort_order from created,
      jsonb_to_recordset($19::jsonb) as t(category text,task_key text,title text,instructions text,required boolean,owner text,sort_order int)
    ), activity as (
      insert into public.launch_activity (launch_id,event_type,detail) select created.id,'launch_created',jsonb_build_object('source_template','workshop-2026-09-06') from created
    ) select id from created`,
    [input.slug,input.name,input.launchType,input.headline,input.description,input.startsAt,input.endsAt,input.ctaLabel,input.ctaUrl,input.startPriceMinor,input.priceStepMinor,input.tierCapacity,process.env.ZERNIO_PROFILE_ID ?? input.zernioProfileId,input.dmKeyword,input.adCampaignName,input.automationNotes,JSON.stringify(products),JSON.stringify(tiers),JSON.stringify(tasks)]);
  const created = rows[0] && await getLaunch(rows[0].id);
  if (!created) throw new Error("El lanzamiento se creó, pero no pudo volver a cargarse.");
  return created;
}

export async function updateLaunchTask(launchId: string, taskId: string, status: LaunchTaskStatus): Promise<void> {
  const rows = await queryDatabase<{ id: string }>(`update public.launch_tasks set status=$3,updated_at=now() where id=$2 and launch_id=$1 returning id`, [launchId, taskId, status]);
  if (!rows[0]) throw new Error("No se encontró la tarea.");
  await queryDatabase(`insert into public.launch_activity (launch_id,event_type,detail) values ($1,'task_updated',jsonb_build_object('task_id',$2::text,'status',$3::text))`, [launchId, taskId, status]);
}

export async function updateLaunch(launchId: string, values: { ctaUrl?: string | null; ctaLabel?: string; dmKeyword?: string | null; adCampaignName?: string | null; automationNotes?: string | null }): Promise<void> {
  for (const [label, value] of [["El destino del botón", values.ctaUrl]] as const) {
    if (!value) continue;
    try { const parsed = new URL(value); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); }
    catch { throw new Error(`${label} debe ser una URL http o https válida.`); }
  }
  await queryDatabase(`update public.launches set cta_url=$2,cta_label=$3,dm_keyword=$4,ad_campaign_name=$5,automation_notes=$6,updated_at=now() where id=$1`, [launchId, values.ctaUrl ?? null, values.ctaLabel || "Quiero participar", values.dmKeyword ?? null, values.adCampaignName ?? null, values.automationNotes ?? null]);
  await queryDatabase(`insert into public.launch_activity (launch_id,event_type) values ($1,'configuration_updated')`, [launchId]);
}

export async function advanceLaunchTier(launchId: string): Promise<void> {
  const rows = await queryDatabase<{ next_id: string }>(`with current as (
      select id,sort_order from public.launch_price_tiers where launch_id=$1 and status='active' for update
    ), next as (
      select t.id from public.launch_price_tiers t,current c where t.launch_id=$1 and t.status='planned' and t.sort_order>c.sort_order order by t.sort_order limit 1
    ), retired as (update public.launch_price_tiers set status='retired',updated_at=now() where id=(select id from current))
    update public.launch_price_tiers set status='active',updated_at=now() where id=(select id from next) returning id as next_id`, [launchId]);
  if (!rows[0]) throw new Error("No existe un tramo siguiente disponible.");
  await queryDatabase(`insert into public.launch_activity (launch_id,event_type) values ($1,'price_tier_advanced')`, [launchId]);
}

export async function transitionLaunch(launchId: string, status: LaunchStatus): Promise<void> {
  const launch = await getLaunch(launchId);
  if (!launch) throw new Error("No se encontró el lanzamiento.");
  if (status === "ready" || status === "published") {
    const readiness = canPublishLaunch(launch);
    if (!readiness.ok) throw new Error(readiness.reasons.join(" "));
  }
  await queryDatabase(`update public.launches set status=$2,published_at=case when $2='published' then coalesce(published_at,now()) else published_at end,zernio_status=case when $2 in ('ready','published') then 'ready' else zernio_status end,updated_at=now() where id=$1`, [launchId, status]);
  await queryDatabase(`insert into public.launch_activity (launch_id,event_type,detail) values ($1,'status_changed',jsonb_build_object('status',$2::text))`, [launchId, status]);
}

export async function syncLaunchWithZernio(launchId: string): Promise<void> {
  try {
    const connection = await getZernioConnection();
    await queryDatabase(`update public.launches set zernio_profile_id=$2,zernio_accounts=$3::jsonb,zernio_status='connected',zernio_last_synced_at=now(),zernio_sync_error=null,updated_at=now() where id=$1`, [launchId, connection.profile.id, JSON.stringify(connection.accounts)]);
    await queryDatabase(`update public.launch_tasks set status='ready',updated_at=now() where launch_id=$1 and task_key='zernio-connection'`, [launchId]);
    await queryDatabase(`insert into public.launch_activity (launch_id,event_type,detail) values ($1,'zernio_synced',jsonb_build_object('profile_id',$2::text,'accounts',$3::int))`, [launchId, connection.profile.id, connection.accounts.length]);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "No se pudo conectar con Zernio.";
    await queryDatabase(`update public.launches set zernio_status='error',zernio_sync_error=$2,updated_at=now() where id=$1`, [launchId, message]);
    throw reason;
  }
}

export async function createLaunchPublicationDraft(launchId: string, input: { title: string; content: string; accountIds: string[] }): Promise<void> {
  const launch = await getLaunch(launchId); if (!launch) throw new Error("No se encontró el lanzamiento.");
  if (input.title.trim().length < 3 || !input.content.trim()) throw new Error("Completa el título y el contenido.");
  const title = input.title.trim().slice(0, 180); const content = input.content.trim().slice(0, 10000);
  const targets = launch.zernio_accounts.filter((account) => input.accountIds.includes(account.id)).map((account) => ({ accountId: account.id, platform: account.platform }));
  if (!targets.length) throw new Error("Selecciona al menos una cuenta conectada.");
  const local = await queryDatabase<{ id: string }>(`insert into public.launch_publications (launch_id,title,content,targets) values ($1,$2,$3,$4::jsonb) returning id`, [launchId, title, content, JSON.stringify(targets)]);
  if (!local[0]) throw new Error("No se pudo registrar el borrador localmente.");
  try {
    const postId = await createZernioPostDraft({ title, content, targets });
    await queryDatabase(`update public.launch_publications set status='synced',zernio_post_id=$2,updated_at=now() where id=$1`, [local[0].id, postId]);
    await queryDatabase(`update public.launch_tasks set status='ready',updated_at=now() where launch_id=$1 and task_key='publication-plan'`, [launchId]);
    await queryDatabase(`insert into public.launch_activity (launch_id,event_type,detail) values ($1,'zernio_post_draft_created',jsonb_build_object('post_id',$2::text))`, [launchId, postId]);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "No se pudo crear el borrador.";
    await queryDatabase(`update public.launch_publications set status='failed',zernio_error=$2,updated_at=now() where id=$1`, [local[0].id, message]); throw reason;
  }
}

export async function createLaunchDmAutomation(launchId: string, input: { accountId: string; keyword: string; dmMessage: string; commentReply: string | null }): Promise<void> {
  const launch = await getLaunch(launchId); if (!launch || !launch.zernio_profile_id) throw new Error("Sincroniza Zernio antes de crear el flujo de DM.");
  const account = launch.zernio_accounts.find((item) => item.id === input.accountId && ["instagram","facebook"].includes(item.platform));
  if (!account) throw new Error("Selecciona una cuenta de Instagram o Facebook conectada.");
  const keyword = input.keyword.trim().replace(/\s+/g," ").slice(0,80); const dmMessage = input.dmMessage.trim().slice(0,1000);
  if (!keyword || !dmMessage) throw new Error("Completa la palabra clave y el mensaje directo.");
  const name = `${launch.name} · ${keyword}`.slice(0,180);
  const local = await queryDatabase<{ id: string }>(`insert into public.launch_dm_automations (launch_id,name,account_id,platform,keyword,dm_message,comment_reply) values ($1,$2,$3,$4,$5,$6,$7) returning id`, [launchId,name,account.id,account.platform,keyword,dmMessage,input.commentReply?.trim().slice(0,500) || null]);
  if (!local[0]) throw new Error("No se pudo registrar la automatización localmente.");
  try {
    const automationId = await createZernioDmAutomation({ profileId: launch.zernio_profile_id, accountId: account.id, name, keyword, dmMessage, commentReply: input.commentReply });
    await queryDatabase(`update public.launch_dm_automations set status='active',zernio_automation_id=$2,updated_at=now() where id=$1`, [local[0].id, automationId]);
    await queryDatabase(`update public.launch_tasks set status='ready',updated_at=now() where launch_id=$1 and task_key='dm-flow'`, [launchId]);
    await queryDatabase(`insert into public.launch_activity (launch_id,event_type,detail) values ($1,'zernio_dm_automation_created',jsonb_build_object('automation_id',$2::text))`, [launchId, automationId]);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "No se pudo crear la automatización.";
    await queryDatabase(`update public.launch_dm_automations set status='failed',zernio_error=$2,updated_at=now() where id=$1`, [local[0].id, message]); throw reason;
  }
}

export function launchDefaultCta(launch: LaunchDetail): string | null {
  if (launch.cta_url) return launch.cta_url;
  return launch.products[0] ? getCatalogEntry(launch.products[0].resource)?.href ?? null : null;
}
