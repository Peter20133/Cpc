import React, { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { C, DISPLAY, BODY, Restaurant } from "@/data/constants";
import { Card, BtnPrimary } from "@/components/ui";

export function SurpriseMe({ restaurants, answers, openRestaurant }: { restaurants: Restaurant[]; answers: any; openRestaurant: (id: number) => void }) {
  const [pick, setPick] = useState<(Restaurant & { score?: number }) | null>(null);
  const roll = () => {
    if (restaurants.length === 0) {
      setPick(null);
      return;
    }
    const pool = restaurants.filter((r) => !answers.city || r.city === answers.city);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || restaurants[0];
    setPick({ ...chosen, score: 90 + Math.floor(Math.random() * 9) });
  };
  return (
    <div className="mx-auto" style={{ maxWidth: 640, padding: "64px 24px 96px", textAlign: "center" }}>
      <Sparkles size={28} color={C.accent} style={{ margin: "0 auto 16px" }} />
      <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 32, color: C.ink }}>Nu știu ce vreau să mănânc.</h1>
      <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 15, marginTop: 12, marginBottom: 32 }}>Alegem noi, pe baza preferințelor tale.</p>
      <BtnPrimary onClick={roll} style={{ margin: "0 auto" }}>Surprinde-mă <Sparkles size={15} /></BtnPrimary>
      {pick && (
        <Card hover onClick={() => openRestaurant(pick.id)} style={{ marginTop: 40, overflow: "hidden", textAlign: "left" }}>
          <img src={pick.image} alt={pick.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
          <div style={{ padding: 24 }}>
            <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14 }}>Cred că acesta o să-ți placă.</p>
            <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: C.ink }}>{pick.name}</h3>
              <span style={{ background: C.ink, color: "#fff", fontFamily: BODY, fontWeight: 600, fontSize: 13, padding: "6px 12px", borderRadius: 999 }}>{pick.score}%</span>
            </div>
            <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14, marginTop: 4 }}>{pick.score}% match • {pick.cuisineLabel}</p>
            <p style={{ fontFamily: BODY, color: C.accent, fontSize: 14, fontWeight: 600, marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>Vezi detaliile <ArrowRight size={14} /></p>
          </div>
        </Card>
      )}
    </div>
  );
}