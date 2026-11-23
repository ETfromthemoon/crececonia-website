import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ pathname: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
import ChatWidget from "@/components/ChatWidget";

describe("commercial widget boundary", () => {
  it.each(["/admin", "/admin/ebook", "/admin/login", "/admin/postulaciones"])("does not render a commercial widget at %s", (pathname) => {
    route.pathname = pathname;
    expect(renderToStaticMarkup(<ChatWidget />)).toBe("");
  });
  it("keeps the widget available on public service pages", () => {
    route.pathname = "/mentoria";
    expect(renderToStaticMarkup(<ChatWidget />)).toContain("button");
  });
});
