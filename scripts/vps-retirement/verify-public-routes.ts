import catalog from "../../content/public-catalog.json";

const rawBase = process.argv[2];
if (!rawBase || !/^https?:\/\//i.test(rawBase)) {
  console.error("Uso: npm run vps:verify-public -- https://preview.example.com");
  process.exit(2);
}

const base = rawBase.replace(/\/$/, "");
const paths = [
  "/centro/guias",
  "/centro/skills",
  "/recursos/prompt-guia-aprendizaje.html",
  ...catalog.guides.map((guide) => `/guias/${guide.slug}`),
  ...catalog.skills.map((skill) => `/skills/${skill.slug}`),
  ...catalog.skills
    .filter((skill) => skill.archivo_nombre)
    .map((skill) => `/downloads/skills/${skill.archivo_nombre}`),
];

async function main() {
  const failures: Array<{ path: string; status: number | string; detail: string }> = [];
  for (const path of paths) {
    try {
      const response = await fetch(`${base}${path}`, { redirect: "follow" });
      const bytes = (await response.arrayBuffer()).byteLength;
      if (!response.ok || bytes === 0) {
        failures.push({ path, status: response.status, detail: bytes === 0 ? "respuesta vacía" : response.statusText });
      }
    } catch (error) {
      failures.push({ path, status: "network", detail: error instanceof Error ? error.message : String(error) });
    }
  }

  console.log(JSON.stringify({ base, checked: paths.length, passed: paths.length - failures.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

void main();
