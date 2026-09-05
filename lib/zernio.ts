import "server-only";

const ZERNIO_API_BASE = "https://zernio.com/api/v1";

export type ZernioProfile = { id: string; name: string };
export type ZernioAccount = { id: string; platform: string; username: string; profileId: string | null };

function apiKey(): string {
  const value = process.env.ZERNIO_API_KEY;
  if (!value) throw new Error("ZERNIO_API_KEY no está configurada en el servidor.");
  return value;
}

async function zernioRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ZERNIO_API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null) as (Record<string, unknown> | null);
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : typeof body?.message === "string" ? body.message : `Zernio respondió ${response.status}.`;
    throw new Error(message);
  }
  return body as T;
}

function arrayFrom(body: Record<string, unknown>, key: string): Array<Record<string, unknown>> {
  const direct = body[key];
  if (Array.isArray(direct)) return direct as Array<Record<string, unknown>>;
  const data = body.data;
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[key])) return (data as Record<string, unknown>)[key] as Array<Record<string, unknown>>;
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  return [];
}

export async function getZernioConnection(): Promise<{ profile: ZernioProfile; accounts: ZernioAccount[] }> {
  const [profilesBody, accountsBody] = await Promise.all([
    zernioRequest<Record<string, unknown>>("/profiles"),
    zernioRequest<Record<string, unknown>>("/accounts"),
  ]);
  const profiles = arrayFrom(profilesBody, "profiles").map((item) => ({ id: String(item._id ?? item.id ?? ""), name: String(item.name ?? "Perfil") })).filter((item) => item.id);
  const configuredProfile = process.env.ZERNIO_PROFILE_ID;
  const profile = profiles.find((item) => item.id === configuredProfile) ?? profiles[0];
  if (!profile) throw new Error("Zernio no tiene un perfil disponible.");
  const accounts = arrayFrom(accountsBody, "accounts").map((item) => ({
    id: String(item._id ?? item.id ?? ""), platform: String(item.platform ?? "").toLowerCase(), username: String(item.username ?? item.name ?? "Cuenta"),
    profileId: item.profileId || item.profile_id ? String(item.profileId ?? item.profile_id) : null,
  })).filter((item) => item.id && item.platform && (!item.profileId || item.profileId === profile.id));
  if (!accounts.length) throw new Error("El perfil de Zernio no tiene cuentas sociales conectadas.");
  return { profile, accounts };
}

export async function createZernioPostDraft(input: { title: string; content: string; targets: Array<{ accountId: string; platform: string }> }): Promise<string> {
  const body = await zernioRequest<Record<string, unknown>>("/posts", { method: "POST", body: JSON.stringify({ title: input.title, content: input.content, platforms: input.targets, isDraft: true }) });
  const post = (body.post ?? (body.data as Record<string, unknown> | undefined)?.post ?? body.data) as Record<string, unknown> | undefined;
  const id = String(post?._id ?? post?.id ?? body.id ?? "");
  if (!id) throw new Error("Zernio creó el borrador sin devolver su identificador.");
  return id;
}

export async function createZernioDmAutomation(input: { profileId: string; accountId: string; name: string; keyword: string; dmMessage: string; commentReply: string | null }): Promise<string> {
  const body = await zernioRequest<Record<string, unknown>>("/comment-automations", { method: "POST", body: JSON.stringify({
    profileId: input.profileId, accountId: input.accountId, name: input.name, keywords: [input.keyword], matchMode: "word",
    dmMessage: input.dmMessage, commentReply: input.commentReply || undefined, alsoMatchInDms: true, linkTracking: true,
  }) });
  const automation = (body.automation ?? (body.data as Record<string, unknown> | undefined)?.automation ?? body.data) as Record<string, unknown> | undefined;
  const id = String(automation?._id ?? automation?.id ?? body.id ?? "");
  if (!id) throw new Error("Zernio creó la automatización sin devolver su identificador.");
  return id;
}
