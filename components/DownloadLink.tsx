"use client";

type Props = {
  token?: string;
  email?: string;
};

export default function DownloadLink({ token, email }: Props) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (email) params.set("email", email);

  return (
    <a
      href={`/api/ebook/download?${params.toString()}`}
      className="btn-evaluacion btn-lg"
      style={{ display: "inline-block", textDecoration: "none" }}
    >
      Descargar ebook
    </a>
  );
}
