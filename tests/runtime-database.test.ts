import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/admin/runtime-database/route";

describe("GET /api/admin/runtime-database", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = "secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project-ref.supabase.co";
  });

  it("requiere la clave administrativa", async () => {
    const response = await GET(new Request("https://crececonia.cl/api/admin/runtime-database"));
    expect(response.status).toBe(401);
  });

  it("expone sólo el identificador público del proyecto", async () => {
    const response = await GET(new Request("https://crececonia.cl/api/admin/runtime-database?key=secret"));
    expect(await response.json()).toEqual({ projectRef: "project-ref", host: "project-ref.supabase.co" });
  });
});
