import {
  getEpisodes,
  getGenresWithPosters,
  getLatestComments,
} from "@/lib/queries/episodes";
import { getContinueWatching } from "@/lib/queries/watch-progress";
import { HomeTabs } from "./home-tabs";
import { GenreCategories } from "@/components/genre/genre-categories";
import { LatestComments } from "@/components/comments/latest-comments";
import { ContinueWatchingShelf } from "@/components/episode/continue-watching-shelf";

/**
 * Continue Watching shelf for logged-in users. Renders nothing for
 * anonymous users (the underlying query returns []). Streamed in via
 * Suspense like the other homepage sections so it doesn't block the
 * rest of the page if auth cookies are slow.
 */
export async function ContinueWatchingSection() {
  const items = await getContinueWatching(12).catch(() => []);
  if (items.length === 0) return null;
  return <ContinueWatchingShelf episodes={items} />;
}

function catchAndLog(label: string) {
  return (err: unknown) => {
    console.error(`[${label}]`, err instanceof Error ? err.message : err);
    return [] as never[];
  };
}

export async function PrimaryEpisodeTabs() {
  const [recentlyUploaded, recentlyReleased, topViewedWeekly] =
    await Promise.all([
      getEpisodes("recently_uploaded", 12).catch(catchAndLog("recently_uploaded")),
      getEpisodes("recently_released", 12).catch(catchAndLog("recently_released")),
      getEpisodes("trending", 12).catch(catchAndLog("trending")),
    ]);

  return (
    <HomeTabs
      primarySections={{
        "Recently Uploaded": recentlyUploaded,
        "Recently Released": recentlyReleased,
        "Top Viewed This Week": topViewedWeekly,
      }}
      secondarySections={{}}
    />
  );
}

export async function SecondaryEpisodeTabs() {
  const [mostViews, mostLikes, highestRated] = await Promise.all([
    getEpisodes("most_views", 12).catch(catchAndLog("most_views")),
    getEpisodes("most_likes", 12).catch(catchAndLog("most_likes")),
    getEpisodes("highest_rated", 12).catch(catchAndLog("highest_rated")),
  ]);

  return (
    <HomeTabs
      primarySections={{}}
      secondarySections={{
        "Most Views": mostViews,
        "Most Favorited": mostLikes,
        "Highest Rated - Weekly": highestRated,
      }}
    />
  );
}

export async function GenreCategoriesSection() {
  const genres = await getGenresWithPosters().catch(catchAndLog("genres_with_posters"));
  if (genres.length === 0) return null;
  return <GenreCategories genres={genres} />;
}

export async function LatestCommentsSection() {
  const comments = await getLatestComments(10).catch(catchAndLog("latest_comments"));
  if (comments.length === 0) return null;
  return <LatestComments comments={comments} />;
}
