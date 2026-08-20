"use client";

import Script from "next/script";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

function isValidPixelId(value: string | undefined): value is string {
  return Boolean(value && /^\d{5,20}$/.test(value));
}

/**
 * Carga el píxel sólo cuando existe un Dataset ID válido. Sin variable de
 * entorno el componente es un no-op, por lo que se puede desplegar antes de
 * crear la cuenta de Meta sin empezar a compartir eventos accidentalmente.
 */
export default function MetaPixel() {
  if (!isValidPixelId(pixelId)) return null;

  const source = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
    'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;

  return (
    <>
      <Script id="meta-pixel" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: source }} />
      <noscript>
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
