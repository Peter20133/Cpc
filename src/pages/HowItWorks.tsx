import React from "react";
import { ArrowRight } from "lucide-react";
import { C, DISPLAY, BODY, px } from "@/data/constants";
import { Eyebrow, BtnPrimary } from "@/components/ui";

export function HowItWorks({ setView }: { setView: (v: string) => void }) {
  const steps = [
    { t: "Spune-ne ce cauți", d: "Alege orașul, tipul de mâncare, bugetul și atmosfera dorită în mai puțin de un minut.", img: px(24433378, 700) },
    { t: "Noi căutăm", d: "RestoMatch compară restaurantele disponibile și calculează un scor de potrivire pentru fiecare.", img: px(28575445, 700) },
    { t: "Alege și rezervă", d: "Alege restaurantul preferat din listă și rezervă online sau sună direct.", img: px(9543813, 700) },
  ];
  return (
    <div className="mx-auto" style={{ maxWidth: 1000, padding: "56px 24px 96px" }}>
      <Eyebrow>Cum funcționează</Eyebrow>
      <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 38, color: C.ink, maxWidth: 600 }}>Trei pași, de la idee la masă rezervată.</h1>
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 48 }}>
        {steps.map((s, i) => (
          <div key={s.t} className="grid md:grid-cols-2 items-center" style={{ gap: 32 }}>
            <div style={{ order: i % 2 === 1 ? 2 : 1 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 32, color: C.accent }}>0{i + 1}</span>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginTop: 6, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 15, lineHeight: 1.7 }}>{s.d}</p>
            </div>
            <img src={s.img} alt={s.t} style={{ order: i % 2 === 1 ? 1 : 2, width: "100%", height: 240, objectFit: "cover", borderRadius: 18 }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 64, textAlign: "center" }}><BtnPrimary onClick={() => setView("search")} style={{ margin: "0 auto" }}>Găsește-mi restaurantul <ArrowRight size={15} /></BtnPrimary></div>
    </div>
  );
}