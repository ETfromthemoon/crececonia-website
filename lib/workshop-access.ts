import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = "w1";

function secret() {
  return process.env.WORKSHOP_ACCESS_SECRET?.trim()
    || process.env.CLASS_HUB_ACCESS_SECRET?.trim()
    || process.env.FLOW_SECRET_KEY?.trim()
    || "";
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createWorkshopAccessToken(orderId: string) {
  if (!secret()) return null;
  const payload = `${TOKEN_VERSION}.${Buffer.from(orderId).toString("base64url")}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyWorkshopAccessToken(token: string | undefined) {
  if (!token || !secret()) return null;
  const [version, encodedOrderId, receivedSignature, extra] = token.split(".");
  if (version !== TOKEN_VERSION || !encodedOrderId || !receivedSignature || extra) return null;
  const payload = `${version}.${encodedOrderId}`;
  const expectedSignature = signature(payload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const orderId = Buffer.from(encodedOrderId, "base64url").toString("utf8");
    return /^workshop-\d+-[a-z0-9]{6}$/.test(orderId) ? orderId : null;
  } catch {
    return null;
  }
}
