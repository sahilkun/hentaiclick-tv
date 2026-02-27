-- Performance indexes for watch page queries, comment lookups, and genre/series joins.

-- Comments by episode (watch page comment list)
CREATE INDEX IF NOT EXISTS idx_comments_episode
  ON public.comments (episode_id, created_at ASC)
  WHERE status = 'approved';

-- Ratings by episode (rating breakdown)
CREATE INDEX IF NOT EXISTS idx_ratings_episode
  ON public.ratings (episode_id);

-- Episodes by series (watch page sidebar)
CREATE INDEX IF NOT EXISTS idx_episodes_series_published
  ON public.episodes (series_id, season_no ASC, episode_no ASC)
  WHERE status = 'published';

-- Episodes by studio (watch page sidebar)
CREATE INDEX IF NOT EXISTS idx_episodes_studio_published
  ON public.episodes (studio_id, views_7d DESC)
  WHERE status = 'published';

-- Genre reverse lookup (genre pages, search filters)
CREATE INDEX IF NOT EXISTS idx_episode_genres_genre
  ON public.episode_genres (genre_id);

-- Series genre reverse lookup (genre fallback queries)
CREATE INDEX IF NOT EXISTS idx_series_genres_genre
  ON public.series_genres (genre_id);

-- Series genre by series (episode genre fallback)
CREATE INDEX IF NOT EXISTS idx_series_genres_series
  ON public.series_genres (series_id);
