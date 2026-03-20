"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, HardDrive, RefreshCw } from "lucide-react";

interface BackupFile {
  name: string;
  size: number;
  created: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBackups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/backups");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBackups(data.backups);
    } catch {
      setError("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const downloadFile = (filename: string) => {
    window.open(`/api/admin/backups?file=${encodeURIComponent(filename)}`, "_blank");
  };

  const dbBackups = backups.filter((b) => b.name.endsWith(".sql.gz") || b.name.endsWith(".sql.gz.gpg"));
  const searchBackups = backups.filter((b) => b.name.endsWith(".tar.gz") || b.name.endsWith(".tar.gz.gpg"));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Backups</h1>
        <button
          onClick={fetchBackups}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5" />
              Database Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : dbBackups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No database backups found</p>
            ) : (
              <div className="space-y-2">
                {dbBackups.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(b.size)} &middot; {formatDate(b.created)}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadFile(b.name)}
                      className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5" />
              Meilisearch Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : searchBackups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No search backups found</p>
            ) : (
              <div className="space-y-2">
                {searchBackups.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(b.size)} &middot; {formatDate(b.created)}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadFile(b.name)}
                      className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
