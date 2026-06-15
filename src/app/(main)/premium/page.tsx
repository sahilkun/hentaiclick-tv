import { getAnonClient } from "@/lib/supabase/anon";
import type { Metadata } from "next";
import {
  Crown,
  MonitorPlay,
  Download,
  ShieldCheck,
  Zap,
  Heart,
  Check,
  X,
} from "lucide-react";
import { FOUR_K_UNLOCK_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Discord invite for the community / supporter flow.
const DISCORD_INVITE = "https://discord.gg/x5PaYPHp";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getAnonClient();
  const { data } = await supabase
    .from("site_pages")
    .select("meta_title, meta_description")
    .eq("slug", "premium")
    .single();

  return {
    title: data?.meta_title ?? "Go Premium — HentaiClick",
    description:
      data?.meta_description ??
      "Unlock 4K from day one, unlimited downloads, and no captcha. Go Premium on HentaiClick.",
    alternates: { canonical: "/premium" },
  };
}

const perks = [
  {
    icon: MonitorPlay,
    title: "4K from day one",
    body: `Stream every new episode in 4K the moment it drops — no ${FOUR_K_UNLOCK_DAYS}-day wait.`,
  },
  {
    icon: Download,
    title: "Unlimited downloads",
    body: "Grab the full uncensored MKV in 1080p or 4K, as many as you want, at full link speed.",
  },
  {
    icon: ShieldCheck,
    title: "No captcha",
    body: "Skip the human-verification step on every download. One click, straight to the file.",
  },
  {
    icon: Zap,
    title: "Full-speed access",
    body: "Priority delivery from the CDN — no throttling on streams or downloads.",
  },
];

const comparison: { label: string; free: string | boolean; premium: string | boolean }[] = [
  { label: "HD & 1080p streaming", free: true, premium: true },
  { label: "4K streaming", free: `After ${FOUR_K_UNLOCK_DAYS} days`, premium: "Day one" },
  { label: "MKV downloads", free: "Daily limit", premium: "Unlimited" },
  { label: "Captcha on downloads", free: "Required", premium: "None" },
  { label: "Keep the site alive", free: false, premium: true },
];

// Render a comparison cell: boolean → check / cross, string → text.
function Cell({ value }: { value: string | boolean }) {
  if (value === true)
    return <Check className="mx-auto h-4 w-4 text-green-500" />;
  if (value === false)
    return <X className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  return <>{value}</>;
}

function DiscordButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={DISCORD_INVITE}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752c4] ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.074.074 0 0 0-.079.037c-.34.6-.717 1.385-.98 2.001a18.27 18.27 0 0 0-5.484 0 12.7 12.7 0 0 0-.995-2.001.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C1.04 8.27.32 12.058.674 15.797a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-4.319-.838-8.073-3.549-11.401a.061.061 0 0 0-.031-.028ZM8.02 13.519c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
      </svg>
      Join our Discord
    </a>
  );
}

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-primary/15 via-card to-card px-6 py-14 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Crown className="h-3.5 w-3.5" />
            Premium
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Get the most out of HentaiClick
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            4K from day one, unlimited uncensored downloads, and no captcha —
            plus you keep the site running.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DiscordButton />
            <span className="text-sm text-muted-foreground">
              Upgrade via our Discord supporter page
            </span>
          </div>
        </div>
      </section>

      {/* Mission / what support funds — surfaced near the top for impact */}
      <section className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              The bigger goal
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Instead of only AI-uncensoring existing hentai, our aim is to{" "}
              <span className="font-medium text-foreground">
                animate and release brand-new uncensored hentai ourselves
              </span>
              . Building a full production team is a massive undertaking — and
              it only happens with strong support from premium members.
            </p>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="mt-12">
        <h2 className="mb-5 text-center text-2xl font-bold">
          Free vs Premium
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">
                  Free
                </th>
                <th className="px-5 py-3 text-center font-semibold text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-amber-400" />
                    Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 ? "bg-card" : "bg-card/40"}
                >
                  <td className="px-5 py-3 text-foreground">{row.label}</td>
                  <td className="px-5 py-3 text-center text-muted-foreground">
                    <Cell value={row.free} />
                  </td>
                  <td className="px-5 py-3 text-center font-medium text-foreground">
                    <Cell value={row.premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-8 rounded-2xl border border-border bg-gradient-to-b from-card to-primary/10 px-6 py-12 text-center">
        <Heart className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">Ready to upgrade?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Join our Discord server and follow the supporter page for upgrade
          instructions. Premium directly funds new uncensored releases.
        </p>
        <div className="mt-6">
          <DiscordButton />
        </div>
      </section>
    </div>
  );
}
