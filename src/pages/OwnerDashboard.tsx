import React, { useEffect, useState } from "react";
import { C, DISPLAY, BODY, Restaurant, CUISINES } from "@/data/constants";
import { Card, Eyebrow, BtnPrimary } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Offer, DAY_LABELS, discountLabel, fmtDate, fmtDateTime, money, errMsg, offerConditions } from "@/lib/monetization";
import { Tabs, Stat, Field, Tag, Notice, SmallBtn, STATUS_RO, inputStyle } from "@/components/mon";
import { OwnerRequest } from "@/pages/Dashboard";

type TabId = "stats" | "validate" | "reservations" | "offers" | "subscription" | "promo" | "profile";

export function OwnerDashboard({ restaurants, setView, onChanged }: { restaurants: Restaurant[]; setView: (v: string) => void; onChanged: () => void }) {
  const { user, ready, ownerships, approvedRestaurantIds, reload } = useAuth();
  const [rid, setRid] = useState<number | null>(null);
  const [tab, setTab] = useState<TabId>("stats");
  useEffect(() => { if (rid == null && approvedRestaurantIds.length) setRid(approvedRestaurantIds[0]); }, [approvedRestaurantIds.join(",")]);

  if (ready && !user) return <Center><h1 style={h1}>Intră în cont</h1><p style={sub}>Panoul restaurantului este disponibil după autentificare.</p><BtnPrimary onClick={() => setView("login")}>Intră în cont</BtnPrimary></Center>;
  if (!approvedRestaurantIds.length) {
    return (
      <div className="mx-auto" style={{ maxWidth: 640, padding: "56px 24px 96px" }}>
        <h1 style={h1}>Panou restaurant</h1>
        <p style={{ ...sub, marginBottom: 20 }}>Nu administrezi încă un restaurant aprobat. Trimite o cerere — după aprobare, panoul se activează.</p>
        <OwnerRequest restaurants={restaurants} onDone={() => void reload()} pending={ownerships} />
      </div>
    );
  }
  const r = restaurants.find((x) => x.id === rid);
  return (
    <div className="mx-auto" style={{ maxWidth: 1100, padding: "40px 20px 96px" }}>
      <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div><p className="rm-kicker" style={{ color: C.accent, fontFamily: BODY }}>Panou restaurant</p><h1 style={h1}>{r?.name ?? ownerships.find((o) => o.restaurant_id === rid)?.restaurantName ?? "Restaurant"}</h1></div>
        {approvedRestaurantIds.length > 1 && (
          <select value={rid ?? ""} onChange={(e) => setRid(Number(e.target.value))} style={{ ...inputStyle, width: "auto", marginTop: 0 }}>
            {ownerships.filter((o) => o.status === "approved").map((o) => <option key={o.restaurant_id} value={o.restaurant_id}>{o.restaurantName}</option>)}
          </select>
        )}
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "stats", label: "Statistici" }, { id: "validate", label: "Validează cupon" }, { id: "reservations", label: "Rezervări" },
        { id: "offers", label: "Oferte" }, { id: "subscription", label: "Abonament" }, { id: "promo", label: "Promovare" }, { id: "profile", label: "Profil" },
      ]} />
      {rid != null && (
        <>
          {tab === "stats" && <StatsTab rid={rid} />}
          {tab === "validate" && <ValidateTab />}
          {tab === "reservations" && <ReservationsTab rid={rid} />}
          {tab === "offers" && <OffersTab rid={rid} onChanged={onChanged} goPlans={() => setTab("subscription")} />}
          {tab === "subscription" && <SubscriptionTab rid={rid} onChanged={onChanged} />}
          {tab === "promo" && <PromoTab rid={rid} restaurant={r} />}
          {tab === "profile" && <ProfileTab rid={rid} restaurant={r} onChanged={onChanged} />}
        </>
      )}
    </div>
  );
}

const h1: React.CSSProperties = { fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, color: C.ink };
const sub: React.CSSProperties = { fontFamily: BODY, color: C.inkSoft, fontSize: 14, margin: "10px 0 22px" };
const Center = ({ children }: { children: React.ReactNode }) => <div className="mx-auto" style={{ maxWidth: 520, padding: "80px 24px", textAlign: "center" }}>{children}</div>;

/* ── Stats ── */
function StatsTab({ rid }: { rid: number }) {
  const [s, setS] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { supabase.rpc("restaurant_stats", { _rid: rid }).then(({ data, error }) => { if (error) setErr(errMsg(error)); else setS(data); }); }, [rid]);
  if (err) return <Notice kind="error">{err}</Notice>;
  if (!s) return <p style={sub}>Se încarcă...</p>;
  const max = Math.max(1, ...s.viewsDaily.map((d: any) => d.n));
  const cur = s.commissionCurrency;
  return (
    <div>
      <p style={{ fontFamily: BODY, fontSize: 13, color: C.inkSoft, marginBottom: 14 }}>Plan curent: <b style={{ color: C.ink }}>{String(s.plan).toUpperCase()}</b></p>
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>
        <Stat label="Vizualizări profil" value={s.views} sub={`${s.views30} în ultimele 30 zile`} />
        <Stat label="Rezervări primite" value={s.reservations} sub={`${s.canceled} anulate / neprezentări`} />
        <Stat label="Rezervări confirmate" value={s.confirmed} />
        <Stat label="Clienți atrași prin oferte" value={s.offerCustomers} />
        <Stat label="Cupoane revendicate" value={s.claimed} />
        <Stat label="Cupoane utilizate" value={s.used} />
        <Stat label="Abonament + campanii plătite" value={money(Number(s.subscriptionCost) + Number(s.campaignCost))} sub={`abonament ${money(s.subscriptionCost)} · campanii ${money(s.campaignCost)}`} />
        <Stat label="Comisioane acumulate" value={money(s.commissionDue, cur)} sub={`${s.commissionCount} rezervări confirmate`} />
      </div>
      <Card style={{ padding: 20, marginTop: 18 }}>
        <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 12 }}>Vizualizări — ultimele 14 zile</p>
        <div className="flex items-end" style={{ gap: 6, height: 120 }}>
          {s.viewsDaily.map((d: any) => (
            <div key={d.day} title={`${d.day}: ${d.n}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: `${(d.n / max) * 100}px`, minHeight: 2, background: C.green, borderRadius: 4 }} />
              <span style={{ fontFamily: BODY, fontSize: 9.5, color: C.inkSoft }}>{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Validate coupon (mobile-first) ── */
function ValidateTab() {
  const [code, setCode] = useState("");
  const [bill, setBill] = useState("");
  const [res, setRes] = useState<any>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setMsg(null); setRes(null);
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("coupon_check", { _code: code });
    setBusy(false);
    if (error) setMsg({ kind: "error", t: errMsg(error) }); else setRes(data);
  };
  const redeem = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("redeem_coupon", { _code: code, _bill_amount: bill ? Number(bill) : undefined });
    setBusy(false);
    if (error) setMsg({ kind: "error", t: errMsg(error) });
    else { setMsg({ kind: "ok", t: `Cupon validat. Codul ${code.toUpperCase()} nu mai poate fi folosit.` }); setRes(null); setCode(""); setBill(""); }
  };
  const o: Offer | undefined = res?.offer;
  return (
    <div style={{ maxWidth: 520 }}>
      <Card style={{ padding: 20 }}>
        <Field label="Codul clientului">
          <input autoCapitalize="characters" inputMode="text" placeholder="RM-XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && check()} style={{ ...inputStyle, fontSize: 20, letterSpacing: 2, padding: "14px" }} />
        </Field>
        <BtnPrimary full onClick={check}>{busy ? "Se verifică..." : "Verifică codul"}</BtnPrimary>
        {msg && <Notice kind={msg.kind}>{msg.t}</Notice>}
      </Card>
      {res && (
        <Card style={{ padding: 20, marginTop: 14, borderColor: res.valid ? C.green : C.accent }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: res.valid ? C.green : C.accent }}>{res.valid ? "Cupon valid" : "Cupon invalid"}</p>
          {(res.reasons ?? []).map((t: string) => <p key={t} style={{ fontFamily: BODY, fontSize: 13.5, color: C.accent }}>• {t}</p>)}
          {o && (
            <>
              <div className="flex items-center" style={{ gap: 8, marginTop: 10 }}><Tag>{discountLabel(o)}</Tag><b style={{ fontFamily: BODY, fontSize: 14 }}>{o.title}</b></div>
              <ul style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, paddingLeft: 16, listStyle: "disc", marginTop: 8 }}>{offerConditions(o).map((t) => <li key={t}>{t}</li>)}</ul>
              <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 6 }}>Emis {fmtDateTime(res.issued_at)} · expiră {fmtDateTime(res.expires_at)}</p>
              {res.reservation && <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.ink, marginTop: 4 }}>Rezervare: {res.reservation.name}, {fmtDate(res.reservation.date)} {res.reservation.time}, {res.reservation.people} pers. ({STATUS_RO[res.reservation.status]})</p>}
            </>
          )}
          {res.valid && (
            <>
              {o?.min_bill && <Field label={`Valoarea notei (minimum ${o.min_bill} lei)`}><input type="number" value={bill} onChange={(e) => setBill(e.target.value)} style={inputStyle} /></Field>}
              <BtnPrimary full onClick={redeem} style={{ marginTop: 10 }}>Confirmă utilizarea cuponului</BtnPrimary>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

/* ── Reservations ── */
function ReservationsTab({ rid }: { rid: number }) {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState(0);
  useEffect(() => { supabase.from("reservations").select("*, coupons:coupon_id(code)").eq("restaurant_id", rid).order("reserved_date", { ascending: false }).then(({ data }) => setRows(data ?? [])); }, [rid, v]);
  const act = async (id: string, s: string) => { setErr(null); const { error } = await supabase.rpc("set_reservation_status", { _id: id, _status: s }); if (error) setErr(errMsg(error)); else setV((x) => x + 1); };
  return (
    <div>
      <Notice>Comisionul RestoMatch se aplică o singură dată, doar rezervărilor confirmate. Anulările și neprezentările nu se taxează.</Notice>
      {err && <Notice kind="error">{err}</Notice>}
      {rows.length === 0 && <p style={sub}>Nicio rezervare încă.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <Card key={r.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: C.ink }}>{r.name} · {r.people} pers.</p>
              <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft }}>{fmtDate(r.reserved_date)} {r.reserved_time} · {r.phone}{r.coupons?.code ? ` · cupon ${r.coupons.code}` : ""}{r.notes ? ` · „${r.notes}”` : ""}</p>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
              <Tag tone={r.status === "confirmed" || r.status === "completed" ? "green" : "soft"}>{STATUS_RO[r.status]}</Tag>
              {r.status === "pending" && <><SmallBtn tone="primary" onClick={() => act(r.id, "confirmed")}>Confirmă</SmallBtn><SmallBtn tone="danger" onClick={() => act(r.id, "canceled")}>Refuză</SmallBtn></>}
              {r.status === "confirmed" && <><SmallBtn onClick={() => act(r.id, "completed")}>Finalizată</SmallBtn><SmallBtn onClick={() => act(r.id, "no_show")}>Neprezentare</SmallBtn><SmallBtn tone="danger" onClick={() => act(r.id, "canceled")}>Anulează</SmallBtn></>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Offers CRUD ── */
const emptyOffer = () => ({ title: "", description: "", discount_type: "percent", discount_value: "15", starts_on: new Date().toISOString().slice(0, 10), ends_on: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), valid_days: [1, 2, 3, 4, 5, 6, 7], time_from: "", time_to: "", max_uses: "", max_uses_per_user: "1", min_bill: "", min_people: "", included_items: "", excluded_items: "", requires_reservation: false, combinable: false, exclusive: false, terms: "", status: "active" });

function OffersTab({ rid, onChanged, goPlans }: { rid: number; onChanged: () => void; goPlans: () => void }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [form, setForm] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    supabase.from("offers").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).then(({ data }) => setOffers((data ?? []) as unknown as Offer[]));
    supabase.rpc("plan_allows_offers", { _rid: rid }).then(({ data }) => setAllowed(data === true));
  }, [rid, v]);
  const set = (k: string, val: any) => setForm((f: any) => ({ ...f, [k]: val }));
  const save = async () => {
    setErr(null);
    if (!form.title.trim() || !Number(form.discount_value)) { setErr("Completează titlul și valoarea reducerii."); return; }
    if (form.time_from && !form.time_to || !form.time_from && form.time_to) { setErr("Completează ambele ore ale intervalului."); return; }
    const num = (x: string) => (x === "" ? null : Number(x));
    const payload: any = {
      restaurant_id: rid, title: form.title.trim(), description: form.description || null, discount_type: form.discount_type, discount_value: Number(form.discount_value), currency: "RON",
      starts_on: form.starts_on, ends_on: form.ends_on, valid_days: form.valid_days, time_from: form.time_from || null, time_to: form.time_to || null,
      max_uses: num(form.max_uses), max_uses_per_user: Number(form.max_uses_per_user) || 1, min_bill: num(form.min_bill), min_people: num(form.min_people),
      included_items: form.included_items || null, excluded_items: form.excluded_items || null, requires_reservation: form.requires_reservation, combinable: form.combinable, exclusive: form.exclusive, terms: form.terms || null, status: form.status,
    };
    const { error } = editId ? await supabase.from("offers").update(payload).eq("id", editId) : await supabase.from("offers").insert(payload);
    if (error) { setErr(errMsg(error).includes("row-level") ? "Planul curent nu permite publicarea ofertelor (necesită PRO sau PREMIUM activ)." : errMsg(error)); return; }
    setForm(null); setEditId(null); setV((x) => x + 1); onChanged();
  };
  const toggle = async (o: Offer) => { const { error } = await supabase.from("offers").update({ status: o.status === "active" ? "inactive" : "active" }).eq("id", o.id); if (error) setErr(errMsg(error)); setV((x) => x + 1); onChanged(); };
  const remove = async (o: Offer) => { if (!confirm(`Ștergi oferta „${o.title}”? Cupoanele emise vor fi șterse.`)) return; const { error } = await supabase.from("offers").delete().eq("id", o.id); if (error) setErr(errMsg(error)); setV((x) => x + 1); onChanged(); };
  const edit = (o: Offer) => { setEditId(o.id); setForm({ ...o, discount_value: String(o.discount_value), max_uses: o.max_uses ?? "", max_uses_per_user: String(o.max_uses_per_user), min_bill: o.min_bill ?? "", min_people: o.min_people ?? "", time_from: o.time_from?.slice(0, 5) ?? "", time_to: o.time_to?.slice(0, 5) ?? "", description: o.description ?? "", included_items: o.included_items ?? "", excluded_items: o.excluded_items ?? "", terms: o.terms ?? "" }); };

  return (
    <div>
      {allowed === false && <Notice kind="error">Publicarea ofertelor necesită un abonament PRO sau PREMIUM activ. <button onClick={goPlans} style={{ background: "none", border: "none", color: C.accent, fontWeight: 700, cursor: "pointer" }}>Vezi abonamentele →</button></Notice>}
      {err && <Notice kind="error">{err}</Notice>}
      {!form && <SmallBtn tone="primary" onClick={() => { setEditId(null); setForm(emptyOffer()); }}>+ Ofertă nouă</SmallBtn>}
      {form && (
        <Card style={{ padding: 22, marginTop: 12 }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, marginBottom: 14 }}>{editId ? "Editează oferta" : "Ofertă nouă"}</p>
          <div className="grid md:grid-cols-2" style={{ columnGap: 16 }}>
            <Field label="Titlul ofertei"><input value={form.title} onChange={(e) => set("title", e.target.value)} style={inputStyle} placeholder="Ex: 15% la cină în timpul săptămânii" /></Field>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <Field label="Tip reducere"><select value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)} style={inputStyle}><option value="percent">Procentuală (%)</option><option value="fixed">Sumă fixă (lei)</option></select></Field>
              <Field label="Valoare"><input type="number" min={1} value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} style={inputStyle} /></Field>
            </div>
            <Field label="Descriere"><textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} style={inputStyle} /></Field>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <Field label="Data începerii"><input type="date" value={form.starts_on} onChange={(e) => set("starts_on", e.target.value)} style={inputStyle} /></Field>
              <Field label="Data expirării"><input type="date" value={form.ends_on} onChange={(e) => set("ends_on", e.target.value)} style={inputStyle} /></Field>
            </div>
            <Field label="Zile valabile">
              <div className="flex flex-wrap" style={{ gap: 6, marginTop: 6 }}>
                {DAY_LABELS.map((d, i) => { const on = form.valid_days.includes(i + 1); return <button key={d} onClick={() => set("valid_days", on ? form.valid_days.filter((x: number) => x !== i + 1) : [...form.valid_days, i + 1].sort())} style={{ width: 38, height: 34, borderRadius: 8, border: `1px solid ${on ? C.ink : C.line}`, background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, fontFamily: BODY, fontSize: 12, cursor: "pointer" }}>{d}</button>; })}
              </div>
            </Field>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <Field label="De la ora (opțional)"><input type="time" value={form.time_from} onChange={(e) => set("time_from", e.target.value)} style={inputStyle} /></Field>
              <Field label="Până la ora"><input type="time" value={form.time_to} onChange={(e) => set("time_to", e.target.value)} style={inputStyle} /></Field>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <Field label="Utilizări maxime (total)" hint="Gol = nelimitat"><input type="number" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} style={inputStyle} /></Field>
              <Field label="Utilizări per client"><input type="number" min={1} value={form.max_uses_per_user} onChange={(e) => set("max_uses_per_user", e.target.value)} style={inputStyle} /></Field>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <Field label="Notă minimă (lei, opțional)"><input type="number" value={form.min_bill} onChange={(e) => set("min_bill", e.target.value)} style={inputStyle} /></Field>
              <Field label="Minim persoane (opțional)"><input type="number" value={form.min_people} onChange={(e) => set("min_people", e.target.value)} style={inputStyle} /></Field>
            </div>
            <Field label="Produse / categorii incluse"><input value={form.included_items} onChange={(e) => set("included_items", e.target.value)} style={inputStyle} placeholder="Ex: preparate principale" /></Field>
            <Field label="Produse / categorii excluse"><input value={form.excluded_items} onChange={(e) => set("excluded_items", e.target.value)} style={inputStyle} placeholder="Ex: băuturi alcoolice" /></Field>
            <Field label="Termeni și condiții"><textarea rows={2} value={form.terms} onChange={(e) => set("terms", e.target.value)} style={inputStyle} /></Field>
            <div style={{ fontFamily: BODY, fontSize: 13.5, display: "flex", flexDirection: "column", gap: 8, paddingTop: 20 }}>
              <label><input type="checkbox" checked={form.requires_reservation} onChange={(e) => set("requires_reservation", e.target.checked)} /> Necesită rezervare prin RestoMatch</label>
              <label><input type="checkbox" checked={form.combinable} onChange={(e) => set("combinable", e.target.checked)} /> Se poate combina cu alte reduceri</label>
              <label><input type="checkbox" checked={form.exclusive} onChange={(e) => set("exclusive", e.target.checked)} /> Ofertă exclusivă RestoMatch</label>
              <label><input type="checkbox" checked={form.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "inactive")} /> Activă</label>
            </div>
          </div>
          <div className="flex" style={{ gap: 8, marginTop: 10 }}><SmallBtn tone="primary" onClick={save}>Salvează</SmallBtn><SmallBtn onClick={() => { setForm(null); setEditId(null); }}>Renunță</SmallBtn></div>
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {offers.map((o) => (
          <Card key={o.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="flex items-center" style={{ gap: 8 }}><Tag>{discountLabel(o)}</Tag><b style={{ fontFamily: BODY, fontSize: 14 }}>{o.title}</b><Tag tone="soft">{STATUS_RO[o.status]}</Tag></div>
              <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>{fmtDate(o.starts_on)} – {fmtDate(o.ends_on)} · {o.claims_count} revendicări · {o.uses_count} utilizări{o.max_uses ? ` / ${o.max_uses}` : ""}</p>
            </div>
            {o.status !== "suspended" ? (
              <div className="flex" style={{ gap: 6 }}><SmallBtn onClick={() => edit(o)}>Editează</SmallBtn><SmallBtn onClick={() => toggle(o)}>{o.status === "active" ? "Dezactivează" : "Activează"}</SmallBtn><SmallBtn tone="danger" onClick={() => remove(o)}>Șterge</SmallBtn></div>
            ) : <span style={{ fontFamily: BODY, fontSize: 12, color: C.accent }}>Suspendată de RestoMatch</span>}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Subscription ── */
function SubscriptionTab({ rid, onChanged }: { rid: number; onChanged: () => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [pays, setPays] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; t: string } | null>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("active", true).order("sort").then(({ data }) => setPlans(data ?? []));
    supabase.from("subscriptions").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).then(({ data }) => setSubs(data ?? []));
    supabase.from("payments").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).then(({ data }) => setPays(data ?? []));
  }, [rid, v]);
  const active = subs.find((s) => s.status === "active" && new Date(s.current_period_end) > new Date());
  const pending = subs.find((s) => s.status === "pending_payment");
  const choose = async (code: string) => {
    setMsg(null);
    const { data, error } = await supabase.rpc("select_plan", { _rid: rid, _plan: code });
    if (error) setMsg({ kind: "error", t: errMsg(error) });
    else setMsg({ kind: "ok", t: (data as any)?.message ?? "Comanda a fost creată și așteaptă plata. Abonamentul se activează automat după confirmarea plății." });
    setV((x) => x + 1); onChanged();
  };
  const cancel = async (resume = false) => { const { error } = await supabase.rpc("cancel_subscription", { _rid: rid, _resume: resume }); if (error) setMsg({ kind: "error", t: errMsg(error) }); setV((x) => x + 1); };
  const currentCode = active?.plan_code ?? "free";
  return (
    <div>
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <p style={{ fontFamily: BODY, fontSize: 13, color: C.inkSoft }}>Plan actual</p>
        <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink }}>{currentCode.toUpperCase()}</p>
        {active ? (
          <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.ink, marginTop: 4 }}>
            {active.cancel_at_period_end ? <>Anulat — rămâne activ până la <b>{fmtDate(active.current_period_end)}</b>, apoi treci pe FREE. <SmallBtn onClick={() => cancel(true)}>Reactivează</SmallBtn></> : <>Următoarea plată: <b>{fmtDate(active.current_period_end)}</b> ({money(active.price, active.currency)}). <SmallBtn tone="danger" onClick={() => cancel()}>Anulează abonamentul</SmallBtn></>}
          </p>
        ) : <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft }}>Fără abonament plătit.</p>}
        {pending && <Notice>Comandă {pending.plan_code.toUpperCase()} în așteptarea plății ({money(pending.price, pending.currency)}). Plățile online nu sunt încă activate pe RestoMatch — echipa confirmă plata (ex. transfer bancar) și abonamentul pornește automat.</Notice>}
        {msg && <Notice kind={msg.kind}>{msg.t}</Notice>}
      </Card>
      <div className="grid md:grid-cols-3" style={{ gap: 14 }}>
        {plans.map((p) => (
          <Card key={p.code} style={{ padding: 20, borderColor: p.code === currentCode ? C.ink : C.line }}>
            <p style={{ fontFamily: BODY, fontWeight: 700, color: C.accent, letterSpacing: 1, fontSize: 13 }}>{p.name}</p>
            <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, color: C.ink }}>{money(p.price, p.currency)}<span style={{ fontSize: 13, color: C.inkSoft }}>/lună</span></p>
            <ul style={{ fontFamily: BODY, fontSize: 13, color: C.ink, margin: "12px 0", paddingLeft: 16, listStyle: "disc", lineHeight: 1.7 }}>{p.features.map((f: string) => <li key={f}>{f}</li>)}</ul>
            {p.code === currentCode ? <Tag tone="ink">Planul tău</Tag> : <SmallBtn tone="primary" onClick={() => choose(p.code)}>{Number(p.price) === 0 ? "Treci pe FREE" : active ? "Schimbă pe acest plan" : "Alege planul"}</SmallBtn>}
          </Card>
        ))}
      </div>
      <PaymentsHistory pays={pays} />
    </div>
  );
}

function PaymentsHistory({ pays }: { pays: any[] }) {
  return (
    <div style={{ marginTop: 22 }}>
      <Eyebrow>Istoricul plăților</Eyebrow>
      {pays.length === 0 ? <p style={sub}>Nicio plată încă.</p> : pays.map((p) => (
        <div key={p.id} className="flex items-center justify-between" style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 13 }}>
          <span>{fmtDate(p.created_at)} · {p.description}</span>
          <span className="flex items-center" style={{ gap: 8 }}><b>{money(p.amount, p.currency)}</b><Tag tone={p.status === "paid" ? "green" : "soft"}>{STATUS_RO[p.status]}</Tag></span>
        </div>
      ))}
    </div>
  );
}

/* ── Promotion ── */
const PROMO_LABEL: Record<string, string> = { search_top: "Sus în căutări", homepage: "Recomandat pe pagina principală", offer: "Ofertă promovată", category_city: "Evidențiat în categorie / oraș" };
function PromoTab({ rid, restaurant }: { rid: number; restaurant?: Restaurant }) {
  const [pk, setPk] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sel, setSel] = useState<any>({ city: restaurant?.city ?? "", cuisine: "", offer: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; t: string } | null>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    supabase.from("campaign_packages").select("*").eq("active", true).order("type").order("days").then(({ data }) => setPk(data ?? []));
    supabase.from("campaigns").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).then(({ data }) => setCamps(data ?? []));
    supabase.from("offers").select("*").eq("restaurant_id", rid).then(({ data }) => setOffers((data ?? []) as unknown as Offer[]));
  }, [rid, v]);
  const buy = async (p: any) => {
    setMsg(null);
    const { error } = await supabase.rpc("buy_campaign", { _rid: rid, _package_id: p.id, _city: p.type === "category_city" ? sel.city || undefined : undefined, _cuisine: p.type === "category_city" ? sel.cuisine || undefined : undefined, _offer_id: p.type === "offer" ? sel.offer || undefined : undefined });
    if (error) setMsg({ kind: "error", t: errMsg(error) }); else setMsg({ kind: "ok", t: "Campania a fost comandată și așteaptă plata. Pornește automat după confirmarea plății." });
    setV((x) => x + 1);
  };
  const cancel = async (id: string) => { const { error } = await supabase.rpc("cancel_campaign", { _id: id }); if (error) setMsg({ kind: "error", t: errMsg(error) }); setV((x) => x + 1); };
  const types = Array.from(new Set(pk.map((p) => p.type)));
  const statusOf = (c: any) => c.status === "active" && new Date(c.ends_at) < new Date() ? "Încheiată" : STATUS_RO[c.status];
  return (
    <div>
      <Notice>Restaurantele promovate apar cu eticheta „Promovat”. Promovarea nu modifică ratingul și nu este prezentată ca recomandare organică.</Notice>
      {msg && <Notice kind={msg.kind}>{msg.t}</Notice>}
      <div className="grid md:grid-cols-2" style={{ gap: 14 }}>
        {types.map((t) => (
          <Card key={t} style={{ padding: 18 }}>
            <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17 }}>{PROMO_LABEL[t]}</p>
            {t === "category_city" && (
              <div className="grid grid-cols-2" style={{ gap: 8 }}>
                <input placeholder="Oraș" value={sel.city} onChange={(e) => setSel({ ...sel, city: e.target.value })} style={inputStyle} />
                <select value={sel.cuisine} onChange={(e) => setSel({ ...sel, cuisine: e.target.value })} style={inputStyle}><option value="">Orice categorie</option>{CUISINES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              </div>
            )}
            {t === "offer" && <select value={sel.offer} onChange={(e) => setSel({ ...sel, offer: e.target.value })} style={inputStyle}><option value="">Alege oferta</option>{offers.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>}
            <div className="flex flex-wrap" style={{ gap: 8, marginTop: 12 }}>
              {pk.filter((p) => p.type === t).map((p) => <SmallBtn key={p.id} onClick={() => buy(p)}>{p.days} zile · {money(p.price, p.currency)}</SmallBtn>)}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <Eyebrow>Campaniile tale</Eyebrow>
        {camps.length === 0 ? <p style={sub}>Nicio campanie.</p> : camps.map((c) => (
          <div key={c.id} className="flex items-center justify-between" style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 13, flexWrap: "wrap", gap: 8 }}>
            <span>{PROMO_LABEL[c.type]} · {c.days} zile{c.target_city ? ` · ${c.target_city}` : ""}{c.target_cuisine ? ` · ${c.target_cuisine}` : ""}{c.starts_at ? ` · ${fmtDate(c.starts_at)} – ${fmtDate(c.ends_at)}` : ""}</span>
            <span className="flex items-center" style={{ gap: 8 }}><b>{money(c.price, c.currency)}</b><Tag tone={c.status === "active" ? "green" : "soft"}>{statusOf(c)}</Tag>{c.status === "pending_payment" && <SmallBtn tone="danger" onClick={() => cancel(c.id)}>Anulează</SmallBtn>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Profile ── */
function ProfileTab({ rid, restaurant, onChanged }: { rid: number; restaurant?: Restaurant; onChanged: () => void }) {
  const [f, setF] = useState({ description: restaurant?.description ?? "", phone: restaurant?.phone ?? "", website: restaurant?.website ?? "", instagram: restaurant?.instagram ?? "", hours: restaurant?.hours ?? "", address: restaurant?.address ?? "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; t: string } | null>(null);
  const save = async () => { const { error } = await supabase.rpc("owner_update_restaurant", { _rid: rid, _patch: f }); setMsg(error ? { kind: "error", t: errMsg(error) } : { kind: "ok", t: "Profil actualizat." }); if (!error) onChanged(); };
  return (
    <Card style={{ padding: 22, maxWidth: 640 }}>
      {(["description", "address", "hours", "phone", "website", "instagram"] as const).map((k) => (
        <Field key={k} label={{ description: "Descriere", address: "Adresă", hours: "Program", phone: "Telefon", website: "Website", instagram: "Instagram" }[k]}>
          {k === "description" ? <textarea rows={4} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} style={inputStyle} /> : <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} style={inputStyle} />}
        </Field>
      ))}
      {msg && <Notice kind={msg.kind}>{msg.t}</Notice>}
      <SmallBtn tone="primary" onClick={save}>Salvează</SmallBtn>
    </Card>
  );
}
