/**
 * Lightweight, local natural-language parser for the search box.
 *
 * This is NOT a call to an external AI model (no network request, no API key, works
 * offline) — it's a rule-based parser tuned to the vocabulary RestoMatch already
 * understands (cities, cuisines, moods, price tiers). That keeps it fast, free, and
 * predictable, and it's usually enough for phrases like:
 *
 *   "Vreau un restaurant romantic în Cluj pentru două persoane, sub 200 lei"
 *   "Ceva casual cu pizza în Brașov, rating peste 4.5"
 *
 * It always returns a short "am înțeles..." summary too, so the person can see exactly
 * what was picked up before results are filtered — natural-language search should never
 * feel like a black box.
 */

import { CITIES, CUISINES, MOODS, BUDGETS } from "@/data/constants";

export type SmartFilters = {
  city?: string;
  cuisine?: string;
  mood?: string;
  minRating?: number;
  budget?: string;
  people?: number;
  dayTime?: string;
};

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function norm(s: string): string {
  return stripDiacritics(s.toLowerCase());
}

const CUISINE_KEYWORDS: Record<string, string[]> = {
  pizza: ["pizza", "pizzerie"],
  sushi: ["sushi", "japonez", "japoneza"],
  burger: ["burger", "hamburger"],
  steak: ["steak", "friptura", "gratar", "carne"],
  italian: ["italian", "italiana", "paste", "pasta"],
  asian: ["asian", "asiatic", "asiatica", "wok", "ramen", "thai", "vietnamez"],
  mexican: ["mexican", "mexicana", "tacos", "burrito"],
  vegetarian: ["vegetarian", "vegetariana", "vegan", "vegana"],
  seafood: ["fructe de mare", "peste", "seafood"],
  brunch: ["brunch", "cafenea", "cafea"],
  dessert: ["desert", "cofetarie", "prajituri", "dulce"],
  romanian: ["romanesc", "romaneasca", "traditional", "sarmale"],
  mediterranean: ["mediteranean", "mediteraneana", "grecesc", "greceasca", "gyros"],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  romantic: ["romantic", "romantica", "cina in doi", "aniversare"],
  familie: ["familie", "copii", "family"],
  elegant: ["elegant", "eleganta", "fine dining", "rafinat"],
  casual: ["casual", "relaxat", "informal"],
  distractie: ["distractie", "petrecere", "party", "gasca", "prieteni"],
  business: ["business", "afaceri", "intalnire de afaceri"],
  rooftop: ["rooftop", "terasa sus", "acoperis", "vedere oras"],
};

export function parseSmartQuery(text: string): { filters: SmartFilters; summary: string } {
  const q = norm(text);
  const filters: SmartFilters = {};
  const parts: string[] = [];

  // City — match against known cities (diacritic-insensitive)
  for (const city of CITIES) {
    const cityTerms = city === "Cluj-Napoca" ? ["cluj-napoca", "cluj"] : [norm(city)];
    if (cityTerms.some((term) => q.includes(term))) {
      filters.city = city;
      parts.push(`în ${city}`);
      break;
    }
  }

  // Cuisine
  outer: for (const c of CUISINES) {
    if (c.id === "orice") continue;
    const keywords = CUISINE_KEYWORDS[c.id] || [c.id];
    for (const kw of keywords) {
      if (q.includes(kw)) {
        filters.cuisine = c.id;
        parts.push(c.label.toLowerCase());
        break outer;
      }
    }
  }

  // Mood
  outerMood: for (const m of MOODS) {
    const keywords = MOOD_KEYWORDS[m.id] || [m.id];
    for (const kw of keywords) {
      if (q.includes(kw)) {
        filters.mood = m.id;
        parts.push(m.label.toLowerCase());
        break outerMood;
      }
    }
  }

  // Number of people: "2 persoane", "pentru doua persoane", "cuplu"
  const peopleNumMatch = q.match(/(\d+)\s*persoan/);
  const wordsToNum: Record<string, number> = { doua: 2, doi: 2, trei: 3, patru: 4, cinci: 5, sase: 6 };
  if (peopleNumMatch) {
    filters.people = parseInt(peopleNumMatch[1], 10);
    parts.push(`${filters.people} persoane`);
  } else {
    for (const [word, num] of Object.entries(wordsToNum)) {
      if (q.includes(`${word} persoan`)) {
        filters.people = num;
        parts.push(`${num} persoane`);
        break;
      }
    }
    if (!filters.people && q.includes("cuplu")) {
      filters.people = 2;
      parts.push("2 persoane");
    }
  }

  // Rating: "peste 4.5", "rating minim 4", "4 stele"
  const ratingMatch = q.match(/(?:peste|minim|min\.?|de la)\s*(\d(?:[.,]\d)?)\s*(?:stele|rating|\*)?/) || q.match(/(\d(?:[.,]\d)?)\s*stele/);
  if (ratingMatch) {
    const val = parseFloat(ratingMatch[1].replace(",", "."));
    if (val >= 1 && val <= 5) {
      filters.minRating = val;
      parts.push(`rating peste ${val}`);
    }
  }

  // Budget: numeric amount (any currency) → nearest tier, or direct keywords
  const amountMatch = q.match(/(?:sub|pana la|maxim|max\.?)\s*(\d+)/);
  if (amountMatch) {
    const amount = parseInt(amountMatch[1], 10);
    // Rough, currency-agnostic tiers — good enough as a starting filter, refine per market.
    filters.budget = amount < 100 ? "€" : amount < 250 ? "€€" : amount < 600 ? "€€€" : "€€€€";
    parts.push(`buget sub ${amount}`);
  } else if (q.includes("ieftin") || q.includes("buget mic")) {
    filters.budget = "€";
    parts.push("buget mic");
  } else if (q.includes("lux") || q.includes("scump") || q.includes("premium")) {
    filters.budget = "€€€€";
    parts.push("buget ridicat");
  } else {
    for (const b of BUDGETS) {
      if (q.includes(b)) {
        filters.budget = b;
        parts.push(`buget ${b}`);
        break;
      }
    }
  }

  // Day/time — captured only for display context, not used to filter (no live availability data)
  const days = ["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"];
  const dayFound = days.find((d) => q.includes(d));
  const timeFound = q.includes("seara") ? "seara" : q.includes("pranz") || q.includes("prânz") ? "la prânz" : q.includes("dimineata") ? "dimineața" : undefined;
  if (dayFound || timeFound) {
    filters.dayTime = [dayFound, timeFound].filter(Boolean).join(" ");
    parts.push(filters.dayTime);
  }

  const summary = parts.length > 0 ? `Am înțeles: ${parts.join(", ")}.` : "Nu am putut identifica preferințe clare — încearcă să menționezi orașul sau tipul de mâncare.";

  return { filters, summary };
}
