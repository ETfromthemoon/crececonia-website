import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function LibraryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
