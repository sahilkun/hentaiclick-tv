export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string;
          role: "user" | "moderator" | "admin";
          is_premium: boolean;
          blacklisted_genres: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string;
          role?: "user" | "moderator" | "admin";
          is_premium?: boolean;
          blacklisted_genres?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string;
          role?: "user" | "moderator" | "admin";
          is_premium?: boolean;
          blacklisted_genres?: string[];
          updated_at?: string;
        };
      };
      studios: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string;
          updated_at?: string;
        };
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_subgenre: boolean;
          parent_genre_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_subgenre?: boolean;
          parent_genre_id?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          is_subgenre?: boolean;
          parent_genre_id?: string | null;
        };
      };
      series: {
        Row: {
          id: string;
          studio_id: string | null;
          title: string;
          slug: string;
          description: string;
          cover_url: string | null;
          status: "ongoing" | "completed" | "upcoming";
          year: number | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          studio_id?: string | null;
          title: string;
          slug: string;
          description?: string;
          cover_url?: string | null;
          status?: "ongoing" | "completed" | "upcoming";
          year?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          studio_id?: string | null;
          title?: string;
          slug?: string;
          description?: string;
          cover_url?: string | null;
          status?: "ongoing" | "completed" | "upcoming";
          year?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
      series_genres: {
        Row: {
          series_id: string;
          genre_id: string;
        };
        Insert: {
          series_id: string;
          genre_id: string;
        };
        Update: {
          series_id?: string;
          genre_id?: string;
        };
      };
      episodes: {
        Row: {
          id: string;
          series_id: string | null;
          season_no: number;
          episode_no: number;
          title: string;
          slug: string;
          description: string;
          cdn_slug: string;
          download_cdn_slug: string;
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
        };
        Insert: {
          id?: string;
          series_id?: string | null;
          season_no?: number;
          episode_no?: number;
          title: string;
          slug: string;
          description?: string;
          cdn_slug: string;
          download_cdn_slug?: string;
          download_filename?: string;
          available_qualities?: number[];
          gallery_urls?: string[];
          poster_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number;
          upload_date?: string;
          release_date?: string | null;
          status?: "draft" | "published" | "hidden";
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          series_id?: string | null;
          season_no?: number;
          episode_no?: number;
          title?: string;
          slug?: string;
          description?: string;
          cdn_slug?: string;
          download_cdn_slug?: string;
          download_filename?: string;
          available_qualities?: number[];
          gallery_urls?: string[];
          poster_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number;
          upload_date?: string;
          release_date?: string | null;
          status?: "draft" | "published" | "hidden";
          rating_avg?: number;
          rating_count?: number;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          views_7d?: number;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
      episode_views: {
        Row: {
          id: string;
          episode_id: string;
          user_id: string | null;
          ip_hash: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          user_id?: string | null;
          ip_hash?: string | null;
          viewed_at?: string;
        };
        Update: {
          episode_id?: string;
          user_id?: string | null;
          ip_hash?: string | null;
        };
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          episode_id: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          episode_id: string;
          score: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          score?: number;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          episode_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          status?: "pending" | "approved" | "rejected";
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          episode_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          episode_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          episode_id?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string;
          is_public: boolean;
          episode_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          slug: string;
          is_public?: boolean;
          episode_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      playlist_episodes: {
        Row: {
          id: string;
          playlist_id: string;
          episode_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          episode_id: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          position?: number;
        };
      };
      download_logs: {
        Row: {
          id: string;
          user_id: string | null;
          episode_id: string;
          quality: number;
          ip_hash: string | null;
          turnstile_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          episode_id: string;
          quality: number;
          ip_hash?: string | null;
          turnstile_token?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      audit_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_type: string;
          target_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: never;
      };
      site_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_episode_view: {
        Args: {
          p_episode_id: string;
          p_ip_hash?: string;
        };
        Returns: undefined;
      };
      get_user_4k_downloads_today: {
        Args: Record<string, never>;
        Returns: number;
      };
      recalculate_views_7d: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Common types
export type Profile = Tables<"profiles">;
export type Studio = Tables<"studios">;
export type Genre = Tables<"genres">;
export type Series = Tables<"series">;
export type Episode = Tables<"episodes">;
export type Rating = Tables<"ratings">;
export type Comment = Tables<"comments">;
export type Favorite = Tables<"favorites">;
export type Playlist = Tables<"playlists">;
export type PlaylistEpisode = Tables<"playlist_episodes">;
export type DownloadLog = Tables<"download_logs">;
export type AuditLog = Tables<"audit_logs">;
export type SitePage = Tables<"site_pages">;
