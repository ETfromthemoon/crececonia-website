import { createHash } from "node:crypto";

export function validateMarketplacePdf(
  bytes: Uint8Array,
  expectedSize: string | number,
  expectedSha256: string,
): string | null {
  if (bytes.length < 100 || bytes.length > 50 * 1024 * 1024) return "Tamaño de PDF fuera de rango.";
  if (BigInt(bytes.length) !== BigInt(expectedSize)) return "El tamaño no coincide con el registrado.";
  if (new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") return "El archivo no empieza como PDF.";
  const tail = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.length - 2048)));
  if (!tail.includes("%%EOF")) return "El PDF no contiene un final válido.";
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256.toLowerCase()) return "La huella SHA-256 no coincide.";
  return null;
}
