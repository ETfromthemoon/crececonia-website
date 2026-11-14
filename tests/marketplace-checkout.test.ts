import { describe, expect, it } from "vitest";
import {
  createMarketplaceDownloadToken,
  marketplacePriceSnapshot,
  marketplaceFlowGatewayFee,
  marketplaceSandboxEnabled,
  normalizeBuyerEmail,
  verifyMarketplaceDownloadToken,
} from "../lib/marketplace-checkout";

describe("cobro marketplace", () => {
  it("calcula 5% de comisión sobre el precio CLP y desglosa IVA incluido", () => {
    expect(marketplacePriceSnapshot(11_900, "tax_inclusive")).toEqual({
      price: 11_900, taxMode: "tax_inclusive", tax: 1_900, taxRateBps: 1_900, commission: 595,
    });
    expect(marketplacePriceSnapshot(10_000, "exempt")?.tax).toBe(0);
    expect(marketplacePriceSnapshot(10_000, "pending_review")).toBeNull();
    expect(marketplacePriceSnapshot(1.5, "tax_inclusive")).toBeNull();
  });

  it("registra solo deducciones Flow completas y conciliadas en CLP", () => {
    expect(marketplaceFlowGatewayFee(17_900, { fee: "571.00", taxes: 108, balance: 17_221, currency: "CLP" })).toBe(679);
    expect(marketplaceFlowGatewayFee(17_900, { fee: "571.00", taxes: 108, balance: 17_222, currency: "CLP" })).toBeNull();
    expect(marketplaceFlowGatewayFee(17_900, { fee: "571.50", taxes: 108, balance: 17_221, currency: "CLP" })).toBeNull();
    expect(marketplaceFlowGatewayFee(17_900, { fee: "571.00", balance: 17_329, currency: "CLP" })).toBe(571);
    expect(marketplaceFlowGatewayFee(17_900, { fee: "571.00", currency: "CLP" })).toBeNull();
    expect(marketplaceFlowGatewayFee(17_900, { fee: "571.00", taxes: 108, currency: "USD" })).toBeNull();
  });

  it("permite Flow sólo cuando sandbox y secretos están configurados", () => {
    const env = { ...process.env, VERCEL_ENV: "preview", FLOW_SANDBOX: "true", FLOW_API_KEY: "key", FLOW_SECRET_KEY: "secret", DATABASE_URL: "postgres://test", RESEND_API_KEY: "resend", MARKETPLACE_SITE_URL: "https://marketplace.example.cl", MARKETPLACE_DOWNLOAD_SECRET: "x".repeat(32) };
    expect(marketplaceSandboxEnabled({ ...env, MARKETPLACE_FLOW_SANDBOX_ENABLED: "true" })).toBe(true);
    expect(marketplaceSandboxEnabled({ ...env, FLOW_SANDBOX: "false", MARKETPLACE_FLOW_SANDBOX_ENABLED: "true" })).toBe(false);
    expect(marketplaceSandboxEnabled({ ...env, VERCEL_ENV: "production", MARKETPLACE_FLOW_SANDBOX_ENABLED: "true" })).toBe(false);
    expect(marketplaceSandboxEnabled(env)).toBe(false);
  });

  it("verifica enlaces de descarga y los rechaza tras su vencimiento", () => {
    const itemId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
    const now = Date.now();
    const token = createMarketplaceDownloadToken(itemId, now + 60_000, "secreto");
    expect(verifyMarketplaceDownloadToken(token, "secreto", now)).toBe(itemId);
    expect(verifyMarketplaceDownloadToken(token, "otro", now)).toBeNull();
    expect(verifyMarketplaceDownloadToken(token, "secreto", now + 61_000)).toBeNull();
  });

  it("normaliza el correo del comprador sin aceptar datos malformados", () => {
    expect(normalizeBuyerEmail("  A@Example.CL ")).toBe("a@example.cl");
    expect(normalizeBuyerEmail("sin correo")).toBeNull();
    expect(normalizeBuyerEmail({ email: "a@example.cl" })).toBeNull();
  });
});
