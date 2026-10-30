ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS review_count integer;
CREATE INDEX IF NOT EXISTS restaurants_google_place_id_idx ON public.restaurants (google_place_id);