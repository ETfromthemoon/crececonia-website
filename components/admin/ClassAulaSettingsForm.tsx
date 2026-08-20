"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type { ClassAulaSettings } from "@/lib/class-aula-settings";

type Props = { adminKey: string; initialSettings: ClassAulaSettings };

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--obsidian)",
  color: "var(--bone)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "11px 12px",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "var(--ash)",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 7,
};

export default function ClassAulaSettingsForm({ adminKey, initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(field: keyof ClassAulaSettings, value: string | boolean) {
    setSettings((current) => ({ ...current, [field]: value }));
    setStatus("idle");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/admin/class-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(settings),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      setStatus("error");
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }
    setSettings((current) => ({ ...current, ...data.settings, sessionUrl: data.settings.session_url ?? "", whatsappGroupUrl: data.settings.whatsapp_group_url ?? "", recordingUrl: data.settings.recording_url ?? "", supportEmail: data.settings.support_email ?? current.supportEmail, classroomEnabled: data.settings.classroom_enabled ?? current.classroomEnabled, updatedAt: data.settings.updated_at ?? current.updatedAt }));
    setStatus("saved");
    setMessage("Guardado. El aula de alumnos toma estos cambios al recargar.");
  }

  return (
    <form onSubmit={submit} style={{ background: "var(--carbon)", border: "1px solid var(--border)", borderRadius: 4, padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <label>
          <span style={labelStyle}>Google Meet</span>
          <input style={inputStyle} type="url" inputMode="url" placeholder="https://meet.google.com/..." value={settings.sessionUrl} onChange={(event) => update("sessionUrl", event.target.value)} />
        </label>
        <label>
          <span style={labelStyle}>Grupo WhatsApp</span>
          <input style={inputStyle} type="url" inputMode="url" placeholder="https://chat.whatsapp.com/..." value={settings.whatsappGroupUrl} onChange={(event) => update("whatsappGroupUrl", event.target.value)} />
        </label>
        <label>
          <span style={labelStyle}>Grabación (opcional)</span>
          <input style={inputStyle} type="url" inputMode="url" placeholder="https://drive.google.com/..." value={settings.recordingUrl} onChange={(event) => update("recordingUrl", event.target.value)} />
        </label>
        <label>
          <span style={labelStyle}>Correo de soporte</span>
          <input style={inputStyle} type="email" value={settings.supportEmail} onChange={(event) => update("supportEmail", event.target.value)} required />
        </label>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18, color: "var(--bone)", fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={settings.classroomEnabled} onChange={(event) => update("classroomEnabled", event.target.checked)} />
        Aula de alumnos publicada y disponible con sus enlaces personales
      </label>
      {message && <p style={{ color: status === "error" ? "#e07a5f" : "var(--champagne)", fontSize: 13, margin: "16px 0 0" }}>{message}</p>}
      <button className="btn-primary" type="submit" disabled={status === "saving"} style={{ marginTop: 18, cursor: status === "saving" ? "wait" : "pointer" }}>
        {status === "saving" ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
