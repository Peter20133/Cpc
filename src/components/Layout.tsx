import React, { useState } from "react";
import { Menu, X, Store, Compass, Sparkles, UserRound } from "lucide-react";
import { C, BODY } from "@/data/constants";
import { Logo, BtnPrimary, BtnOutline } from "./ui";

export function Header({ view, setView, loggedIn }: { view: string; setView: (v: string) => void; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const items = [{ id: "home", label: "Acasă" }, { id: "results", label: "Explorează" }, { id: "how", label: "Cum funcționează" }, { id: "for-restaurants", label: "Prețuri" }];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(247,245,240,.82)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${C.line}` }}>
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1240, padding: "16px 24px" }}>
        <Logo onClick={() => { setView("home"); setOpen(false); }} />
        <nav className="hidden lg:flex items-center" style={{ gap: 8, marginLeft: 32 }}>
          {items.map((it) => (
            <button key={it.id} onClick={() => setView(it.id)} style={{
              background: view === it.id ? C.surface : "transparent", border: `1px solid ${view === it.id ? C.line : "transparent"}`, borderRadius: 999, cursor: "pointer", fontFamily: BODY, fontWeight: view === it.id ? 600 : 500, fontSize: 13.5,
              color: view === it.id ? C.ink : C.inkSoft, transition: "all .2s", padding: "9px 14px",
            }} onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = view === it.id ? C.ink : C.inkSoft)}>{it.label}</button>
          ))}
        </nav>
        <div className="hidden lg:flex items-center" style={{ gap: 10 }}>
          <button onClick={() => setView(loggedIn ? "dashboard" : "login")} style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: BODY, fontWeight: 600, fontSize: 13.5, color: C.inkSoft, display: "flex", alignItems: "center", gap: 7,
          }}><UserRound size={15} /> {loggedIn ? "Contul meu" : "Login"}</button>
          <BtnOutline onClick={() => setView("add-restaurant")} style={{ padding: "9px 16px", fontSize: 13.5, borderRadius: 10 }}>
            <Store size={14} /> Adaugă restaurant
          </BtnOutline>
          <BtnPrimary onClick={() => setView("search")} style={{ padding: "10px 18px", fontSize: 13.5, borderRadius: 10 }}><Sparkles size={14} /> Găsește un restaurant</BtnPrimary>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} style={{ background: "none", border: "none" }}>
          {open ? <X size={24} color={C.ink} /> : <Menu size={24} color={C.ink} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden" style={{ borderTop: `1px solid ${C.line}`, padding: "14px 24px 20px", display: "flex", flexDirection: "column", gap: 2, background: C.surface, boxShadow: C.shadow }}>
          {items.map((it) => (
            <button key={it.id} onClick={() => { setView(it.id); setOpen(false); }} style={{ textAlign: "left", padding: "12px 0", background: "none", border: "none", fontFamily: BODY, fontWeight: 500, fontSize: 15, color: view === it.id ? C.ink : C.inkSoft }}>{it.label}</button>
          ))}
           <button onClick={() => { setView(loggedIn ? "dashboard" : "login"); setOpen(false); }} style={{ textAlign: "left", padding: "12px 0", background: "none", border: "none", fontFamily: BODY, fontWeight: 500, fontSize: 15, color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}><UserRound size={16} /> {loggedIn ? "Contul meu" : "Login"}</button>
          <BtnOutline onClick={() => { setView("add-restaurant"); setOpen(false); }} full style={{ marginTop: 8 }}><Store size={15} /> Adaugă restaurant</BtnOutline>
          <BtnPrimary onClick={() => { setView("search"); setOpen(false); }} full style={{ marginTop: 8 }}>Găsește un restaurant</BtnPrimary>
        </div>
      )}
    </header>
  );
}

export function Footer({ setView }: { setView: (v: string) => void }) {
  return (
    <footer style={{ borderTop: `1px solid rgba(255,255,255,.08)`, marginTop: 112, background: C.green, color: "#F7F5F0" }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "64px 24px 32px" }}>
        <div className="flex flex-col md:flex-row md:justify-between" style={{ gap: 32 }}>
          <div style={{ maxWidth: 320 }}>
            <Logo onClick={() => setView("home")} />
             <p style={{ fontFamily: BODY, color: "rgba(247,245,240,.68)", fontSize: 14, marginTop: 14, lineHeight: 1.7, maxWidth: 280 }}>Restaurantul potrivit, găsit pentru tine. Fără compromisuri.</p>
          </div>
          <div className="flex flex-wrap" style={{ gap: 48 }}>
            <div>
               <p style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: "rgba(247,245,240,.55)", marginBottom: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>Platformă</p>
              {[["home","Acasă"],["results","Explorează"],["how","Cum funcționează"],["surprise","Surprinde-mă"]].map(([v,l]) => (
                <button key={v} onClick={() => setView(v)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 14, color: C.inkSoft, padding: "5px 0" }}>{l}</button>
              ))}
            </div>
            <div>
               <p style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: "rgba(247,245,240,.55)", marginBottom: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>Cont</p>
              {[["login","Login"],["dashboard","Dashboard"],["for-restaurants","Pentru restaurante"]].map(([v,l]) => (
                <button key={v} onClick={() => setView(v)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 14, color: C.inkSoft, padding: "5px 0" }}>{l}</button>
              ))}
            </div>
            <div>
               <p style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: "rgba(247,245,240,.55)", marginBottom: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>Proprietari</p>
              {[["add-restaurant","Adaugă restaurant"],["admin","Admin"]].map(([v,l]) => (
                <button key={v} onClick={() => setView(v)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 14, color: C.inkSoft, padding: "5px 0" }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
         <p style={{ fontFamily: BODY, color: "rgba(247,245,240,.5)", fontSize: 12, marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.1)" }}>Datele din OpenStreetMap sunt verificate înainte de publicare. Restaurantele adăugate de proprietari trec prin aceeași verificare.</p>
      </div>
    </footer>
  );
}
