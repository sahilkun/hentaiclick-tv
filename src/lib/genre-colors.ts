/** Genre color map — shared between episode cards and watch page */

export const WARNING_GENRES = new Set(["gore", "horror", "scat", "rape"]);

const GENRE_COLORS: Record<string, { text: string; hover: string }> = {
  "4k": { text: "text-emerald-400", hover: "hover:bg-emerald-500/35" },
  vanilla: { text: "text-pink-400", hover: "hover:bg-pink-500/35" },
  censored: { text: "text-yellow-500", hover: "hover:bg-yellow-500/35" },
  uncensored: { text: "text-emerald-400", hover: "hover:bg-emerald-500/35" },
  ntr: { text: "text-red-400", hover: "hover:bg-red-500/35" },
  rape: { text: "text-red-600", hover: "hover:bg-red-700 hover:text-white" },
  netorare: { text: "text-red-400", hover: "hover:bg-red-500/35" },
  "48fps": { text: "text-cyan-400", hover: "hover:bg-cyan-500/35" },
  milf: { text: "text-amber-300", hover: "hover:bg-amber-400/35" },
  "big-boobs": { text: "text-orange-300", hover: "hover:bg-orange-400/35" },
  creampie: { text: "text-rose-300", hover: "hover:bg-rose-400/35" },
  ahegao: { text: "text-fuchsia-400", hover: "hover:bg-fuchsia-500/35" },
  anal: { text: "text-violet-400", hover: "hover:bg-violet-500/35" },
  "public-sex": { text: "text-sky-400", hover: "hover:bg-sky-500/35" },
  harem: { text: "text-indigo-400", hover: "hover:bg-indigo-500/35" },
  loli: { text: "text-pink-300", hover: "hover:bg-pink-400/35" },
  shota: { text: "text-teal-400", hover: "hover:bg-teal-500/35" },
  yuri: { text: "text-purple-400", hover: "hover:bg-purple-500/35" },
  "school-girl": { text: "text-blue-400", hover: "hover:bg-blue-500/35" },
  tentacle: { text: "text-lime-400", hover: "hover:bg-lime-500/35" },
  femdom: { text: "text-rose-400", hover: "hover:bg-rose-500/35" },
  incest: { text: "text-orange-400", hover: "hover:bg-orange-500/35" },
  bondage: { text: "text-violet-300", hover: "hover:bg-violet-400/35" },
  "x-ray": { text: "text-sky-300", hover: "hover:bg-sky-400/35" },
  blowjob: { text: "text-pink-400", hover: "hover:bg-pink-500/35" },
  threesome: { text: "text-amber-400", hover: "hover:bg-amber-500/35" },
  gangbang: { text: "text-red-300", hover: "hover:bg-red-400/35" },
  fantasy: { text: "text-indigo-300", hover: "hover:bg-indigo-400/35" },
  gore: { text: "text-red-600", hover: "hover:bg-red-700 hover:text-white" },
  horror: { text: "text-red-600", hover: "hover:bg-red-700 hover:text-white" },
  scat: { text: "text-red-600", hover: "hover:bg-red-700 hover:text-white" },
  elf: { text: "text-emerald-300", hover: "hover:bg-emerald-400/35" },
  maid: { text: "text-blue-300", hover: "hover:bg-blue-400/35" },
  succubus: { text: "text-fuchsia-300", hover: "hover:bg-fuchsia-400/35" },
  bdsm: { text: "text-violet-400", hover: "hover:bg-violet-500/35" },
  romance: { text: "text-pink-400", hover: "hover:bg-pink-500/35" },
};

/** Returns Tailwind color classes for a genre slug */
export function genreColor(slug: string): string {
  const colors = GENRE_COLORS[slug];
  return colors
    ? `${colors.text} ${colors.hover}`
    : "text-foreground hover:bg-white/15";
}
