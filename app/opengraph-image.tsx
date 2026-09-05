import { ImageResponse } from "next/og";

export const alt = "CrececonIA — IA aplicada a tu negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#f3f0e8",
        color: "#161719",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 25 }}>
        <div style={{ display: "flex", fontWeight: 700, letterSpacing: "-0.04em" }}>
          Crece<span style={{ color: "#829435" }}>con</span>IA
        </div>
        <div style={{ color: "#667039", fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          IA aplicada · Santiago / remoto
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
        <div style={{ color: "#829435", fontSize: 22, letterSpacing: "0.12em", marginBottom: 22, textTransform: "uppercase" }}>
          Problema → decisión → sistema
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.055em" }}>
          <span>IA aplicada a tu negocio.</span>
          <span style={{ color: "#829435" }}>Sin herramientas de más.</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 25, borderTop: "2px solid #cbc7ba", fontSize: 20 }}>
        <span>Aprende · recibe dirección · delega la implementación</span>
        <span style={{ color: "#667039" }}>crececonia.cl</span>
      </div>
    </div>,
    size,
  );
}
