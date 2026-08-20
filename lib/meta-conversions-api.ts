import "server-only";

import { createHash } from "crypto";
import { CLASS_PATH, CLASS_PRODUCT_KEY } from "@/lib/class-product";
import { SITE_URL } from "@/lib/seo";

type PurchaseInput = {
  email: string;
  amount: number;
  orderId: string;
  request: Request;
};

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim();
}

/**
 * Envía una compra que Flow ya verificó. Es opcional y no bloquea la entrega
 * al alumno si Meta está caído o todavía no se han configurado sus variables.
 */
export async function captureMetaClassPurchase({ email, amount, orderId, request }: PurchaseInput) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.META_CAPI_API_VERSION?.trim();

  if (!pixelId || !accessToken || !apiVersion) return;

  const ip = clientIp(request);
  const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(pixelId)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: accessToken,
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `class-purchase-${orderId}`,
        action_source: "website",
        event_source_url: `${SITE_URL}${CLASS_PATH}`,
        user_data: {
          em: [hash(email)],
          ...(ip ? { client_ip_address: ip } : {}),
          ...(request.headers.get("user-agent") ? { client_user_agent: request.headers.get("user-agent") } : {}),
        },
        custom_data: {
          currency: "CLP",
          value: amount,
          content_type: "product",
          content_ids: [CLASS_PRODUCT_KEY],
          order_id: orderId,
        },
      }],
    }),
  });

  if (!response.ok) throw new Error(`Meta CAPI respondió ${response.status}`);
}
