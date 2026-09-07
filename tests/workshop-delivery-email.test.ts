import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend, mockSettings } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockSettings: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({
  Resend: vi.fn(function (this: Record<string, unknown>) {
    this.emails = { send: mockSend };
  }),
}));
vi.mock("@/lib/workshop-settings", () => ({ getWorkshopSettings: mockSettings }));

import { sendWorkshopFollowUpEmail } from "@/lib/workshop-delivery-email";

describe("workshop delivery email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WORKSHOP_ACCESS_SECRET = "test-access-secret";
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("explica que SKOOL sigue pendiente sin inventar un enlace", async () => {
    mockSettings.mockResolvedValue({ skoolUrl: "" });

    await sendWorkshopFollowUpEmail({ email: "alumno@test.com", orderId: "workshop-1234567890000-abc123" });

    const html = mockSend.mock.calls[0][0].html as string;
    expect(html).toContain("pendiente de lanzamiento");
    expect(html).not.toContain("Entrar a la comunidad SKOOL");
  });

  it("incluye el enlace directo cuando SKOOL ya fue publicado", async () => {
    mockSettings.mockResolvedValue({ skoolUrl: "https://www.skool.com/crececonia" });

    await sendWorkshopFollowUpEmail({ email: "alumno@test.com", orderId: "workshop-1234567890000-abc123" });

    const html = mockSend.mock.calls[0][0].html as string;
    expect(html).toContain("Entrar a la comunidad SKOOL");
    expect(html).toContain("https://www.skool.com/crececonia");
  });
});
