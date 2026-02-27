import Image from "next/image";
import Link from "next/link";
import type { GenreWithPosters } from "@/lib/queries/episodes";

interface GenreCategoriesProps {
  genres: GenreWithPosters[];
}

/** A single placeholder poster (gradient block) for when no real posters exist */
function PlaceholderPoster({ className }: { className: string }) {
  return (
    <div
      className={`${className} bg-gradient-to-br from-primary/30 to-primary/10`}
    />
  );
}

function GenreCard({ genre }: { genre: GenreWithPosters }) {
  const [img1, img2, img3] = genre.posters;

  return (
    <Link
      href={`/search?genres=${genre.slug}`}
      className="relative mx-auto w-96 sm:w-full h-56 bg-neutral-800 text-white rounded-lg overflow-hidden shadow-lg mt-4 transition ease-in-out hover:-translate-y-1 hover:scale-[1.05] duration-300"
    >
      {/* Genre name */}
      <h2 className="text-lg font-semibold text-center pt-2">{genre.name}</h2>

      {/* Stacked poster images (3 cards fanned out) */}
      {/* Left card – rotated -15deg */}
      {img1 ? (
        <Image
          src={img1}
          alt={genre.name}
          width={128}
          height={176}
          className="absolute w-32 h-44 rounded-lg object-cover shadow-md left-4 top-4 -rotate-[15deg] z-0"
        />
      ) : (
        <PlaceholderPoster className="absolute w-32 h-44 rounded-lg shadow-md left-4 top-4 -rotate-[15deg] z-0" />
      )}

      {/* Center card – straight */}
      {img2 ? (
        <Image
          src={img2}
          alt={genre.name}
          width={128}
          height={176}
          className="absolute w-32 h-44 rounded-lg object-cover shadow-lg top-4 left-1/2 -translate-x-1/2 z-10"
        />
      ) : (
        <PlaceholderPoster className="absolute w-32 h-44 rounded-lg shadow-lg top-4 left-1/2 -translate-x-1/2 z-10" />
      )}

      {/* Right card – rotated +15deg */}
      {img3 ? (
        <Image
          src={img3}
          alt={genre.name}
          width={128}
          height={176}
          className="absolute w-32 h-44 rounded-lg object-cover shadow-lg right-4 top-14 rotate-[15deg] z-20"
        />
      ) : (
        <PlaceholderPoster className="absolute w-32 h-44 rounded-lg shadow-lg right-4 top-14 rotate-[15deg] z-20" />
      )}
    </Link>
  );
}

export function GenreCategories({ genres }: GenreCategoriesProps) {
  if (genres.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Popular Genres</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        {genres.map((genre) => (
          <GenreCard key={genre.id} genre={genre} />
        ))}
      </div>
    </div>
  );
}
