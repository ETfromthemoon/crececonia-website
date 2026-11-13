import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PayoutCalculator from "@/components/marketplace/PayoutCalculator";

describe("PayoutCalculator", () => {
  it("does not present a negative settlement as a seller deposit", () => {
    const html = renderToStaticMarkup(<PayoutCalculator initialPrice="1" />);
    expect(html).toContain("Sin depósito positivo: Déficit de");
    expect(html).not.toContain("Depósito ilustrativo al vendedor</dt><dd aria-live=\"polite\">-$");
  });
});
