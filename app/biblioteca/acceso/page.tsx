import { LibraryAccessForm } from "@/components/LibraryAccessForm";
import styles from "../library.module.css";
export const metadata={title:"Accede a tu biblioteca | CrececonIA",robots:{index:false,follow:false}};
export default function AccessPage(){return <main className={styles.shell}><section className={styles.card} aria-labelledby="library-title"><p className={styles.eyebrow}>CrececonIA · Tus recursos</p><h1 id="library-title" className={styles.title}>Accede a tu biblioteca</h1><p className={styles.body}>Ingresa el correo que usaste al comprar y te enviaremos un enlace privado para revisar tus ebooks.</p><LibraryAccessForm/><a className={styles.link} href="/ebooks">Volver al catálogo de ebooks</a></section></main>}
