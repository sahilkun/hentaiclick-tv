"use client";

import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/lib/cdn";
import { getDownloadableQualities, needsTurnstile } from "@/lib/access";
import { QUALITY_LABELS, type Quality } from "@/lib/constants";
import type { UserContext, EpisodeWithRelations } from "@/types";

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
  const [turnstileVerified, setTurnstileVerified] = useState(false);

  const downloadQualities = getDownloadableQualities(
    episode.available_qualities,
    userContext,
    episode.upload_date
  );

  const showTurnstile = needsTurnstile(userContext);

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
              ) : showTurnstile && !turnstileVerified ? (
                <div className="text-xs text-muted-foreground">
                  Verify captcha below
                </div>
              ) : (
                <a
                  href={getDownloadUrl(
                    episode.download_cdn_slug,
                    episode.download_filename,
                    quality
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm">Download</Button>
                </a>
              )}
            </div>
          ))}

          {/* Turnstile widget placeholder for guests */}
          {showTurnstile && !turnstileVerified && (
            <div className="mt-4 rounded-lg border border-border p-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Complete the captcha to download
              </p>
              {/* Cloudflare Turnstile widget will be embedded here */}
              <div className="mx-auto h-[65px] w-[300px] rounded bg-muted" />
              <p className="mt-2 text-xs text-muted-foreground">
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
