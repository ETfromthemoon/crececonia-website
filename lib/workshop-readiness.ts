import "server-only";
import { getWorkshopAssetStatus, type WorkshopAssetStatus } from "./workshop-asset-storage";
import { getWorkshopSettings, type WorkshopSettings } from "./workshop-settings";

export type WorkshopReadinessKey = "room" | "recording" | "slides" | "handout" | "skills" | "skool";

export type WorkshopFulfillmentReadiness = {
  ready: boolean;
  settings: WorkshopSettings;
  assets: WorkshopAssetStatus;
  recordingReachable: boolean;
  missing: WorkshopReadinessKey[];
};

const AUTH_HOSTS = new Set(["accounts.google.com"]);

function responseIsPublic(response: Response) {
  if (!response.ok) return false;
  try {
    return !AUTH_HOSTS.has(new URL(response.url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function isWorkshopRecordingPubliclyReachable(url: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const options = { redirect: "follow" as const, signal: AbortSignal.timeout(8_000), cache: "no-store" as const };
    const head = await fetch(parsed, { ...options, method: "HEAD" });
    if (head.status !== 405) return responseIsPublic(head);
    const sample = await fetch(parsed, { ...options, headers: { Range: "bytes=0-0" } });
    return responseIsPublic(sample);
  } catch {
    return false;
  }
}

export async function getWorkshopFulfillmentReadiness(): Promise<WorkshopFulfillmentReadiness> {
  const [settings, assets] = await Promise.all([getWorkshopSettings(), getWorkshopAssetStatus()]);
  const recordingReachable = await isWorkshopRecordingPubliclyReachable(settings.recordingUrl);
  const missing: WorkshopReadinessKey[] = [];
  if (!settings.roomEnabled) missing.push("room");
  if (!recordingReachable) missing.push("recording");
  if (!assets.slides) missing.push("slides");
  if (!assets.handout) missing.push("handout");
  if (!assets.skills) missing.push("skills");
  if (!settings.skoolUrl) missing.push("skool");
  return { ready: missing.length === 0, settings, assets, recordingReachable, missing };
}
