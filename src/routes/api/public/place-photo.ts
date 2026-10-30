import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Serves a Google Places photo for a restaurant already stored in our catalog.
// Only photo names saved for that restaurant can be requested (no open proxy).
export const Route = createFileRoute("/api/public/place-photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = Number(url.searchParams.get("id"));
        const i = Number(url.searchParams.get("i") ?? 0);
        if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(i) || i < 0 || i > 9) {
          return new Response("Bad request", { status: 400 });
        }
        const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
        const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
        if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) return new Response("Google Maps not configured", { status: 500 });

        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await sb.from("restaurants").select("google_photos").eq("id", id).maybeSingle();
        if (error) return new Response(error.message, { status: 500 });
        const photos = (data?.google_photos ?? []) as Array<{ name: string }>;
        const photo = photos[i];
        if (!photo?.name || !/^places\/[^/]+\/photos\/[^/]+$/.test(photo.name)) return new Response("Not found", { status: 404 });

        const res = await fetch(
          `https://connector-gateway.lovable.dev/google_maps/places/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
          { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY } },
        );
        if (!res.ok) {
          const body = await res.text();
          console.error(`Google photo failed [${res.status}]: ${body}`);
          return new Response(`Google Places photo failed [${res.status}]: ${body}`, { status: res.status });
        }
        const { photoUri } = (await res.json()) as { photoUri?: string };
        if (!photoUri) return new Response("No photo", { status: 404 });
        return new Response(null, { status: 302, headers: { Location: photoUri, "Cache-Control": "public, max-age=86400" } });
      },
    },
  },
});
