import { createServerFn } from "@tanstack/react-start";

export type GoogleReview = { author: string; authorUrl?: string; photo?: string; rating: number; text: string; when?: string };

const TTL_MS = 30 * 24 * 3600 * 1000;

// Returns up to 5 Google reviews for a catalog restaurant, cached in the DB (one Google call per restaurant per 30 days).
export const getRestaurantReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number }) => {
    if (!Number.isInteger(d?.id) || d.id <= 0) throw new Error("Bad id");
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("restaurants").select("google_place_id, google_reviews, google_reviews_at").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.google_place_id) return { reviews: [] as GoogleReview[] };
    if (row.google_reviews_at && Date.now() - new Date(row.google_reviews_at).getTime() < TTL_MS) {
      return { reviews: (row.google_reviews ?? []) as GoogleReview[] };
    }
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Google Maps not configured");
    const res = await fetch(
      `https://connector-gateway.lovable.dev/google_maps/places/v1/places/${encodeURIComponent(row.google_place_id)}?languageCode=ro`,
      { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY, "X-Goog-FieldMask": "reviews" } },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`Google reviews failed [${res.status}]: ${body}`);
      throw new Error(`Google reviews failed [${res.status}]`);
    }
    const json = (await res.json()) as { reviews?: Array<{ rating?: number; text?: { text?: string }; originalText?: { text?: string }; relativePublishTimeDescription?: string; authorAttribution?: { displayName?: string; uri?: string; photoUri?: string } }> };
    const reviews: GoogleReview[] = (json.reviews ?? []).slice(0, 5).map((r) => ({
      author: r.authorAttribution?.displayName ?? "Utilizator Google",
      authorUrl: r.authorAttribution?.uri, photo: r.authorAttribution?.photoUri,
      rating: r.rating ?? 0, text: r.text?.text ?? r.originalText?.text ?? "", when: r.relativePublishTimeDescription,
    }));
    await supabaseAdmin.from("restaurants").update({ google_reviews: reviews, google_reviews_at: new Date().toISOString() }).eq("id", data.id);
    return { reviews };
  });
