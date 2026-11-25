import type { Metadata } from "next";
import { getWorkshopSettings } from "@/lib/workshop-settings";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enlaces · CrececonIA",
  description: "Ebooks, comunidad y redes sociales de CrececonIA en un solo lugar.",
  alternates: { canonical: "/links" },
};

const links = [
  { eyebrow: "EBOOK DESTACADO", title: "Claude a Nivel Experto", detail: "Una guía para llevar Claude más allá del chat.", href: "/ebook/claude-nivel-experto" },
  { eyebrow: "BIBLIOTECA", title: "Explora todos los ebooks", detail: "Encuentra la ruta que corresponde a tu nivel.", href: "/ebooks" },
  { eyebrow: "SITIO WEB", title: "Conoce CrececonIA", detail: "Aprende, recibe mentoría o implementa IA.", href: "/" },
];

export default async function LinksPage() {
  const { skoolUrl } = await getWorkshopSettings();
  const communityUrl = /^https:\/\//i.test(skoolUrl) ? skoolUrl : "";

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <a className={styles.wordmark} href="/" aria-label="CrececonIA, ir al inicio">Crece<span>con</span>IA<span className={styles.period}>.</span></a>
        <div className={styles.mark} aria-hidden="true">C<span>IA</span></div>
        <p className={styles.kicker}>TU PUNTO DE PARTIDA</p>
        <h1>Una idea puede<br /><em>cambiar tu forma de trabajar.</em></h1>
        <p className={styles.intro}>Recursos prácticos y una comunidad para aplicar inteligencia artificial con criterio.</p>

        <nav className={styles.links} aria-label="Enlaces destacados">
          {links.map((link, index) => (
            <a className={styles.card} href={link.href} key={link.href}>
              <span className={styles.number}>0{index + 1}</span>
              <span className={styles.cardCopy}><span className={styles.eyebrow}>{link.eyebrow}</span><strong>{link.title}</strong><span className={styles.detail}>{link.detail}</span></span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          ))}
          {communityUrl ? (
            <a className={styles.card} href={communityUrl} target="_blank" rel="noopener noreferrer">
              <span className={styles.number}>04</span><span className={styles.cardCopy}><span className={styles.eyebrow}>COMUNIDAD</span><strong>Únete a Skool</strong><span className={styles.detail}>Sigue aprendiendo junto a la comunidad.</span></span><span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          ) : null}
        </nav>

        <div className={styles.socialBlock}>
          <p>SÍGUENOS EN REDES</p>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/crececoniacl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de CrececonIA">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.8" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://www.tiktok.com/@crececoniacl" target="_blank" rel="noopener noreferrer" aria-label="TikTok de CrececonIA">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.8 2c.3 2.6 1.7 4.1 4.2 4.3v3.4a8.4 8.4 0 0 1-4.2-1.2v7.1a6.2 6.2 0 1 1-6.2-6.2h.6v3.5h-.6a2.7 2.7 0 1 0 2.7 2.7V2h3.5Z"/></svg>
            </a>
          </div>
        </div>
        <p className={styles.footer}>© 2026 CrececonIA <span>·</span> Santiago, Chile</p>
      </div>
    </main>
  );
}
