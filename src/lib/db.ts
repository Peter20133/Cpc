/**
 * Data layer for RestoMatch.
 *
 * WHAT CHANGED (production pass)
 * -------------------------------
 * Every function here now talks to Supabase when a project is connected (see
 * src/lib/supabaseClient.ts) — that's the real, shared database: a restaurant approved by
 * an admin is now visible to *every* visitor, not just the browser that approved it.
 *
 * If Supabase isn't connected yet (no env vars set), everything falls back to the previous
 * localStorage behaviour automatically, so the app still works out of the box during
 * development/preview. Once you connect Supabase and run the SQL in `supabase/migrations/`
 * + `supabase/seed.sql`, this file switches over with zero further code changes.
 *
 * Every exported function is now async (`Promise`-returning) because a real network request
 * to Supabase is asynchronous — this is the one shape change every caller had to adapt to.
 */

import { Restaurant, RestaurantStatus, Booking, MenuItem, CatalogStats } from "@/data/constants";
import { RESTAURANTS as SEED_RESTAURANTS } from "@/data/restaurants";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const TABLE = "restaurants";
// Bump this key whenever the bundled seed changes materially. This prevents
// an older browser preview cache (including the retired 220-row demo seed)
// from masking the current OSM catalog.
const RESTAURANTS_KEY = "restomatch:restaurants:v3-osm";
const SAVED_KEY = "restomatch:saved:v1";

/* ── Supabase row <-> Restaurant mapping (snake_case columns <-> camelCase fields) ──── */

type Row = {
  id: number; name: string; city: string; cuisine: string; cuisine_label: string | null;
  mood: string | null; price: string; rating: number; distance: string | null; open_until: string | null;
  image: string | null; address: string | null; hours: string | null; description: string | null;
  dishes: string[] | null; tags: string[] | null; facilities: string[] | null; menu: MenuItem[] | null;
  photos: string[] | null; phone: string | null; website: string | null; instagram: string | null;
  booking: Booking; status: RestaurantStatus; submitted_at: string | null;
  osm_id: number | null; osm_type: "node" | "way" | "relation" | null; data_source: string | null;
  source_url: string | null; latitude: number | null; longitude: number | null;
  google_place_id?: string | null; review_count?: number | null; google_photos?: Restaurant["googlePhotos"] | null; google_cover_url?: string | null;
};

function inferFacilities(tags: string[] | null | undefined): string[] | undefined {
  if (!tags?.length) return undefined;
  const text = tags.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const facilities: string[] = [];
  if (text.includes("terasa")) facilities.push("Terasă");
  if (text.includes("muzica live")) facilities.push("Muzică live");
  if (text.includes("vegan") || text.includes("vegetal")) facilities.push("Meniu vegan");
  if (text.includes("grup")) facilities.push("Rezervări de grup");
  return facilities.length ? facilities : undefined;
}

function rowToRestaurant(row: Row): Restaurant {
  const booking = row.booking && typeof row.booking === "object"
    ? row.booking
    : row.website
      ? { type: "website" as const, url: row.website }
      : { type: "phone" as const, phone: row.phone ?? "" };
  return {
    id: row.id, name: row.name, city: row.city, cuisine: row.cuisine,
    cuisineLabel: row.cuisine_label ?? row.cuisine, mood: row.mood ?? "casual",
    price: row.price, rating: Number(row.rating), distance: row.distance ?? "—",
    openUntil: row.open_until ?? "—", image: row.image ?? undefined, address: row.address ?? undefined,
    hours: row.hours ?? undefined, description: row.description ?? undefined, dishes: row.dishes ?? [],
    tags: row.tags ?? undefined, facilities: row.facilities ?? inferFacilities(row.tags), menu: row.menu ?? undefined,
    photos: row.photos ?? undefined, phone: row.phone ?? undefined, website: row.website ?? undefined,
    instagram: row.instagram ?? undefined, booking, status: row.status ?? "approved",
    submittedAt: row.submitted_at ?? undefined, osmId: row.osm_id ?? undefined, osmType: row.osm_type ?? undefined,
    source: row.data_source ?? undefined, sourceUrl: row.source_url ?? undefined,
    latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
    googlePlaceId: row.google_place_id ?? undefined,
    reviewCount: row.review_count ?? undefined,
    googlePhotos: row.google_photos?.length ? row.google_photos : undefined,
    googleCoverUrl: row.google_cover_url ?? undefined,
  };
}

function restaurantToRow(r: Partial<Restaurant>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (r.name !== undefined) row.name = r.name;
  if (r.city !== undefined) row.city = r.city;
  if (r.cuisine !== undefined) row.cuisine = r.cuisine;
  if (r.cuisineLabel !== undefined) row.cuisine_label = r.cuisineLabel;
  if (r.mood !== undefined) row.mood = r.mood;
  if (r.price !== undefined) row.price = r.price;
  if (r.rating !== undefined) row.rating = r.rating;
  if (r.distance !== undefined) row.distance = r.distance;
  if (r.openUntil !== undefined) row.open_until = r.openUntil;
  if (r.image !== undefined) row.image = r.image;
  if (r.address !== undefined) row.address = r.address;
  if (r.hours !== undefined) row.hours = r.hours;
  if (r.description !== undefined) row.description = r.description;
  if (r.dishes !== undefined) row.dishes = r.dishes;
  if (r.tags !== undefined) row.tags = r.tags;
  if (r.facilities !== undefined) row.facilities = r.facilities;
  if (r.menu !== undefined) row.menu = r.menu;
  if (r.photos !== undefined) row.photos = r.photos;
  if (r.phone !== undefined) row.phone = r.phone;
  if (r.website !== undefined) row.website = r.website;
  if (r.instagram !== undefined) row.instagram = r.instagram;
  if (r.booking !== undefined) row.booking = r.booking;
  if (r.status !== undefined) row.status = r.status;
  if (r.submittedAt !== undefined) row.submitted_at = r.submittedAt;
  if (r.osmId !== undefined) row.osm_id = r.osmId;
  if (r.osmType !== undefined) row.osm_type = r.osmType;
  if (r.source !== undefined) row.data_source = r.source;
  if (r.sourceUrl !== undefined) row.source_url = r.sourceUrl;
  if (r.latitude !== undefined) row.latitude = r.latitude;
  if (r.longitude !== undefined) row.longitude = r.longitude;
  return row;
}

/* ── localStorage fallback (used only when Supabase isn't connected yet) ───────────── */

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore quota/private-mode errors */ }
}
function seedIfEmpty(): Restaurant[] {
  const existing = readLS<Restaurant[] | null>(RESTAURANTS_KEY, null);
  if (existing) {
    return existing.map((r) => r.facilities === undefined ? { ...r, facilities: inferFacilities(r.tags) } : r);
  }
  const seeded = SEED_RESTAURANTS.map((r) => ({ ...r, facilities: r.facilities ?? inferFacilities(r.tags), status: "pending" as RestaurantStatus }));
  writeLS(RESTAURANTS_KEY, seeded);
  return seeded;
}
let lsCache: Restaurant[] = seedIfEmpty();
function persistLS() { writeLS(RESTAURANTS_KEY, lsCache); }

function getLocalCache(): Restaurant[] {
  // Read the latest browser value before every operation so a second tab can add
  // a restaurant without this module allocating an id from stale data.
  const stored = readLS<Restaurant[] | null>(RESTAURANTS_KEY, null);
  if (stored) lsCache = stored;
  return lsCache;
}
function localListAll(): Restaurant[] {
  return [...getLocalCache()];
}

function localListApproved(): Restaurant[] {
  return getLocalCache().filter((r) => (r.status ?? "approved") === "approved");
}

function localListByStatus(status: RestaurantStatus): Restaurant[] {
  return getLocalCache().filter((r) => (r.status ?? "approved") === status);
}

/* ── Reads ──────────────────────────────────────────────────────────────────────────── */

/**
 * Citește TOATE rândurile care se potrivesc, în pagini de 1000.
 *
 * Fără paginare, API-ul returnează implicit maximum 1000 de rânduri — iar cu peste
 * 2.500 de restaurante în catalog, căutarea pe oraș/bucătărie părea „fără rezultate"
 * pentru tot ce nu intra în primele 1000 de rânduri.
 */
function isBadTokenError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("jwt") || m.includes("token") || m.includes("issued at future");
}

async function fetchAllRows(status?: RestaurantStatus): Promise<Restaurant[]> {
  const pageSize = 1000;
  const all: Restaurant[] = [];
  let clearedSession = false;
  for (let from = 0; ; from += pageSize) {
    let query = supabase!.from(TABLE).select("*").order("id").range(from, from + pageSize - 1);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      // O sesiune stricată/expirată (ex. ceas desincronizat -> „JWT issued at future")
      // nu trebuie să blocheze citirea publică: o eliminăm local și reîncercăm anonim.
      if (isBadTokenError(error.message) && !clearedSession) {
        clearedSession = true;
        try {
          await supabase!.auth.signOut({ scope: "local" });
        } catch {
          /* ignorăm: continuăm anonim */
        }
        from -= pageSize;
        continue;
      }
      throw new Error(`Nu am putut încărca restaurantele: ${error.message}`);
    }
    const rows = (data ?? []) as unknown as Row[];
    all.push(...rows.map(rowToRestaurant));
    if (rows.length < pageSize) return all;
  }
}


export async function listAll(): Promise<Restaurant[]> {
  if (isSupabaseConfigured) return fetchAllRows();
  return localListAll();
}

export async function listApproved(): Promise<Restaurant[]> {
  if (isSupabaseConfigured) return fetchAllRows("approved");
  return localListApproved();
}


function statsFromRestaurants(restaurants: Restaurant[]): CatalogStats {
  const catalog = restaurants.filter((restaurant) => (restaurant.status ?? "approved") !== "rejected");
  return {
    total: catalog.length,
    approved: catalog.filter((restaurant) => (restaurant.status ?? "approved") === "approved").length,
    pending: catalog.filter((restaurant) => restaurant.status === "pending").length,
    cityCount: new Set(catalog.map((restaurant) => restaurant.city).filter(Boolean)).size,
    cuisineCount: new Set(catalog.map((restaurant) => restaurant.cuisine).filter(Boolean)).size,
  };
}

export async function getCatalogStats(): Promise<CatalogStats> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.rpc("get_restaurant_catalog_stats");
    if (error) throw new Error(`Nu am putut încărca statisticile catalogului: ${error.message}`);
    const stats = data as Partial<CatalogStats> | null;
    if (!stats || typeof stats.total !== "number") {
      throw new Error("Statisticile catalogului au un format invalid.");
    }
    return {
      total: stats.total,
      approved: Number(stats.approved ?? 0),
      pending: Number(stats.pending ?? 0),
      cityCount: Number(stats.cityCount ?? 0),
      cuisineCount: Number(stats.cuisineCount ?? 0),
    };
  }
  return statsFromRestaurants(localListAll());
}

export async function listByStatus(status: RestaurantStatus): Promise<Restaurant[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from(TABLE).select("*").eq("status", status).order("id");
    if (error) throw new Error(`Nu am putut încărca restaurantele: ${error.message}`);
    return (data as unknown as Row[]).map(rowToRestaurant);
  }
  return localListByStatus(status);
}

export async function getById(id: number): Promise<Restaurant | undefined> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Nu am putut încărca restaurantul: ${error.message}`);
    return data ? rowToRestaurant(data as unknown as Row) : undefined;
  }
  return getLocalCache().find((r) => r.id === id);
}

/* ── Writes ─────────────────────────────────────────────────────────────────────────── */

export type NewRestaurantInput = Omit<Restaurant, "id" | "status" | "submittedAt" | "rating" | "distance" | "openUntil" | "dishes" | "booking"> & {
  rating?: number; distance?: string; openUntil?: string; dishes?: string[]; booking?: Restaurant["booking"];
};

export async function submitRestaurant(input: NewRestaurantInput): Promise<Restaurant> {
  const dishes = input.dishes ?? input.menu?.map((m) => m.name).slice(0, 3) ?? [];
  const booking: Booking = input.booking ?? (input.website ? { type: "website", url: input.website } : { type: "phone", phone: input.phone ?? "" });
  const base: Omit<Restaurant, "id"> = {
    ...input, rating: input.rating ?? 0, distance: input.distance ?? "—", openUntil: input.openUntil ?? "—",
    dishes, booking, status: "pending", submittedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const row = restaurantToRow(base);
      const { data, error } = await supabase!.from(TABLE).insert(row as never).select().single();
      if (error) throw new Error(`Nu am putut trimite restaurantul: ${error.message}`);
      if (!data) throw new Error("Nu am primit restaurantul trimis.");
      return rowToRestaurant(data as unknown as Row);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Nu am putut")) throw error;
      throw new Error(`Nu am putut trimite restaurantul: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const current = getLocalCache();
  const nextId = current.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const created: Restaurant = { id: nextId, ...base };
  lsCache = [...current, created];
  persistLS();
  return created;
}

export async function approveRestaurant(id: number): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from(TABLE).update({ status: "approved" }).eq("id", id);
    if (error) throw new Error(`Nu am putut aproba restaurantul: ${error.message}`);
    return;
  }
  lsCache = getLocalCache().map((r) => (r.id === id ? { ...r, status: "approved" } : r));
  persistLS();
}

export async function rejectRestaurant(id: number): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from(TABLE).update({ status: "rejected" }).eq("id", id);
    if (error) throw new Error(`Nu am putut respinge restaurantul: ${error.message}`);
    return;
  }
  lsCache = getLocalCache().map((r) => (r.id === id ? { ...r, status: "rejected" } : r));
  persistLS();
}

export async function updateRestaurant(id: number, patch: Partial<Restaurant>): Promise<void> {
  if (isSupabaseConfigured) {
    const row = restaurantToRow(patch);
    const { error } = await supabase!.from(TABLE).update(row as never).eq("id", id);
    if (error) throw new Error(`Nu am putut salva modificările: ${error.message}`);
    return;
  }
  lsCache = getLocalCache().map((r) => (r.id === id ? { ...r, ...patch } : r));
  persistLS();
}

export async function deleteRestaurant(id: number): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(`Nu am putut șterge restaurantul: ${error.message}`);
    return;
  }
  lsCache = getLocalCache().filter((r) => r.id !== id);
  persistLS();
}

/* ── Favorites (always per-browser via localStorage — intentionally not shared/global) ─ */

export function loadSaved(): Set<number> {
  return new Set(readLS<number[]>(SAVED_KEY, []));
}
export function persistSaved(saved: Set<number>): void {
  writeLS(SAVED_KEY, Array.from(saved));
}
