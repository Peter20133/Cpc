import React from "react";
import { C, BODY, DISPLAY } from "@/data/constants";

export const inputStyle: React.CSSProperties = { width: "100%", marginTop: 6, padding: "11px 13px", borderRadius: 10, border: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 14, boxSizing: "border-box", outline: "none", background: "#fff" };

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>{label}</label>
      {children}
      {hint && <p style={{ fontFamily: BODY, fontSize: 11.5, color: C.inkSoft, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export function Tag({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "ink" | "gold" | "soft" | "green" }) {
  const map = {
    accent: { bg: C.accent, fg: "#fff" },
    ink: { bg: C.ink, fg: "#fff" },
    gold: { bg: C.gold, fg: "#fff" },
    green: { bg: C.green, fg: "#fff" },
    soft: { bg: C.lineSoft, fg: C.ink },
  }[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: map.bg, color: map.fg, fontFamily: BODY, fontWeight: 700, fontSize: 11, padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{children}</span>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 22 }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: "9px 15px", borderRadius: 999, border: `1px solid ${value === t.id ? C.ink : C.line}`, background: value === t.id ? C.ink : C.surface, color: value === t.id ? "#fff" : C.ink, fontFamily: BODY, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>{t.label}</button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px" }}>
      <p style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft }}>{label}</p>
      <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: C.ink, marginTop: 4 }}>{value}</p>
      {sub && <p style={{ fontFamily: BODY, fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "ok"; children: React.ReactNode }) {
  const color = kind === "error" ? C.accent : kind === "ok" ? C.green : C.inkSoft;
  return <p style={{ fontFamily: BODY, fontSize: 13.5, color, background: C.lineSoft, borderRadius: 10, padding: "10px 12px", margin: "10px 0", lineHeight: 1.5 }}>{children}</p>;
}

export function SmallBtn({ children, onClick, tone = "outline", disabled }: { children: React.ReactNode; onClick?: () => void; tone?: "outline" | "primary" | "danger"; disabled?: boolean }) {
  const s = tone === "primary" ? { background: C.green, color: "#fff", border: `1px solid ${C.green}` } : tone === "danger" ? { background: C.surface, color: C.accent, border: `1px solid ${C.accent}` } : { background: C.surface, color: C.ink, border: `1px solid ${C.line}` };
  return <button disabled={disabled} onClick={onClick} style={{ ...s, borderRadius: 9, padding: "7px 12px", fontFamily: BODY, fontWeight: 600, fontSize: 12.5, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>{children}</button>;
}

export const STATUS_RO: Record<string, string> = {
  pending: "În așteptare", confirmed: "Confirmată", canceled: "Anulată", no_show: "Neprezentare", completed: "Finalizată",
  claimed: "Revendicat", used: "Utilizat", void: "Anulat", expired: "Expirat",
  active: "Activ", inactive: "Inactiv", suspended: "Suspendat", pending_payment: "Așteaptă plata", past_due: "Restanță",
  paid: "Plătit", failed: "Eșuat", approved: "Aprobat", rejected: "Respins", due: "De plată",
};
