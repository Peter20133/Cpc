import React, { useEffect, useState } from "react";
import { Ticket, Copy } from "lucide-react";
import { C, BODY, DISPLAY } from "@/data/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Offer, Coupon, discountLabel, expiresSoon, offerConditions, fmtDate, errMsg } from "@/lib/monetization";
import { Card, Eyebrow } from "@/components/ui";
import { Tag, Notice, SmallBtn } from "@/components/mon";

export function OffersSection({ restaurantId, setView }: { restaurantId: number; setView: (v: string) => void }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [mine, setMine] = useState<Coupon[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<Coupon | null>(null);

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("offers").select("*").eq("restaurant_id", restaurantId).eq("status", "active").lte("starts_on", today).gte("ends_on", today).order("ends_on");
    setOffers((data ?? []) as unknown as Offer[]);
    if (user) {
      const { data: c } = await supabase.from("coupons").select("*").eq("restaurant_id", restaurantId).eq("user_id", user.id).eq("status", "claimed").gt("expires_at", new Date().toISOString());
      setMine((c ?? []) as Coupon[]);
    } else setMine([]);
  };
  useEffect(() => { void load(); }, [restaurantId, user?.id]);

  if (offers.length === 0) return null;

  const claim = async (o: Offer) => {
    setError(null);
    if (!user) { setView("login"); return; }
    setBusy(o.id);
    const { data, error } = await supabase.rpc("claim_offer", { _offer_id: o.id });
    setBusy(null);
    if (error) { setError(errMsg(error)); return; }
    setShown(data as unknown as Coupon);
    void load();
  };

  return (
    <div style={{ marginTop: 34 }} id="oferte">
      <Eyebrow>Oferte active</Eyebrow>
      {error && <Notice kind="error">{error}</Notice>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {offers.map((o) => {
          const existing = mine.find((c) => c.offer_id === o.id);
          const coupon = shown?.offer_id === o.id ? shown : existing;
          return (
            <Card key={o.id} style={{ padding: 20, borderColor: C.accent }}>
              <div className="flex items-start justify-between" style={{ gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 8 }}>
                    <Tag>{discountLabel(o)}</Tag>
                    {o.exclusive && <Tag tone="ink">Ofertă exclusivă</Tag>}
                    {expiresSoon(o.ends_on) && <Tag tone="gold">Expiră curând</Tag>}
                  </div>
                  <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: C.ink }}>{o.title}</p>
                  {o.description && <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.55 }}>{o.description}</p>}
                  <ul style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 10, paddingLeft: 16, listStyle: "disc", lineHeight: 1.6 }}>
                    {offerConditions(o).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  {o.terms && <p style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft, marginTop: 8 }}>Termeni: {o.terms}</p>}
                </div>
                {!coupon && <SmallBtn tone="primary" disabled={busy === o.id} onClick={() => claim(o)}><Ticket size={13} style={{ display: "inline", marginRight: 4 }} />{busy === o.id ? "Se generează..." : user ? "Revendică oferta" : "Autentifică-te pentru a revendica"}</SmallBtn>}
              </div>
              {coupon && (
                <div style={{ marginTop: 14, background: C.lineSoft, borderRadius: 12, padding: 14 }}>
                  <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft }}>Codul tău de reducere</p>
                  <div className="flex items-center" style={{ gap: 10, marginTop: 4 }}>
                    <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: C.ink }}>{coupon.code}</span>
                    <button aria-label="Copiază codul" onClick={() => navigator.clipboard?.writeText(coupon.code)} style={{ background: "none", border: "none", cursor: "pointer" }}><Copy size={15} color={C.inkSoft} /></button>
                  </div>
                  <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>Emis {fmtDate(coupon.issued_at)} · valabil până la {fmtDate(o.ends_on)}. Arată codul personalului la plata notei — reducerea este aplicată de restaurant, RestoMatch nu încasează nota. Codul poate fi folosit o singură dată. Îl găsești oricând în „Contul meu → Cupoanele mele”.</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
