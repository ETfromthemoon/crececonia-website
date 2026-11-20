import "server-only";
import { Resend } from "resend";

export async function sendLibraryAccess(email: string, url: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw new Error("EBOOK_LIBRARY_EMAIL_UNCONFIGURED");
  const { data, error } = await new Resend(key).emails.send({
    from, to: [email], subject: "Acceso a tu biblioteca de CrececonIA",
    text: `Solicitaste acceso a tu biblioteca. Confirma desde este enlace, válido por 15 minutos:\n\n${url}\n\nSi no lo solicitaste, puedes ignorar este correo.`,
  });
  if (error || !data?.id) throw new Error("EBOOK_LIBRARY_EMAIL_FAILED");
}
