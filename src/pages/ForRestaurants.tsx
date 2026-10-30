import React from "react";
import { Check } from "lucide-react";
import { C, DISPLAY, BODY } from "@/data/constants";
import { Eyebrow, BtnPrimary, BtnOutline } from "@/components/ui";

export function ForRestaurants() {
  const tiers = [
    { name: "FREE", price: "0 €/lună", features: ["Profil de bază", "Informații despre restaurant", "Website și telefon"], cta: "Începe gratuit" },
    { name: "PRO", price: "29 €/lună", features: ["Profil îmbunătățit", "Fotografii nelimitate", "Promovare în rezultate", "Statistici de bază"], cta: "Alege PRO", highlight: true },
    { name: "PREMIUM", price: "59 €/lună", features: ["Promovare avansată", "Recomandări prioritare", "Statistici detaliate", "Instrumente pentru rezervări"], cta: "Alege PREMIUM" },
  ];
  return (
    <div>
      <section className="mx-auto" style={{ maxWidth: 1000, padding: "64px 24px 24px", textAlign: "center" }}>
        <Eyebrow>Pentru restaurante</Eyebrow>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(30px, 4.5vw, 42px)", color: C.ink, maxWidth: 680, margin: "0 auto" }}>Adu mai mulți clienți la restaurantul tău.</h1>
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: "18px auto 0" }}>Restaurantul tău poate avea un profil premium și poate fi promovat direct utilizatorilor care caută exact tipul tău de bucătărie.</p>
      </section>
      <section className="mx-auto" style={{ maxWidth: 1100, padding: "40px 24px 96px" }}>
        <div className="grid md:grid-cols-3" style={{ gap: 20 }}>
          {tiers.map((t) => (
            <div key={t.name} style={{ background: t.highlight ? C.ink : C.surface, border: `1px solid ${t.highlight ? C.ink : C.line}`, borderRadius: 18, padding: 30, display: "flex", flexDirection: "column", transform: t.highlight ? "translateY(-6px)" : "none", boxShadow: t.highlight ? C.shadowLg : "none" }}>
              <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13, letterSpacing: 1, color: t.highlight ? "#fff" : C.accent }}>{t.name}</p>
              <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 32, color: t.highlight ? "#fff" : C.ink, marginTop: 10 }}>{t.price}</p>
              <div style={{ flex: 1, marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                {t.features.map((f) => (<div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}><Check size={16} color={t.highlight ? "#fff" : C.accent} style={{ marginTop: 2, flexShrink: 0 }} /><span style={{ fontFamily: BODY, fontSize: 14, color: t.highlight ? "rgba(255,255,255,0.85)" : C.ink }}>{f}</span></div>))}
              </div>
              {t.highlight ? <BtnPrimary full style={{ marginTop: 26, background: "#fff", color: C.ink }}>{t.cta}</BtnPrimary> : <BtnOutline full style={{ marginTop: 26 }}>{t.cta}</BtnOutline>}
            </div>
          ))}
        </div>
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 13, textAlign: "center", marginTop: 32 }}>Prețuri demonstrative pentru versiunea de prezentare.</p>
      </section>
    </div>
  );
}