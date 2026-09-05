export const LAUNCH_TYPES = ["event", "ebook_release", "campaign"] as const;
export const LAUNCH_STATUSES = ["draft", "planning", "ready", "published", "completed", "archived"] as const;
export const LAUNCH_TASK_STATUSES = ["pending", "ready", "blocked", "not_applicable"] as const;

export type LaunchType = (typeof LAUNCH_TYPES)[number];
export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];
export type LaunchTaskStatus = (typeof LAUNCH_TASK_STATUSES)[number];

export type LaunchTaskTemplate = {
  category: "cerneo" | "publications" | "dm" | "ads" | "automation" | "delivery" | "analytics";
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
  cerneoProjectUrl: string | null;
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
  assertWebUrl(optionalText("cerneoProjectUrl", 500), "El enlace de CERNEO");
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
    cerneoProjectUrl: optionalText("cerneoProjectUrl", 500),
  };
}

export function buildLaunchTasks(input: Pick<CreateLaunchInput, "name" | "slug" | "dmKeyword" | "adCampaignName">): LaunchTaskTemplate[] {
  const keyword = input.dmKeyword || `[definir palabra clave para ${input.slug}]`;
  const campaign = input.adCampaignName || `[definir campaña para ${input.slug}]`;
  return [
    { category: "cerneo", taskKey: "cerneo-project", title: "Coordinar el proyecto en CERNEO", instructions: `Crear o vincular “${input.name}” en CERNEO. Registrar objetivo, audiencia, oferta, fechas, responsables, productos, hitos y enlaces. CERNEO debe ser la fuente de coordinación de publicaciones, DM, anuncios y automatizaciones.`, required: true, owner: "CERNEO", sortOrder: 10 },
    { category: "publications", taskKey: "publication-plan", title: "Programar publicaciones", instructions: "Definir en CERNEO calendario, canales, piezas, responsables, estados de aprobación, enlaces y UTM para cada publicación orgánica.", required: true, owner: "CERNEO", sortOrder: 20 },
    { category: "dm", taskKey: "dm-flow", title: "Configurar captación por DM", instructions: `Documentar y activar en CERNEO el flujo de DM: palabra clave “${keyword}”, respuesta inicial, calificación, entrega del enlace, seguimiento y derivación humana.`, required: true, owner: "CERNEO", sortOrder: 30 },
    { category: "ads", taskKey: "ads-flow", title: "Configurar anuncios", instructions: `Crear o vincular la campaña “${campaign}” en CERNEO. Registrar audiencias, creatividades, presupuesto, aprobaciones, URL/UTM y eventos de conversión.`, required: true, owner: "CERNEO", sortOrder: 40 },
    { category: "automation", taskKey: "automation-flow", title: "Probar automatizaciones", instructions: "Probar de punta a punta registro/checkout, confirmación, correo o acceso, recordatorios, recuperación y alertas. Guardar evidencia y responsable en CERNEO.", required: true, owner: "CERNEO", sortOrder: 50 },
    { category: "delivery", taskKey: "delivery-assets", title: "Confirmar entrega y productos", instructions: "Verificar que todos los ebooks/recursos seleccionados estén disponibles, sus enlaces funcionen y la promesa de entrega coincida con la página.", required: true, owner: "CERNEO", sortOrder: 60 },
    { category: "analytics", taskKey: "analytics", title: "Validar medición", instructions: "Validar pageview, CTA, inicio, compra/registro y entrega. Confirmar PostHog, Meta Pixel/CAPI y UTMs donde corresponda.", required: true, owner: "CERNEO", sortOrder: 70 },
  ];
}

export function canPublishLaunch(launch: { cta_url: string | null; products: unknown[]; tasks: Array<{ required: boolean; status: LaunchTaskStatus }> }): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!launch.cta_url && launch.products.length === 0) reasons.push("Falta un destino para el botón principal.");
  const pending = launch.tasks.filter((task) => task.required && task.status !== "ready").length;
  if (pending) reasons.push(`Quedan ${pending} tareas obligatorias sin aprobar.`);
  return { ok: reasons.length === 0, reasons };
}
