export const C = {
  bg: "#F7F5F0",
  surface: "#FFFDF9",
  ink: "#1D211E",
  inkSoft: "#6F756D",
  line: "#E7E4DC",
  lineSoft: "#F0EEE8",
  accent: "#B95635",
  accentDark: "#8E3C24",
  accentSoft: "#F5E7DE",
  gold: "#C49A57",
  green: "#304B3D",
  shadow: "0 8px 24px rgba(31,35,29,0.07)",
  shadowLg: "0 18px 48px rgba(31,35,29,0.09)",
};

export const FONT = "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&display=swap";
export const DISPLAY = "'Fraunces', Georgia, serif";
export const BODY = "'Inter', system-ui, sans-serif";

export const px = (id: number, w = 1000) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const GALLERY: Record<string, number[]> = {
  pizza: [6223172, 1878346, 6605187, 9543813],
  sushi: [28559483, 31393434, 4724481, 2098143],
  burger: [5488052, 3727243, 36691286, 4315148],
  steak: [14515091, 27643017, 36683019, 36630840],
  vegetarian: [33323285, 4958946, 6065181, 3026013],
  asian: [24243345, 3054690, 28895978, 29145757],
  mexican: [36498696, 25391591, 36498704, 34289262],
  italian: [546945, 1438672, 8917285, 31637791],
  seafood: [16743486, 14499018, 19524049, 33041124],
  brunch: [8616015, 2874780, 947898, 35160887],
  dessert: [39240983, 39240989, 31928755, 32916204],
};

export const CITIES = [
  "București", "Craiova", "Cluj-Napoca", "Timișoara", "Brașov", "Constanța", "Iași",
  "Sibiu", "Oradea", "Galați", "Ploiești", "Arad", "Bacău", "Târgu Mureș", "Baia Mare",
  "Bistrița", "Botoșani", "Brăila", "Buzău", "Deva", "Focșani", "Giurgiu", "Hunedoara",
  "Piatra Neamț", "Pitești", "Reșița", "Râmnicu Vâlcea", "Satu Mare", "Săcele",
  "Sighișoara", "Slatina", "Suceava", "Târgoviște", "Târgu Jiu", "Tulcea", "Vaslui",
  "Zalău",
];

export const CUISINES = [
  { id: "pizza", label: "Pizza", icon: "" },
  { id: "sushi", label: "Sushi", icon: "" },
  { id: "burger", label: "Burger", icon: "" },
  { id: "steak", label: "Steak", icon: "" },
  { id: "italian", label: "Italian", icon: "" },
  { id: "asian", label: "Asian", icon: "" },
  { id: "mexican", label: "Mexican", icon: "" },
  { id: "vegetarian", label: "Vegetarian", icon: "" },
  { id: "seafood", label: "Fructe de mare", icon: "" },
  { id: "brunch", label: "Brunch", icon: "" },
  { id: "dessert", label: "Desert", icon: "" },
  { id: "romanian", label: "Românesc", icon: "" },
  { id: "mediterranean", label: "Mediteranean", icon: "" },
  { id: "orice", label: "Orice", icon: "" },
];

export const BUDGETS = ["€", "€€", "€€€", "€€€€"];

export const MOODS = [
  { id: "romantic", label: "Romantic", icon: "" },
  { id: "familie", label: "Familie", icon: "" },
  { id: "elegant", label: "Elegant", icon: "" },
  { id: "casual", label: "Casual", icon: "" },
  { id: "distractie", label: "Distracție", icon: "" },
  { id: "business", label: "Business", icon: "" },
  { id: "rooftop", label: "Rooftop", icon: "" },
];

export type Booking = { type: "online" | "phone" | "website" | "none"; url?: string; phone?: string };

export type MenuItem = { name: string; price?: string };

export type RestaurantStatus = "pending" | "approved" | "rejected";
export type CatalogStats = {
  total: number;
  approved: number;
  pending: number;
  cityCount: number;
  cuisineCount: number;
};

export type Restaurant = {
  id: number; name: string; city: string; cuisine: string; cuisineLabel: string;
  mood?: string; price: string; rating: number; distance: string; openUntil: string;
  image?: string; address?: string; hours?: string; description?: string;
  dishes: string[]; booking: Booking; tags?: string[];
  // Owner-submitted / extensible fields (optional so existing seed data keeps working)
  phone?: string;
  website?: string;
  instagram?: string;
  facilities?: string[];
  menu?: MenuItem[];
  photos?: string[];
  status?: RestaurantStatus;
  submittedAt?: string;
  osmType?: "node" | "way" | "relation";
  osmId?: number;
  source?: string;
  sourceUrl?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  reviewCount?: number;
  googlePhotos?: { name: string; attributions: { displayName?: string; uri?: string }[] }[];
  googleCoverUrl?: string;
};

export const FACILITIES = [
  "Wi-Fi gratuit",
  "Parcare",
  "Terasă",
  "Acces persoane cu dizabilități",
  "Livrare la domiciliu",
  "Muzică live",
  "Pet friendly",
  "Loc de joacă pentru copii",
  "Rezervări de grup",
  "Meniu vegan",
];

export const priceRank: Record<string, number> = { "—": 0, "€": 1, "€€": 2, "€€€": 3, "€€€€": 4 };

export function computeMatch(r: Restaurant, answers: Record<string, any>): number {
  // Baseline reflects the restaurant's own quality (a highly-rated place should never look
  // like a bad match just because one preference wasn't explicitly requested).
  let score = 38 + Math.round((r.rating / 5) * 22); // ~38–60 based on rating alone
  if (answers.cuisine && answers.cuisine !== "orice") {
    if (answers.cuisine === r.cuisine) score += 20;
  }
  if (answers.mood && answers.mood === r.mood) score += 12;
  if (answers.budget) {
    if (answers.budget === r.price) score += 9;
    else if (priceRank[answers.budget] !== undefined && priceRank[r.price] !== undefined && Math.abs(priceRank[answers.budget] - priceRank[r.price]) === 1) score += 3; // adjacent tier, partial credit
  }
  if (answers.minRating) {
    score += r.rating >= answers.minRating ? 5 : -8;
  }
  // Keep scores stable between renders so sorting does not reshuffle while a person
  // is browsing or toggling a filter.
  score += r.id % 4;
  return Math.max(35, Math.min(99, score));
}

export function googleMapsUrl(r: Restaurant): string {
  const query = r.latitude !== undefined && r.longitude !== undefined
    ? `${r.latitude},${r.longitude}`
    : `${r.name}, ${r.address ?? r.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const REVIEWERS = ["Andrei P.","Elena M.","Mihai R.","Ioana T.","Cristian D.","Ana V.","George B.","Larisa S.","Bogdan N.","Diana C.","Alexandru F.","Raluca I.","Vlad O.","Simona K.","Radu H."];
const REVIEW_LINES = [
  "Am comandat {dish} și a fost exact ce aveam nevoie. Ne întoarcem sigur.",
  "Atmosfera e superbă, iar {dish} a fost punctul culminant al serii.",
  "Porții generoase și personal amabil. Recomand cu încredere {dish}.",
  "{dish} a fost foarte bun, dar am așteptat puțin mai mult decât mă așteptam.",
  "Locul e mic și cald, perfect pentru o seară liniștită. {dish} — foarte reușit.",
  "Am fost impresionat de prospețimea ingredientelor din {dish}.",
  "Prețul e corect pentru calitate. {dish} merită încercat.",
  "Personalul a fost foarte atent, iar {dish} a venit exact cum a fost descris în meniu.",
  "Revin de fiecare dată pentru {dish} — nu m-a dezamăgit niciodată.",
  "Decor plăcut, muzică potrivită, iar {dish} a fost punctul forte al mesei.",
  "Recomand rezervare din timp, mai ales în weekend. {dish} a fost delicios.",
  "O experiență solidă per total, iar {dish} chiar merită menționat separat.",
];

export function getReviews(r: Restaurant) {
  return Array.from({ length: 3 }).map((_, i) => {
    const lineIdx = (r.id * 3 + i * 2) % REVIEW_LINES.length;
    const authorIdx = (r.id * 5 + i * 3) % REVIEWERS.length;
    const dish = r.dishes.length > 0 ? r.dishes[i % r.dishes.length] : "preparatele lor";
    const ratingVariant = Math.max(3.5, Math.min(5, r.rating + (i - 1) * 0.3));
    return {
      author: REVIEWERS[authorIdx],
      rating: Math.round(ratingVariant * 2) / 2,
      text: REVIEW_LINES[lineIdx].replace("{dish}", dish),
      daysAgo: 2 + ((r.id * 7 + i * 13) % 45),
    };
  });
}

export function getReviewCount(r: Restaurant): number { return 38 + ((r.id * 17) % 260); }

// Imagini de bucătărie (Pexels) folosite doar când restaurantul nu are fotografie proprie.
const CUISINE_FALLBACK_KEYS = Object.keys(GALLERY);
export function cuisineImages(r: Restaurant, count = 4): string[] {
  const key = GALLERY[r.cuisine]
    ? r.cuisine
    : CUISINE_FALLBACK_KEYS[Math.abs(r.id) % CUISINE_FALLBACK_KEYS.length];
  const ids = GALLERY[key] ?? [];
  if (!ids.length) return [];
  const offset = Math.abs(r.id) % ids.length;
  return Array.from({ length: Math.min(count, ids.length) }, (_, i) =>
    px(ids[(offset + i) % ids.length]),
  );
}
export const googlePhotoUrl = (r: Restaurant, i: number) => `/api/public/place-photo?id=${r.id}&i=${i}`;
export type ImageSource = "google" | "site" | "fallback";
export function imageSource(r: Restaurant): ImageSource {
  if (r.googlePhotos?.length) return "google";
  if (r.image || r.photos?.length) return "site";
  return "fallback";
}
export function primaryImage(r: Restaurant): string | undefined {
  if (r.googlePhotos?.length) return r.googleCoverUrl || googlePhotoUrl(r, 0);
  return r.image || r.photos?.[0] || cuisineImages(r, 1)[0];
}
export function getGallery(r: Restaurant): string[] {
  if (r.googlePhotos?.length) return r.googlePhotos.map((_, i) => googlePhotoUrl(r, i));
  if (r.photos?.length) return r.photos;
  const own = r.image ? [r.image] : [];
  return [...own, ...cuisineImages(r, 4 - own.length)];
}
export function imageAlt(r: Restaurant): string {
  const s = imageSource(r);
  if (s === "google") return `${r.name} — fotografie Google Maps`;
  if (s === "site") return `${r.name} — fotografie de pe site-ul restaurantului`;
  return `${r.name} — imagine ilustrativă (fallback) ${r.cuisineLabel}`;
}
