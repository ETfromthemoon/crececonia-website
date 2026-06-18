import crypto from "crypto";

export function flowSign(
  params: Record<string, string | number>,
  secretKey: string
): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
}

export function getFlowBase(): string {
  return process.env.FLOW_SANDBOX === "true"
    ? "https://sandbox.flow.cl/api"
    : "https://www.flow.cl/api";
}
