import Image from "next/image";
import styles from "./HomeEditorial.module.css";

export default function EditorialHero() {
  return <section className={`${styles.hero} site-container`} aria-labelledby="home-title">
    <div className={styles.heroCopy}>
      <span className={styles.label}>CrececonIA / Inteligencia aplicada</span>
      <h1 id="home-title">Menos probar.<br />Más <em>hacer.</em></h1>
      <p>IA aplicada a tu negocio, sin herramientas de más. Aprende con una guía, avanza con mentoría o delega la implementación.</p>
      <div className={styles.actions}><a className="button button-dark" href="/ia">Encuentra tu ruta <span>↗</span></a><a className="text-link" href="#biblioteca">Explorar recursos ↓</a></div>
      <div className={styles.heroNote}><span aria-hidden="true">↳</span> Del conocimiento a tu próxima solución.</div>
    </div>
    <div className={styles.stage} aria-label="Una biblioteca para pasar de aprender a aplicar">
      <div className={styles.stageTop}><span>Herramientas con criterio</span><span>01 — 03</span></div>
      <a className={styles.book} href="/ebook/de-cero-a-claude-en-una-semana"><Image src="/ebooks/de-cero-a-claude-en-una-semana.jpg" alt="De cero a Claude en una semana — explorar el ebook" fill sizes="(max-width: 640px) 52vw, 260px" priority /></a>
      <a className={styles.paper} href="/guias/guia-completa-para-usar-claude-code"><span className={styles.label}>02 / Guía práctica</span><strong>Tu primera<br />sesión con<br /><em>Claude Code.</em></strong><span className={styles.paperLines} aria-hidden="true" /><span>Leer la guía ↗</span></a>
      <a className={styles.skillSlip} href="/skills/captaclientes"><span className={styles.fileIcon} aria-hidden="true">↗</span><span><small>03 / SKILL</small><strong>Captaclientes</strong></span><span aria-hidden="true">→</span></a>
      <div className={styles.stageBottom}><span>Lee. Prueba. Construye.</span><span>Hecho para aplicar.</span></div>
    </div>
  </section>;
}
