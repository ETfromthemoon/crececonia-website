import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { zipSync } from "fflate";
import { listPrivateObjects, uploadPrivateObject } from "../lib/private-storage";

const source = join(process.cwd(), "private", "workshop-skills-2026-09-06");
const storagePath = "workshop-2026-09-06/crececonia-pack-5-skills.zip";

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
  const { error } = await uploadPrivateObject("workshop-assets", storagePath, zip, "application/zip");
  if (error) throw new Error(error.message);
  const objects = await listPrivateObjects("workshop-assets", "workshop-2026-09-06");
  if (!objects.includes("crececonia-pack-5-skills.zip")) throw new Error("El ZIP se subió, pero no pudo verificarse.");
  console.log(`OK · ${skills.length} skills · ${Object.keys(files).length} archivos · ${zip.byteLength} bytes · ${storagePath}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
