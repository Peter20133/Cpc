import React, { useEffect, useMemo, useState } from "react";
import { LogOut, Heart, Store, Shield } from "lucide-react";
import { C, DISPLAY, BODY, Restaurant } from "@/data/constants";
import { Eyebrow, Card, BtnOutline } from "@/components/ui";
import { RestaurantCard } from "@/components/RestaurantCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Offer, discountLabel, fmtDate, fmtDateTime, errMsg } from "@/lib/monetization";
import { Tabs, Tag, SmallBtn, Notice, STATUS_RO, inputStyle } from "@/components/mon";

type CouponRow = { id: string; code: string; status: string; issued_at: string; expires_at: string; used_at: string | null; restaurant_id: number; offers: Offer; restaurants: { name: string; city: string } };
type ResRow = { id: string; restaurant_id: number; reserved_date: string; reserved_time: string; people: number; status: string; coupon_id: string | null; restaurants: { name: string } };

export function Dashboard({ restaurants, setView, saved, toggleSaved, openRestaurant, onLogout }: { restaurants: Restaurant[]; setView: (v: string) => void; saved: Set<number>; toggleSaved: (id: number) => void; openRestaurant: (id: number) => void; onLogout: () => void }) {
  const { user, isAdmin, ownerships, reload } = useAuth();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [reservations, setReservations] = useState<ResRow[]>([]);
  const [ctab, setCtab] = useState<"claimed" | "used" | "expired">("claimed");
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState(0);
  const recommended = restaurants.slice(0, 4);
  const savedList = restaurants.filter((r) => saved.has(r.id));

  useEffect(() => {
    if (!user) return;
    supabase.from("coupons").select("id, code, status, issued_at, expires_at, used_at, restaurant_id, offers(*), restaurants(name, city)").eq("user_id", user.id).order("issued_at", { ascending: false })
      .then(({ data }) => setCoupons((data ?? []) as unknown as CouponRow[]));
    supabase.from("reservations").select("id, restaurant_id, reserved_date, reserved_time, people, status, coupon_id, restaurants(name)").eq("user_id", user.id).order("reserved_date", { ascending: false })
      .then(({ data }) => setReservations((data ?? []) as unknown as ResRow[]));
  }, [user?.id, v]);

  const now = Date.now();
  const grouped = useMemo(() => ({
    claimed: coupons.filter((c) => c.status === "claimed" && new Date(c.expires_at).getTime() > now),
    used: coupons.filter((c) => c.status === "used"),
    expired: coupons.filter((c) => c.status === "void" || (c.status === "claimed" && new Date(c.expires_at).getTime() <= now)),
  }), [coupons]);

  const cancel = async (id: string) => {
    setError(null);
    const { error } = await supabase.rpc("set_reservation_status", { _id: id, _status: "canceled" });
    if (error) setError(errMsg(error)); else setV((x) => x + 1);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 1200, padding: "44px 24px 96px" }}>
      <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, color: C.ink }}>Bun venit înapoi</h1>
          <p style={{ fontFamily: BODY, fontSize: 13, color: C.inkSoft }}>{user?.email}</p>
        </div>
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          <BtnOutline onClick={() => setView("owner")} style={{ padding: "8px 14px", fontSize: 13 }}><Store size={14} /> Panou restaurant</BtnOutline>
          {isAdmin && <BtnOutline onClick={() => setView("admin")} style={{ padding: "8px 14px", fontSize: 13 }}><Shield size={14} /> Administrare</BtnOutline>}
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.inkSoft }}><LogOut size={14} /> Ieși din cont</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2" style={{ gap: 28, marginBottom: 48 }}>
        <div>
          <Eyebrow>Cupoanele mele</Eyebrow>
          <Tabs value={ctab} onChange={setCtab} tabs={[{ id: "claimed", label: `Revendicate (${grouped.claimed.length})` }, { id: "used", label: `Utilizate (${grouped.used.length})` }, { id: "expired", label: `Expirate (${grouped.expired.length})` }]} />
          {grouped[ctab].length === 0 ? (
            <Card style={{ padding: 22, borderStyle: "dashed" }}>
              <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft }}>Niciun cupon aici. <button onClick={() => setView("offers")} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, cursor: "pointer" }}>Vezi ofertele disponibile →</button></p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped[ctab].map((c) => (
                <Card key={c.id} style={{ padding: 14 }}>
                  <div className="flex items-center justify-between" style={{ gap: 10 }}>
                    <div>
                      <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: C.ink }}><button onClick={() => openRestaurant(c.restaurant_id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", color: "inherit" }}>{c.restaurants?.name}</button></p>
                      <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft }}>{c.offers?.title}</p>
                    </div>
                    <Tag>{c.offers ? discountLabel(c.offers) : ""}</Tag>
                  </div>
                  <p style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: 2, fontSize: 18, color: ctab === "claimed" ? C.ink : C.inkSoft, marginTop: 8, textDecoration: ctab === "claimed" ? "none" : "line-through" }}>{c.code}</p>
                  <p style={{ fontFamily: BODY, fontSize: 11.5, color: C.inkSoft }}>
                    {ctab === "used" ? `Utilizat ${fmtDateTime(c.used_at)}` : ctab === "expired" ? `Expirat ${fmtDate(c.expires_at)}` : `Emis ${fmtDate(c.issued_at)} · expiră ${fmtDateTime(c.expires_at)}`}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <Eyebrow>Rezervările mele</Eyebrow>
          {error && <Notice kind="error">{error}</Notice>}
          {reservations.length === 0 ? (
            <Card style={{ padding: 22, borderStyle: "dashed" }}><p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft }}>Nu ai rezervări încă.</p></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reservations.map((r) => (
                <Card key={r.id} style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: C.ink }}>{r.restaurants?.name}</p>
                    <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft }}>{fmtDate(r.reserved_date)} · {r.reserved_time} · {r.people} pers.{r.coupon_id ? " · cu ofertă" : ""}</p>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Tag tone={r.status === "confirmed" ? "green" : "soft"}>{STATUS_RO[r.status]}</Tag>
                    {(r.status === "pending" || r.status === "confirmed") && <SmallBtn tone="danger" onClick={() => cancel(r.id)}>Anulează</SmallBtn>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Eyebrow>Restaurante recomandate pentru tine</Eyebrow>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16, marginBottom: 52 }}>
        {recommended.map((r) => (<RestaurantCard key={r.id} r={{ ...r, score: 88 + (r.id % 10) }} onOpen={() => openRestaurant(r.id)} saved={saved.has(r.id)} onToggleSave={() => toggleSaved(r.id)} />))}
      </div>
      <div className="grid md:grid-cols-2" style={{ gap: 28 }}>
        <OwnerRequest restaurants={restaurants} onDone={() => void reload()} pending={ownerships.filter((o) => o.status !== "approved")} />
        <div>
          <Eyebrow>Restaurante salvate</Eyebrow>
          {savedList.length === 0 ? (
            <Card style={{ borderStyle: "dashed", padding: 28, textAlign: "center" }}>
              <Heart size={26} color={C.line} style={{ margin: "0 auto 10px" }} />
              <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14 }}>Nu ai salvat încă niciun restaurant. Apasă pe inima de pe un card pentru a-l adăuga aici.</p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedList.map((r) => (
                <Card key={r.id} hover onClick={() => openRestaurant(r.id)} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10 }}>
                  <div style={{ flex: 1 }}><p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, color: C.ink }}>{r.name}</p><p style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft }}>{r.cuisineLabel}</p></div>
                  <Heart size={15} color={C.accent} fill={C.accent} />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OwnerRequest({ restaurants, onDone, pending }: { restaurants: Restaurant[]; onDone: () => void; pending: { id: string; status: string; restaurantName?: string }[] }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Restaurant | null>(null);
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const matches = q.trim().length >= 2 && !pick ? restaurants.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const send = async () => {
    if (!user || !pick) return;
    setErr(null);
    const { error } = await supabase.from("restaurant_owners").insert({ user_id: user.id, user_email: user.email, restaurant_id: pick.id, contact_name: contact || null, phone: phone || null });
    if (error) setErr(error.code === "23505" ? "Ai trimis deja o cerere pentru acest restaurant." : errMsg(error));
    else { setMsg("Cererea a fost trimisă. Echipa RestoMatch o verifică și te anunță."); setPick(null); setQ(""); onDone(); }
  };
  return (
    <div>
      <Eyebrow>Ești proprietar de restaurant?</Eyebrow>
      <Card style={{ padding: 22 }}>
        <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft, marginBottom: 10 }}>Cere administrarea profilului pentru a publica oferte, a primi rezervări și a vedea statistici.</p>
        {pending.map((p) => <p key={p.id} style={{ fontFamily: BODY, fontSize: 12.5, color: C.ink }}>• {p.restaurantName}: <b>{STATUS_RO[p.status]}</b></p>)}
        <input placeholder="Caută restaurantul după nume" value={pick ? `${pick.name} — ${pick.city}` : q} onChange={(e) => { setPick(null); setQ(e.target.value); }} style={inputStyle} />
        {matches.map((r) => <button key={r.id} onClick={() => setPick(r)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${C.lineSoft}`, padding: "8px 2px", fontFamily: BODY, fontSize: 13, cursor: "pointer" }}>{r.name} <span style={{ color: C.inkSoft }}>· {r.city}</span></button>)}
        {pick && (
          <>
            <input placeholder="Numele tău" value={contact} onChange={(e) => setContact(e.target.value)} style={inputStyle} />
            <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <div style={{ marginTop: 10 }}><SmallBtn tone="primary" onClick={send}>Trimite cererea</SmallBtn></div>
          </>
        )}
        {msg && <Notice kind="ok">{msg}</Notice>}
        {err && <Notice kind="error">{err}</Notice>}
      </Card>
    </div>
  );
}
