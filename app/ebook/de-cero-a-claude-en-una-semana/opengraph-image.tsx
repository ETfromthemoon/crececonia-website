import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "De cero a Claude en una semana — guía práctica de CrececonIA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const cover = await readFile(
    join(process.cwd(), "public/ebooks/de-cero-a-claude-en-una-semana.jpg"),
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#15120f",
        color: "#f5ecdd",
        fontFamily: "Arial, sans-serif",
        padding: "52px 68px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 710,
          justifyContent: "space-between",
          paddingRight: 55,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 25, fontWeight: 700 }}>
          <div style={{ width: 11, height: 11, borderRadius: 11, background: "#c6db70" }} />
          CrececonIA
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#c6db70", fontSize: 20, letterSpacing: "0.18em", marginBottom: 22 }}>
            EBOOK · GUÍA PRÁCTICA
          </div>
          <div style={{ fontSize: 75, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.055em" }}>
            De cero a Claude
          </div>
          <div style={{ fontSize: 61, lineHeight: 1.08, color: "#c6db70", marginTop: 9 }}>
            en una semana.
          </div>
          <div style={{ fontSize: 25, lineHeight: 1.35, color: "#d7ccbc", marginTop: 28 }}>
            Un camino claro para empezar a usar Claude en tu trabajo.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#b7aa98" }}>
          Por Sergio Astudillo · crececonia.cl
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: 354,
          height: 530,
          borderRadius: 20,
          overflow: "hidden",
          border: "2px solid #836b4b",
        }}
      >
        <img
          src={`data:image/jpeg;base64,${cover.toString("base64")}`}
          alt=""
          width={354}
          height={530}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
    </div>,
    size,
  );
}
