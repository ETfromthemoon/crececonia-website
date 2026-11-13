import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
import MentoriaPage, { metadata as mentoriaMetadata } from "@/app/mentoria/page";
import ImplementacionPage, { metadata as implementacionMetadata } from "@/app/implementacion/page";
import SelectorPage from "@/app/ia/page";
import { SERVICE_OFFERS } from "@/lib/service-offers";

describe("commercial terms across public entry points", () => {
  it.each([
    ["mentoria", MentoriaPage, mentoriaMetadata],
    ["implementacion", ImplementacionPage, implementacionMetadata],
  ] as const)("keeps %s selector, landing, form and structured price aligned", (service, Page, metadata) => {
    const offer = SERVICE_OFFERS[service];
    const html = renderToStaticMarkup(<Page />);
    expect(renderToStaticMarkup(<SelectorPage />)).toContain(offer.investment);
    expect(metadata.description).toContain(offer.investment);
    expect(html).toContain(offer.investment);
    expect(html).toContain(offer.confirmation);
    expect(html).toContain(offer.conditions);
    const script = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();
    const json = JSON.parse(script!);
    expect(json.offers.priceSpecification.minPrice).toBe(offer.minimumPrice);
    expect(json.offers.priceSpecification.description).toBe(`${offer.investment}.`);
  });
});
