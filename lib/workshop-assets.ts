export const WORKSHOP_ASSET_PREFIX = "workshop-2026-09-06";

export const WORKSHOP_ASSETS = {
  skills: {
    label: "Pack de cinco skills",
    storagePath: `${WORKSHOP_ASSET_PREFIX}/crececonia-pack-5-skills.zip`,
    filename: "crececonia-pack-5-skills.zip",
    contentType: "application/zip",
    disposition: "attachment",
  },
  slides: {
    label: "Slides del workshop",
    storagePath: `${WORKSHOP_ASSET_PREFIX}/slides-taller-claude-desktop.html`,
    filename: "slides-taller-claude-desktop.html",
    contentType: "text/html; charset=utf-8",
    disposition: "inline",
  },
  handout: {
    label: "Hoja de trabajo",
    storagePath: `${WORKSHOP_ASSET_PREFIX}/hoja-de-trabajo.md`,
    filename: "hoja-de-trabajo-workshop.md",
    contentType: "text/markdown; charset=utf-8",
    disposition: "attachment",
  },
} as const;

export type WorkshopAssetKey = keyof typeof WORKSHOP_ASSETS;

export function isWorkshopAssetKey(value: string): value is WorkshopAssetKey {
  return Object.prototype.hasOwnProperty.call(WORKSHOP_ASSETS, value);
}
