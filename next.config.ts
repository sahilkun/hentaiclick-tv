import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
  },
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true, // Bypass Next.js image optimizer because pushr.io hotlink protection rejects server-to-server fetches
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hentaiclick.tv",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cdn.rootserver1.com",
      },
      {
        protocol: "https",
        hostname: "cdn.rootserver2.com",
      },
    ],
  },
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },
  async headers() {
    // Standard security headers — harmless on every response, including
    // machine-readable files.
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      { key: "X-XSS-Protection", value: "1; mode=block" },
    ];

    const contentSecurityPolicy = {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com wss://*.supabase.co https://challenges.cloudflare.com " +
          "https://cdn.hentaiclick.tv https://cdn.rootserver1.com " +
          (process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL + " " : "") +
          (process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? ""),
        "frame-src https://challenges.cloudflare.com",
        "media-src 'self' blob: https://cdn.hentaiclick.tv https://cdn.rootserver1.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
    };

    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // CSP on every page EXCEPT sitemap.xml / robots.txt. Those are
        // machine-readable files with no scripts or embedded content, so
        // a CSP serves no security purpose — and worse, Chrome's built-in
        // XML viewer relies on inline scripts to render sitemap.xml, which
        // the CSP blocks, leaving the sitemap looking blank in a browser.
        // (Googlebot is unaffected — it parses the raw XML, no viewer.)
        source: "/((?!sitemap.xml|robots.txt).*)",
        headers: [contentSecurityPolicy],
      },
    ];
  },
};

export default nextConfig;
