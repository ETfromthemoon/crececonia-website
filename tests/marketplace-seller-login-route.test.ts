import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { send, queryDatabase } = vi.hoisted(() => ({ send: vi.fn(), queryDatabase: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));
vi.mock("@/lib/database", () => ({ queryDatabase }));

import { POST } from "@/app/api/marketplace/seller/login/route";
import { tokenHash } from "@/lib/marketplace-seller-auth";

const site = "https://www.crececonia.cl";
const request = () => new Request(`${site}/api/marketplace/seller/login`, {
  method: "POST",
  headers: { origin: site },
  body: JSON.stringify({ email: " Autor@Example.cl " }),
});

beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "test");
  vi.stubEnv("MARKETPLACE_SESSION_SECRET", "x".repeat(32));
  vi.stubEnv("MARKETPLACE_SITE_URL", site);
  vi.stubEnv("SITE_URL", "https://other.example.cl");
  queryDatabase.mockResolvedValue([{ attempts: 1 }]);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

it("sends a confirmation link for the reserved token on the marketplace host", async () => {
  send.mockResolvedValue({ data: { id: "test-message" }, error: null });
  expect((await POST(request())).status).toBe(200);
  const message = send.mock.calls[0][0];
  const link = new URL(message.text.match(/https:\/\/\S+/)[0]);
  expect(link.origin).toBe(site);
  const token = new URLSearchParams(link.hash.slice(1)).get("token")!;
  expect(queryDatabase.mock.calls[1][1][1]).toBe(tokenHash(token));
  expect(message.to).toBe("autor@example.cl");
  expect(message.html).toContain('clicktracking="off"');
});

it("reports a rate limit without sending another email", async () => {
  queryDatabase.mockResolvedValueOnce([]);
  expect((await POST(request())).status).toBe(429);
  expect(send).not.toHaveBeenCalled();
});

it("reports an unavailable service when Resend rejects the message", async () => {
  send.mockResolvedValue({ data: null, error: { statusCode: 403 } });
  expect((await POST(request())).status).toBe(503);
});

it("keeps preview registration isolated from the database and email service", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  expect((await POST(request())).status).toBe(404);
  expect(queryDatabase).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
