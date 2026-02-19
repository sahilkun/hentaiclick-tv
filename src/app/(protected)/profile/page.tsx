"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!user) return null;

  if (!initialized) {
    setDisplayName(user.display_name);
    setBio(user.bio);
    setInitialized(true);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio })
      .eq("id", user.id);

    if (error) {
      toast("Failed to save profile", "error");
    } else {
      toast("Profile updated", "success");
    }

    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Profile Settings</h1>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium">{user.display_name}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.is_premium && (
            <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              Premium
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Display Name
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {/* Quick links */}
      <div className="mt-8 space-y-2 border-t border-border pt-6">
        <h2 className="mb-3 font-medium">Quick Links</h2>
        <Link
          href="/profile/favorites"
          className="block text-sm text-primary hover:underline"
        >
          My Favorites
        </Link>
        <Link
          href="/profile/history"
          className="block text-sm text-primary hover:underline"
        >
          Watch History
        </Link>
        <Link
          href="/profile/playlists"
          className="block text-sm text-primary hover:underline"
        >
          My Playlists
        </Link>
      </div>
    </div>
  );
}
