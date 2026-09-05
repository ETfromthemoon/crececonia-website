"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { slugifyLaunch } from "@/lib/launch-model";

type ProductOption = { resource: string; title: string; coverSrc: string; price: number };

export default function LaunchCreateForm({ adminKey, products }: { adminKey: string; products: ProductOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setBusy(true); setError("");
    const selected = formData.getAll("products").map(String);
    const dateValue = (key: string) => { const value = String(formData.get(key) || ""); return value ? new Date(value).toISOString() : null; };
    const body = {
      name, slug: slug || slugifyLaunch(name), launchType: formData.get("launchType"),
      headline: formData.get("headline"), description: formData.get("description"),
      startsAt: dateValue("startsAt"), endsAt: dateValue("endsAt"),
      startPriceMinor: formData.get("startPriceMinor") ? Number(formData.get("startPriceMinor")) : null,
      priceStepMinor: Number(formData.get("priceStepMinor")), tierCapacity: Number(formData.get("tierCapacity")),
      ctaLabel: formData.get("ctaLabel"), ctaUrl: formData.get("ctaUrl") || null,
      dmKeyword: formData.get("dmKeyword") || null, adCampaignName: formData.get("adCampaignName") || null,
      cerneoProjectUrl: formData.get("cerneoProjectUrl") || null, automationNotes: formData.get("automationNotes") || null,
      productResources: selected,
    };
    const response = await fetch("/api/admin/launches", { method: "POST", headers: { "content-type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "No se pudo crear."); setBusy(false); return; }
    router.push(`/admin/lanzamientos/${result.launch.slug}?key=${encodeURIComponent(adminKey)}`);
  }

  return <form className="launch-create" action={submit}>
    <div className="launch-section-head"><span>Nuevo lanzamiento</span><h2>Parte con lo esencial.</h2><p>El sistema crea los tramos y la coordinación CERNEO automáticamente.</p></div>
    <div className="launch-form-grid">
      <label><span>Nombre *</span><input required minLength={3} value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(slugifyLaunch(event.target.value)); }} placeholder="Ej. Taller de agentes para ventas" /></label>
      <label><span>Identificador web *</span><input required value={slug} onChange={(event) => setSlug(slugifyLaunch(event.target.value))} placeholder="taller-agentes-ventas" /></label>
      <label><span>Tipo</span><select name="launchType" defaultValue="event"><option value="event">Evento o workshop</option><option value="ebook_release">Lanzamiento de ebooks</option><option value="campaign">Campaña</option></select></label>
      <label><span>Titular</span><input name="headline" placeholder="La promesa principal" /></label>
      <label className="wide"><span>Descripción</span><textarea name="description" rows={3} placeholder="Qué ocurrirá y para quién es." /></label>
      <label><span>Inicio</span><input name="startsAt" type="datetime-local" /></label>
      <label><span>Término</span><input name="endsAt" type="datetime-local" /></label>
      <label><span>Precio inicial (CLP)</span><input name="startPriceMinor" type="number" min="0" step="100" placeholder="20000" /></label>
      <label><span>Subida por tramo</span><input name="priceStepMinor" type="number" min="0" step="100" defaultValue="5000" /></label>
      <label><span>Cupos por tramo</span><input name="tierCapacity" type="number" min="1" defaultValue="5" /></label>
      <label><span>Texto del botón</span><input name="ctaLabel" defaultValue="Quiero participar" /></label>
      <label className="wide"><span>Destino del botón</span><input name="ctaUrl" type="url" placeholder="https://... (opcional si eliges un ebook)" /></label>
    </div>
    <fieldset className="launch-products"><legend>Ebooks incluidos</legend><p>Selecciona productos existentes. El primero será el producto principal.</p><div>{products.map((product) => <label key={product.resource}><input type="checkbox" name="products" value={product.resource}/><Image src={product.coverSrc} alt="" width={54} height={86}/><span><b>{product.title}</b><small>Precio tienda: ${product.price.toLocaleString("es-CL")}</small></span></label>)}</div></fieldset>
    <details className="launch-advanced"><summary>Coordinación y datos avanzados</summary><div className="launch-form-grid">
      <label><span>Palabra clave DM</span><input name="dmKeyword" placeholder="AGENTES" /></label>
      <label><span>Nombre campaña anuncios</span><input name="adCampaignName" placeholder="Lanzamiento · Agentes" /></label>
      <label className="wide"><span>Proyecto CERNEO</span><input name="cerneoProjectUrl" type="url" placeholder="Pega el enlace cuando exista" /></label>
      <label className="wide"><span>Notas de automatización</span><textarea name="automationNotes" rows={3} placeholder="Recordatorios, segmentación, responsables..." /></label>
    </div></details>
    {error && <p className="launch-error">{error}</p>}
    <button className="launch-primary" disabled={busy}>{busy ? "Creando…" : "Crear lanzamiento y checklist"}</button>
  </form>;
}
