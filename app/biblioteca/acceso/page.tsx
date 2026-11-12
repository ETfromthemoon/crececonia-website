import { LibraryAccessForm } from "@/components/LibraryAccessForm";
export const metadata={title:"Accede a tu biblioteca | CrececonIA",robots:{index:false,follow:false}};
export default function AccessPage(){return <main style={{maxWidth:600,margin:"0 auto",padding:32}}><h1>Accede a tu biblioteca</h1><p>Te enviaremos un enlace para revisar tus recursos comprados.</p><LibraryAccessForm/></main>}
