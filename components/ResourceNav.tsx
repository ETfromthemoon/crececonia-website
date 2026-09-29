"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/centro", label: "Explorar" },
  { href: "/ebooks", label: "Ebooks" },
  { href: "/centro/guias", label: "Guías" },
  { href: "/centro/skills", label: "Skills" },
];

export default function ResourceNav() {
  const pathname = usePathname();
  const active = pathname.startsWith("/ebook") ? "/ebooks"
    : pathname.startsWith("/guias/") ? "/centro/guias"
    : pathname.startsWith("/skills/") ? "/centro/skills" : pathname;
  return <nav className="resource-nav" aria-label="Tipos de recursos">
    {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</Link>)}
  </nav>;
}
