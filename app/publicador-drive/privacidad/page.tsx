import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad del publicador de Google Drive | CrececonIA",
  description: "Tratamiento de datos de Google Drive por el automatizador de videos de CrececonIA.",
  alternates: { canonical: "https://www.crececonia.cl/publicador-drive/privacidad" },
};

export default function PrivacidadPublicadorDrivePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-[color:var(--ink)]">
      <Link href="/publicador-drive" className="text-sm underline underline-offset-4">Publicador de Drive</Link>
      <h1 className="mt-10 text-4xl font-semibold">Privacidad del publicador de Google Drive</h1>
      <p className="mt-4 text-sm">CrececonIA · Santiago, Chile · Actualizada el 28 de octubre de 2026</p>

      <h2 className="mt-10 text-2xl font-semibold">Alcance y acceso</h2>
      <p className="mt-3 leading-7">
        Esta política describe el automatizador local de videos de CrececonIA, no todos los servicios de este
        sitio. Con la autorización OAuth de su operador, solicita acceso a Google Drive para listar archivos y
        metadatos, descargar videos y moverlos entre las carpetas de entrada, programados, revisión y errores. El permiso
        solicitado permite acceso amplio a Drive; el procesamiento automático se limita a la carpeta de entrada
        configurada por CrececonIA.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Uso y transferencias</h2>
      <p className="mt-3 leading-7">
        Para cada video elegible se leen nombre, identificador, tamaño y otros metadatos técnicos. El video se
        descarga temporalmente en el equipo del operador y se extrae su audio. El audio y el contexto de marca
        se envían al servicio privado de procesamiento de IA configurado por CrececonIA para generar transcripción
        y textos. El video y esos textos se envían a Zernio para su programación en Instagram y TikTok. Si el
        servicio privado de IA no está configurado, el automatizador puede usar OpenAI para transcribir y generar
        los textos. Estos proveedores procesan la información necesaria para prestar esas funciones.
      </p>
      <p className="mt-4 leading-7">
        No usamos los datos obtenidos de Google Drive para publicidad personalizada ni los vendemos. No
        transferimos datos de Drive a terceros ajenos a las funciones descritas aquí.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Conservación y control</h2>
      <p className="mt-3 leading-7">
        Los archivos de video y audio descargados se guardan en una carpeta temporal local durante el
        procesamiento y se eliminan al terminar ese procesamiento. El automatizador conserva localmente datos
        operativos, como identificadores y nombres de archivo, estados, textos de publicación, identificadores
        de Zernio y fechas programadas, para evitar publicaciones duplicadas y diagnosticar errores. Si una
        transcripción se considera candidata para crear una guía, puede conservarse en una cola local de trabajo.
        Los videos permanecen en Google Drive, en la carpeta de destino correspondiente, hasta que el operador
        los elimine. La conservación de copias y publicaciones en Zernio y las redes sociales se rige también por
        las políticas de esas plataformas.
      </p>
      <p className="mt-4 leading-7">
        El operador puede revocar el acceso en la seguridad de su cuenta de Google y solicitar la eliminación de
        los registros locales asociados. La revocación impide nuevas lecturas, pero no elimina publicaciones ya
        enviadas a Zernio o a las redes sociales.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Contacto</h2>
      <p className="mt-3 leading-7">
        Para consultas o solicitudes sobre estos datos, escribe a{" "}
        <a href="mailto:sergio@crececonia.cl" className="underline underline-offset-4">sergio@crececonia.cl</a>.
      </p>
    </main>
  );
}
