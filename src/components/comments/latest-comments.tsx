import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import type { LatestComment } from "@/lib/queries/episodes";

interface LatestCommentsProps {
  comments: LatestComment[];
}

function CommentCard({ comment }: { comment: LatestComment }) {
  const { user, episode } = comment;
  const posterSrc = episode.poster_url || episode.thumbnail_url;

  return (
    <div className="flex p-4 bg-neutral-950 rounded-lg">
      {/* Left – Episode poster */}
      <Link
        href={`/episode/${episode.slug}`}
        className="shrink-0 mr-5 relative transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300"
      >
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={episode.title}
            width={120}
            height={175}
            className="w-[120px] aspect-[11/16] rounded-lg object-cover object-center"
          />
        ) : (
          <div className="w-[120px] aspect-[11/16] rounded-lg bg-gradient-to-br from-primary/30 to-primary/10" />
        )}
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 w-[120px]">
          {episode.title}
        </p>
      </Link>

      {/* Right – Comment content */}
      <div className="flex-1 min-w-0 pt-2 bg-neutral-800 rounded-lg pl-4 pr-4 pb-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.display_name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Username + Comment + Time */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {user.display_name || user.username}
            </p>
            <p className="mt-1 text-sm text-foreground/80 line-clamp-3">
              {comment.content}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LatestComments({ comments }: LatestCommentsProps) {
  if (comments.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Latest Comments</h2>
      <div className="grid gap-2 grid-cols-1 xl:grid-cols-2">
        {comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
