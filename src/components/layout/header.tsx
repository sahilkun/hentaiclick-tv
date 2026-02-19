"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shuffle,
  User,
  LogIn,
  LogOut,
  Settings,
  Heart,
  History,
  ListVideo,
  Shield,
  Menu,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";

// Placeholder until auth is implemented
interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: "user" | "moderator" | "admin";
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/playlists", label: "Playlists" },
];

export function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Placeholder — will be replaced with real auth
  const user = null as UserProfile | null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        {/* Mobile menu trigger */}
        <MobileMenuTrigger className="lg:hidden" />

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold text-primary">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <SearchBar className="hidden flex-1 max-w-md lg:block" />

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Random button */}
          <Link
            href="/episode/random"
            className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-accent"
            title="Random Episode"
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden sm:inline">Random</span>
          </Link>

          <ThemeToggle />

          {/* Premium CTA */}
          <Link
            href="/premium"
            className="hidden h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:flex"
          >
            Get Premium
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm transition-colors hover:bg-accent"
            >
              {user ? (
                <>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden max-w-24 truncate sm:inline">
                    {user.displayName}
                  </span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Guest</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>

            {userMenuOpen && (
              <UserDropdown
                user={user}
                onClose={() => setUserMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function UserDropdown({
  user,
  onClose,
}: {
  user: UserProfile | null;
  onClose: () => void;
}) {
  if (!user) {
    return (
      <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-lg">
        <div className="px-3 py-2 text-sm text-muted-foreground">
          Guest / Please Login
        </div>
        <hr className="my-1 border-border" />
        <DropdownLink href="/login" icon={LogIn} onClick={onClose}>
          Log In
        </DropdownLink>
        <DropdownLink href="/register" icon={User} onClick={onClose}>
          Register
        </DropdownLink>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-lg">
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{user.displayName}</p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>
      <hr className="my-1 border-border" />
      <DropdownLink href="/profile" icon={User} onClick={onClose}>
        Profile
      </DropdownLink>
      <DropdownLink href="/profile/favorites" icon={Heart} onClick={onClose}>
        Favorites
      </DropdownLink>
      <DropdownLink href="/profile/history" icon={History} onClick={onClose}>
        Watch History
      </DropdownLink>
      <DropdownLink
        href="/profile/playlists"
        icon={ListVideo}
        onClick={onClose}
      >
        My Playlists
      </DropdownLink>
      {(user.role === "admin" || user.role === "moderator") && (
        <>
          <hr className="my-1 border-border" />
          <DropdownLink href="/admin" icon={Shield} onClick={onClose}>
            Admin Panel
          </DropdownLink>
        </>
      )}
      <hr className="my-1 border-border" />
      <DropdownLink href="/profile" icon={Settings} onClick={onClose}>
        Settings
      </DropdownLink>
      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-accent"
      >
        <LogOut className="h-4 w-4" />
        Log Out
      </button>
    </div>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function MobileMenuTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent",
        className
      )}
      aria-label="Open mobile menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
