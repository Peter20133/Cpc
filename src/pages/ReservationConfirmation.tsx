import React from "react";
import { Check } from "lucide-react";
import { C, DISPLAY, BODY, Restaurant } from "@/data/constants";
import { Card, BtnPrimary, BtnOutline } from "@/components/ui";

export function ReservationConfirmation({ restaurant, details, setView }: { restaurant: Restaurant | undefined; details: any; setView: (v: string) => void }) {
  if (!restaurant || !details) return null;
  const code = `RZ-${String(details.id ?? "").slice(0, 8).toUpperCase()}`;
  const rows: [string, string][] = [["Restaurant", restaurant.name], ["Dată", new Date(details.date + "T12:00:00").toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })], ["Oră", details.time], ["Persoane", String(details.people)], ["Nume", details.name], ["Telefon", details.phone], ["Status", "În așteptarea confirmării"]];
  if (details.coupon) rows.push(["Ofertă", `${details.coupon.label} · ${details.coupon.code}`]);
  return (
    <div className="mx-auto" style={{ maxWidth: 540, padding: "80px 24px 112px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><Check size={26} color={C.accent} /></div>
      <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: C.ink }}>Cererea ta de rezervare a fost trimisă.</h1>
      <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 15, marginTop: 10 }}>{restaurant.name} o va confirma din panoul său. Urmărești statusul în „Contul meu”.</p>
      <Card style={{ padding: 26, marginTop: 30, textAlign: "left" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}><span style={{ fontFamily: BODY, fontSize: 13, color: C.inkSoft }}>Cod rezervare</span><span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: C.accent, letterSpacing: 1 }}>{code}</span></div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between" style={{ padding: "8px 0", borderTop: `1px solid ${C.line}` }}><span style={{ fontFamily: BODY, fontSize: 14, color: C.inkSoft }}>{k}</span><span style={{ fontFamily: BODY, fontWeight: 500, fontSize: 14, color: C.ink }}>{v}</span></div>
        ))}
        {details.coupon && <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 10 }}>Reducerea se aplică de restaurant la plata notei, după validarea codului.</p>}
      </Card>
      <div className="flex flex-col sm:flex-row" style={{ gap: 12, marginTop: 30, justifyContent: "center" }}>
        <BtnOutline onClick={() => setView("dashboard")}>Rezervările mele</BtnOutline>
        <BtnPrimary onClick={() => setView("results")}>Explorează alte restaurante</BtnPrimary>
      </div>
    </div>
  );
}
