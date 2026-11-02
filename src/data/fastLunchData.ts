import { RESTAURANTS } from "./restaurants";

export type FastLunchItem = {
  id: number;
  name: string;
  city: string;
  address: string;
  distanceMeters: number;
  walkingTimeMin: number;
  price: number;
  deal: string;
  latitude: number;
  longitude: number;
};

export const ROMANIAN_CITIES_COORDS = [
  { city: "București", lat: 44.4323, lng: 26.1063 },
  { city: "Cluj-Napoca", lat: 46.7712, lng: 23.6236 },
  { city: "Timișoara", lat: 45.7537, lng: 21.2257 },
  { city: "Iași", lat: 47.1585, lng: 27.6014 },
  { city: "Constanța", lat: 44.1792, lng: 28.6498 },
  { city: "Brașov", lat: 45.6579, lng: 25.6012 },
  { city: "Craiova", lat: 44.3302, lng: 23.7949 },
  { city: "Galați", lat: 45.4353, lng: 28.008 },
  { city: "Ploiești", lat: 44.9367, lng: 26.0129 },
  { city: "Oradea", lat: 47.0722, lng: 21.9211 },
  { city: "Brăila", lat: 45.2692, lng: 27.9575 },
  { city: "Arad", lat: 46.1866, lng: 21.3123 },
  { city: "Pitești", lat: 44.8565, lng: 24.8692 },
  { city: "Sibiu", lat: 45.7983, lng: 24.1256 },
  { city: "Bacău", lat: 46.567, lng: 26.9146 },
  { city: "Târgu Mureș", lat: 46.5456, lng: 24.5625 },
  { city: "Baia Mare", lat: 47.6598, lng: 23.5795 },
  { city: "Buzău", lat: 45.1517, lng: 26.8166 },
  { city: "Botoșani", lat: 47.746, lng: 26.6695 },
  { city: "Satu Mare", lat: 47.79, lng: 22.89 },
  { city: "Râmnicu Vâlcea", lat: 45.1047, lng: 24.3693 },
  { city: "Suceava", lat: 47.6514, lng: 26.2556 },
  { city: "Drobeta-Turnu Severin", lat: 44.6269, lng: 22.6566 },
  { city: "Piatra Neamț", lat: 46.9275, lng: 26.3708 },
  { city: "Târgu Jiu", lat: 45.038, lng: 23.2747 },
  { city: "Focșani", lat: 45.696, lng: 27.183 },
  { city: "Tulcea", lat: 45.1797, lng: 28.8037 },
  { city: "Târgoviște", lat: 44.9254, lng: 25.4567 },
  { city: "Bistrița", lat: 47.1333, lng: 24.5 },
  { city: "Reșița", lat: 45.3008, lng: 21.8892 },
  { city: "Slatina", lat: 44.43, lng: 24.36 },
  { city: "Alba Iulia", lat: 46.0686, lng: 23.5805 },
  { city: "Sighișoara", lat: 46.2197, lng: 24.7928 },
];

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function detectClosestCity(lat: number, lng: number): string {
  let closest = "București";
  let min = Infinity;
  for (const item of ROMANIAN_CITIES_COORDS) {
    const d = calculateDistanceMeters(lat, lng, item.lat, item.lng);
    if (d < min) {
      min = d;
      closest = item.city;
    }
  }
  return closest;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function makeDeal(name: string, cuisine: string, index: number): { deal: string; price: number } {
  const n = normalize(name);
  const c = normalize(cuisine);
  if (n.includes("luca") || n.includes("matei") || n.includes("simigeri")) {
    return { deal: "Meniu zilei", price: 29 };
  }
  if (n.includes("bonita") || n.includes("shaorma") || n.includes("kebab") || n.includes("dristor") || n.includes("doner")) {
    return { deal: "Shaorma + suc", price: 27 };
  }
  if (n.includes("pizza") || c.includes("pizza")) {
    return { deal: "Pizza felie mare + suc", price: 28 };
  }
  if (n.includes("burger") || c.includes("burger")) {
    return { deal: "Burger pui + cartofi", price: 29 };
  }
  if (index === 0) return { deal: "Meniu zilei", price: 29 };
  if (index === 1) return { deal: "Ciorbă + Felul 2", price: 28 };
  return { deal: "Sandwich cald + băutură", price: 26 };
}

/**
 * Căutare ultra-rapidă (<20ms) bazată pe locația reală (coordonate GPS) sau orașul specificat de utilizator
 */
export function searchFastLunch(
  query: string,
  userCoords?: { lat: number; lng: number } | null,
  currentCity?: string | null,
): { location: string; results: FastLunchItem[] } {
  const normQuery = normalize(query);

  // 1. Verifică dacă utilizatorul a tastat numele unui oraș
  let matchedCity: string | null = null;
  for (const c of ROMANIAN_CITIES_COORDS) {
    if (normQuery.includes(normalize(c.city))) {
      matchedCity = c.city;
      break;
    }
  }

  // 2. Dacă avem coordonate GPS reale, determinăm orașul și căutăm cele mai apropiate restaurante reale
  if (userCoords && !matchedCity) {
    const realCity = detectClosestCity(userCoords.lat, userCoords.lng);
    const valid = RESTAURANTS.filter(
      (r) => typeof r.latitude === "number" && typeof r.longitude === "number",
    );

    const scored = valid.map((r) => ({
      r,
      dist: calculateDistanceMeters(userCoords.lat, userCoords.lng, r.latitude!, r.longitude!),
    }));

    scored.sort((a, b) => a.dist - b.dist);

    const top = scored.slice(0, 3).map((item, idx) => {
      const r = item.r;
      const { deal, price } = makeDeal(r.name, r.cuisine || r.cuisineLabel || "", idx);
      const walkingTime = Math.max(1, Math.round(item.dist / 80));
      return {
        id: r.id,
        name: r.name,
        city: r.city,
        address: r.address || `${r.city}, Centru`,
        distanceMeters: item.dist,
        walkingTimeMin: walkingTime,
        price,
        deal,
        latitude: r.latitude!,
        longitude: r.longitude!,
      };
    });

    return {
      location: top[0]?.city ? `${top[0].city}` : realCity,
      results: top,
    };
  }

  // 3. Căutare după oraș (fie cel specificat acum, fie cel salvat anterior)
  const targetCity = matchedCity || currentCity || "București";
  const normTarget = normalize(targetCity);

  const cityRestaurants = RESTAURANTS.filter(
    (r) =>
      typeof r.latitude === "number" &&
      typeof r.longitude === "number" &&
      normalize(r.city) === normTarget,
  );

  // Referință centru oraș
  const cityInfo = ROMANIAN_CITIES_COORDS.find((c) => normalize(c.city) === normTarget) || ROMANIAN_CITIES_COORDS[0];

  const pool = cityRestaurants.length >= 3 ? cityRestaurants : RESTAURANTS.slice(0, 20);

  const scored = pool.map((r, idx) => {
    const dist = r.latitude && r.longitude ? calculateDistanceMeters(cityInfo.lat, cityInfo.lng, r.latitude, r.longitude) : 300 + idx * 150;
    return { r, dist };
  });

  scored.sort((a, b) => a.dist - b.dist);

  const results = scored.slice(0, 3).map((item, idx) => {
    const r = item.r;
    const { deal, price } = makeDeal(r.name, r.cuisine || r.cuisineLabel || "", idx);
    const dist = Math.min(item.dist, 950);
    const walkingTime = Math.max(2, Math.round(dist / 80));
    return {
      id: r.id,
      name: r.name,
      city: r.city,
      address: r.address || `${r.city}, Centru`,
      distanceMeters: dist || 320 + idx * 130,
      walkingTimeMin: walkingTime || 3 + idx * 2,
      price,
      deal,
      latitude: r.latitude || cityInfo.lat + (idx * 0.001),
      longitude: r.longitude || cityInfo.lng + (idx * 0.001),
    };
  });

  return {
    location: targetCity,
    results,
  };
}
