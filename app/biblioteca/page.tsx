import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EBOOK_LIBRARY_COOKIE, hashLibraryValue, isEbookLibraryEnabled } from "@/lib/ebook-library-config";
import { getLibraryResources, getSessionEmail } from "@/lib/ebook-library-repository";
import styles from "./library.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"Tu biblioteca | CrececonIA",robots:{index:false,follow:false}};
export default async function LibraryPage(){
 if(!isEbookLibraryEnabled())return <main className={styles.shell}><section className={styles.card}><p className={styles.eyebrow}>CrececonIA · Tus recursos</p><h1 className={styles.title}>Biblioteca temporalmente no disponible</h1><p className={styles.body}>Estamos preparando el acceso a tus recursos. Vuelve a intentarlo más tarde.</p></section></main>;
 const session=(await cookies()).get(EBOOK_LIBRARY_COOKIE)?.value;
 if(!session)redirect("/biblioteca/acceso");
 try{
  const email=await getSessionEmail(await hashLibraryValue(session));
  if(!email)redirect("/biblioteca/acceso");
  const books=await getLibraryResources(email);
  return <main className={styles.shell}><section className={styles.card} aria-labelledby="library-title"><p className={styles.eyebrow}>CrececonIA · Contenido adquirido</p><h1 id="library-title" className={styles.title}>Tu biblioteca</h1><p className={styles.body}>Tus recursos asociados a las compras realizadas.</p>{books.length?books.map(book=><section className={styles.resource} key={book.resource}><h2 className={styles.resourceTitle}>{book.title}</h2><div className={styles.downloads}><a href={`/api/biblioteca/download?resource=${encodeURIComponent(book.resource)}&format=movil`}>Descargar formato móvil</a><a href={`/api/biblioteca/download?resource=${encodeURIComponent(book.resource)}&format=a4`}>Descargar formato A4</a></div></section>):<p className={styles.body}>No encontramos recursos disponibles para esta sesión.</p>}<form className={styles.logout} action="/api/biblioteca/logout" method="post"><button className={styles.button} type="submit">Cerrar sesión</button></form></section></main>;
 }catch(error){if(error instanceof Error&&error.message==="NEXT_REDIRECT")throw error;return <main className={styles.shell}><section className={styles.card}><h1 className={styles.title}>No pudimos cargar tu biblioteca</h1><p className={styles.body}>Intenta más tarde.</p></section></main>}
}
