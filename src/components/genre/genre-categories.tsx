import Image from "next/image";
import Link from "next/link";
import type { GenreWithPosters } from "@/lib/queries/episodes";

interface GenreCategoriesProps {
  genres: GenreWithPosters[];
}

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
      className="group mx-auto w-96 sm:w-full mt-4 transition ease-in-out hover:-translate-y-1 duration-300"
    >
      {/* Card with poster images */}
      <div className="relative h-48 bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
        {img1 ? (
          <Image
            src={img1}
            alt={genre.name}
            width={128}
            height={176}
            sizes="128px"
            className="absolute w-32 h-44 rounded-lg object-cover shadow-md left-4 top-2 -rotate-[15deg] z-0"
          />
        ) : (
          <PlaceholderPoster className="absolute w-32 h-44 rounded-lg shadow-md left-4 top-2 -rotate-[15deg] z-0" />
        )}

        {img2 ? (
          <Image
            src={img2}
            alt={genre.name}
            width={128}
            height={176}
            sizes="128px"
            className="absolute w-32 h-44 rounded-lg object-cover shadow-lg top-2 left-1/2 -translate-x-1/2 z-10"
          />
        ) : (
          <PlaceholderPoster className="absolute w-32 h-44 rounded-lg shadow-lg top-2 left-1/2 -translate-x-1/2 z-10" />
        )}

        {img3 ? (
          <Image
            src={img3}
            alt={genre.name}
            width={128}
            height={176}
            sizes="128px"
            className="absolute w-32 h-44 rounded-lg object-cover shadow-lg right-4 top-8 rotate-[15deg] z-20"
          />
        ) : (
          <PlaceholderPoster className="absolute w-32 h-44 rounded-lg shadow-lg right-4 top-8 rotate-[15deg] z-20" />
        )}
      </div>

      {/* Genre name below the card */}
      <h3 className="text-center text-sm font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">{genre.name}</h3>
    </Link>
  );
}

export function GenreCategories({ genres }: GenreCategoriesProps) {
  if (genres.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Popular Genres</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {genres.map((genre) => (
          <GenreCard key={genre.id} genre={genre} />
        ))}
      </div>
    </div>
  );
}
