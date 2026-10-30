import React from "react";
import { Heart, MapPin, Clock, UtensilsCrossed, ArrowUpRight } from "lucide-react";
import { C, BODY, DISPLAY, MOODS, Restaurant, primaryImage, imageAlt, imageSource, googlePhotoUrl } from "@/data/constants";
import { Card, Stars } from "./ui";

export function RestaurantCard({ r, onOpen, saved, onToggleSave }: { r: Restaurant & { score?: number }; onOpen: () => void; saved: boolean; onToggleSave: () => void }) {
  const cover = primaryImage(r);
  return (
    <Card hover onClick={onOpen} style={{ overflow: "hidden" }}>
      <div style={{ position: "relative", overflow: "hidden", background: C.lineSoft }}>
        {cover ? (
          <>
            <img className="rm-image-zoom" src={cover} alt={imageAlt(r)} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (r.googlePhotos?.length && !img.dataset.retry) { img.dataset.retry = "1"; img.src = googlePhotoUrl(r, 0); } else img.style.display = "none"; }} style={{ width: "100%", height: 214, objectFit: "cover", display: "block" }} />
            <span style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,.55)", color: "#fff", fontFamily: BODY, fontSize: 10.5, padding: "3px 8px", borderRadius: 999 }}>{imageSource(r) === "google" ? "Foto: Google Maps" : imageSource(r) === "site" ? "Foto: site-ul restaurantului" : "Imagine ilustrativă (fallback)"}</span>
          </>
        ) : (
            <div style={{ width: "100%", height: 214, background: `radial-gradient(circle at 78% 18%, rgba(196,154,87,.28), transparent 32%), linear-gradient(135deg, ${C.green}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UtensilsCrossed size={38} color="rgba(255,255,255,.72)" strokeWidth={1.25} />
          </div>
        )}
        <span style={{ position: "absolute", top: 14, left: 14, background: C.surface, color: C.ink, fontFamily: BODY, fontWeight: 700, fontSize: 11, letterSpacing: .3, padding: "7px 10px", borderRadius: 999, backdropFilter: "blur(8px)", boxShadow: "0 4px 14px rgba(0,0,0,.08)" }}>{r.score ?? 90}% potrivire</span>
        <button aria-label={saved ? "Elimină din favorite" : "Salvează restaurantul"} onClick={(e) => { e.stopPropagation(); onToggleSave(); }} style={{ position: "absolute", top: 13, right: 13, width: 38, height: 38, borderRadius: 12, background: "rgba(255,253,249,.94)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
          <Heart size={15} color={saved ? C.accent : C.inkSoft} fill={saved ? C.accent : "none"} />
        </button>
      </div>
      <div style={{ padding: "18px 18px 19px" }}>
        <div className="flex items-start justify-between" style={{ gap: 12 }}><p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, lineHeight: 1.12, color: C.ink, letterSpacing: -.3 }}>{r.name}</p><span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}><Stars rating={r.rating} />{r.reviewCount ? <span style={{ fontFamily: BODY, fontSize: 11, color: C.inkSoft }}>{r.reviewCount} recenzii Google</span> : null}</span></div>
        <p style={{ fontFamily: BODY, color: C.accent, fontSize: 12.5, fontWeight: 600, marginTop: 7 }}>{r.cuisineLabel}{r.mood ? ` · ${MOODS.find((m) => m.id === r.mood)?.label ?? r.mood}` : ""}</p>
        <div className="flex items-center justify-between" style={{ marginTop: 16, paddingTop: 13, borderTop: `1px solid ${C.lineSoft}` }}>
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12.5, color: C.ink }}>{r.price === "—" ? "Preț indisponibil" : r.price}</span>
          <span style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} color={C.accent} /> {r.city}</span>
        </div>
        <p style={{ fontFamily: BODY, fontSize: 11.5, color: C.inkSoft, marginTop: 11, display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} color={C.accent} /> {r.hours ? r.hours : "Program indisponibil în OSM"} <ArrowUpRight size={12} style={{ marginLeft: "auto" }} /></p>
      </div>
    </Card>
  );
}
