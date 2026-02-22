"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Share2,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VideoPlayer } from "@/components/player/video-player";
import { EpisodeList } from "@/components/episode/episode-list";
import { SidebarCard } from "@/components/episode/sidebar-card";
import { DownloadModal } from "@/components/episode/download-modal";
import { CommentList } from "@/components/comments/comment-list";
import { RatingPicker } from "@/components/user/rating-picker";
import { FavoriteButton } from "@/components/user/favorite-button";
import { AddToPlaylist } from "@/components/user/add-to-playlist";
import { PlaylistSidebar } from "@/components/user/playlist-sidebar";
import { CircularRating } from "@/components/ui/circular-rating";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import { getStreamableQualities } from "@/lib/access";
import { deriveStreamQualities } from "@/lib/cdn";
import { QUALITY_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import type { EpisodeWithRelations, UserContext } from "@/types";

/* ─── Genre color map (text + hover bg) ─── */
const GENRE_COLORS: Record<string, { text: string; hover: string }> = {
  "4k": { text: "text-emerald-400", hover: "hover:bg-emerald-500/35" },
  vanilla: { text: "text-pink-400", hover: "hover:bg-pink-500/35" },
  censored: { text: "text-yellow-500", hover: "hover:bg-yellow-500/35" },
  uncensored: { text: "text-emerald-400", hover: "hover:bg-emerald-500/35" },
  ntr: { text: "text-red-400", hover: "hover:bg-red-500/35" },
  rape: { text: "text-red-400", hover: "hover:bg-red-500/35" },
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
};

function genreColor(slug: string) {
  const colors = GENRE_COLORS[slug];
  return colors
    ? `${colors.text} ${colors.hover}`
    : "text-foreground hover:bg-white/15";
}

/* ─── Props ─── */
interface WatchPageClientProps {
  episode: EpisodeWithRelations;
  seriesEpisodes: EpisodeWithRelations[];
  studioEpisodes: EpisodeWithRelations[];
  popularWeekly: EpisodeWithRelations[];
  playlistId?: string;
}

export function WatchPageClient({
  episode,
  seriesEpisodes,
  studioEpisodes,
  popularWeekly,
  playlistId,
}: WatchPageClientProps) {
  const { user } = useAuth();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch user's existing rating and favorite status
  useEffect(() => {
    if (!user) return;
    fetch(`/api/episodes/${episode.id}/rate`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch rating");
        return r.json();
      })
      .then((data) => setUserRating(data.score ?? null))
      .catch(() => {});

    fetch(`/api/favorites?episode_id=${episode.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch favorite");
        return r.json();
      })
      .then((data) => setIsFavorited(data.favorited))
      .catch(() => {});
  }, [user, episode.id]);

  const userContext: UserContext = {
    id: user?.id ?? null,
    role: user
      ? (user.role as "user" | "moderator" | "admin")
      : "guest",
    isPremium: user?.is_premium ?? false,
  };

  const streamQualities = deriveStreamQualities(episode.stream_links);
  const allowedQualities = getStreamableQualities(
    streamQualities,
    userContext,
    episode.upload_date
  );

  const handleView = useCallback(async () => {
    try {
      await fetch(`/api/episodes/${episode.id}/view`, { method: "POST" });
    } catch {}
  }, [episode.id]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const qualityBadge = streamQualities
    .sort((a, b) => b - a)
    .map((q) => QUALITY_LABELS[q] ?? `${q}p`)
    .join(" | ");

  // Resolve studio name
  const studioName = episode.studio?.name ?? episode.series?.studio?.name;
  const studioSlug = episode.studio?.slug ?? episode.series?.studio?.slug;

  // Gallery: show 5 initially, rest on expand
  const galleryImages = episode.gallery_urls ?? [];
  const GALLERY_PREVIEW = 5;
  const visibleGallery = showAllGallery
    ? galleryImages
    : galleryImages.slice(0, GALLERY_PREVIEW);

  // Determine which sidebar sections to show
  const hasSidebar =
    seriesEpisodes.length > 0 ||
    studioEpisodes.length > 0 ||
    popularWeekly.length > 0;

  return (
    <div>
      {/* ── Top area: Player + Sidebar ── */}
      <div className="flex flex-col xl:flex-row gap-4 px-4 max-w-[90%] mx-auto">
        {/* Player — takes remaining width */}
        <div className="flex-1 min-w-0">
          <VideoPlayer
            streamLinks={episode.stream_links}
            subtitleLinks={episode.subtitle_links}
            thumbnailPath={episode.thumbnail_path}
            availableQualities={streamQualities}
            allowedQualities={allowedQualities}
            onView={handleView}
          />
        </div>

        {/* ── Right Sidebar next to player (xl+) ── */}
        {(hasSidebar || playlistId) && (
          <div className="hidden xl:flex xl:flex-col w-[300px] shrink-0 max-h-[calc((90vw-348px)*9/16)] overflow-y-auto">
            <div className="space-y-5">
              {/* Playlist sidebar (when playing from playlist) */}
              {playlistId && (
                <PlaylistSidebar
                  playlistId={playlistId}
                  currentEpisodeId={episode.id}
                />
              )}

              {/* Series episodes */}
              {seriesEpisodes.length > 1 && (
                <div>
                  <h3 className="mb-2.5 text-sm font-bold text-foreground">
                    Episodes ({seriesEpisodes.length})
                  </h3>
                  <div className="space-y-3">
                    {seriesEpisodes.map((ep) => (
                      <SidebarCard
                        key={ep.id}
                        episode={ep}
                        isCurrent={ep.id === episode.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Studio episodes */}
              {studioEpisodes.length > 0 && studioName && (
                <div>
                  <h3 className="mb-2.5 text-sm font-bold text-foreground">
                    More from Studio{" "}
                    {studioSlug ? (
                      <Link
                        href={`/studios/${studioSlug}`}
                        className="text-primary hover:underline"
                      >
                        {studioName}
                      </Link>
                    ) : (
                      <span className="text-primary">{studioName}</span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {studioEpisodes.map((ep) => (
                      <SidebarCard key={ep.id} episode={ep} />
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Weekly */}
              {popularWeekly.length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-sm font-bold text-foreground">
                    Popular Weekly
                  </h3>
                  <div className="space-y-3">
                    {popularWeekly.map((ep) => (
                      <SidebarCard key={ep.id} episode={ep} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Episode Info Section ── */}
      <div className="mx-auto max-w-7xl px-4 py-6">
            {/* Header: Poster + Title + Meta */}
            <div className="flex gap-4 pb-5 border-b border-white/20">
              {episode.poster_url && (
                <img
                  src={episode.poster_url}
                  alt={episode.title}
                  className="hidden h-36 w-24 rounded-lg object-cover shadow-md sm:block"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-primary sm:text-2xl">
                  {episode.title}
                </h1>
                {episode.series && (
                  <Link
                    href={`/series/${episode.series.slug}`}
                    className="mt-0.5 block text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {episode.series.title}
                  </Link>
                )}

                {/* Dates & Studio row */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(episode.upload_date), {
                      addSuffix: true,
                    })}
                  </span>
                  {episode.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(episode.release_date).toLocaleDateString()}
                    </span>
                  )}
                  {studioName && (
                    <span className="text-muted-foreground">|</span>
                  )}
                  {studioName && studioSlug && (
                    <Link
                      href={`/studios/${studioSlug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {studioName}
                    </Link>
                  )}
                </div>

                {/* Stats + Actions row */}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatNumber(episode.view_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {formatNumber(episode.like_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {formatNumber(episode.comment_count)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDownloadOpen(true)}
                      className="gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </>
                      )}
                    </Button>
                    <AddToPlaylist episodeId={episode.id} />
                    <FavoriteButton episodeId={episode.id} initialFavorited={isFavorited} />
                  </div>
                </div>
              </div>

              {/* Rating badge - large */}
              <div className="hidden sm:flex flex-col items-center justify-start shrink-0">
                <CircularRating
                  rating={episode.rating_avg}
                  count={episode.rating_count}
                  size={56}
                  strokeWidth={4}
                />
                {episode.rating_count > 0 && (
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {episode.rating_count} votes
                  </span>
                )}
              </div>
            </div>

            {/* ── Description ── */}
            {episode.meta_description && (
              <div className="mt-5 pb-5 border-b border-white/20">
                <h2 className="mb-2 text-sm font-bold text-primary">
                  Description
                </h2>
                <p
                  className={cn(
                    "text-base leading-relaxed text-foreground/90",
                    !showFullDescription && "line-clamp-3"
                  )}
                >
                  {episode.meta_description}
                </p>
                {episode.meta_description.length > 200 && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                    onClick={() =>
                      setShowFullDescription(!showFullDescription)
                    }
                  >
                    {showFullDescription ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {/* ── Genres ── */}
            {episode.genres && episode.genres.length > 0 && (
              <div className="mt-5 pb-5 border-b border-white/20">
                <h2 className="mb-3 text-sm font-bold text-primary">
                  Genres
                </h2>
                <div className="flex flex-wrap items-center">
                  {episode.genres.map((genre, i) => (
                    <span key={genre.id} className="flex items-center">
                      {i > 0 && (
                        <span className="mx-1 text-muted-foreground/40 select-none">|</span>
                      )}
                      <Link
                        href={`/search?genres=${genre.slug}`}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                          genreColor(genre.slug)
                        )}
                      >
                        {genre.name}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gallery ── */}
            {galleryImages.length > 0 && (
              <div className="mt-5 pb-5 border-b border-white/20">
                <h2 className="mb-3 text-sm font-bold text-primary">
                  Gallery
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {visibleGallery.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/img relative aspect-video overflow-hidden rounded-lg"
                    >
                      <img
                        src={url}
                        alt={`Gallery ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
                {galleryImages.length > GALLERY_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllGallery(!showAllGallery)}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {showAllGallery ? (
                      <>
                        Show Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show More ({galleryImages.length - GALLERY_PREVIEW} more){" "}
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* ── Rate this episode ── */}
            <div className="mt-6 pb-5 border-b border-white/20">
              <h2 className="mb-3 text-sm font-bold text-primary">
                Rate this Episode
              </h2>
              <RatingPicker episodeId={episode.id} initialRating={userRating} />
            </div>

            {/* ── Comments ── */}
            <div className="mt-8">
              <h2 className="mb-4 text-sm font-bold text-primary">
                Comments ({episode.comment_count})
              </h2>
              <CommentList episodeId={episode.id} />
            </div>

          {/* ── Mobile/Tablet sidebar (below content on < xl) ── */}
          <div className="xl:hidden w-full space-y-8 mt-8">
            {/* Playlist (when playing from playlist) */}
            {playlistId && (
              <div className="rounded-lg border border-border p-4">
                <PlaylistSidebar
                  playlistId={playlistId}
                  currentEpisodeId={episode.id}
                />
              </div>
            )}

            {/* Series episodes */}
            {seriesEpisodes.length > 1 && (
              <div>
                <h2 className="mb-3 text-sm font-bold">
                  Episodes ({seriesEpisodes.length})
                </h2>
                <EpisodeList
                  episodes={seriesEpisodes}
                  currentEpisodeId={episode.id}
                />
              </div>
            )}

            {/* Studio episodes */}
            {studioEpisodes.length > 0 && studioName && (
              <div>
                <h2 className="mb-3 text-sm font-bold">
                  More from Studio{" "}
                  <span className="text-primary">{studioName}</span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {studioEpisodes.slice(0, 4).map((ep) => (
                    <SidebarCard key={ep.id} episode={ep} />
                  ))}
                </div>
              </div>
            )}

            {/* Popular Weekly */}
            {popularWeekly.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold">Popular This Week</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {popularWeekly.slice(0, 4).map((ep) => (
                    <SidebarCard key={ep.id} episode={ep} />
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Download Modal */}
      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        episode={episode}
        userContext={userContext}
      />
    </div>
  );
}
