import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const footerLinks = [
  { href: "/genres", label: "Genres" },
  { href: "/studios", label: "Studios" },
  { href: "/playlists", label: "Playlists" },
  { href: "/premium", label: "Premium" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[84%] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-primary">
              {SITE_NAME}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Watch the highest quality hentai in 4K, 1080p, and HD for free.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
