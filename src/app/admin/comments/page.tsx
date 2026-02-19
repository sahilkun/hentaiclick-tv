"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface CommentRow {
  id: string;
  content: string;
  status: string;
  created_at: string;
  user: { username: string; display_name: string } | null;
  episode: { title: string; slug: string } | null;
}

const tabs = ["pending", "approved", "rejected"] as const;

export default function AdminCommentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("pending");
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select(
        `id, content, status, created_at, user:user_id (username, display_name), episode:episode_id (title, slug)`
      )
      .eq("status", activeTab)
      .order("created_at", { ascending: false })
      .limit(50);

    setComments((data ?? []) as unknown as CommentRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [activeTab]);

  const updateStatus = async (
    commentId: string,
    newStatus: "approved" | "rejected"
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .update({ status: newStatus })
      .eq("id", commentId);

    if (error) {
      toast(error.message, "error");
    } else {
      toast(`Comment ${newStatus}`, "success");
      fetchComments();
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Comment Moderation</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium capitalize",
              tab === activeTab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No {activeTab} comments.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">
                    {comment.user?.display_name ?? "Unknown"}
                  </span>{" "}
                  on{" "}
                  <span className="text-primary">
                    {comment.episode?.title ?? "Unknown Episode"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mb-3 text-sm">{comment.content}</p>

              {activeTab === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(comment.id, "approved")}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(comment.id, "rejected")}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
