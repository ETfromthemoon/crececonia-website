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

export function validateMarketplaceCover(
  bytes: Uint8Array,
  contentType: string,
  expectedSize: string | number,
  expectedSha256: string,
): string | null {
  if (bytes.length < 100 || bytes.length > 4 * 1024 * 1024) return "Tamaño de portada fuera de rango.";
  if (BigInt(bytes.length) !== BigInt(expectedSize)) return "El tamaño no coincide con el registrado.";
  const dimensions = bytes.length >= 24 ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength) : null;
  const png = contentType === "image/png" && dimensions !== null
    && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
    && dimensions.getUint32(16) > 0 && dimensions.getUint32(16) <= 8000
    && dimensions.getUint32(20) > 0 && dimensions.getUint32(20) <= 8000;
  const jpeg = contentType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8
    && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  if (!png && !jpeg) return "El archivo no coincide con una portada PNG o JPG.";
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256.toLowerCase()) return "La huella SHA-256 no coincide.";
  return null;
}
