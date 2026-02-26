import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Episodes",
  description:
    "Search and filter hentai episodes by genre, studio, year, and rating. Browse thousands of episodes in 4K, 1080p, and HD.",
  openGraph: {
    title: "Search Episodes | HentaiClick TV",
    description:
      "Search and filter hentai episodes by genre, studio, year, and rating.",
    url: "/search",
  },
  alternates: { canonical: "/search" },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
