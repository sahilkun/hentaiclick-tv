import Image from "next/image";
import Link from "next/link";
import type { GenreWithPosters } from "@/lib/queries/episodes";

interface GenreCategoriesProps {
  genres: GenreWithPosters[];
}

function GenreCard({ genre }: { genre: GenreWithPosters }) {
  const posters = genre.posters.filter(Boolean);

  return (
    <Link
      href={`/search?genres=${genre.slug}`}
      className="group block overflow-hidden rounded-lg bg-neutral-800/80 shadow-lg transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Genre name on top */}
      <h3 className="py-2.5 text-center text-sm font-bold text-foreground group-hover:text-primary transition-colors">
        {genre.name}
      </h3>

      {/* Poster images row */}
      <div className="relative h-44 sm:h-48 overflow-hidden">
        {posters.length >= 3 ? (
          <>
            <Image src={posters[0]} alt={genre.name} width={160} height={220} sizes="33vw" className="absolute w-[35%] h-[90%] rounded-md object-cover shadow-md left-[5%] top-[5%] -rotate-[12deg] z-0" />
            <Image src={posters[1]} alt={genre.name} width={160} height={220} sizes="33vw" className="absolute w-[35%] h-[90%] rounded-md object-cover shadow-lg left-1/2 -translate-x-1/2 top-[2%] z-10" />
            <Image src={posters[2]} alt={genre.name} width={160} height={220} sizes="33vw" className="absolute w-[35%] h-[90%] rounded-md object-cover shadow-lg right-[5%] top-[10%] rotate-[12deg] z-20" />
          </>
        ) : posters.length === 2 ? (
          <>
            <Image src={posters[0]} alt={genre.name} width={160} height={220} sizes="40vw" className="absolute w-[40%] h-[90%] rounded-md object-cover shadow-md left-[10%] top-[5%] -rotate-[8deg] z-0" />
            <Image src={posters[1]} alt={genre.name} width={160} height={220} sizes="40vw" className="absolute w-[40%] h-[90%] rounded-md object-cover shadow-lg right-[10%] top-[5%] rotate-[8deg] z-10" />
          </>
        ) : posters.length === 1 ? (
          <Image src={posters[0]} alt={genre.name} width={200} height={260} sizes="50vw" className="absolute w-[50%] h-[90%] rounded-md object-cover shadow-lg left-1/2 -translate-x-1/2 top-[5%]" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No posters yet</div>
        )}
      </div>
    </Link>
  );
}

export function GenreCategories({ genres }: GenreCategoriesProps) {
  if (genres.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Popular Genres</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {genres.map((genre) => (
          <GenreCard key={genre.id} genre={genre} />
        ))}
      </div>
    </div>
  );
}
