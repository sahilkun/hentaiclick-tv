"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Library,
  Building2,
  Layers,
  MessageSquare,
  Users,
  FileText,
  ScrollText,
  SearchCode,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/episodes", label: "Episodes", icon: Film },
  { href: "/admin/series", label: "Series", icon: Library },
  { href: "/admin/studios", label: "Studios", icon: Building2 },
  { href: "/admin/genres", label: "Genres", icon: Layers },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/search", label: "Search Index", icon: SearchCode },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-card lg:block">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/admin" className="font-bold text-primary">
          {SITE_NAME}
        </Link>
        <span className="ml-2 text-xs text-muted-foreground">Admin</span>
      </div>

      <nav className="space-y-1 p-3">
        {adminLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-border p-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
