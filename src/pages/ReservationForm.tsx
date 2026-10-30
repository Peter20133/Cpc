import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { C, DISPLAY, BODY, Restaurant } from "@/data/constants";
import { Card, BtnPrimary } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Offer, discountLabel, offerConditions, errMsg } from "@/lib/monetization";
import { Notice } from "@/components/mon";

type CouponWithOffer = { id: string; code: string; offers: Offer };

export function ReservationForm({ restaurant, setView, onConfirm }: { restaurant: Restaurant | undefined; setView: (v: string) => void; onConfirm: (d: any) => void }) {
  const { user, ready } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, time: "19:00", people: 2, name: "", phone: "", email: "", notes: "" });
  const [coupons, setCoupons] = useState<CouponWithOffer[]>([]);
  const [couponId, setCouponId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user || !restaurant) return;
    set("email", user.email ?? "");
    supabase.from("coupons").select("id, code, offers(*)").eq("user_id", user.id).eq("restaurant_id", restaurant.id).eq("status", "claimed").is("reservation_id", null).gt("expires_at", new Date().toISOString())
      .then(({ data }) => setCoupons((data ?? []) as unknown as CouponWithOffer[]));
  }, [user?.id, restaurant?.id]);

  if (!restaurant) return null;
  const canSubmit = form.date && form.time && form.name.trim() && form.phone.trim();
  const SLOTS = ["12:00","13:00","14:00","18:00","19:00","19:30","20:00","20:30","21:00","21:30"];
  const inputStyle: React.CSSProperties = { width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 14, boxSizing: "border-box", outline: "none" };
  const selected = coupons.find((c) => c.id === couponId);
  const eligible = (o: Offer) => {
    const dow = ((new Date(form.date + "T12:00:00").getDay() + 6) % 7) + 1;
    return (!o.min_people || form.people >= o.min_people) && form.date <= o.ends_on && o.valid_days.includes(dow);
  };

  const submit = async () => {
    if (!canSubmit || !user) return;
    setBusy(true); setError(null);
    const { data, error } = await supabase.from("reservations").insert({
      restaurant_id: restaurant.id, user_id: user.id, reserved_date: form.date, reserved_time: form.time, people: form.people,
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || null, notes: form.notes.trim() || null, coupon_id: couponId || null,
    }).select("id").single();
    setBusy(false);
    if (error) { setError(errMsg(error)); return; }
    onConfirm({ ...form, id: data.id, coupon: selected ? { code: selected.code, label: discountLabel(selected.offers), title: selected.offers.title } : null });
  };

  if (ready && !user) {
    return (
      <div className="mx-auto" style={{ maxWidth: 520, padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink }}>Intră în cont pentru a rezerva</h1>
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14, margin: "10px 0 24px" }}>Rezervările și cupoanele sunt legate de contul tău, ca restaurantul să le poată confirma.</p>
        <BtnPrimary onClick={() => setView("login")}>Intră în cont</BtnPrimary>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 640, padding: "40px 24px 96px" }}>
      <button onClick={() => setView("restaurant")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontWeight: 500, color: C.inkSoft, fontSize: 14, marginBottom: 20 }}><ChevronLeft size={16} /> Înapoi la restaurant</button>
      <div className="flex items-center" style={{ gap: 14, marginBottom: 28 }}>
        <div><h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: C.ink }}>Rezervă la {restaurant.name}</h1><p style={{ fontFamily: BODY, fontSize: 13, color: C.inkSoft }}>{restaurant.address}</p></div>
      </div>
      <Card style={{ padding: "28px 26px" }}>
        <div className="grid sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
          <div><label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Dată</label><input type="date" min={today} value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} /></div>
          <div><label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Oră</label><select value={form.time} onChange={(e) => set("time", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>{SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Număr de persoane</label>
          <div className="flex items-center" style={{ gap: 14, marginTop: 8 }}>
            <button onClick={() => set("people", Math.max(1, form.people - 1))} style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", fontFamily: BODY, fontWeight: 600, fontSize: 16 }}>−</button>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: C.ink, minWidth: 24, textAlign: "center" }}>{form.people}</span>
            <button onClick={() => set("people", Math.min(20, form.people + 1))} style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", fontFamily: BODY, fontWeight: 600, fontSize: 16 }}>+</button>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}><label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Nume complet</label><input type="text" placeholder="Numele tău" value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} /></div>
        <div className="grid sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
          <div><label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Telefon</label><input type="tel" placeholder="07xx xxx xxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} /></div>
          <div><label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Email (opțional)</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Aplică o ofertă (opțional)</label>
          {coupons.length === 0 ? (
            <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 6 }}>Nu ai cupoane revendicate pentru acest restaurant. Le poți revendica din secțiunea „Oferte active” a restaurantului.</p>
          ) : (
            <select value={couponId} onChange={(e) => setCouponId(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              <option value="">Fără ofertă</option>
              {coupons.map((c) => <option key={c.id} value={c.id} disabled={!eligible(c.offers)}>{discountLabel(c.offers)} · {c.offers.title} ({c.code}){eligible(c.offers) ? "" : " — neeligibil pentru data/persoanele alese"}</option>)}
            </select>
          )}
          {selected && (
            <div style={{ background: C.lineSoft, borderRadius: 12, padding: 12, marginTop: 10, fontFamily: BODY, fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>
              <p><b>Valoarea inițială:</b> nu este cunoscută dinainte — depinde de comanda ta.</p>
              <p><b>Reducere:</b> {discountLabel(selected.offers)} {selected.offers.discount_type === "percent" ? "din valoarea notei eligibile" : "din nota eligibilă"}.</p>
              <ul style={{ paddingLeft: 16, listStyle: "disc", color: C.inkSoft, marginTop: 4 }}>{offerConditions(selected.offers).map((t) => <li key={t}>{t}</li>)}</ul>
              <p style={{ marginTop: 6 }}>Reducerea va fi aplicată de restaurant la plata notei, pe baza codului <b>{selected.code}</b>. RestoMatch nu încasează și nu modifică nota.</p>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 24 }}><label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Cerințe speciale (opțional)</label><textarea rows={3} placeholder="Ex: masă lângă fereastră, scaun de copil, aniversare..." value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} /></div>
        {error && <Notice kind="error">{error}</Notice>}
        <BtnPrimary full style={{ opacity: canSubmit && !busy ? 1 : 0.45 }} onClick={submit}>{busy ? "Se trimite..." : "Trimite cererea de rezervare"}</BtnPrimary>
        <p style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft, textAlign: "center", marginTop: 12 }}>Cererea ajunge în panoul restaurantului, care o confirmă sau o refuză. Statusul îl vezi în „Contul meu”.</p>
      </Card>
    </div>
  );
}
