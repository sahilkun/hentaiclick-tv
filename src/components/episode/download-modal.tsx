"use client";

import { useState } from "react";
import { Download, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/ui/turnstile";
import { getDownloadableQualities, needsTurnstile } from "@/lib/access";
import { deriveDownloadQualities, getDownloadUrl } from "@/lib/cdn";
import { QUALITY_LABELS, type Quality } from "@/lib/constants";
import type { UserContext, EpisodeWithRelations } from "@/types";

function buildApiUrl(
  downloadLinks: Record<string, string>,
  quality: Quality,
  turnstileToken?: string
): string | null {
  const fullUrl = getDownloadUrl(downloadLinks, quality);
  if (!fullUrl) return null;
  const params = new URLSearchParams();
  params.set("url", fullUrl);
  if (turnstileToken) params.set("token", turnstileToken);
  return `/api/download?${params.toString()}`;
}

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  episode: EpisodeWithRelations;
  userContext: UserContext;
}

export function DownloadModal({
  open,
  onClose,
  episode,
  userContext,
}: DownloadModalProps) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuality, setPendingQuality] = useState<Quality | null>(null);

  const availableDownloadQualities = deriveDownloadQualities(episode.download_links);
  const downloadQualities = getDownloadableQualities(
    availableDownloadQualities,
    userContext,
    episode.upload_date
  );

  const showTurnstile = needsTurnstile(userContext);
  const turnstileVerified = !showTurnstile || !!turnstileToken;

  const handleDownload = async (quality: Quality) => {
    setError(null);
    setPendingQuality(quality);
    try {
      const apiUrl = buildApiUrl(
        episode.download_links,
        quality,
        turnstileToken ?? undefined
      );
      if (!apiUrl) {
        setError("Download link unavailable for this quality.");
        return;
      }
      const res = await fetch(apiUrl, { credentials: "include" });

      if (res.status === 429 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Download not allowed.");
        // Reset captcha so user can re-verify if it expired
        if (res.status === 403) setTurnstileToken(null);
        return;
      }
      if (!res.ok) {
        setError(`Download failed (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      if (!data?.url) {
        setError("Server response missing download URL.");
        return;
      }
      // Navigate to the CDN URL — browser downloads the .mkv directly
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPendingQuality(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Download {episode.title}</ModalTitle>
        <ModalClose onClose={onClose} />
      </ModalHeader>
      <ModalBody>
        <div className="space-y-3">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {downloadQualities.map(({ quality, locked, reason }) => (
            <div
              key={quality}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                {locked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Download className="h-4 w-4 text-success" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {QUALITY_LABELS[quality] ?? `${quality}p`}
                  </p>
                  {locked && reason && (
                    <p className="text-xs text-muted-foreground">{reason}</p>
                  )}
                </div>
              </div>

              {locked ? (
                <Button size="sm" variant="outline" disabled>
                  Locked
                </Button>
              ) : !turnstileVerified ? (
                <div className="text-xs text-muted-foreground">
                  Verify captcha below
                </div>
              ) : (
                <Button
                  size="sm"
                  disabled={pendingQuality !== null}
                  onClick={() => handleDownload(quality)}
                >
                  {pendingQuality === quality ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    "Download"
                  )}
                </Button>
              )}
            </div>
          ))}

          {/* Turnstile widget for guests */}
          {showTurnstile && !turnstileToken && (
            <div className="mt-4 rounded-lg border border-border p-4 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Complete the captcha to download
              </p>
              <Turnstile
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                <a href="/login" className="text-primary hover:underline">
                  Log in
                </a>{" "}
                to avoid the captcha
              </p>
            </div>
          )}

          {/* Free user info */}
          {userContext.role !== "admin" &&
            userContext.role !== "moderator" &&
            !userContext.isPremium && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Free users: 2 downloads/day · 1 at a time ·{" "}
                <a href="/premium" className="text-primary hover:underline">
                  Go premium
                </a>{" "}
                for unlimited.
              </p>
            )}
        </div>
      </ModalBody>
    </Modal>
  );
}
