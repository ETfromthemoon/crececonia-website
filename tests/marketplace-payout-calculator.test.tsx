import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PayoutCalculator from "@/components/marketplace/PayoutCalculator";

describe("PayoutCalculator", () => {
  it("does not promise a final seller deposit before the Flow fee is known", () => {
    const html = renderToStaticMarkup(<PayoutCalculator initialPrice="1" />);
    expect(html).toContain("Liquidación final al vendedor</dt><dd aria-live=\"polite\">Pendiente de Flow y revisión tributaria");
    expect(html).toContain("Costo real de Flow, a cargo del vendedor</dt><dd>Pendiente del pago");
    expect(html).not.toContain("Depósito ilustrativo al vendedor");
  });
});
