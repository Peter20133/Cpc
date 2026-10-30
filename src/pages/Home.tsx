import React, { useState } from "react";
import { ArrowRight, Check, Clock3, Search, ShieldCheck, Sparkles, Utensils } from "lucide-react";
import { C, DISPLAY, BODY, px, CITIES, Restaurant, CatalogStats } from "@/data/constants";
import { BtnPrimary, BtnOutline, Eyebrow, Card } from "@/components/ui";
import { SearchWizard } from "@/components/SearchWizard";
import { AIPranzChat, AIPranzFloatingButton } from "@/components/AIPranzChat";

const cuisineShowcase = [
  { label: "Pizza", id: "pizza", img: px(1566837, 650) },
  { label: "Sushi", id: "sushi", img: px(31393436, 650) },
  { label: "Burger", id: "burger", img: px(3727243, 650) },
  { label: "Italian", id: "italian", img: px(546945, 650) },
  { label: "Vegetarian", id: "vegetarian", img: px(6065181, 650) },
  { label: "Brunch", id: "brunch", img: px(8616015, 650) },
];

export function Home({ setView, answers, setAnswers, goSearch, restaurants, catalogStats, onOpenRestaurant }: {
  setView: (v: string) => void;
  answers: any;
  setAnswers: React.Dispatch<React.SetStateAction<any>>;
  goSearch: () => void;
  restaurants: Restaurant[];
  catalogStats: CatalogStats | null;
  onOpenRestaurant?: (id: number) => void;
}) {
  const [isAIPranzOpen, setIsAIPranzOpen] = useState(false);
  const cityCount = catalogStats?.cityCount ?? new Set(restaurants.map((restaurant) => restaurant.city)).size;
  const cuisineCount = catalogStats?.cuisineCount ?? new Set(restaurants.map((restaurant) => restaurant.cuisine)).size;
  const totalCount = catalogStats?.total ?? restaurants.length;
  const availableCities = restaurants.length > 0
    ? Array.from(new Set(restaurants.map((restaurant) => restaurant.city))).sort((a, b) => a.localeCompare(b, "ro"))
    : CITIES;

  return (
    <div className="rm-page">
      <section style={{ padding: "26px 0 0" }}>
        <div className="rm-container rm-reveal">
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 30, minHeight: 560, background: `linear-gradient(112deg, ${C.green} 0%, #3B5C4B 54%, #6A4637 100%)`, boxShadow: "0 24px 70px rgba(48,75,61,.18)" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 82% 15%, rgba(246,216,175,.3), transparent 27%), radial-gradient(circle at 12% 100%, rgba(185,86,53,.3), transparent 34%)" }} />
            <div className="grid lg:grid-cols-2" style={{ position: "relative", minHeight: 560, alignItems: "center" }}>
              <div style={{ padding: "70px 56px", maxWidth: 660 }}>
                <p className="rm-kicker" style={{ color: "#EBC9A4", marginBottom: 18 }}>RESTOMATCH · ROMÂNIA</p>
                <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(42px, 6vw, 74px)", lineHeight: .99, color: "#FFFDF9", letterSpacing: -2.2, maxWidth: 620 }}>
                  Seara ta bună începe cu locul potrivit.
                </h1>
                <p style={{ fontFamily: BODY, color: "rgba(255,253,249,.72)", fontSize: 16.5, lineHeight: 1.7, marginTop: 24, maxWidth: 490 }}>
                  Spune-ne ce îți dorești. RestoMatch caută prin restaurante locale și îți arată alegerile care se potrivesc cel mai bine.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap" style={{ gap: 12, marginTop: 32 }}>
                  <BtnPrimary onClick={() => setView("search")} style={{ background: "#FFFDF9", color: C.green, padding: "15px 20px" }}>
                    Începe căutarea <ArrowRight size={16} />
                  </BtnPrimary>
                  <button
                    type="button"
                    onClick={() => setIsAIPranzOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg hover:brightness-110 active:scale-98 cursor-pointer"
                    style={{ background: C.accent, color: "#FFFDF9" }}
                  >
                    <span>🎙️ Ce mănânc azi? (AI Prânz 30 Lei)</span>
                  </button>
                  <BtnOutline onClick={() => setView("results")} style={{ color: "#FFFDF9", background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.24)", padding: "15px 20px" }}>
                    Explorează locurile
                  </BtnOutline>
                </div>
                <div className="flex items-center" style={{ gap: 10, marginTop: 28, color: "rgba(255,253,249,.62)", fontFamily: BODY, fontSize: 12.5 }}>
                  <ShieldCheck size={15} color="#EBC9A4" /> Date din surse verificabile, înainte de publicare
                </div>
              </div>
              <div className="hidden lg:block" style={{ position: "relative", height: "100%", minHeight: 560 }}>
                <div style={{ position: "absolute", inset: "58px 48px 48px 16px", borderRadius: 24, overflow: "hidden", transform: "rotate(2deg)", boxShadow: "0 24px 50px rgba(0,0,0,.24)" }}>
                  <img src={px(6223172, 1100)} alt="Inspirație pentru o cină reușită" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(28,44,35,.02) 40%, rgba(28,44,35,.74) 100%)" }} />
                </div>
                <div className="rm-reveal rm-reveal-delay-2" style={{ position: "absolute", left: 0, bottom: 60, background: C.surface, border: `1px solid rgba(255,255,255,.5)`, borderRadius: 18, padding: 16, width: 220, boxShadow: C.shadowLg }}>
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentSoft, color: C.accent }}><Utensils size={17} /></span>
                    <div><p style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Alegere personalizată</p><p style={{ fontFamily: BODY, fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>pentru gustul tău</p></div>
                  </div>
                </div>
                <div style={{ position: "absolute", right: 18, top: 70, background: "rgba(255,253,249,.92)", borderRadius: 14, padding: "11px 14px", boxShadow: C.shadow }}>
                  <p style={{ fontFamily: BODY, fontSize: 11, color: C.inkSoft }}>Catalog local</p>
                  <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.green }}>{totalCount.toLocaleString("ro-RO")} <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 600 }}>locuri</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rm-container rm-reveal rm-reveal-delay-1" style={{ padding: "22px 0 0" }}>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: C.shadow, overflow: "hidden" }}>
          {[
            [totalCount.toLocaleString("ro-RO"), "restaurante în bază"],
            [cityCount.toLocaleString("ro-RO"), "orașe explorate"],
            [cuisineCount.toLocaleString("ro-RO"), "bucătării"],
            ["100%", "date cu sursă"],
          ].map(([value, label], i) => (
            <div key={label} style={{ padding: "22px 24px", borderRight: i < 3 ? `1px solid ${C.line}` : "none" }}>
              <p style={{ fontFamily: DISPLAY, color: C.ink, fontWeight: 600, fontSize: 28, letterSpacing: -1 }}>{value}</p>
              <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 12.5, marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
        {catalogStats && catalogStats.pending > 0 && (
          <p style={{ fontFamily: BODY, textAlign: "center", color: C.inkSoft, fontSize: 11.5, marginTop: 10 }}>
            {catalogStats.approved.toLocaleString("ro-RO")} publicate · {catalogStats.pending.toLocaleString("ro-RO")} în verificare
          </p>
        )}
      </section>

      <section className="rm-container" style={{ padding: "88px 0 0" }}>
        <div className="grid lg:grid-cols-[.8fr_1.2fr]" style={{ gap: 42, alignItems: "end" }}>
          <div>
            <Eyebrow>Găsește-ți următoarea masă</Eyebrow>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(32px, 4vw, 46px)", lineHeight: 1.05, color: C.ink, letterSpacing: -1.2 }}>Spune-ne ce cauți.<br /><em style={{ color: C.accent, fontStyle: "normal" }}>Noi facem selecția.</em></h2>
          </div>
          <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 15, lineHeight: 1.7, maxWidth: 430 }}>Cinci întrebări simple, recomandări mai bune și mai puțin timp petrecut printre liste interminabile.</p>
        </div>
        <div style={{ marginTop: 26 }}>
          <SearchWizard answers={answers} setAnswers={setAnswers} onSubmit={goSearch} availableCities={availableCities} />
        </div>
      </section>

      <section className="rm-container" style={{ padding: "92px 0 0" }}>
        <div className="flex items-end justify-between" style={{ gap: 24, marginBottom: 24 }}>
          <div><Eyebrow>După poftă</Eyebrow><h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: -.8 }}>Ce ți-ar plăcea astăzi?</h2></div>
          <button onClick={() => setView("results")} className="hidden sm:flex items-center" style={{ background: "none", border: "none", color: C.accent, fontFamily: BODY, fontWeight: 700, fontSize: 13, cursor: "pointer", gap: 6 }}>Vezi toate <ArrowRight size={15} /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" style={{ gap: 12 }}>
          {cuisineShowcase.map((c) => (
            <button key={c.id} onClick={() => { setAnswers((a: any) => ({ ...a, cuisine: c.id })); setView("results"); }} className="rm-hover-lift" style={{ position: "relative", height: 190, borderRadius: 18, overflow: "hidden", border: "none", cursor: "pointer", padding: 0, background: C.green, textAlign: "left" }}>
              <img src={c.img} alt={c.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: .82 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,35,28,.02) 28%, rgba(20,35,28,.88) 100%)" }} />
              <span style={{ position: "absolute", left: 14, bottom: 14, fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, color: "#fff" }}>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rm-container" style={{ padding: "100px 0 0" }}>
        <div style={{ background: C.accentSoft, borderRadius: 26, padding: "42px 42px 38px" }}>
          <div className="grid md:grid-cols-3" style={{ gap: 30 }}>
            {[
              { icon: Search, title: "Spune ce îți dorești", text: "Alegi orașul, gustul, bugetul și atmosfera." },
              { icon: Sparkles, title: "Primești un match", text: "Scorul te ajută să alegi fără să pierzi timpul." },
              { icon: Check, title: "Alegi cu încredere", text: "Vezi informațiile disponibile și sursa lor." },
            ].map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="flex items-start" style={{ gap: 14 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flexShrink: 0 }}><Icon size={17} /></span>
                <div><p style={{ fontFamily: BODY, fontWeight: 700, fontSize: 14, color: C.ink }}>{title}</p><p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rm-container" style={{ padding: "100px 0 0" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, minHeight: 270, background: C.green, padding: "44px 46px" }}>
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", right: -80, top: -150, background: "rgba(235,201,164,.18)" }} />
          <div style={{ position: "relative", maxWidth: 560 }}>
            <p className="rm-kicker" style={{ color: "#EBC9A4" }}>Ai încredere în instinct</p>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 34, lineHeight: 1.08, color: "#FFFDF9", letterSpacing: -.6, marginTop: 8 }}>Nu știi ce vrei? Lasă-ne să alegem pentru tine.</h2>
            <BtnPrimary onClick={() => setView("surprise")} style={{ marginTop: 24, background: "#FFFDF9", color: C.green }}>Surprinde-mă <Sparkles size={15} /></BtnPrimary>
          </div>
          <div className="hidden md:block" style={{ position: "absolute", right: 72, bottom: 35, width: 150, height: 150, borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", transform: "rotate(-18deg)" }}>
            <Clock3 size={32} color="#EBC9A4" style={{ position: "absolute", top: 42, left: 58 }} />
          </div>
        </div>
      </section>

      {/* 🎙️ Floating button & Chat Modal for AI Prânz - 30 Lei */}
      <AIPranzFloatingButton onClick={() => setIsAIPranzOpen(true)} />
      <AIPranzChat
        isOpen={isAIPranzOpen}
        onClose={() => setIsAIPranzOpen(false)}
        onOpenRestaurant={onOpenRestaurant}
      />
    </div>
  );
}