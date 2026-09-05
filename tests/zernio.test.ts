import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createZernioDmAutomation, createZernioPostDraft, getZernioConnection } = await import("@/lib/zernio");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("integración con Zernio", () => {
  it("sincroniza el perfil configurado y sólo sus cuentas", async () => {
    vi.stubEnv("ZERNIO_API_KEY", "zernio_test");
    vi.stubEnv("ZERNIO_PROFILE_ID", "profile-1");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ profiles: [{ _id: "profile-1", name: "CrececonIA" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accounts: [{ _id: "ig-1", platform: "instagram", username: "crececoniacl", profileId: "profile-1" }, { _id: "other", platform: "tiktok", username: "otro", profileId: "profile-2" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getZernioConnection()).resolves.toEqual({ profile: { id: "profile-1", name: "CrececonIA" }, accounts: [{ id: "ig-1", platform: "instagram", username: "crececoniacl", profileId: "profile-1" }] });
  });

  it("crea publicaciones siempre como borradores", async () => {
    vi.stubEnv("ZERNIO_API_KEY", "zernio_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ post: { _id: "post-1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createZernioPostDraft({ title: "Publicación", content: "Contenido", targets: [{ accountId: "ig-1", platform: "instagram" }] })).resolves.toBe("post-1");
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ isDraft: true });
    expect(JSON.parse(String(request.body))).not.toHaveProperty("publishNow");
  });

  it("activa el flujo de palabra clave con DM y seguimiento", async () => {
    vi.stubEnv("ZERNIO_API_KEY", "zernio_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ automation: { _id: "auto-1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createZernioDmAutomation({ profileId: "profile-1", accountId: "ig-1", name: "Lanzamiento", keyword: "AGENTES", dmMessage: "Aquí está", commentReply: "Te escribí" })).resolves.toBe("auto-1");
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body).toMatchObject({ keywords: ["AGENTES"], matchMode: "word", alsoMatchInDms: true, linkTracking: true });
  });

  it("rechaza operaciones si falta la credencial del servidor", async () => {
    vi.stubEnv("ZERNIO_API_KEY", "");
    await expect(getZernioConnection()).rejects.toThrow(/ZERNIO_API_KEY/);
  });
});
