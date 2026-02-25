import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Playlists",
  description: "Browse public playlists created by the community.",
};

export default function PublicPlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
