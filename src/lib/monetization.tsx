import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Promo = { type: "search_top" | "homepage" | "offer" | "category_city"; city?: string | null; cuisine?: string | null; offer_id?: string | null; ends_at?: string };
export type Signal = { id: number; premium: boolean; priority: boolean; homepage: boolean; promos: Promo[]; offers: number; bestPct: number | null; bestFixed: number | null; offerEnds: string | null; exclusive: boolean };

export type Offer = {
  id: string; restaurant_id: number; title: string; description: string | null;
  discount_type: "percent" | "fixed"; discount_value: number; currency: string;
  starts_on: string; ends_on: string; valid_days: number[]; time_from: string | null; time_to: string | null;
  max_uses: number | null; max_uses_per_user: number; min_bill: number | null; min_people: number | null;
  included_items: string | null; excluded_items: string | null; requires_reservation: boolean; combinable: boolean; exclusive: boolean;
  terms: string | null; status: "active" | "inactive" | "suspended"; claims_count: number; uses_count: number; created_at?: string;
};

export type Coupon = {
  id: string; code: string; offer_id: string; restaurant_id: number; user_id: string; status: "claimed" | "used" | "void";
  issued_at: string; expires_at: string; used_at: string | null; reservation_id: string | null;
};

export const DAY_LABELS = ["L", "Ma", "Mi", "J", "V", "S", "D"];

export function discountLabel(o: Pick<Offer, "discount_type" | "discount_value" | "currency">) {
  return o.discount_type === "percent" ? `-${Number(o.discount_value)}%` : `-${Number(o.discount_value)} ${o.currency === "RON" ? "lei" : o.currency}`;
}

export function expiresSoon(endsOn: string | null | undefined) {
  if (!endsOn) return false;
  const diff = (new Date(endsOn + "T23:59:59").getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 3;
}

export function offerConditions(o: Offer): string[] {
  const out: string[] = [];
  const days = o.valid_days?.length && o.valid_days.length < 7 ? o.valid_days.map((d) => DAY_LABELS[d - 1]).join(", ") : "toate zilele";
  out.push(`Valabilă ${days}${o.time_from && o.time_to ? `, între ${o.time_from.slice(0, 5)} și ${o.time_to.slice(0, 5)}` : ""}.`);
  out.push(`Perioadă: ${fmtDate(o.starts_on)} – ${fmtDate(o.ends_on)}.`);
  if (o.min_bill) out.push(`Notă minimă: ${o.min_bill} ${o.currency === "RON" ? "lei" : o.currency}.`);
  if (o.min_people) out.push(`Minimum ${o.min_people} persoane.`);
  if (o.included_items) out.push(`Se aplică la: ${o.included_items}.`);
  if (o.excluded_items) out.push(`Nu se aplică la: ${o.excluded_items}.`);
  out.push(o.requires_reservation ? "Necesită rezervare prin RestoMatch." : "Nu necesită rezervare.");
  out.push(o.combinable ? "Se poate combina cu alte reduceri." : "Nu se combină cu alte reduceri.");
  out.push(`Maximum ${o.max_uses_per_user} utilizare/utilizări per client.`);
  return out;
}

export const fmtDate = (d: string | null | undefined) => d ? new Date(d.length <= 10 ? d + "T12:00:00" : d).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const fmtDateTime = (d: string | null | undefined) => d ? new Date(d).toLocaleString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const money = (n: number | string | null | undefined, cur = "EUR") => `${Number(n ?? 0).toLocaleString("ro-RO", { maximumFractionDigits: 2 })} ${cur === "RON" ? "lei" : cur === "EUR" ? "€" : cur}`;

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as any).message);
  return "A apărut o eroare.";
}

type MonState = { signals: Map<number, Signal>; reload: () => void };
const Ctx = createContext<MonState>({ signals: new Map(), reload: () => {} });

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const [signals, setSignals] = useState<Map<number, Signal>>(new Map());
  const [v, setV] = useState(0);
  useEffect(() => {
    let active = true;
    supabase.rpc("public_monetization").then(({ data }) => {
      if (!active || !Array.isArray(data)) return;
      setSignals(new Map((data as unknown as Signal[]).map((s) => [s.id, s])));
    });
    return () => { active = false; };
  }, [v]);
  const reload = useCallback(() => setV((x) => x + 1), []);
  return <Ctx.Provider value={{ signals, reload }}>{children}</Ctx.Provider>;
}

export const useMonetization = () => useContext(Ctx);

/** Paid placement for a given search context — never changes the rating, only order + a visible "Promovat" label. */
export function isPromotedFor(s: Signal | undefined, ctx: { city?: string | null; cuisine?: string | null }) {
  if (!s) return false;
  return s.promos.some((p) => p.type === "search_top" || (p.type === "category_city" && (!p.city || p.city === ctx.city) && (!p.cuisine || p.cuisine === ctx.cuisine) && (ctx.city || ctx.cuisine)));
}

export function logProfileView(restaurantId: number) {
  const key = `rm_view_${restaurantId}`;
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
  void supabase.from("profile_views").insert({ restaurant_id: restaurantId });
}
