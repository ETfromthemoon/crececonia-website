import { estimateMarketplacePayout } from "./payout-estimate";

export const MARKETPLACE_COMMISSION_BPS = 900;
export const MARKETPLACE_VAT_BPS = 1_900;
export const MARKETPLACE_SELLER_TERMS_VERSION = "marketplace-v2";

export function marketplaceSaleBreakdown(price: number, taxMode: string) {
  if (!Number.isSafeInteger(price) || price < 1 || price > 10_000_000) return null;
  if (taxMode !== "tax_inclusive" && taxMode !== "exempt") return null;
  const taxRateBps = taxMode === "tax_inclusive" ? MARKETPLACE_VAT_BPS : 0;
  const estimate = estimateMarketplacePayout({ amountClp: price, includesSaleVat: true }, {
    version: MARKETPLACE_SELLER_TERMS_VERSION,
    saleVatBps: taxRateBps,
    commissionBps: MARKETPLACE_COMMISSION_BPS,
    commissionBasis: "sale_net",
    commissionVatBps: MARKETPLACE_VAT_BPS,
    gatewayFeeBps: 0,
    gatewayFixedFeeNetClp: 0,
    gatewayFeeVatBps: null,
    saleVatWithheldClp: 0,
  });
  const { commissionVatClp, commissionTotalEstimateClp } = estimate;
  if (commissionVatClp === null || commissionTotalEstimateClp === null) return null;
  return {
    price, taxMode, taxRateBps, tax: estimate.saleVatClp,
    commissionBasis: estimate.commissionBaseClp,
    commissionNet: estimate.commissionNetClp,
    commissionTax: commissionVatClp,
    // The existing ledger debits the seller for the full service charge.
    commission: commissionTotalEstimateClp,
  };
}
