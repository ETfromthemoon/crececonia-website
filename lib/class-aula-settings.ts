import { getSupabaseAdmin } from "./supabase";
import { CLASS_PRODUCT_KEY } from "./class-product";

export type ClassAulaSettings = {
  sessionUrl: string;
  whatsappGroupUrl: string;
  recordingUrl: string;
  supportEmail: string;
  classroomEnabled: boolean;
  updatedAt: string | null;
};

type SettingsRow = {
  session_url: string | null;
  whatsapp_group_url: string | null;
  recording_url: string | null;
  support_email: string | null;
  classroom_enabled: boolean | null;
  updated_at: string | null;
};

function environmentFallback(): ClassAulaSettings {
  return {
    sessionUrl: process.env.CLASS_SESSION_URL?.trim() ?? "",
    whatsappGroupUrl: process.env.CLASS_WHATSAPP_GROUP_URL?.trim() ?? "",
    recordingUrl: process.env.CLASS_RECORDING_URL?.trim() ?? "",
    supportEmail: process.env.CLASS_SUPPORT_EMAIL?.trim() || "sergio@crececonia.cl",
    classroomEnabled: true,
    updatedAt: null,
  };
}

export function normalizeClassAulaSettings(row: SettingsRow | null | undefined): ClassAulaSettings {
  const fallback = environmentFallback();
  if (!row) return fallback;

  return {
    sessionUrl: row.session_url?.trim() || fallback.sessionUrl,
    whatsappGroupUrl: row.whatsapp_group_url?.trim() || fallback.whatsappGroupUrl,
    recordingUrl: row.recording_url?.trim() || fallback.recordingUrl,
    supportEmail: row.support_email?.trim() || fallback.supportEmail,
    classroomEnabled: row.classroom_enabled ?? true,
    updatedAt: row.updated_at,
  };
}

/**
 * The database settings are optional during the migration window. The server
 * falls back to the existing Vercel variables so checkout and delivery keep
 * working if the configuration row has not been created yet.
 */
export async function getClassAulaSettings(): Promise<ClassAulaSettings> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .schema("commerce")
      .from("class_aula_settings")
      .select("session_url, whatsapp_group_url, recording_url, support_email, classroom_enabled, updated_at")
      .eq("product_key", CLASS_PRODUCT_KEY)
      .maybeSingle();

    if (error) return environmentFallback();
    return normalizeClassAulaSettings(data as SettingsRow | null);
  } catch {
    return environmentFallback();
  }
}
