import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Publicador de videos desde Google Drive | CrececonIA",
  description: "Cómo el automatizador de CrececonIA prepara y programa videos desde una carpeta autorizada de Google Drive.",
  alternates: { canonical: "https://www.crececonia.cl/publicador-drive" },
};

export default function PublicadorDrivePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-[color:var(--ink)]">
      <Link href="/" className="text-sm underline underline-offset-4">CrececonIA</Link>
      <h1 className="mt-10 text-4xl font-semibold">Publicador de videos desde Google Drive</h1>
      <p className="mt-6 leading-7">
        Esta herramienta de CrececonIA procesa videos que su operador coloca en una carpeta de Google Drive
        autorizada. Descarga cada video, extrae su audio para transcribirlo y preparar el texto de publicación,
        y envía el video y los textos a Zernio para programarlos en Instagram y TikTok.
      </p>
      <p className="mt-4 leading-7">
        Después de una programación correcta, mueve el archivo a la carpeta de programados. Los archivos que
        no pasan la validación se mueven a revisión o errores. No examina otras carpetas para seleccionar
        videos, aunque el permiso de Google Drive solicitado es más amplio que estas operaciones.
      </p>
      <p className="mt-4 leading-7">
        El acceso se concede mediante Google OAuth y puede revocarse desde la configuración de seguridad de la
        cuenta de Google. Al revocarlo, el automatizador deja de poder procesar nuevos videos.
      </p>
      <p className="mt-6 leading-7">
        Para conocer exactamente qué datos se leen, transfieren y conservan, consulta la{" "}
        <Link href="/publicador-drive/privacidad" className="underline underline-offset-4">
          política de privacidad de este publicador
        </Link>.
      </p>
      <p className="mt-8 text-sm">Consultas: <a className="underline" href="mailto:sergio@crececonia.cl">sergio@crececonia.cl</a></p>
    </main>
  );
}
