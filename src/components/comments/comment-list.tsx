"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Reply, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentForm } from "./comment-form";

interface CommentData {
  id: string;
  episode_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentListProps {
  episodeId: string;
  className?: string;
}

export function CommentList({ episodeId, className }: CommentListProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?episode_id=${episodeId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [episodeId]);

  // Build threaded structure
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <CommentForm episodeId={episodeId} onSubmit={fetchComments} />

      {rootComments.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No comments yet. Be the first!
        </p>
      )}

      {rootComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={getReplies(comment.id)}
          episodeId={episodeId}
          onReply={fetchComments}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  episodeId,
  onReply,
  isReply = false,
}: {
  comment: CommentData;
  replies: CommentData[];
  episodeId: string;
  onReply: () => void;
  isReply?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className={cn("space-y-3", isReply && "ml-8 border-l-2 border-border pl-4")}>
      <div>
        {/* Header */}
        <div className="flex items-center gap-2">
          {comment.user.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.display_name}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium">
            {comment.user.display_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Content */}
        <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>

        {/* Actions */}
        {!isReply && (
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-8">
          <CommentForm
            episodeId={episodeId}
            parentId={comment.id}
            onSubmit={() => {
              setShowReplyForm(false);
              onReply();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Replies */}
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={[]}
          episodeId={episodeId}
          onReply={onReply}
          isReply
        />
      ))}
    </div>
  );
}
