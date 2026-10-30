import React from "react";
import {
  ChevronLeft, Heart, MapPin, Clock, Phone, Globe, ExternalLink, Instagram, UtensilsCrossed,
} from "lucide-react";
import { C, DISPLAY, BODY, Restaurant, googleMapsUrl, getGallery, primaryImage, imageAlt, imageSource, googlePhotoUrl } from "@/data/constants";
import { getRestaurantReviews, type GoogleReview } from "@/lib/reviews.functions";
import { OffersSection } from "@/components/OffersSection";
import { logProfileView } from "@/lib/monetization";
import { Card, Stars, Eyebrow, BtnPrimary, BtnOutline } from "@/components/ui";

function PhotoCredit({ r }: { r: Restaurant }) {
  const s = imageSource(r);
  const style = { fontFamily: BODY, fontSize: 12, color: C.inkSoft, marginTop: 8 } as const;
  if (s === "fallback") return <p style={style}>Imagine ilustrativă (fallback) — Google Maps nu oferă încă fotografii pentru acest restaurant.</p>;
  if (s === "site") return <p style={style}>Foto: site-ul oficial al restaurantului.</p>;
  const authors = new Map<string, string | undefined>();
  r.googlePhotos!.forEach((p) => p.attributions.forEach((a) => a.displayName && authors.set(a.displayName, a.uri)));
  return (
    <p style={style}>
      Foto: <a href={r.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${r.googlePlaceId}` : undefined} target="_blank" rel="noreferrer" style={{ color: C.ink, fontWeight: 600 }}>Google Maps</a>
      {authors.size > 0 && <> · autori: {[...authors].map(([n, u], i) => <React.Fragment key={n}>{i > 0 && ", "}{u ? <a href={u} target="_blank" rel="noreferrer" style={{ color: C.inkSoft, textDecoration: "underline" }}>{n}</a> : n}</React.Fragment>)}</>}
    </p>
  );
}
function ReviewsSection({ r }: { r: Restaurant }) {
  const [state, setState] = React.useState<{ loading: boolean; reviews: GoogleReview[]; error?: string }>({ loading: true, reviews: [] });
  React.useEffect(() => {
    if (!r.googlePlaceId) { setState({ loading: false, reviews: [] }); return; }
    let alive = true;
    setState({ loading: true, reviews: [] });
    getRestaurantReviews({ data: { id: r.id } })
      .then((d) => alive && setState({ loading: false, reviews: d.reviews }))
      .catch((e) => alive && setState({ loading: false, reviews: [], error: String(e?.message ?? e) }));
    return () => { alive = false; };
  }, [r.id, r.googlePlaceId]);
  return (
    <div style={{ marginTop: 36 }}>
      <Eyebrow>Recenzii Google</Eyebrow>
      {state.loading && <p style={{ fontFamily: BODY, fontSize: 14, color: C.inkSoft }}>Se încarcă recenziile…</p>}
      {!state.loading && state.error && <p style={{ fontFamily: BODY, fontSize: 14, color: C.inkSoft }}>Recenziile nu au putut fi încărcate acum.</p>}
      {!state.loading && !state.error && state.reviews.length === 0 && <p style={{ fontFamily: BODY, fontSize: 14, color: C.inkSoft }}>Nu există încă recenzii Google pentru acest restaurant.</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {state.reviews.map((rv, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {rv.photo && <img src={rv.photo} alt="" referrerPolicy="no-referrer" style={{ width: 32, height: 32, borderRadius: 999 }} />}
              <div style={{ flex: 1 }}>
                {rv.authorUrl ? <a href={rv.authorUrl} target="_blank" rel="noreferrer" style={{ fontFamily: BODY, fontWeight: 600, fontSize: 14, color: C.ink }}>{rv.author}</a> : <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 14, color: C.ink }}>{rv.author}</span>}
                <div style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft }}>{"★".repeat(Math.round(rv.rating))}{"☆".repeat(5 - Math.round(rv.rating))} {rv.when && `· ${rv.when}`}</div>
              </div>
            </div>
            {rv.text && <p style={{ fontFamily: BODY, fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{rv.text.length > 400 ? rv.text.slice(0, 400) + "…" : rv.text}</p>}
          </Card>
        ))}
      </div>
      {state.reviews.length > 0 && <p style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft, marginTop: 8 }}>Recenzii de pe Google Maps</p>}
    </div>
  );
}


export function RestaurantDetail({ restaurant, setView, saved, toggleSaved }: { restaurant: Restaurant | undefined; setView: (v: string) => void; saved: Set<number>; toggleSaved: (id: number) => void }) {
  React.useEffect(() => { if (restaurant) logProfileView(restaurant.id); }, [restaurant?.id]);
  if (!restaurant) return null;
  const r = restaurant;
  const gallery = getGallery(r);
  const cover = primaryImage(r);
  return (
    <div className="rm-page rm-container" style={{ padding: "38px 0 88px" }}>
      <button onClick={() => setView("results")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontWeight: 700, color: C.inkSoft, fontSize: 13, marginBottom: 18, padding: 0 }}><ChevronLeft size={16} /> Înapoi la rezultate</button>
      <div className="rm-reveal" style={{ position: "relative", borderRadius: 26, overflow: "hidden", border: `1px solid ${C.line}`, boxShadow: C.shadowLg }}>
        {cover ? (
          <img src={cover} alt={imageAlt(r)} referrerPolicy="no-referrer" onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (r.googlePhotos?.length && !img.dataset.retry) { img.dataset.retry = "1"; img.src = googlePhotoUrl(r, 0); } else img.style.display = "none"; }} style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: 420, background: `radial-gradient(circle at 75% 20%, rgba(196,154,87,.28), transparent 30%), linear-gradient(135deg, ${C.green}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UtensilsCrossed size={58} color={C.accent} strokeWidth={1.2} />
          </div>
        )}
        <button onClick={() => toggleSaved(r.id)} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.95)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Heart size={18} color={saved.has(r.id) ? C.accent : C.inkSoft} fill={saved.has(r.id) ? C.accent : "none"} /></button>
      </div>
      <PhotoCredit r={r} />
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 8, marginTop: 10 }}>
        {gallery.slice(0, 4).map((src, i) => (<img key={i} src={src} alt={`${imageAlt(r)} ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} style={{ width: "100%", height: 85, objectFit: "cover", borderRadius: 12 }} />))}
      </div>
       <div className="grid md:grid-cols-3" style={{ gap: 54, marginTop: 38 }}>
        <div className="md:col-span-2">
           <div className="flex items-start justify-between" style={{ flexWrap: "wrap", gap: 14 }}><div><p className="rm-kicker" style={{ color: C.accent, fontFamily: BODY, marginBottom: 8 }}>{r.city}</p><h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1, letterSpacing: -1.1, color: C.ink }}>{r.name}</h1></div><div style={{ paddingTop: 20 }}><Stars rating={r.rating} /></div></div>
           <p style={{ fontFamily: BODY, color: C.accent, fontWeight: 700, fontSize: 14, marginTop: 12 }}>{r.cuisineLabel} <span style={{ color: C.inkSoft, fontWeight: 500 }}>·</span> <span style={{ color: C.inkSoft, fontWeight: 500 }}>{r.price === "—" ? "preț indisponibil" : r.price}</span></p>
          {r.tags && (<div className="flex flex-wrap" style={{ gap: 6, marginTop: 12 }}>{r.tags.map((t) => (<span key={t} style={{ background: C.lineSoft, color: C.inkSoft, fontFamily: BODY, fontWeight: 500, fontSize: 12, padding: "5px 11px", borderRadius: 999 }}>{t}</span>))}</div>)}
          {r.description && <p style={{ fontFamily: BODY, color: C.ink, fontSize: 15, lineHeight: 1.7, marginTop: 22 }}>{r.description}</p>}
          {r.facilities && r.facilities.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <Eyebrow>Facilități</Eyebrow>
              <div className="flex flex-wrap" style={{ gap: 6 }}>
                {r.facilities.map((f) => (<span key={f} style={{ background: C.accentSoft, color: C.accent, fontFamily: BODY, fontWeight: 500, fontSize: 12, padding: "5px 11px", borderRadius: 999 }}>{f}</span>))}
              </div>
            </div>
          )}
          {r.menu && r.menu.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <Eyebrow>Meniu</Eyebrow>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {r.menu.map((m, i) => (
                  <div key={i} className="flex items-center justify-between" style={{ padding: "12px 16px", borderTop: i > 0 ? `1px solid ${C.line}` : "none" }}>
                    <span style={{ fontFamily: BODY, fontSize: 14, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}><UtensilsCrossed size={13} color={C.inkSoft} /> {m.name}</span>
                    {m.price && <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13.5, color: C.inkSoft }}>{m.price}</span>}
                  </div>
                ))}
              </Card>
            </div>
          )}
          {r.dishes.length > 0 && <div style={{ marginTop: 32 }}><Eyebrow>Mâncăruri recomandate</Eyebrow><div className="grid sm:grid-cols-3" style={{ gap: 10 }}>{r.dishes.map((d) => (<Card key={d} style={{ padding: "14px 16px" }}><p style={{ fontFamily: BODY, fontWeight: 500, fontSize: 14, color: C.ink }}>{d}</p></Card>))}</div></div>}
          {gallery.length > 0 && <div style={{ marginTop: 32 }}><Eyebrow>Galerie foto</Eyebrow><div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 8 }}>{gallery.map((src, i) => (<img key={i} src={src} alt={`${r.name} ${i + 1}`} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12 }} />))}</div></div>}
          <div style={{ marginTop: 32 }}>
            <Eyebrow>Locație</Eyebrow>
            {r.latitude !== undefined && r.longitude !== undefined ? (
              <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}` }}>
                <iframe title={`Hartă ${r.name}`} loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(`${r.name}, ${r.address ?? r.city ?? ""}`)}&ll=${r.latitude},${r.longitude}&z=16&output=embed`} style={{ width: "100%", height: 300, border: 0, display: "block" }} />
              </div>
            ) : (
              <p style={{ fontFamily: BODY, fontSize: 14, color: C.inkSoft }}>Coordonate indisponibile.</p>
            )}
            <button onClick={() => window.open(r.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${r.googlePlaceId}` : googleMapsUrl(r), "_blank")} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink, padding: 0 }}><ExternalLink size={13} /> Deschide în Google Maps</button>
          </div>
          <ReviewsSection r={r} />
          <OffersSection restaurantId={r.id} setView={setView} />
        </div>
        <aside>
           <Card style={{ padding: 24, position: "sticky", top: 92, boxShadow: C.shadow }}>
             <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}><MapPin size={15} style={{ marginTop: 2, flexShrink: 0 }} /> {r.address ?? "Adresă indisponibilă în OpenStreetMap"}</p>
             <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.inkSoft, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 22 }}><Clock size={15} style={{ marginTop: 2, flexShrink: 0 }} /> {r.hours ?? "Program indisponibil în OpenStreetMap"}</p>
            <BtnPrimary full onClick={() => setView("reserve")} style={{ marginBottom: 10 }}>Rezervă prin RestoMatch</BtnPrimary>
            {r.booking.type === "phone" && (<div><BtnPrimary full style={{ background: C.ink }} onClick={() => window.open(`tel:${r.booking.phone?.replace(/\s+/g, "")}`)}><Phone size={15} /> Sună pentru rezervare</BtnPrimary><p style={{ fontFamily: BODY, textAlign: "center", marginTop: 10, fontWeight: 600, color: C.ink, fontSize: 14 }}>{r.booking.phone}</p></div>)}
            {r.booking.type === "website" && <BtnOutline full onClick={() => window.open(r.booking.url, "_blank")}><Globe size={15} /> Vezi website-ul</BtnOutline>}
             {r.booking.type === "none" && <div style={{ background: C.lineSoft, borderRadius: 12, padding: "12px 14px" }}><p style={{ fontFamily: BODY, textAlign: "center", color: C.inkSoft, fontSize: 12.5, lineHeight: 1.5 }}>Nu există date de contact publice în sursa OpenStreetMap.</p></div>}
            {(r.website && r.booking.type !== "website") || r.instagram ? (
              <div className="flex items-center" style={{ gap: 8, marginTop: 12 }}>
                {r.website && r.booking.type !== "website" && (
                  <button onClick={() => window.open(r.website, "_blank")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.lineSoft, border: "none", borderRadius: 10, padding: "9px 0", cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 12.5, color: C.ink }}>
                    <Globe size={13} /> Website
                  </button>
                )}
                {r.instagram && (
                  <button onClick={() => window.open(`https://instagram.com/${r.instagram!.replace(/^@/, "")}`, "_blank")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.lineSoft, border: "none", borderRadius: 10, padding: "9px 0", cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 12.5, color: C.ink }}>
                    <Instagram size={13} /> Instagram
                  </button>
                )}
              </div>
            ) : null}
            <button onClick={() => window.open(googleMapsUrl(r), "_blank")} style={{ width: "100%", marginTop: 12, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.inkSoft, padding: "8px 0" }}><MapPin size={13} /> Vezi traseul în Google Maps</button>
          </Card>
        </aside>
      </div>
    </div>
  );
}