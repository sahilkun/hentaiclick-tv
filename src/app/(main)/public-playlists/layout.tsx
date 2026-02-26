import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Playlists",
  description: "Browse public playlists created by the community. Curated collections of hentai episodes in 4K, 1080p, and HD.",
  openGraph: {
    title: "Public Playlists | HentaiClick TV",
    description: "Browse public playlists created by the community. Curated collections of hentai episodes.",
    url: "/public-playlists",
  },
  alternates: { canonical: "/public-playlists" },
};

export default function PublicPlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
