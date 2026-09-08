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
  const fields: Array<[keyof WorkshopSettings, string, string]> = [["sessionUrl","Google Meet","https://meet.google.com/..."],["recordingUrl","Grabación del taller","https://..."],["skoolUrl","Invitación SKOOL · pendiente de lanzamiento","https://www.skool.com/..."],["supportEmail","Correo de soporte","sergio@crececonia.cl"]];
  return <form className="workshop-admin-settings" onSubmit={submit}><div>{fields.map(([key,label,placeholder]) => <label key={key}><span>{label}</span><input type={key === "supportEmail" ? "email" : "url"} placeholder={placeholder} value={String(settings[key] ?? "")} onChange={(event) => update(key,event.target.value)} />{key === "skoolUrl" && <small>{settings.skoolUrl ? "Publicado: el enlace ya aparece en todas las salas privadas." : "Puede quedar vacío hasta el lanzamiento. No bloquea las ventas del curso grabado."}</small>}</label>)}</div><aside><strong>Archivos privados del taller</strong><p>Sube la última versión de los slides, la hoja de trabajo y el ZIP de cinco skills con <code>npm run workshop:subir-recursos</code>. El comando reemplaza los archivos anteriores y verifica los tres. La guía del relator y los archivos <code>*.original.html</code> permanecen internos.</p></aside><aside><strong>Cómo lanzar SKOOL</strong><p>Cuando tengas la invitación, pégala arriba y guarda. El enlace aparecerá inmediatamente en todas las salas, antiguas y futuras. Después usa <strong>Enviar recursos a todos</strong> para avisar por correo a todas las personas que ya compraron.</p></aside><label className="workshop-admin-check"><input type="checkbox" checked={settings.roomEnabled} onChange={(event) => update("roomEnabled",event.target.checked)} /> Sala privada publicada</label><button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar operación"}</button>{status && <p>{status}</p>}</form>;
}
