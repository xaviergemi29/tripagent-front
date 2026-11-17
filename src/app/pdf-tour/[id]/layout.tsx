import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manifiesto de abordaje" };

export default function ManifestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
