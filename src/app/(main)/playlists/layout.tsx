import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playlists",
  description:
    "Browse public playlists created by the community. Curated collections of hentai episodes in 4K, 1080p, and HD.",
  openGraph: {
    title: "Playlists | HentaiClick TV",
    description:
      "Browse public playlists created by the community. Curated collections of hentai episodes.",
    url: "/playlists",
  },
  alternates: { canonical: "/playlists" },
};

export default function PlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
