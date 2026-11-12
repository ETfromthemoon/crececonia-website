import { describe, expect, it } from "vitest";
import { estimateMarketplacePayout, type PayoutEstimatePolicy } from "@/lib/marketplace/payout-estimate";

const policy: PayoutEstimatePolicy = {
  version: "example-v1",
  saleVatBps: 1_900,
  commissionBps: 500,
  commissionBasis: "sale_net",
  commissionVatBps: 1_900,
  gatewayFeeBps: 0,
  gatewayFixedFeeNetClp: 300,
  gatewayFeeVatBps: 1_900,
  saleVatWithheldClp: 0,
};

describe("estimateMarketplacePayout", () => {
  it("extracts 19% included in a CLP final price and reconciles the approved example", () => {
    const estimate = estimateMarketplacePayout({ amountClp: 11_900, includesSaleVat: true }, policy);
    expect(estimate.saleGrossClp).toBe(11_900);
    expect(estimate.saleNetClp).toBe(10_000);
    expect(estimate.saleVatClp).toBe(1_900);
    expect(estimate.commissionNetClp).toBe(500);
    expect(estimate.commissionVatClp).toBe(95);
    expect(estimate.gatewayFeeNetEstimateClp).toBe(300);
    expect(estimate.gatewayFeeVatEstimateClp).toBe(57);
    expect(estimate.sellerPayoutEstimateClp).toBe(10_948);
    expect(estimate.sellerSaleVatReserveClp).toBe(1_900);
    expect(estimate.sellerAfterVatReserveEstimateClp).toBe(9_048);
    expect(estimate.saleNetClp + estimate.saleVatClp).toBe(estimate.saleGrossClp);
  });

  it("adds VAT to a net-entered price with exact reconciliation", () => {
    const estimate = estimateMarketplacePayout({ amountClp: 10_000, includesSaleVat: false }, policy);
    expect(estimate.saleNetClp).toBe(10_000);
    expect(estimate.saleVatClp).toBe(1_900);
    expect(estimate.saleGrossClp).toBe(11_900);
  });

  it("uses the supplied policy for a non-taxable sale instead of assuming 19%", () => {
    const estimate = estimateMarketplacePayout(
      { amountClp: 11_900, includesSaleVat: true },
      { ...policy, saleVatBps: 0 },
    );
    expect(estimate.saleNetClp).toBe(11_900);
    expect(estimate.saleVatClp).toBe(0);
  });

  it("does not claim a seller payout while fee VAT treatment is unresolved", () => {
    const estimate = estimateMarketplacePayout(
      { amountClp: 11_900, includesSaleVat: true },
      { ...policy, gatewayFeeVatBps: null },
    );
    expect(estimate.gatewayFeeTotalEstimateClp).toBeNull();
    expect(estimate.sellerPayoutEstimateClp).toBeNull();
    expect(estimate.unresolved).toContain("IVA del costo de pasarela no definido");
  });

  it("subtracts only VAT actually withheld from the payout and reserve", () => {
    const estimate = estimateMarketplacePayout(
      { amountClp: 11_900, includesSaleVat: true },
      { ...policy, saleVatWithheldClp: 400 },
    );
    expect(estimate.saleVatWithheldClp).toBe(400);
    expect(estimate.sellerPayoutEstimateClp).toBe(10_548);
    expect(estimate.sellerSaleVatReserveClp).toBe(1_500);
    expect(estimate.sellerAfterVatReserveEstimateClp).toBe(9_048);
  });

  it("rounds half-up using integer arithmetic", () => {
    const estimate = estimateMarketplacePayout(
      { amountClp: 3, includesSaleVat: false },
      { ...policy, saleVatBps: 1_900, commissionBps: 0, commissionVatBps: 0, gatewayFeeBps: 0, gatewayFixedFeeNetClp: 0, gatewayFeeVatBps: 0 },
    );
    expect(estimate.saleVatClp).toBe(1);
    expect(estimate.saleGrossClp).toBe(4);
  });

  it("rejects invalid values and withheld tax above the transaction VAT", () => {
    expect(() => estimateMarketplacePayout({ amountClp: -1, includesSaleVat: true }, policy)).toThrow(RangeError);
    expect(() => estimateMarketplacePayout(
      { amountClp: 11_900, includesSaleVat: true },
      { ...policy, saleVatWithheldClp: 1_901 },
    )).toThrow(/cannot exceed/);
  });
});
