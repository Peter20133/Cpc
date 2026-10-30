import React from "react";
import { Star, Utensils, Check, ArrowUpRight } from "lucide-react";
import { C, DISPLAY, BODY } from "@/data/constants";

export function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <span style={{ width: 38, height: 38, borderRadius: 13, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 5px 12px rgba(48,75,61,.2)" }}>
        <Utensils size={18} color="#F7F5F0" strokeWidth={2} />
      </span>
      <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: C.ink, letterSpacing: -0.5 }}>Resto<span style={{ color: C.accent }}>Match</span></span>
    </button>
  );
}

export function Pill({ active, onClick, children, style }: { active?: boolean; onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} className="transition-all" style={{
      padding: "9px 16px", borderRadius: 999, border: `1px solid ${active ? C.ink : C.line}`,
      background: active ? C.ink : C.surface, color: active ? "#fff" : C.ink,
      fontFamily: BODY, fontWeight: 500, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap",
      transition: "all .2s ease", ...style,
    }}>{children}</button>
  );
}

export function BtnPrimary({ children, onClick, full, style, type = "button" }: { children: React.ReactNode; onClick?: () => void; full?: boolean; style?: React.CSSProperties; type?: "button" | "submit" }) {
  const baseBackground = typeof style?.background === "string" ? style.background : C.green;
  return (
    <button type={type} onClick={onClick} className="transition-all" style={{
      background: C.green, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12,
      fontFamily: BODY, fontWeight: 600, fontSize: 14.5, cursor: "pointer",
      width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      transition: "all .2s ease", ...style,
    }} onMouseEnter={(e) => { e.currentTarget.style.background = baseBackground === C.green ? C.accentDark : C.accentSoft; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = baseBackground; e.currentTarget.style.transform = "translateY(0)"; }}>{children}</button>
  );
}

export function BtnOutline({ children, onClick, full, style }: { children: React.ReactNode; onClick?: () => void; full?: boolean; style?: React.CSSProperties }) {
  const baseBackground = typeof style?.background === "string" ? style.background : C.surface;
  const baseBorder = typeof style?.borderColor === "string" ? style.borderColor : C.line;
  return (
    <button onClick={onClick} className="transition-all" style={{
      background: C.surface, color: C.ink, border: `1px solid ${C.line}`, padding: "14px 28px", borderRadius: 12,
      fontFamily: BODY, fontWeight: 600, fontSize: 14.5, cursor: "pointer",
      width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      transition: "all .2s ease", ...style,
    }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.ink; e.currentTarget.style.background = baseBackground === C.surface ? C.lineSoft : "rgba(255,255,255,.14)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = baseBorder; e.currentTarget.style.background = baseBackground; e.currentTarget.style.transform = "translateY(0)"; }}>{children}</button>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="rm-kicker" style={{ fontFamily: BODY, color: C.accent, fontWeight: 700, marginBottom: 10 }}>{children}</p>;
}

export function Stars({ rating }: { rating: number }) {
  if (rating <= 0) {
    return <span style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft }}>Fără rating în sursa OSM</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <Star size={13} color={C.gold} fill={C.gold} />
      <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13, color: C.ink }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export function Card({ children, style, onClick, hover }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; hover?: boolean }) {
  return (
    <div onClick={onClick} className={`transition-all ${hover ? "rm-hover-lift rm-card" : ""}`} style={{
      background: C.surface, border: `1px solid ${C.line}`, borderRadius: 20, transition: "all .25s ease",
      ...(hover ? { cursor: "pointer" } : {}), ...style,
    }} onMouseEnter={hover ? (e) => { e.currentTarget.style.borderColor = "#D5CCBF"; e.currentTarget.style.boxShadow = C.shadow; } : undefined}
      onMouseLeave={hover ? (e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = "none"; } : undefined}>{children}</div>
  );
}

export { Check };
