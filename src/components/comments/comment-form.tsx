"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import Link from "next/link";

interface CommentFormProps {
  episodeId: string;
  parentId?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export function CommentForm({
  episodeId,
  parentId,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>{" "}
        to post a comment
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episode_id: episodeId,
          parent_id: parentId,
          content: content.trim(),
        }),
      });

      if (res.ok) {
        setContent("");
        toast(
          "Comment submitted! It will appear after approval.",
          "success"
        );
        onSubmit?.();
      } else {
        const data = await res.json();
        toast(data.error ?? "Failed to submit comment", "error");
      }
    } catch {
      toast("Failed to submit comment", "error");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/{COMMENT_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading || !content.trim()}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Comments require approval before appearing.
      </p>
    </form>
  );
}
