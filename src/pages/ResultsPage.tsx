import React, { useState, useMemo, useEffect } from "react";

const PAGE = 24;
import { SlidersHorizontal, Sparkles, X, Search, ArrowRight } from "lucide-react";
import { C, DISPLAY, BODY, BUDGETS, MOODS, FACILITIES, priceRank, computeMatch, Restaurant } from "@/data/constants";
import { Pill, BtnOutline } from "@/components/ui";
import { RestaurantCard } from "@/components/RestaurantCard";
import { parseSmartQuery } from "@/lib/smartSearch";

export function ResultsPage({ restaurants, answers, setView, openRestaurant, saved, toggleSaved }: {
  restaurants: Restaurant[];
  answers: any;
  setView: (v: string) => void;
  openRestaurant: (id: number) => void;
  saved: Set<number>;
  toggleSaved: (id: number) => void;
}) {
  // NOTE ON THE "0 RESTAURANTS" FIX:
  // City and cuisine are safe to apply as hard filters straight from the search wizard —
  // the dataset guarantees at least one restaurant for every (city, cuisine) pair.
  // Mood, price and minimum rating are NOT hard-filtered here — with a finite dataset,
  // requiring an exact match on all five criteria at once (city + cuisine + mood + price +
  // rating) very often has zero matches even though plenty of good, close restaurants exist.
  // Instead they act as *preferences* that shape the match % and sort order below. They only
  // become real hard filters once the person explicitly taps them open in the "Filtre" panel —
  // an intentional, visible action they can just as easily undo.
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(answers.city ?? null);
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(answers.cuisine && answers.cuisine !== "orice" ? answers.cuisine : null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [facilityFilters, setFacilityFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("match");
  const [showFilters, setShowFilters] = useState(false);
  const [smartQuery, setSmartQuery] = useState("");
  const [smartSummary, setSmartSummary] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const runSmartSearch = () => {
    if (!smartQuery.trim()) return;
    const { filters, summary } = parseSmartQuery(smartQuery);
    if (filters.city) setCityFilter(filters.city);
    if (filters.cuisine) setCuisineFilter(filters.cuisine);
    if (filters.mood) setMoodFilter(filters.mood);
    if (filters.budget) setPriceFilter(filters.budget);
    if (filters.minRating) setMinRating(filters.minRating);
    setSmartSummary(summary);
  };

  const activeFilterCount = [cityFilter, cuisineFilter, moodFilter, priceFilter].filter(Boolean).length + facilityFilters.length + (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setCityFilter(null); setCuisineFilter(null); setMoodFilter(null); setPriceFilter(null);
    setMinRating(0); setFacilityFilters([]); setSmartSummary(null); setSmartQuery(""); setTextQuery("");
  };

  const list = useMemo(() => {
    let base = restaurants;
    const normalizedQuery = textQuery.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizedQuery) {
      const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 1);
      base = base.filter((r) => {
        const searchable = [
          r.name, r.city, r.cuisine, r.cuisineLabel, r.address, r.description,
          ...r.dishes, ...(r.tags ?? []), ...(r.facilities ?? []),
        ].join(" ").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return searchable.includes(normalizedQuery) || tokens.every((token) => searchable.includes(token));
      });
    }
    if (cityFilter) base = base.filter((r) => r.city === cityFilter);
    if (cuisineFilter) base = base.filter((r) => r.cuisine === cuisineFilter);
    if (moodFilter) base = base.filter((r) => r.mood === moodFilter);
    if (priceFilter) base = base.filter((r) => r.price === priceFilter);
    if (minRating > 0) base = base.filter((r) => r.rating >= minRating);
    if (facilityFilters.length > 0) base = base.filter((r) => facilityFilters.every((f) => (r.facilities ?? []).includes(f)));
    // Score against explicit hard filters where present, otherwise fall back to the softer
    // preferences carried over from the search wizard — so ranking still reflects what the
    // person originally asked for even though it isn't excluding anything.
    const scoringPrefs = {
      cuisine: cuisineFilter ?? answers.cuisine,
      mood: moodFilter ?? answers.mood,
      budget: priceFilter ?? answers.budget,
      minRating: minRating || answers.minRating,
    };
    // Never show the same place twice (same id, or two rows pointing at the same Google place).
    const seen = new Set<string>();
    base = base.filter((r) => {
      const key = r.googlePlaceId ?? `id:${r.id}`;
      if (seen.has(key) || seen.has(`id:${r.id}`)) return false;
      seen.add(key); seen.add(`id:${r.id}`);
      return true;
    });
    let withScore = base.map((r) => ({ ...r, score: computeMatch(r, scoringPrefs) }));
    if (sortBy === "match") withScore.sort((a, b) => b.score - a.score || b.rating - a.rating);
    if (sortBy === "rating") withScore.sort((a, b) => b.rating - a.rating);
    if (sortBy === "price") withScore.sort((a, b) => (priceRank[a.price] ?? 99) - (priceRank[b.price] ?? 99));
    return withScore;
  }, [restaurants, textQuery, cityFilter, cuisineFilter, moodFilter, priceFilter, minRating, facilityFilters, sortBy, answers]);

  // Reset paging only when the result set changes; filters stay active while loading more.
  useEffect(() => { setVisible(PAGE); }, [textQuery, cityFilter, cuisineFilter, moodFilter, priceFilter, minRating, facilityFilters, sortBy]);

  // Preferences from the wizard that aren't currently applied as hard filters — shown as a
  // gentle hint so it's clear why some results might not perfectly match every original answer.
  const softPreferenceNote = (() => {
    const bits: string[] = [];
    const moodLabel = answers.mood ? MOODS.find((m) => m.id === answers.mood)?.label?.toLowerCase() : undefined;
    if (!moodFilter && moodLabel) bits.push(moodLabel);
    if (!priceFilter && answers.budget) bits.push(`buget ${answers.budget}`);
    if (!minRating && answers.minRating) bits.push(`rating peste ${answers.minRating}`);
    return bits.filter(Boolean).length > 0
      ? `Sortat și după preferințele tale (${bits.filter(Boolean).join(", ")}) — restaurantele care se potrivesc cel mai bine apar primele.`
      : null;
  })();

  const availableCities = Array.from(new Set(restaurants.map((restaurant) => restaurant.city))).sort((a, b) => a.localeCompare(b, "ro"));
  const availableCuisines = Array.from(new Map(restaurants.map((restaurant) => [restaurant.cuisine, restaurant.cuisineLabel])).entries())
    .sort((a, b) => a[1].localeCompare(b[1], "ro"));

  const toggleFacility = (f: string) => setFacilityFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  return (
    <div className="rm-page rm-container" style={{ padding: "42px 0 72px" }}>
      <div className="rm-reveal" style={{ background: C.green, borderRadius: 24, padding: "30px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", right: -50, top: -90, background: "rgba(235,201,164,.16)" }} />
        <p className="rm-kicker" style={{ color: "#EBC9A4", marginBottom: 10 }}>Selecția ta</p>
        <div className="flex items-end justify-between" style={{ position: "relative", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: BODY, color: "rgba(255,253,249,.66)", fontSize: 13, marginBottom: 5 }}>{cityFilter ? `în ${cityFilter}` : "în toate orașele"}</p>
            <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1, color: "#FFFDF9", letterSpacing: -1 }}>{list.length} restaurante pentru tine</h1>
          </div>
          <span style={{ color: "rgba(255,253,249,.7)", fontFamily: BODY, fontSize: 12.5, display: "flex", alignItems: "center", gap: 7 }}><Sparkles size={15} color="#EBC9A4" /> Sortate după potrivire</span>
        </div>
      </div>
      {softPreferenceNote && (
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 13, marginBottom: 20, maxWidth: 560, lineHeight: 1.5 }}>{softPreferenceNote}</p>
      )}

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "5px 6px 5px 15px", display: "flex", alignItems: "center", gap: 10, marginBottom: 10, boxShadow: C.shadow }}>
        <Sparkles size={16} color={C.accent} style={{ flexShrink: 0 }} />
         <input
          type="text" value={smartQuery} onChange={(e) => setSmartQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSmartSearch()}
          placeholder="Descrie ce cauți, ex: „ceva romantic în Cluj, sub 200 lei, pentru 2 persoane”"
          style={{ flex: 1, border: "none", outline: "none", fontFamily: BODY, fontSize: 14, padding: "10px 0", background: "transparent", minWidth: 0 }}
        />
         <button onClick={runSmartSearch} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontFamily: BODY, fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>Caută <ArrowRight size={14} /></button>
      </div>
      {smartSummary && (
        <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          {smartSummary}
          <button onClick={() => setSmartSummary(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}><X size={12} /></button>
        </p>
      )}

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "5px 15px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, boxShadow: C.shadow }}>
        <Search size={16} color={C.inkSoft} />
        <input
          type="search"
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          placeholder="Caută după nume, preparat sau zonă"
          aria-label="Caută restaurante după nume, preparat sau zonă"
          style={{ flex: 1, border: "none", outline: "none", fontFamily: BODY, fontSize: 14, padding: "10px 0", background: "transparent", minWidth: 0 }}
        />
        {textQuery && <button onClick={() => setTextQuery("")} aria-label="Șterge căutarea" style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, display: "flex" }}><X size={14} /></button>}
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 16 }}>
        <button onClick={() => setShowFilters((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 6, background: showFilters ? C.ink : "#fff", color: showFilters ? "#fff" : C.ink, border: `1px solid ${showFilters ? C.ink : C.line}`, borderRadius: 999, padding: "9px 16px", fontFamily: BODY, fontWeight: 500, fontSize: 13.5, cursor: "pointer" }}>
          <SlidersHorizontal size={14} /> Filtre {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: `1px solid ${C.line}`, borderRadius: 999, padding: "9px 14px", fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink, background: "#fff", cursor: "pointer" }}>
          <option value="match">Sortează: Match</option>
          <option value="rating">Sortează: Rating</option>
          <option value="price">Sortează: Preț</option>
        </select>
        {activeFilterCount > 0 && <BtnOutline onClick={clearFilters} style={{ padding: "9px 16px", fontSize: 13 }}>Șterge filtrele</BtnOutline>}
      </div>

      {showFilters && (
        <div className="rm-reveal" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: 22, marginBottom: 24, display: "flex", flexDirection: "column", gap: 18, boxShadow: C.shadow }}>
          <div>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Oraș</p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              <Pill active={!cityFilter} onClick={() => setCityFilter(null)}>Toate</Pill>
              {availableCities.map((c) => <Pill key={c} active={cityFilter === c} onClick={() => setCityFilter(c)}>{c}</Pill>)}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Bucătărie</p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              <Pill active={!cuisineFilter} onClick={() => setCuisineFilter(null)}>Toate</Pill>
              {availableCuisines.map(([id, label]) => <Pill key={id} active={cuisineFilter === id} onClick={() => setCuisineFilter(id)}>{label}</Pill>)}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Preț</p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              <Pill active={!priceFilter} onClick={() => setPriceFilter(null)}>Toate</Pill>
              {BUDGETS.map((b) => <Pill key={b} active={priceFilter === b} onClick={() => setPriceFilter(b)}>{b}</Pill>)}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Atmosferă</p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              <Pill active={!moodFilter} onClick={() => setMoodFilter(null)}>Toate</Pill>
              {MOODS.map((m) => <Pill key={m.id} active={moodFilter === m.id} onClick={() => setMoodFilter(m.id)}>{m.icon} {m.label}</Pill>)}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Rating minim: {minRating > 0 ? minRating.toFixed(1) : "oricare"}</p>
            <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(parseFloat(e.target.value))} style={{ width: "100%", maxWidth: 320, accentColor: C.ink }} />
          </div>
          <div>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Facilități</p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {FACILITIES.map((f) => <Pill key={f} active={facilityFilters.includes(f)} onClick={() => toggleFacility(f)}>{f}</Pill>)}
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 20 }}>
        {list.slice(0, visible).map((r) => (<RestaurantCard key={r.id} r={r} onOpen={() => openRestaurant(r.id)} saved={saved.has(r.id)} onToggleSave={() => toggleSaved(r.id)} />))}
      </div>
      {list.length > visible && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 28 }}>
          <BtnOutline onClick={() => setVisible((v) => v + PAGE)}>Vezi mai multe ({list.length - visible} rămase)</BtnOutline>
          <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft }}>Afișate {visible} din {list.length}</p>
        </div>
      )}
       {list.length === 0 && (
         <div className="rm-reveal" style={{ textAlign: "center", padding: "72px 24px", color: C.inkSoft, fontFamily: BODY, background: C.surface, border: `1px dashed ${C.line}`, borderRadius: 20 }}>
           <div style={{ width: 48, height: 48, borderRadius: 16, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Search size={20} /></div>
           <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: C.ink, marginBottom: 8 }}>Încercăm altă direcție?</p>
           <p style={{ maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>{cityFilter ? `Nu avem încă restaurante publicate în „${cityFilter}”.` : "Nu am găsit restaurante pentru acest filtru."} Încearcă alt oraș sau șterge câteva filtre.</p>
         </div>
       )}
    </div>
  );
}
