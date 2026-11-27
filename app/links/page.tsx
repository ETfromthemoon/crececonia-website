import type { Metadata } from "next";
import { getWorkshopSettings } from "@/lib/workshop-settings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    <><Navbar /><main className={styles.page}>
      <header className={`${styles.intro} site-container`}>
        <span className={styles.label}>CrececonIA / Enlaces</span>
        <h1>Elige por dónde<br /><em>empezar.</em></h1>
        <p>Recursos prácticos y una comunidad para aplicar inteligencia artificial con criterio.</p>
      </header>

      <section className={styles.content} aria-labelledby="links-heading">
        <div className="site-container">
          <div className={styles.sectionHeading}><span className={styles.label}>Accesos directos</span><h2 id="links-heading">Todo lo importante,<br /><em>en un solo lugar.</em></h2></div>
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
        </div>
      </section>

      <section className={styles.socialBlock} aria-label="Redes sociales">
        <div className="site-container">
          <span className={styles.label}>Sigamos conectados</span>
          <h2>CrececonIA <em>en redes.</em></h2>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/crececoniacl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de CrececonIA">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.8" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://www.tiktok.com/@crececoniacl" target="_blank" rel="noopener noreferrer" aria-label="TikTok de CrececonIA">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.8 2c.3 2.6 1.7 4.1 4.2 4.3v3.4a8.4 8.4 0 0 1-4.2-1.2v7.1a6.2 6.2 0 1 1-6.2-6.2h.6v3.5h-.6a2.7 2.7 0 1 0 2.7 2.7V2h3.5Z"/></svg>
            </a>
          </div>
        </div>
      </section>
    </main><Footer /></>
  );
}
