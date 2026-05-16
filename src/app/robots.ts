import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";

  // Standard private-area disallow list — applied to every user-agent.
  const privateAreas = ["/admin/", "/profile/", "/api/", "/auth/"];

  // AI-engine crawlers. Allowing these is a deliberate GEO/AEO decision:
  // we want ChatGPT, Claude, Perplexity, Gemini AI Overviews etc. to
  // discover the catalog and cite us in answers. The `Content-Signal:
  // ai-train=no` header (set by Cloudflare's managed robots.txt) still
  // declines training-data use — that's separate from crawling for
  // live answers. If Cloudflare's "Block AI Bots" feature is currently
  // injecting Disallow rules for these agents at the edge, it
  // overrides this file; turn that off in dashboard → Security → Bots.
  const aiBots = [
    "GPTBot",            // OpenAI / ChatGPT
    "ChatGPT-User",      // OpenAI live browsing
    "OAI-SearchBot",     // OpenAI search index
    "ClaudeBot",         // Anthropic (Claude)
    "Claude-Web",        // Anthropic (legacy)
    "Claude-User",       // Anthropic live browsing
    "Claude-SearchBot",  // Anthropic search index
    "PerplexityBot",     // Perplexity AI search
    "Perplexity-User",   // Perplexity user-initiated fetch
    "Google-Extended",   // Gemini / Bard / Google AI Overviews training signal
    "Applebot-Extended", // Apple Intelligence training signal
    "CCBot",             // Common Crawl (powers many open AI models)
    "Bytespider",        // ByteDance / TikTok AI
    "meta-externalagent",// Meta AI
    "Amazonbot",         // Amazon / Alexa AI
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateAreas,
      },
      // Per-AI-bot rules. Functionally identical to the wildcard, but
      // emitting them as explicit User-agent blocks makes intent
      // unambiguous to crawler operators and to anyone auditing the file
      // ("are you OK with us crawling?" → yes, there's a rule just for
      // you).
      ...aiBots.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: privateAreas,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
