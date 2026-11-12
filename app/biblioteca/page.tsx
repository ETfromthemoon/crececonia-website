import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EBOOK_LIBRARY_COOKIE, hashLibraryValue, isEbookLibraryEnabled } from "@/lib/ebook-library-config";
import { getLibraryResources, getSessionEmail } from "@/lib/ebook-library-repository";

export const dynamic="force-dynamic";
export const metadata={title:"Tu biblioteca | CrececonIA",robots:{index:false,follow:false}};
export default async function LibraryPage(){
 if(!isEbookLibraryEnabled())return <main><h1>Biblioteca temporalmente no disponible</h1></main>;
 const session=(await cookies()).get(EBOOK_LIBRARY_COOKIE)?.value;
 if(!session)redirect("/biblioteca/acceso");
 try{
  const email=await getSessionEmail(await hashLibraryValue(session));
  if(!email)redirect("/biblioteca/acceso");
  const books=await getLibraryResources(email);
  return <main style={{maxWidth:900,margin:"0 auto",padding:32}}><h1>Tu biblioteca</h1><p>Recursos asociados a tus compras.</p>{books.length?books.map(book=><section key={book.resource}><h2>{book.title}</h2><a href={`/api/biblioteca/download?resource=${encodeURIComponent(book.resource)}&format=movil`}>Descargar formato móvil</a><br/><a href={`/api/biblioteca/download?resource=${encodeURIComponent(book.resource)}&format=a4`}>Descargar formato A4</a></section>):<p>No encontramos recursos disponibles para esta sesión.</p>}<form action="/api/biblioteca/logout" method="post"><button type="submit">Cerrar sesión</button></form></main>;
 }catch(error){if(error instanceof Error&&error.message==="NEXT_REDIRECT")throw error;return <main><h1>No pudimos cargar tu biblioteca</h1><p>Intenta más tarde.</p></main>}
}
