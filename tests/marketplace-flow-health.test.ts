import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryDatabase = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase }));

import { getMarketplaceFlowHealth } from "@/lib/marketplace-flow-health";

describe("comprobación de Flow para abrir el marketplace", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("FLOW_API_KEY", "test-api-key");
    vi.stubEnv("FLOW_SECRET_KEY", "test-secret-key");
    vi.stubEnv("FLOW_SANDBOX", "false");
    queryDatabase.mockReset().mockResolvedValue([{ flow_token: "known-paid-token" }]);
    fetchMock.mockReset().mockResolvedValue(Response.json({
      status: 2, payer: "buyer@example.cl", amount: "11900", flowOrder: 12345,
      commerceOrder: "existing-ebook-order",
    }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("verifica un pago previo de la misma cuenta sin crear otro cobro", async () => {
    expect(await getMarketplaceFlowHealth()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.origin).toBe("https://www.flow.cl");
    expect(url.pathname).toBe("/api/payment/getStatus");
    expect(url.searchParams.get("token")).toBe("known-paid-token");
  });

  it("falla cerrado si faltan credenciales o se apunta al sandbox", async () => {
    vi.stubEnv("FLOW_SANDBOX", "true");
    expect(await getMarketplaceFlowHealth()).toBe(false);
    expect(queryDatabase).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falla cerrado si Flow no confirma el contrato requerido", async () => {
    fetchMock.mockResolvedValue(Response.json({ status: 1 }));
    expect(await getMarketplaceFlowHealth()).toBe(false);
  });
});
