import "server-only";
import { listPrivateObjects } from "./private-storage";
import { WORKSHOP_ASSETS, WORKSHOP_ASSET_PREFIX, type WorkshopAssetKey } from "./workshop-assets";

export type WorkshopAssetStatus = Record<WorkshopAssetKey, boolean>;

export async function getWorkshopAssetStatus(): Promise<WorkshopAssetStatus> {
  try {
    const objects = new Set(await listPrivateObjects("workshop-assets", WORKSHOP_ASSET_PREFIX));
    return Object.fromEntries(
      Object.entries(WORKSHOP_ASSETS).map(([key, asset]) => [
        key,
        objects.has(asset.storagePath.slice(WORKSHOP_ASSET_PREFIX.length + 1)),
      ])
    ) as WorkshopAssetStatus;
  } catch {
    return { skills: false, slides: false, handout: false };
  }
}
