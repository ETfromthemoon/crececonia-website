"use client";

import { useState, type FormEvent } from "react";

export default function WorkshopAccessRecovery() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading"); setMessage("");
    const response = await fetch("/api/workshop/access/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? "success" : "error");
    setMessage(data.message ?? data.error ?? "No pudimos procesar la solicitud.");
  }

  return <main className="workshop-access">
    <section>
      <a className="workshop-access-brand" href="/">Crececon<span>IA</span></a>
      <p className="workshop-kicker"><i /> Acceso de alumnos</p>
      <h1>Recupera tu sala privada.</h1>
      <p>Usa el mismo correo con el que compraste. Te enviaremos un enlace nuevo a la grabación, los slides, la hoja de trabajo, las skills y tus demás recursos.</p>
      <form onSubmit={submit}>
        <label htmlFor="workshop-access-email">Correo de compra</label>
        <input id="workshop-access-email" type="email" required autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Enviando…" : "Enviar nuevo enlace"}</button>
      </form>
      {message && <p className={status === "error" ? "is-error" : "is-success"} role="status">{message}</p>}
      <small>Por seguridad, el enlace es personal. Si no llega, revisa spam o escribe a <a href="mailto:sergio@crececonia.cl">sergio@crececonia.cl</a>.</small>
    </section>
  </main>;
}
