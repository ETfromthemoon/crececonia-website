import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureServerEvent } = vi.hoisted(() => ({ captureServerEvent: vi.fn() }));

vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));

import { POST } from "@/app/api/public/skills/[slug]/request-download/route";

function request(slug: string) {
  return POST(
    new Request(`https://www.crececonia.cl/api/public/skills/${slug}/request-download`, { method: "POST" }),
    { params: Promise.resolve({ slug }) },
  );
}

describe("descarga de skills sin correo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("entrega el ZIP sin datos personales y cuenta una descarga", async () => {
    const response = await request("captaclientes");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      download_url: "/downloads/skills/captaclientes.zip",
    });
    expect(captureServerEvent).toHaveBeenCalledOnce();
    expect(captureServerEvent).toHaveBeenCalledWith(
      "skill_download_succeeded",
      expect.any(String),
      expect.objectContaining({ slug: "captaclientes", file_type: "zip" }),
    );
  });

  it("no cuenta ni entrega skills inexistentes o sin archivo", async () => {
    expect((await request("inexistente")).status).toBe(404);
    expect((await request("piensa-con-ia-framework-de-7-pasos-para-resolver-cualquier-problema")).status).toBe(404);
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("no bloquea el archivo si la analítica falla", async () => {
    captureServerEvent.mockRejectedValueOnce(new Error("analytics unavailable"));
    const response = await request("captaclientes");
    expect(response.status).toBe(200);
    expect((await response.json()).download_url).toBe("/downloads/skills/captaclientes.zip");
  });
});
