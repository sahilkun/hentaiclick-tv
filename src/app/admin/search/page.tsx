"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function AdminSearchPage() {
  const { toast } = useToast();
  const [reindexing, setReindexing] = useState(false);
  const [status, setStatus] = useState<{
    indexed: number | null;
    healthy: boolean | null;
  }>({ indexed: null, healthy: null });
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/reindex", { method: "GET" });
      const data = await res.json();
      setStatus({
        indexed: data.numberOfDocuments ?? null,
        healthy: data.healthy ?? null,
      });
    } catch {
      toast("Failed to check Meilisearch status", "error");
    }
    setChecking(false);
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await fetch("/api/admin/reindex", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast(`Reindex complete: ${data.indexed} episodes indexed`, "success");
        setStatus({ indexed: data.indexed, healthy: true });
      } else {
        toast(data.error || "Reindex failed", "error");
      }
    } catch {
      toast("Reindex request failed", "error");
    }
    setReindexing(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meilisearch</h1>

      <div className="max-w-lg space-y-6">
        {/* Status */}
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Index Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Health</span>
              <span>
                {status.healthy === null ? (
                  "—"
                ) : status.healthy ? (
                  <span className="text-green-600">Healthy</span>
                ) : (
                  <span className="text-red-600">Unhealthy</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indexed Episodes</span>
              <span>{status.indexed ?? "—"}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={checkStatus}
            disabled={checking}
          >
            {checking ? "Checking..." : "Check Status"}
          </Button>
        </div>

        {/* Reindex */}
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-2 text-lg font-semibold">Full Reindex</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Rebuilds the entire Meilisearch index from Supabase. This fetches
            all published episodes and syncs them to the search index.
          </p>
          <Button onClick={handleReindex} disabled={reindexing}>
            {reindexing ? "Reindexing..." : "Reindex All Episodes"}
          </Button>
        </div>

        {/* Config */}
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-2 text-lg font-semibold">Configuration</h2>
          <div className="space-y-2 font-mono text-xs text-muted-foreground">
            <p>
              Host:{" "}
              {process.env.NEXT_PUBLIC_MEILISEARCH_URL || "not configured"}
            </p>
            <p>Index: episodes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
