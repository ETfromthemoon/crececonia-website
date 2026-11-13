import "server-only";
import { queryDatabase } from "./database";
import { finalizeEbookPaymentWithQuery, type VerifiedEbookPayment } from "./ebook-payment-finalization-core";

export { isEbookFinalizationEnabled, type VerifiedEbookPayment, type EbookFinalizationResult } from "./ebook-payment-finalization-core";

export function finalizeEbookPayment(payment: VerifiedEbookPayment) {
  return finalizeEbookPaymentWithQuery(queryDatabase, payment);
}