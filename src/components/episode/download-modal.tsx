"use client";

import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/ui/turnstile";
import { getDownloadableQualities, needsTurnstile } from "@/lib/access";
import { deriveDownloadQualities, getDownloadUrl } from "@/lib/cdn";
import { QUALITY_LABELS, type Quality } from "@/lib/constants";
import type { UserContext, EpisodeWithRelations } from "@/types";

function getProxyDownloadUrl(
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

  const availableDownloadQualities = deriveDownloadQualities(episode.download_links);
  const downloadQualities = getDownloadableQualities(
    availableDownloadQualities,
    userContext,
    episode.upload_date
  );

  const showTurnstile = needsTurnstile(userContext);
  const turnstileVerified = !showTurnstile || !!turnstileToken;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Download {episode.title}</ModalTitle>
        <ModalClose onClose={onClose} />
      </ModalHeader>
      <ModalBody>
        <div className="space-y-3">
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
              ) : (() => {
                const url = getProxyDownloadUrl(
                  episode.download_links,
                  quality,
                  turnstileToken ?? undefined
                );
                return url ? (
                  <a href={url}>
                    <Button size="sm">Download</Button>
                  </a>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    Unavailable
                  </Button>
                );
              })()}
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
        </div>
      </ModalBody>
    </Modal>
  );
}
