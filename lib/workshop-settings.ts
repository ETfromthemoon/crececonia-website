import "server-only";
import { getSupabaseAdmin } from "./supabase";
import { WORKSHOP_PRODUCT_KEY } from "./workshop-product";

export type WorkshopSettings = {
  sessionUrl: string;
  recordingUrl: string;
  skoolUrl: string;
  skillsStoragePath: string;
  supportEmail: string;
  roomEnabled: boolean;
  updatedAt: string | null;
};

type SettingsRow = {
  session_url: string | null;
  recording_url: string | null;
  skool_url: string | null;
  skills_storage_path: string | null;
  support_email: string | null;
  room_enabled: boolean | null;
  updated_at: string | null;
};

function fallback(): WorkshopSettings {
  return {
    sessionUrl: process.env.WORKSHOP_SESSION_URL?.trim() ?? "",
    recordingUrl: process.env.WORKSHOP_RECORDING_URL?.trim() ?? "",
    skoolUrl: process.env.WORKSHOP_SKOOL_URL?.trim() ?? "",
    skillsStoragePath: process.env.WORKSHOP_SKILLS_STORAGE_PATH?.trim() ?? "",
    supportEmail: process.env.WORKSHOP_SUPPORT_EMAIL?.trim() || "sergio@crececonia.cl",
    roomEnabled: true,
    updatedAt: null,
  };
}

export function normalizeWorkshopSettings(row?: SettingsRow | null): WorkshopSettings {
  const env = fallback();
  if (!row) return env;
  return {
    sessionUrl: row.session_url?.trim() || env.sessionUrl,
    recordingUrl: row.recording_url?.trim() || env.recordingUrl,
    skoolUrl: row.skool_url?.trim() || env.skoolUrl,
    skillsStoragePath: row.skills_storage_path?.trim() || env.skillsStoragePath,
    supportEmail: row.support_email?.trim() || env.supportEmail,
    roomEnabled: row.room_enabled ?? true,
    updatedAt: row.updated_at,
  };
}

export async function getWorkshopSettings(): Promise<WorkshopSettings> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("get_workshop_settings", {
      p_product_key: WORKSHOP_PRODUCT_KEY,
    });
    if (error) return fallback();
    return normalizeWorkshopSettings((data?.[0] ?? null) as SettingsRow | null);
  } catch {
    return fallback();
  }
}
