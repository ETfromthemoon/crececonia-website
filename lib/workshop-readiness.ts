import "server-only";
import { getWorkshopAssetStatus, type WorkshopAssetStatus } from "./workshop-asset-storage";
import { getWorkshopSettings, type WorkshopSettings } from "./workshop-settings";
import { EBOOK_FORMATS, EBOOK_STORAGE_BUCKET, storageObjectName } from "./ebook-storage";
import { listPrivateObjects } from "./private-storage";
import { WORKSHOP_EBOOK_RESOURCES } from "./workshop-product";

export type WorkshopReadinessKey = "room" | "recording" | "slides" | "handout" | "skills" | "ebooks" | "skool";

export type WorkshopFulfillmentReadiness = {
  ready: boolean;
  settings: WorkshopSettings;
  assets: WorkshopAssetStatus;
  recordingReachable: boolean;
  missingEbookFiles: string[];
  missing: WorkshopReadinessKey[];
  pending: WorkshopReadinessKey[];
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
  const [settings, assets, ebookFiles] = await Promise.all([
    getWorkshopSettings(),
    getWorkshopAssetStatus(),
    listPrivateObjects(EBOOK_STORAGE_BUCKET).catch(() => [] as string[]),
  ]);
  const recordingReachable = await isWorkshopRecordingPubliclyReachable(settings.recordingUrl);
  const availableEbooks = new Set(ebookFiles);
  const missingEbookFiles = WORKSHOP_EBOOK_RESOURCES.flatMap((resource) =>
    EBOOK_FORMATS.map((format) => storageObjectName(resource, format)).filter((name) => !availableEbooks.has(name))
  );
  const missing: WorkshopReadinessKey[] = [];
  if (!settings.roomEnabled) missing.push("room");
  if (!recordingReachable) missing.push("recording");
  if (!assets.slides) missing.push("slides");
  if (!assets.handout) missing.push("handout");
  if (!assets.skills) missing.push("skills");
  if (missingEbookFiles.length) missing.push("ebooks");
  const pending: WorkshopReadinessKey[] = settings.skoolUrl ? [] : ["skool"];
  return { ready: missing.length === 0, settings, assets, recordingReachable, missingEbookFiles, missing, pending };
}
