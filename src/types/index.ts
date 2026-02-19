export type { Database, Tables, Profile, Studio, Genre, Series, Episode, Rating, Comment, Favorite, Playlist, PlaylistEpisode, DownloadLog, AuditLog, SitePage } from "./database";

// Episode with joined relations (for display)
export interface EpisodeWithRelations {
  id: string;
  series_id: string | null;
  season_no: number;
  episode_no: number;
  title: string;
  slug: string;
  cdn_slug: string;
  download_filename: string;
  available_qualities: number[];
  gallery_urls: string[];
  poster_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  upload_date: string;
  release_date: string | null;
  status: "draft" | "published" | "hidden";
  rating_avg: number;
  rating_count: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  views_7d: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  series?: {
    title: string;
    slug: string;
    studio?: {
      name: string;
      slug: string;
    } | null;
  } | null;
  genres?: {
    id: string;
    name: string;
    slug: string;
  }[];
}

// User context for access control
export interface UserContext {
  id: string | null;
  role: "guest" | "user" | "moderator" | "admin";
  isPremium: boolean;
}
