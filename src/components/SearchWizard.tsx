import React, { useMemo, useState } from "react";
import { MapPin, ChevronLeft, Search, ArrowRight } from "lucide-react";
import { C, DISPLAY, BODY, CITIES, CUISINES, BUDGETS, MOODS } from "@/data/constants";
import { Card, Pill, BtnPrimary } from "./ui";

const normalizeCity = (value: string) =>
  value.trim().toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function SearchWizard({ answers, setAnswers, onSubmit, availableCities = CITIES }: {
  answers: any;
  setAnswers: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  availableCities?: string[];
}) {
  const [step, setStep] = useState(0);
  const [cityQuery, setCityQuery] = useState(answers.city ?? "");
  const steps = ["Oraș", "Mâncare", "Buget", "Atmosferă", "Rating"];
  const set = (k: string, v: any) => setAnswers((a: any) => ({ ...a, [k]: v }));
  const cityByKey = useMemo(() => new Map(availableCities.map((city) => [normalizeCity(city), city])), [availableCities]);
  const cityMatch = cityByKey.get(normalizeCity(cityQuery));
  const citySuggestions = useMemo(() => {
    const query = normalizeCity(cityQuery);
    if (!query || cityMatch) return [];
    return availableCities.filter((city) => normalizeCity(city).includes(query)).slice(0, 6);
  }, [availableCities, cityMatch, cityQuery]);
  const updateCity = (value: string) => {
    setCityQuery(value);
    const match = cityByKey.get(normalizeCity(value));
    set("city", match ?? value.trim());
  };
  const canNext = () => { if (step === 0) return !!cityQuery.trim(); if (step === 1) return !!answers.cuisine; if (step === 2) return !!answers.budget; if (step === 3) return !!answers.mood; return true; };

  return (
    <Card style={{ padding: "32px 28px", boxShadow: C.shadowLg, borderColor: C.line }}>
      <div className="flex items-center" style={{ gap: 6, marginBottom: 28 }}>
        {steps.map((s, i) => (<div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= step ? C.ink : C.line, transition: "background .3s" }} />))}
      </div>
      {step === 0 && (
        <div>
          <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 18 }}>Unde vrei să mănânci?</h3>
          <div style={{ border: `1px solid ${cityQuery && !cityMatch ? C.accent : C.line}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10, padding: "4px 14px", background: C.surface }}>
            <MapPin size={16} color={C.inkSoft} style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => updateCity(e.target.value)}
              placeholder="Scrie orașul, ex. București"
              aria-label="Scrie orașul"
              autoComplete="address-level2"
              style={{ width: "100%", border: "none", outline: "none", fontFamily: BODY, fontSize: 15, padding: "12px 0", background: "transparent", color: C.ink }}
            />
          </div>
          {citySuggestions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {citySuggestions.map((city) => (
                <Pill key={city} onClick={() => updateCity(city)} style={{ fontSize: 12.5 }}>{city}</Pill>
              ))}
            </div>
          )}
          {cityQuery.trim() && !cityMatch && availableCities.length > 0 && (
            <p role="status" style={{ fontFamily: BODY, color: C.accent, fontSize: 13, lineHeight: 1.45, marginTop: 12 }}>
              Nu avem încă restaurante publicate în „{cityQuery.trim()}”. Încearcă alt oraș.
            </p>
          )}
          {cityMatch && (
            <p role="status" style={{ fontFamily: BODY, color: "#2F8F4E", fontSize: 13, marginTop: 12 }}>
              Oraș găsit: {cityMatch}
            </p>
          )}
        </div>
      )}
      {step === 1 && (<div><h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 18 }}>Ce vrei să mănânci?</h3><div className="flex flex-wrap" style={{ gap: 8 }}>{CUISINES.map((c) => (<Pill key={c.id} active={answers.cuisine === c.id} onClick={() => set("cuisine", c.id)}>{c.icon} {c.label}</Pill>))}</div></div>)}
      {step === 2 && (<div><h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 18 }}>Care este bugetul tău?</h3><div className="flex flex-wrap" style={{ gap: 8 }}>{BUDGETS.map((b) => (<Pill key={b} active={answers.budget === b} onClick={() => set("budget", b)} style={{ fontSize: 15, minWidth: 56, justifyContent: "center" }}>{b}</Pill>))}</div></div>)}
      {step === 3 && (<div><h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 18 }}>Ce atmosferă cauți?</h3><div className="flex flex-wrap" style={{ gap: 8 }}>{MOODS.map((m) => (<Pill key={m.id} active={answers.mood === m.id} onClick={() => set("mood", m.id)}>{m.icon} {m.label}</Pill>))}</div></div>)}
      {step === 4 && (<div><h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 4 }}>Cât de important este ratingul?</h3><p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14, marginBottom: 20 }}>Alege ratingul minim pe care trebuie să-l aibă restaurantul.</p><input type="range" min="3" max="5" step="0.5" value={answers.minRating || 4} onChange={(e) => set("minRating", parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.ink }} /><div className="flex items-center justify-between" style={{ marginTop: 10 }}><span style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 13 }}>★★★☆☆</span><span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: C.ink }}>{(answers.minRating || 4).toFixed(1)} ★</span><span style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 13 }}>★★★★★</span></div></div>)}
      <div className="flex items-center justify-between" style={{ marginTop: 28 }}>
        {step > 0 ? (<button onClick={() => setStep(step - 1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: BODY, fontWeight: 500, color: C.inkSoft, fontSize: 14 }}><ChevronLeft size={16} /> Înapoi</button>) : <span />}
        {step < 4 ? (<BtnPrimary onClick={() => canNext() && setStep(step + 1)} style={{ opacity: canNext() ? 1 : 0.4, padding: "11px 22px" }}>Continuă <ArrowRight size={15} /></BtnPrimary>) : (<BtnPrimary onClick={onSubmit} style={{ padding: "12px 26px" }}><Search size={16} /> Găsește restaurante</BtnPrimary>)}
      </div>
    </Card>
  );
}
