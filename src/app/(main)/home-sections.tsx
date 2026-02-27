import {
  getEpisodes,
  getGenresWithPosters,
  getLatestComments,
} from "@/lib/queries/episodes";
import { HomeTabs } from "./home-tabs";
import { GenreCategories } from "@/components/genre/genre-categories";
import { LatestComments } from "@/components/comments/latest-comments";

export async function PrimaryEpisodeTabs() {
  const [recentlyUploaded, recentlyReleased, topViewedWeekly] =
    await Promise.all([
      getEpisodes("recently_uploaded", 12).catch(() => []),
      getEpisodes("recently_released", 12).catch(() => []),
      getEpisodes("trending", 12).catch(() => []),
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
    getEpisodes("most_views", 12).catch(() => []),
    getEpisodes("most_likes", 12).catch(() => []),
    getEpisodes("highest_rated", 12).catch(() => []),
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
  const genres = await getGenresWithPosters().catch(() => []);
  if (genres.length === 0) return null;
  return <GenreCategories genres={genres} />;
}

export async function LatestCommentsSection() {
  const comments = await getLatestComments(10).catch(() => []);
  if (comments.length === 0) return null;
  return <LatestComments comments={comments} />;
}
