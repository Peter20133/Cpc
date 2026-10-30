ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS google_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_cover_url text,
  ADD COLUMN IF NOT EXISTS google_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_match_note text;