-- Performance indexes for common homepage and listing queries.
-- All partial indexes filter on status = 'published' to match the most frequent query pattern.

CREATE INDEX IF NOT EXISTS idx_episodes_published_upload
  ON public.episodes (upload_date DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_episodes_published_views7d
  ON public.episodes (views_7d DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_episodes_published_views
  ON public.episodes (view_count DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_episodes_published_likes
  ON public.episodes (like_count DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_episodes_published_rating
  ON public.episodes (rating_avg DESC, rating_count DESC)
  WHERE status = 'published' AND rating_count > 0;

CREATE INDEX IF NOT EXISTS idx_episodes_published_release
  ON public.episodes (release_date DESC NULLS LAST)
  WHERE status = 'published';

-- Reverse lookup: find genres for a batch of episodes
CREATE INDEX IF NOT EXISTS idx_episode_genres_episode
  ON public.episode_genres (episode_id);

-- Latest approved root comments (homepage section)
CREATE INDEX IF NOT EXISTS idx_comments_latest
  ON public.comments (created_at DESC)
  WHERE status = 'approved' AND parent_id IS NULL;
