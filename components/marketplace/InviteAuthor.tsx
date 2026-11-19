"use client";

import { useState } from "react";
import styles from "./InviteAuthor.module.css";

const subject = "Te invito a vender tus ebooks en CrececonIA";
const message = "¡Hola! Te invito a publicar y vender tus ebooks de IA, tecnología, negocios o bienestar en el Marketplace de CrececonIA. Puedes inscribirte como autor aquí: https://www.crececonia.cl/ebooks/vender";
const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
const email = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

export default function InviteAuthor() {
  const [feedback, setFeedback] = useState("");

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setFeedback("Invitación copiada.");
    } catch {
      setFeedback("Selecciona el texto de arriba para copiarlo manualmente.");
    }
  }

  return <details className={styles.invite} onToggle={(event) => {
    if (!event.currentTarget.open) setFeedback("");
  }}>
    <summary className={styles.trigger}>Invitar a vender <span aria-hidden="true">↗</span></summary>
    <div className={styles.panel}>
      <blockquote className={styles.message}>{message}</blockquote>
      <div className={styles.actions}>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href={email}>Correo</a>
        <button type="button" onClick={copyMessage}>Copiar mensaje</button>
      </div>
      <span className={styles.feedback} role="status">{feedback}</span>
    </div>
  </details>;
}
