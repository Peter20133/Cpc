import React, { useState, useEffect } from "react";
import { Lock, Check, X, Pencil, Trash2, Clock, MapPin, ExternalLink, UtensilsCrossed } from "lucide-react";
import { C, DISPLAY, BODY, CUISINES } from "@/data/constants";
import { Restaurant, RestaurantStatus } from "@/data/constants";
import { Card, Pill, BtnPrimary, BtnOutline, Eyebrow } from "@/components/ui";
import { RestaurantFormFields, RestaurantFormState, validateRestaurantForm } from "@/components/RestaurantFormFields";
import { listAll, approveRestaurant, rejectRestaurant, deleteRestaurant, updateRestaurant } from "@/lib/db";
import { isSupabaseConfigured, restoreAdminSession, signInAdmin, signOutAdmin } from "@/lib/supabaseClient";

const ADMIN_PASSCODE = "restomatch-admin";

function toFormState(r: Restaurant): RestaurantFormState {
  return {
    name: r.name, city: r.city, address: r.address ?? "", phone: r.phone ?? r.booking?.phone ?? "",
    website: r.website ?? (r.booking?.type === "website" ? r.booking.url ?? "" : ""), instagram: r.instagram ?? "",
    cuisine: r.cuisine, price: r.price, description: r.description ?? "", hours: r.hours ?? "",
    photos: r.photos && r.photos.length ? r.photos : [r.image ?? ""],
    menu: r.menu && r.menu.length ? r.menu : r.dishes.map((d) => ({ name: d, price: "" })),
    facilities: r.facilities ?? [],
  };
}

function AdminRow({ r, busy, onApprove, onReject, onDelete, onEdit }: {
  r: Restaurant; busy: boolean; onApprove?: () => void; onReject?: () => void; onDelete: () => void; onEdit: () => void;
}) {
  return (
    <Card style={{ padding: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", opacity: busy ? 0.55 : 1, pointerEvents: busy ? "none" : "auto" }}>
      {r.image ? (
        <img src={r.image} alt={`${r.name} — fotografie din OpenStreetMap`} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 60, height: 60, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <UtensilsCrossed size={22} color={C.accent} strokeWidth={1.5} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 180 }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15.5, color: C.ink }}>{r.name}</p>
        <p style={{ fontFamily: BODY, fontSize: 12.5, color: C.inkSoft, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <MapPin size={11} /> {r.city} • {r.cuisineLabel} • {r.price}
        </p>
        {r.submittedAt && (
          <p style={{ fontFamily: BODY, fontSize: 11.5, color: C.inkSoft, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Clock size={11} /> trimis {new Date(r.submittedAt).toLocaleDateString("ro-RO")}
          </p>
        )}
        {r.sourceUrl && (
          <button onClick={() => window.open(r.sourceUrl, "_blank")} style={{ background: "none", border: "none", padding: 0, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, color: C.accent, fontFamily: BODY, fontSize: 11.5, cursor: "pointer" }}>
            <ExternalLink size={11} /> Verifică în OpenStreetMap
          </button>
        )}
      </div>
      <div className="flex items-center" style={{ gap: 8 }}>
        {onApprove && (
          <button onClick={onApprove} title="Aprobă" style={{ background: "#EAF6EC", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Check size={16} color="#2F8F4E" />
          </button>
        )}
        {onReject && (
          <button onClick={onReject} title="Respinge" style={{ background: "#FBEAEA", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#C23B3B" />
          </button>
        )}
        <button onClick={onEdit} title="Editează" style={{ background: C.lineSoft, border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Pencil size={15} color={C.ink} />
        </button>
        <button onClick={onDelete} title="Șterge" style={{ background: C.lineSoft, border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Trash2 size={15} color={C.accent} />
        </button>
      </div>
    </Card>
  );
}

export function Admin({ onDataChanged }: { onDataChanged: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<RestaurantStatus>("pending");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RestaurantFormState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [all, setAll] = useState<Restaurant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    restoreAdminSession()
      .then((admin) => { if (active) setUnlocked(admin); })
      .catch((e: unknown) => { if (active) setAuthError(e instanceof Error ? e.message : "Nu am putut verifica sesiunea."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    let active = true;
    setLoadError(null);
    listAll()
      .then((data) => { if (active) { setAll(data); setLoaded(true); } })
      .catch((e: any) => { if (active) { setLoaded(true); setLoadError(e?.message || "Nu am putut încărca restaurantele."); } });
    return () => { active = false; };
  }, [unlocked, refresh]);

  const list = all.filter((r) => (r.status ?? "approved") === tab);
  const bump = () => { setRefresh((x) => x + 1); onDataChanged(); };

  const startEdit = (r: Restaurant) => { setSaveError(null); setEditingId(r.id); setEditForm(toFormState(r)); };

  const saveEdit = async () => {
    if (editingId == null || !editForm) return;
    const err = validateRestaurantForm(editForm);
    if (err) { setSaveError(err); return; }
    setSaveError(null);
    setSaving(true);
    const cuisineMeta = CUISINES.find((c) => c.id === editForm.cuisine);
    const nextImage = editForm.photos.find((p) => p.trim());
    try {
      await updateRestaurant(editingId, {
        name: editForm.name.trim(), city: editForm.city, address: editForm.address.trim(),
        cuisine: editForm.cuisine, cuisineLabel: cuisineMeta?.label ?? editForm.cuisine,
        price: editForm.price, description: editForm.description.trim(), hours: editForm.hours.trim(),
        phone: editForm.phone.trim(), website: editForm.website.trim() || undefined, instagram: editForm.instagram.trim() || undefined,
        photos: editForm.photos.filter((p) => p.trim()), menu: editForm.menu.filter((m) => m.name.trim()),
        facilities: editForm.facilities,
        ...(nextImage ? { image: nextImage } : {}),
      });
      setEditingId(null); setEditForm(null); bump();
    } catch (e: any) {
      setSaveError(e?.message || "Nu am putut salva modificările.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    setBusyId(id);
    try { await approveRestaurant(id); bump(); } catch (e: any) { setLoadError(e?.message); } finally { setBusyId(null); }
  };
  const handleReject = async (id: number) => {
    setBusyId(id);
    try { await rejectRestaurant(id); bump(); } catch (e: any) { setLoadError(e?.message); } finally { setBusyId(null); }
  };
  const handleDelete = async (r: Restaurant) => {
    if (!confirm(`Ștergi definitiv „${r.name}"?`)) return;
    setBusyId(r.id);
    try { await deleteRestaurant(r.id); bump(); } catch (e: any) { setLoadError(e?.message); } finally { setBusyId(null); }
  };

  const handleUnlock = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      if (passInput === ADMIN_PASSCODE) setUnlocked(true);
      else setAuthError("Codul de acces nu este corect.");
      return;
    }

    setAuthLoading(true);
    try {
      await signInAdmin(email.trim(), passInput);
      setUnlocked(true);
      setPassInput("");
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Autentificarea a eșuat.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLock = async () => {
    if (isSupabaseConfigured) {
      try { await signOutAdmin(); } catch (e: unknown) { setLoadError(e instanceof Error ? e.message : "Deconectarea a eșuat."); }
    }
    setUnlocked(false);
    setAll([]);
    setLoaded(false);
  };

  if (!unlocked) {
    return (
      <div className="mx-auto" style={{ maxWidth: 380, padding: "100px 24px 140px", textAlign: "center" }}>
        <Lock size={26} color={C.inkSoft} style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: C.ink }}>Panou Admin</h1>
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 13.5, marginTop: 8, marginBottom: 20 }}>
          {isSupabaseConfigured ? "Zonă restricționată. Intră cu contul Admin." : "Zonă restricționată. Introdu codul de acces."}
        </p>
        <Card style={{ padding: 20 }}>
          {isSupabaseConfigured && (
            <input
              type="email" placeholder="Email Admin" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleUnlock(); }}
              autoComplete="email"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 12 }}
            />
          )}
          <input
            type="password" placeholder={isSupabaseConfigured ? "Parolă" : "Cod de acces"} value={passInput} onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleUnlock(); }}
            autoComplete="current-password"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 12 }}
          />
          {authError && <p style={{ fontFamily: BODY, color: C.accent, fontSize: 13, lineHeight: 1.45, marginBottom: 12 }}>{authError}</p>}
          <BtnPrimary full onClick={() => !authLoading && void handleUnlock()} style={{ opacity: authLoading ? 0.6 : 1 }}>
            {authLoading ? "Se verifică..." : "Intră în panou"}
          </BtnPrimary>
        </Card>
        {!isSupabaseConfigured && (
          <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 11.5, marginTop: 14 }}>
            Accesul demonstrativ folosește un cod local. Configurează Supabase înainte de publicare.
          </p>
        )}
      </div>
    );
  }

  if (editingId != null && editForm) {
    return (
      <div className="mx-auto" style={{ maxWidth: 680, padding: "40px 24px 100px" }}>
        <Eyebrow>Editează restaurant</Eyebrow>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: C.ink, marginBottom: 20 }}>{editForm.name || "Restaurant"}</h1>
        <Card style={{ padding: "26px 24px" }}>
          <RestaurantFormFields value={editForm} onChange={setEditForm} />
          {saveError && <p style={{ fontFamily: BODY, color: C.accent, fontSize: 13.5, marginTop: 16 }}>{saveError}</p>}
          <div className="flex items-center" style={{ gap: 12, marginTop: 24 }}>
            <BtnOutline onClick={() => { setEditingId(null); setEditForm(null); setSaveError(null); }}>Anulează</BtnOutline>
            <BtnPrimary onClick={() => !saving && saveEdit()} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? "Se salvează..." : "Salvează modificările"}</BtnPrimary>
          </div>
        </Card>
      </div>
    );
  }

  const tabs: { id: RestaurantStatus; label: string }[] = [
    { id: "pending", label: `În verificare (${all.filter((r) => r.status === "pending").length})` },
    { id: "approved", label: `Aprobate (${all.filter((r) => (r.status ?? "approved") === "approved").length})` },
    { id: "rejected", label: `Respinse (${all.filter((r) => r.status === "rejected").length})` },
  ];

  return (
    <div className="mx-auto" style={{ maxWidth: 900, padding: "40px 24px 100px" }}>
      <div className="flex items-center justify-between" style={{ gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, color: C.ink }}>Panou Admin</h1>
        <BtnOutline onClick={() => void handleLock()} style={{ padding: "8px 14px", fontSize: 12.5 }}>Ieși din panou</BtnOutline>
      </div>
      {loadError && <p style={{ fontFamily: BODY, color: C.accent, fontSize: 13.5, marginBottom: 16 }}>{loadError}</p>}
      {!loaded ? (
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14 }}>Se încarcă...</p>
      ) : (
        <>
          <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 24 }}>
            {tabs.map((t) => <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pill>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((r) => (
              <AdminRow
                key={r.id}
                r={r}
                busy={busyId === r.id}
                onApprove={tab !== "approved" ? () => handleApprove(r.id) : undefined}
                onReject={tab !== "rejected" ? () => handleReject(r.id) : undefined}
                onDelete={() => handleDelete(r)}
                onEdit={() => startEdit(r)}
              />
            ))}
            {list.length === 0 && (
              <Card style={{ padding: 40, textAlign: "center", borderStyle: "dashed" }}>
                <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14 }}>Nimic aici momentan.</p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
