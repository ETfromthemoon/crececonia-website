export const LAUNCH_TYPES = ["event", "ebook_release", "campaign"] as const;
export const LAUNCH_STATUSES = ["draft", "planning", "ready", "published", "completed", "archived"] as const;
export const LAUNCH_TASK_STATUSES = ["pending", "ready", "blocked", "not_applicable"] as const;

export type LaunchType = (typeof LAUNCH_TYPES)[number];
export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];
export type LaunchTaskStatus = (typeof LAUNCH_TASK_STATUSES)[number];

export type LaunchTaskTemplate = {
  category: "zernio" | "publications" | "dm" | "ads" | "automation" | "delivery" | "analytics";
  taskKey: string;
  title: string;
  instructions: string;
  required: boolean;
  owner: string;
  sortOrder: number;
};

export type CreateLaunchInput = {
  name: string;
  slug: string;
  launchType: LaunchType;
  headline: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  ctaLabel: string;
  ctaUrl: string | null;
  startPriceMinor: number | null;
  priceStepMinor: number;
  tierCapacity: number;
  productResources: string[];
  dmKeyword: string | null;
  adCampaignName: string | null;
  automationNotes: string | null;
  zernioProfileId: string | null;
};

export function slugifyLaunch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function parseCreateLaunchInput(value: unknown): CreateLaunchInput {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (key: string, max: number) => typeof body[key] === "string" ? body[key].trim().slice(0, max) : "";
  const optionalText = (key: string, max: number) => text(key, max) || null;
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const parsed = Number(body[key]);
    return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
  };
  const name = text("name", 140);
  const slug = slugifyLaunch(text("slug", 100) || name);
  const launchType = LAUNCH_TYPES.includes(body.launchType as LaunchType) ? body.launchType as LaunchType : "event";
  if (name.length < 3) throw new Error("Escribe un nombre de al menos 3 caracteres.");
  if (slug.length < 3) throw new Error("El identificador del lanzamiento no es válido.");
  const productResources = Array.isArray(body.productResources)
    ? [...new Set(body.productResources.filter((item): item is string => typeof item === "string" && item.startsWith("ebook:")).slice(0, 30))]
    : [];
  const startPrice = body.startPriceMinor === null || body.startPriceMinor === undefined || body.startPriceMinor === "" ? null : integer("startPriceMinor", -1, 0, 100_000_000);
  if (startPrice === -1) throw new Error("El precio inicial no es válido.");
  const startsAt = optionalText("startsAt", 40);
  const endsAt = optionalText("endsAt", 40);
  if (startsAt && Number.isNaN(Date.parse(startsAt))) throw new Error("La fecha de inicio no es válida.");
  if (endsAt && Number.isNaN(Date.parse(endsAt))) throw new Error("La fecha de término no es válida.");
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error("El término debe ser posterior al inicio.");
  const assertWebUrl = (url: string | null, label: string) => {
    if (!url) return;
    try { const parsed = new URL(url); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); }
    catch { throw new Error(`${label} debe ser una URL http o https válida.`); }
  };
  assertWebUrl(optionalText("ctaUrl", 500), "El destino del botón");
  return {
    name, slug, launchType,
    headline: text("headline", 220) || name,
    description: text("description", 2000),
    startsAt, endsAt,
    ctaLabel: text("ctaLabel", 80) || "Quiero participar",
    ctaUrl: optionalText("ctaUrl", 500),
    startPriceMinor: startPrice,
    priceStepMinor: integer("priceStepMinor", 5000, 0, 100_000_000),
    tierCapacity: integer("tierCapacity", 5, 1, 1_000_000),
    productResources,
    dmKeyword: optionalText("dmKeyword", 80),
    adCampaignName: optionalText("adCampaignName", 160),
    automationNotes: optionalText("automationNotes", 2000),
    zernioProfileId: optionalText("zernioProfileId", 100),
  };
}

export function buildLaunchTasks(input: Pick<CreateLaunchInput, "name" | "slug" | "dmKeyword" | "adCampaignName">): LaunchTaskTemplate[] {
  const keyword = input.dmKeyword || `[definir palabra clave para ${input.slug}]`;
  const campaign = input.adCampaignName || `[definir campaña para ${input.slug}]`;
  return [
    { category: "zernio", taskKey: "zernio-connection", title: "Conectar el lanzamiento con Zernio", instructions: `Sincronizar “${input.name}” con el perfil de CrececonIA en Zernio y comprobar la salud de todas las cuentas sociales seleccionadas.`, required: true, owner: "Zernio", sortOrder: 10 },
    { category: "publications", taskKey: "publication-plan", title: "Crear publicaciones en Zernio", instructions: "Preparar los borradores en Zernio con canal, cuenta, fecha, pieza, CTA y UTM. Publicar sólo después de aprobar cada contenido.", required: true, owner: "Zernio", sortOrder: 20 },
    { category: "dm", taskKey: "dm-flow", title: "Activar captación por DM en Zernio", instructions: `Crear una automatización comentario/DM en Zernio para la palabra clave “${keyword}”, con respuesta, enlace rastreable y seguimiento.`, required: true, owner: "Zernio", sortOrder: 30 },
    { category: "ads", taskKey: "ads-flow", title: "Preparar anuncios en Zernio", instructions: `Crear o vincular la campaña “${campaign}” en Zernio. Los anuncios deben quedar pausados hasta aprobar presupuesto, audiencia, creatividad y medición.`, required: true, owner: "Zernio", sortOrder: 40 },
    { category: "automation", taskKey: "automation-flow", title: "Probar automatizaciones", instructions: "Probar de punta a punta registro/checkout, confirmación, correo o acceso, recordatorios, recuperación y alertas; registrar evidencia junto al lanzamiento.", required: true, owner: "Zernio", sortOrder: 50 },
    { category: "delivery", taskKey: "delivery-assets", title: "Confirmar entrega y productos", instructions: "Verificar que todos los ebooks/recursos seleccionados estén disponibles, sus enlaces funcionen y la promesa de entrega coincida con la página.", required: true, owner: "Zernio", sortOrder: 60 },
    { category: "analytics", taskKey: "analytics", title: "Validar medición", instructions: "Validar métricas de publicaciones y DM en Zernio, además de pageview, CTA, compra/registro, PostHog, Meta Pixel/CAPI y UTMs.", required: true, owner: "Zernio", sortOrder: 70 },
  ];
}

export function canPublishLaunch(launch: { cta_url: string | null; products: unknown[]; zernio_status?: string; tasks: Array<{ required: boolean; status: LaunchTaskStatus }> }): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!launch.cta_url && launch.products.length === 0) reasons.push("Falta un destino para el botón principal.");
  if (launch.zernio_status && !["connected", "ready"].includes(launch.zernio_status)) reasons.push("Falta sincronizar correctamente el perfil de Zernio.");
  const pending = launch.tasks.filter((task) => task.required && task.status !== "ready").length;
  if (pending) reasons.push(`Quedan ${pending} tareas obligatorias sin aprobar.`);
  return { ok: reasons.length === 0, reasons };
}
