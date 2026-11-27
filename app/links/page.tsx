import type { Metadata } from "next";
import { getWorkshopSettings } from "@/lib/workshop-settings";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enlaces · CrececonIA",
  description: "Ebooks, comunidad y redes sociales de CrececonIA en un solo lugar.",
  alternates: { canonical: "/links" },
};

const links = [
  { title: "Claude a Nivel Experto", href: "/ebook/claude-nivel-experto" },
  { title: "Todos los ebooks", href: "/ebooks" },
  { title: "Conoce CrececonIA", href: "/" },
];

export default async function LinksPage() {
  const { skoolUrl } = await getWorkshopSettings();
  const communityUrl = /^https:\/\//i.test(skoolUrl) ? skoolUrl : "";

  return (
    <><Navbar /><main className={styles.page}>
      <div className={`${styles.shell} site-container`}>
        <span className={styles.label}>CrececonIA / Enlaces</span>
        <h1>Todo en <em>un lugar.</em></h1>
        <nav className={styles.links} aria-label="Enlaces destacados">
          {links.map((link, index) => (
            <a className={styles.card} href={link.href} key={link.href}>
              <span className={styles.number}>0{index + 1}</span>
              <strong>{link.title}</strong>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          ))}
          {communityUrl ? (
            <a className={styles.card} href={communityUrl} target="_blank" rel="noopener noreferrer">
              <span className={styles.number}>04</span><strong>Comunidad Skool</strong><span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          ) : null}
        </nav>

        <section className={styles.socialBlock} aria-label="Redes sociales">
          <span className={styles.label}>En redes</span>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/crececoniacl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de CrececonIA">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.8" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              <strong>Instagram</strong><span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
            <a href="https://www.tiktok.com/@crececoniacl" target="_blank" rel="noopener noreferrer" aria-label="TikTok de CrececonIA">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.8 2c.3 2.6 1.7 4.1 4.2 4.3v3.4a8.4 8.4 0 0 1-4.2-1.2v7.1a6.2 6.2 0 1 1-6.2-6.2h.6v3.5h-.6a2.7 2.7 0 1 0 2.7 2.7V2h3.5Z"/></svg>
              <strong>TikTok</strong><span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </main></>
  );
}
