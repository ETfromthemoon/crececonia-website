import { beforeEach, describe, expect, it, vi } from "vitest";

const isAdminRequest = vi.hoisted(() => vi.fn());
const queryDatabase = vi.hoisted(() => vi.fn());
const listPrivateObjects = vi.hoisted(() => vi.fn());
const s3Send = vi.hoisted(() => vi.fn());
const s3Destroy = vi.hoisted(() => vi.fn());
const getMarketplaceFlowHealth = vi.hoisted(() => vi.fn());
const getWorkshopEmailHealth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin-session", () => ({ isAdminRequest }));
vi.mock("@/lib/database", () => ({ queryDatabase }));
vi.mock("@/lib/private-storage", () => ({ listPrivateObjects }));
vi.mock("@/lib/marketplace-flow-health", () => ({ getMarketplaceFlowHealth }));
vi.mock("@/lib/workshop-email-health", () => ({ getWorkshopEmailHealth }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = s3Send; destroy = s3Destroy; },
  PutObjectCommand: class { kind = "put"; constructor(public input: { Body: Uint8Array; Key: string }) {} },
  GetObjectCommand: class { kind = "get"; constructor(public input: { Key: string }) {} },
  DeleteObjectCommand: class { kind = "delete"; constructor(public input: { Key: string }) {} },
}));

import { GET, POST } from "@/app/api/admin/marketplace/health/route";

describe("estado operativo administrativo del marketplace", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    isAdminRequest.mockReset().mockReturnValue(true);
    queryDatabase.mockReset().mockResolvedValue([{ healthy: 1 }]);
    listPrivateObjects.mockReset().mockResolvedValue(["private-buyer-file.pdf"]);
    s3Send.mockReset();
    s3Destroy.mockReset();
    getMarketplaceFlowHealth.mockReset().mockResolvedValue(true);
    getWorkshopEmailHealth.mockReset().mockResolvedValue({ domainReady: true });
    let uploaded: Uint8Array;
    s3Send.mockImplementation(async (command: { kind: string; input: { Body?: Uint8Array } }) => {
      if (command.kind === "put") uploaded = command.input.Body!;
      if (command.kind === "get") return { Body: { transformToByteArray: async () => uploaded } };
      return {};
    });
    vi.stubEnv("STORAGE_S3_ENDPOINT", "https://storage.example.cl");
    vi.stubEnv("STORAGE_S3_BUCKET", "private");
    vi.stubEnv("STORAGE_S3_ACCESS_KEY_ID", "test-key");
    vi.stubEnv("STORAGE_S3_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("MARKETPLACE_HEALTH_SECRET", "h".repeat(40));
  });

  it("rechaza acceso no autorizado antes de consultar servicios", async () => {
    isAdminRequest.mockReturnValue(false);
    const response = await GET(new Request("https://example.cl/api/admin/marketplace/health"));
    expect(response.status).toBe(401);
    expect(queryDatabase).not.toHaveBeenCalled();
    expect(listPrivateObjects).not.toHaveBeenCalled();
  });

  it("comprueba DB y listado privado sin exponer nombres ni secretos", async () => {
    const response = await GET(new Request("https://example.cl/api/admin/marketplace/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ database: true, storage_list: true, storage_upload_configured: true });
    expect(listPrivateObjects).toHaveBeenCalledWith("ebooks", "marketplace/health");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("marca indisponible el almacenamiento sin filtrar el error", async () => {
    listPrivateObjects.mockRejectedValue(new Error("secret storage credential"));
    const response = await GET(new Request("https://example.cl/api/admin/marketplace/health"));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret storage credential");
  });

  it("exige clave de máquina antes de escribir en S3", async () => {
    const response = await POST(new Request("https://example.cl/api/admin/marketplace/health", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(s3Send).not.toHaveBeenCalled();
  });

  it("sube, lee y elimina un objeto aleatorio sin exponer su ruta", async () => {
    const response = await POST(new Request("https://example.cl/api/admin/marketplace/health", {
      method: "POST", headers: { "x-marketplace-health-key": "h".repeat(40) },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ storage_roundtrip: true, cleanup: true, flow: true, email_domain: true });
    expect(s3Send.mock.calls.map(([command]) => command.kind)).toEqual(["put", "get", "delete"]);
    expect(s3Send.mock.calls[0][0].input.Key).toBe(s3Send.mock.calls[2][0].input.Key);
    expect(s3Destroy).toHaveBeenCalledTimes(1);
  });

  it("borra el objeto incluso si falla la lectura", async () => {
    s3Send.mockImplementation(async (command: { kind: string }) => {
      if (command.kind === "get") throw new Error("secret storage failure");
      return {};
    });
    const response = await POST(new Request("https://example.cl/api/admin/marketplace/health", {
      method: "POST", headers: { "x-marketplace-health-key": "h".repeat(40) },
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ storage_roundtrip: false, cleanup: true, flow: true, email_domain: true });
    expect(s3Send.mock.calls.map(([command]) => command.kind)).toEqual(["put", "get", "delete"]);
  });

  it("bloquea la apertura si Flow o el dominio de correo no responden", async () => {
    getMarketplaceFlowHealth.mockResolvedValue(false);
    getWorkshopEmailHealth.mockResolvedValue({ domainReady: false });
    const response = await POST(new Request("https://example.cl/api/admin/marketplace/health", {
      method: "POST", headers: { "x-marketplace-health-key": "h".repeat(40) },
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ storage_roundtrip: true, cleanup: true, flow: false, email_domain: false });
  });
});
