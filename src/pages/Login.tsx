import React, { useState } from "react";
import { C, DISPLAY, BODY } from "@/data/constants";
import { Card, BtnPrimary, BtnOutline } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { inputStyle, Notice } from "@/components/mon";

export function Login({ onLogin }: { setView: (v: string) => void; onLogin: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null); setInfo(null);
    if (!email.trim() || password.length < 6) { setError("Introdu un email valid și o parolă de minimum 6 caractere."); return; }
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onLogin();
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session) onLogin();
        else setInfo("Cont creat. Verifică emailul și apasă linkul de confirmare, apoi intră în cont.");
      }
    } catch (e: any) {
      setError(e?.message === "Invalid login credentials" ? "Email sau parolă greșită." : e?.message ?? "Autentificarea a eșuat.");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setError(null);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if ((res as any)?.error) setError("Autentificarea cu Google a eșuat.");
    else if (!(res as any)?.redirected) onLogin();
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 400, padding: "80px 24px 112px" }}>
      <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, color: C.ink, textAlign: "center" }}>{mode === "in" ? "Bun venit înapoi" : "Creează cont"}</h1>
      <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 32 }}>Intră în cont pentru oferte, cupoane și rezervări.</p>
      <Card style={{ padding: 28 }}>
        <label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Email</label>
        <input type="email" placeholder="nume@exemplu.ro" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} />
        <label style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink }}>Parolă</label>
        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...inputStyle, marginBottom: 18 }} />
        {error && <Notice kind="error">{error}</Notice>}
        {info && <Notice kind="ok">{info}</Notice>}
        <BtnPrimary full onClick={submit} style={{ opacity: busy ? 0.6 : 1 }}>{busy ? "Se procesează..." : mode === "in" ? "Intră în cont" : "Creează cont"}</BtnPrimary>
        <div className="flex items-center" style={{ gap: 10, margin: "18px 0" }}><span style={{ flex: 1, height: 1, background: C.line }} /><span style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft }}>sau</span><span style={{ flex: 1, height: 1, background: C.line }} /></div>
        <BtnOutline full onClick={google}>Continuă cu Google</BtnOutline>
        <p style={{ fontFamily: BODY, fontSize: 13, color: C.inkSoft, textAlign: "center", marginTop: 20 }}>
          {mode === "in" ? "Nu ai cont? " : "Ai deja cont? "}
          <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); setInfo(null); }} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, cursor: "pointer", fontFamily: BODY, fontSize: 13 }}>{mode === "in" ? "Creează cont" : "Intră în cont"}</button>
        </p>
      </Card>
    </div>
  );
}
