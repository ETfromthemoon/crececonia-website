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
      className="btn-monad-fill"
      style={{ display: "inline-flex", textDecoration: "none" }}
    >
      Descargar ebook (PDF)
    </a>
  );
}
