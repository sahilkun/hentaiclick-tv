-- meili-reindex.sql — Build the complete Meilisearch document for every
-- published episode, in the exact shape `episodeToSearchDocument()` in
-- src/lib/meilisearch/sync.ts produces. One JSON object per row,
-- written to stdout via COPY for streaming to Meili's bulk-index POST.
--
-- Joins: studios, series (+ series.studio for fallback name/slug),
--   episode_genres → genres (primary) with series_genres → genres as
--   fallback when an episode has zero direct genres.
COPY (
  WITH ep AS (
    SELECT
      e.id,
      e.title,
      e.regional_name,
      e.slug,
      e.thumbnail_url,
      e.stream_links,
      e.gallery_urls,
      e.poster_url,
      e.status,
      e.meta_description,
      e.rating_avg, e.rating_count,
      e.view_count, e.like_count, e.comment_count, e.views_7d,
      e.upload_date, e.release_date, e.duration_seconds,
      e.series_id,
      st.name AS direct_studio_name, st.slug AS direct_studio_slug,
      s.title AS series_title, s.slug AS series_slug,
      st2.name AS series_studio_name, st2.slug AS series_studio_slug
    FROM episodes e
    LEFT JOIN studios st  ON st.id  = e.studio_id
    LEFT JOIN series  s   ON s.id   = e.series_id
    LEFT JOIN studios st2 ON st2.id = s.studio_id
    WHERE e.status = 'published'
  ),
  ep_genres AS (
    SELECT eg.episode_id,
           array_agg(g.name ORDER BY g.name) AS names,
           array_agg(g.slug ORDER BY g.name) AS slugs
    FROM episode_genres eg JOIN genres g ON g.id = eg.genre_id
    GROUP BY eg.episode_id
  ),
  series_genres_agg AS (
    SELECT sg.series_id,
           array_agg(g.name ORDER BY g.name) AS names,
           array_agg(g.slug ORDER BY g.name) AS slugs
    FROM series_genres sg JOIN genres g ON g.id = sg.genre_id
    GROUP BY sg.series_id
  )
  SELECT json_build_object(
    'id',                 ep.id,
    'title',              ep.title,
    'regionalName',       COALESCE(ep.regional_name, ''),
    'slug',               ep.slug,
    'thumbnailUrl',       ep.thumbnail_url,
    'seriesTitle',        COALESCE(ep.series_title, ''),
    'seriesSlug',         COALESCE(ep.series_slug, ''),
    'studioName',         COALESCE(ep.direct_studio_name, ep.series_studio_name, ''),
    'studioSlug',         COALESCE(ep.direct_studio_slug, ep.series_studio_slug, ''),
    'genreNames',         COALESCE(epg.names, sgg.names, ARRAY[]::text[]),
    'genreSlugs',         COALESCE(epg.slugs, sgg.slugs, ARRAY[]::text[]),
    'availableQualities', (
      SELECT COALESCE(array_agg((q.k)::int ORDER BY (q.k)::int), ARRAY[]::int[])
      FROM jsonb_each_text(COALESCE(ep.stream_links, '{}'::jsonb)) AS q(k, v)
      WHERE q.k ~ '^[0-9]+$'
    ),
    'ratingAvg',          ep.rating_avg,
    'ratingCount',        ep.rating_count,
    'viewCount',          ep.view_count,
    'likeCount',          ep.like_count,
    'commentCount',       ep.comment_count,
    'views7d',            ep.views_7d,
    'uploadDate',         ep.upload_date,
    'releaseDate',        ep.release_date,
    'durationSeconds',    ep.duration_seconds,
    'galleryUrls',        COALESCE(ep.gallery_urls, ARRAY[]::text[]),
    'posterUrl',          ep.poster_url,
    'status',             ep.status,
    'description',        COALESCE(ep.meta_description, ''),
    'year',               CASE WHEN ep.release_date IS NOT NULL
                                THEN EXTRACT(YEAR FROM ep.release_date)::int
                                ELSE NULL END
  )
  FROM ep
  LEFT JOIN ep_genres       epg ON epg.episode_id = ep.id
  LEFT JOIN series_genres_agg sgg ON sgg.series_id  = ep.series_id
) TO STDOUT;
