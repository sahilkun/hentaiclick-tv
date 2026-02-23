-- Add optional regional name field (e.g., Japanese title like 夏と箱)
ALTER TABLE public.episodes
  ADD COLUMN regional_name text DEFAULT NULL;
