"use client";
import { useState, type FormEvent } from "react";
import type { WorkshopSettings } from "@/lib/workshop-settings";

export default function WorkshopSettingsForm({ adminKey, initial }: { adminKey: string; initial: WorkshopSettings }) {
  const [settings, setSettings] = useState(initial), [status, setStatus] = useState(""), [saving, setSaving] = useState(false);
  const update = (key: keyof WorkshopSettings, value: string | boolean) => setSettings((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setStatus("");
    const response = await fetch("/api/admin/workshop-settings", { method: "PUT", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify(settings) });
    const data = await response.json().catch(() => ({}));
    setSaving(false); setStatus(response.ok ? "Guardado. La sala se actualiza al recargar." : data.error ?? "No se pudo guardar.");
  }
  const fields: Array<[keyof WorkshopSettings, string, string]> = [["sessionUrl","Google Meet","https://meet.google.com/..."],["recordingUrl","Grabación","https://..."],["skoolUrl","Invitación SKOOL","https://www.skool.com/..."],["skillsStoragePath","ZIP en bucket workshop-assets","workshop-2026-09-06/skills.zip"],["supportEmail","Correo de soporte","sergio@crececonia.cl"]];
  return <form className="workshop-admin-settings" onSubmit={submit}><div>{fields.map(([key,label,placeholder]) => <label key={key}><span>{label}</span><input type={key === "supportEmail" ? "email" : key === "skillsStoragePath" ? "text" : "url"} placeholder={placeholder} value={String(settings[key] ?? "")} onChange={(event) => update(key,event.target.value)} /></label>)}</div><label className="workshop-admin-check"><input type="checkbox" checked={settings.roomEnabled} onChange={(event) => update("roomEnabled",event.target.checked)} /> Sala privada publicada</label><button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar operación"}</button>{status && <p>{status}</p>}</form>;
}
