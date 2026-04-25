-- Track download events for free user quota and concurrency limits
CREATE TABLE IF NOT EXISTS download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text NOT NULL,
  download_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for the two count queries we run on every download
CREATE INDEX IF NOT EXISTS download_events_user_recent_idx
  ON download_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS download_events_ip_recent_idx
  ON download_events (ip_hash, created_at DESC);

-- RLS: only service role can read/write (this table is internal accounting)
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no public policies needed.
-- (No GRANT to anon/authenticated means no direct access via PostgREST)

COMMENT ON TABLE download_events IS 'Records each download for quota and concurrency enforcement. Auto-pruned after 7 days.';
