/**
 * Pure CLP marketplace estimate. This module does not decide which transactions
 * are taxable: callers must provide the currently approved, versioned policy.
 * All money is integer CLP and all percentage rates use basis points.
 */

export type PriceInput =
  | { amountClp: number; includesSaleVat: true }
  | { amountClp: number; includesSaleVat: false };

export interface PayoutEstimatePolicy {
  /** Immutable identifier for the business/tax assumptions used in a quote. */
  version: string;
  /** 1,900 is a hypothetical/general 19% rate, not a classification decision. */
  saleVatBps: number;
  commissionBps: number;
  commissionBasis: "sale_net" | "sale_gross";
  /** Null means this policy has not established VAT treatment for the fee. */
  commissionVatBps: number | null;
  /** Provider fee is estimated as a percent of gross plus a fixed net fee. */
  gatewayFeeBps: number;
  gatewayFixedFeeNetClp: number;
  /** Null means gateway fee VAT is unknown and must be shown as unresolved. */
  gatewayFeeVatBps: number | null;
  /** Only non-zero when provider contract confirms it is withheld at settlement. */
  saleVatWithheldClp: number;
}

export interface PayoutEstimate {
  policyVersion: string;
  saleGrossClp: number;
  saleNetClp: number;
  saleVatClp: number;
  commissionBaseClp: number;
  commissionNetClp: number;
  commissionVatClp: number | null;
  commissionTotalEstimateClp: number | null;
  gatewayFeeNetEstimateClp: number;
  gatewayFeeVatEstimateClp: number | null;
  gatewayFeeTotalEstimateClp: number | null;
  /** Estimated payment-provider settlement before any seller tax reserve. */
  sellerPayoutEstimateClp: number | null;
  /** Informational reserve only; it is not money withheld by the platform. */
  sellerSaleVatReserveClp: number;
  saleVatWithheldClp: number;
  /** Payout minus a conservative VAT reserve, not final taxable profit. */
  sellerAfterVatReserveEstimateClp: number | null;
  unresolved: string[];
}

const BPS = BigInt(10_000);
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function positiveInteger(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  return BigInt(value);
}

function validRate(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0 || value > 100_000) {
    throw new RangeError(`${name} must be between 0 and 100000 basis points`);
  }
  return BigInt(value);
}

/** Half-up rounding for non-negative integer ratios, without floating point. */
function roundRatio(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt(2)) / denominator;
}

function toClp(value: bigint, name: string): number {
  if (value > MAX_SAFE_BIGINT) throw new RangeError(`${name} exceeds safe CLP range`);
  return Number(value);
}

export function estimateMarketplacePayout(
  price: PriceInput,
  policy: PayoutEstimatePolicy,
): PayoutEstimate {
  if (!policy.version.trim()) throw new TypeError("policy.version is required");
  const amount = positiveInteger(price.amountClp, "price.amountClp");
  if (amount === BigInt(0)) throw new RangeError("price.amountClp must be greater than zero");

  const saleVatRate = validRate(policy.saleVatBps, "saleVatBps");
  const commissionRate = validRate(policy.commissionBps, "commissionBps");
  const commissionVatRate = policy.commissionVatBps === null
    ? null
    : validRate(policy.commissionVatBps, "commissionVatBps");
  const gatewayRate = validRate(policy.gatewayFeeBps, "gatewayFeeBps");
  const gatewayVatRate = policy.gatewayFeeVatBps === null
    ? null
    : validRate(policy.gatewayFeeVatBps, "gatewayFeeVatBps");
  const fixedGatewayFee = positiveInteger(policy.gatewayFixedFeeNetClp, "gatewayFixedFeeNetClp");
  const vatWithheld = positiveInteger(policy.saleVatWithheldClp, "saleVatWithheldClp");

  let saleGross: bigint;
  let saleNet: bigint;
  let saleVat: bigint;
  if (price.includesSaleVat) {
    saleGross = amount;
    // For an included tax: net = gross / (1 + rate); tax is the remainder.
    saleNet = roundRatio(saleGross * BPS, BPS + saleVatRate);
    saleVat = saleGross - saleNet;
  } else {
    saleNet = amount;
    saleVat = roundRatio(saleNet * saleVatRate, BPS);
    saleGross = saleNet + saleVat;
  }

  const commissionBase = policy.commissionBasis === "sale_net" ? saleNet : saleGross;
  const commissionNet = roundRatio(commissionBase * commissionRate, BPS);
  const commissionVat = commissionVatRate === null
    ? null
    : roundRatio(commissionNet * commissionVatRate, BPS);
  const commissionTotal = commissionVat === null ? null : commissionNet + commissionVat;

  const gatewayNet = roundRatio(saleGross * gatewayRate, BPS) + fixedGatewayFee;
  const gatewayVat = gatewayVatRate === null
    ? null
    : roundRatio(gatewayNet * gatewayVatRate, BPS);
  const gatewayTotal = gatewayVat === null ? null : gatewayNet + gatewayVat;

  const unresolved: string[] = [];
  if (commissionTotal === null) unresolved.push("IVA de la comisión no definido");
  if (gatewayTotal === null) unresolved.push("IVA del costo de pasarela no definido");

  // Do not present a false net payout if any fee's tax is unknown.
  const payout = commissionTotal === null || gatewayTotal === null
    ? null
    : saleGross - commissionTotal - gatewayTotal - vatWithheld;

  if (vatWithheld > saleVat) {
    throw new RangeError("saleVatWithheldClp cannot exceed saleVatClp");
  }
  const afterReserve = payout === null ? null : payout - (saleVat - vatWithheld);

  return {
    policyVersion: policy.version,
    saleGrossClp: toClp(saleGross, "saleGrossClp"),
    saleNetClp: toClp(saleNet, "saleNetClp"),
    saleVatClp: toClp(saleVat, "saleVatClp"),
    commissionBaseClp: toClp(commissionBase, "commissionBaseClp"),
    commissionNetClp: toClp(commissionNet, "commissionNetClp"),
    commissionVatClp: commissionVat === null ? null : toClp(commissionVat, "commissionVatClp"),
    commissionTotalEstimateClp: commissionTotal === null ? null : toClp(commissionTotal, "commissionTotalClp"),
    gatewayFeeNetEstimateClp: toClp(gatewayNet, "gatewayFeeNetEstimateClp"),
    gatewayFeeVatEstimateClp: gatewayVat === null ? null : toClp(gatewayVat, "gatewayFeeVatEstimateClp"),
    gatewayFeeTotalEstimateClp: gatewayTotal === null ? null : toClp(gatewayTotal, "gatewayFeeTotalEstimateClp"),
    sellerPayoutEstimateClp: payout === null ? null : toClp(payout, "sellerPayoutEstimateClp"),
    sellerSaleVatReserveClp: toClp(saleVat - vatWithheld, "sellerSaleVatReserveClp"),
    saleVatWithheldClp: toClp(vatWithheld, "saleVatWithheldClp"),
    sellerAfterVatReserveEstimateClp: afterReserve === null
      ? null
      : toClp(afterReserve, "sellerAfterVatReserveEstimateClp"),
    unresolved,
  };
}
