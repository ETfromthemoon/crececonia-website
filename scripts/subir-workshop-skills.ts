import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { zipSync } from "fflate";
import { listPrivateObjects, uploadPrivateObject } from "../lib/private-storage";
import { WORKSHOP_ASSETS, WORKSHOP_ASSET_PREFIX } from "../lib/workshop-assets";

const source = join(process.cwd(), "private", "workshop-skills-2026-09-06");
const workshopSource = join(process.cwd(), "private", "workshop-2026-09-06");

async function collect(directory: string, files: Record<string, Uint8Array>) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute, files);
    else files[relative(source, absolute).split(sep).join("/")] = new Uint8Array(await readFile(absolute));
  }
}

async function main() {
  const skills = (await readdir(source, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  if (skills.length !== 5) throw new Error(`Se esperaban exactamente 5 carpetas de skills en ${source}; se encontraron ${skills.length}.`);
  for (const skill of skills) {
    const entries = await readdir(join(source, skill.name));
    if (!entries.some((name) => name.toLowerCase() === "skill.md")) throw new Error(`${skill.name} no contiene SKILL.md.`);
  }
  const files: Record<string, Uint8Array> = {};
  await collect(source, files);
  const zip = zipSync(files, { level: 9 });
  const uploads = [
    { ...WORKSHOP_ASSETS.skills, body: zip },
    { ...WORKSHOP_ASSETS.slides, body: new Uint8Array(await readFile(join(workshopSource, "slides-taller-claude-desktop.html"))) },
    { ...WORKSHOP_ASSETS.handout, body: new Uint8Array(await readFile(join(workshopSource, "HANDOUT-ALUMNOS.md"))) },
  ];
  for (const asset of uploads) {
    const { error } = await uploadPrivateObject("workshop-assets", asset.storagePath, asset.body, asset.contentType);
    if (error) throw new Error(`${asset.label}: ${error.message}`);
  }
  const objects = await listPrivateObjects("workshop-assets", WORKSHOP_ASSET_PREFIX);
  const expected = uploads.map((asset) => asset.storagePath.slice(WORKSHOP_ASSET_PREFIX.length + 1));
  const missing = expected.filter((name) => !objects.includes(name));
  if (missing.length) throw new Error(`La subida terminó, pero faltan estos objetos: ${missing.join(", ")}`);
  console.log(`OK · ${skills.length} skills · ${Object.keys(files).length} archivos internos · 3 recursos verificados en Storage.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
