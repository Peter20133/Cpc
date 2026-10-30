import React from "react";
import { Plus, X } from "lucide-react";
import { C, BODY, CITIES, CUISINES, BUDGETS, FACILITIES } from "@/data/constants";
import { Pill } from "./ui";

export type RestaurantFormState = {
  name: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  cuisine: string;
  price: string;
  description: string;
  hours: string;
  photos: string[];
  menu: { name: string; price?: string }[];
  facilities: string[];
};

export const EMPTY_RESTAURANT_FORM: RestaurantFormState = {
  name: "", city: "", address: "", phone: "", website: "", instagram: "",
  cuisine: "", price: "€€", description: "", hours: "",
  photos: [""], menu: [{ name: "", price: "" }], facilities: [],
};

const inputStyle: React.CSSProperties = {
  width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${C.line}`, fontFamily: BODY, fontSize: 14, boxSizing: "border-box", outline: "none",
};
const labelStyle: React.CSSProperties = { fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.ink };

export function RestaurantFormFields({ value, onChange }: { value: RestaurantFormState; onChange: (v: RestaurantFormState) => void }) {
  const set = <K extends keyof RestaurantFormState>(k: K, v: RestaurantFormState[K]) => onChange({ ...value, [k]: v });

  const setPhoto = (i: number, v: string) => { const next = [...value.photos]; next[i] = v; set("photos", next); };
  const addPhoto = () => set("photos", [...value.photos, ""]);
  const removePhoto = (i: number) => set("photos", value.photos.filter((_, idx) => idx !== i));

  const setMenuItem = (i: number, k: "name" | "price", v: string) => { const next = [...value.menu]; next[i] = { ...next[i], [k]: v }; set("menu", next); };
  const addMenuItem = () => set("menu", [...value.menu, { name: "", price: "" }]);
  const removeMenuItem = (i: number) => set("menu", value.menu.filter((_, idx) => idx !== i));

  const toggleFacility = (f: string) => {
    set("facilities", value.facilities.includes(f) ? value.facilities.filter((x) => x !== f) : [...value.facilities, f]);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Nume restaurant *</label>
        <input type="text" placeholder="Ex: La Trattoria" value={value.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
      </div>

      <div className="grid sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Oraș *</label>
          <select value={value.city} onChange={(e) => set("city", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
            <option value="">Alege orașul</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Adresă *</label>
          <input type="text" placeholder="Str. Exemplu 10" value={value.address} onChange={(e) => set("address", e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Telefon *</label>
          <input type="tel" placeholder="+40 7xx xxx xxx" value={value.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Website (opțional)</label>
          <input type="url" placeholder="https://restaurantultau.ro" value={value.website} onChange={(e) => set("website", e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Instagram (opțional)</label>
        <input type="text" placeholder="@restaurantultau" value={value.instagram} onChange={(e) => set("instagram", e.target.value)} style={inputStyle} />
      </div>

      <div className="grid sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Tipul bucătăriei *</label>
          <select value={value.cuisine} onChange={(e) => set("cuisine", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
            <option value="">Alege tipul</option>
            {CUISINES.filter((c) => c.id !== "orice").map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Nivel de preț *</label>
          <div className="flex" style={{ gap: 8, marginTop: 6 }}>
            {BUDGETS.map((b) => (
              <Pill key={b} active={value.price === b} onClick={() => set("price", b)} style={{ flex: 1, justifyContent: "center" }}>{b}</Pill>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Descriere *</label>
        <textarea rows={3} placeholder="Câteva propoziții despre atmosferă și specificul locului..." value={value.description} onChange={(e) => set("description", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Program *</label>
        <input type="text" placeholder="Ex: 12:00 – 23:00, zilnic" value={value.hours} onChange={(e) => set("hours", e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Fotografii (linkuri către imagini)</label>
        <p style={{ fontFamily: BODY, fontSize: 12, color: C.inkSoft, marginTop: 2, marginBottom: 8 }}>Lipește adresa web (URL) a fiecărei fotografii. Încărcarea directă de fișiere va fi adăugată o dată cu o bază de date cu stocare de fișiere.</p>
        {value.photos.map((p, i) => (
          <div key={i} className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <input type="url" placeholder="https://..." value={p} onChange={(e) => setPhoto(i, e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
            {value.photos.length > 1 && (
              <button type="button" onClick={() => removePhoto(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0 }}><X size={16} color={C.inkSoft} /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={addPhoto} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.accent, padding: "4px 0" }}>
          <Plus size={14} /> Adaugă altă fotografie
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Meniu (fel de mâncare + preț opțional)</label>
        {value.menu.map((m, i) => (
          <div key={i} className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
            <input type="text" placeholder="Ex: Pizza Margherita" value={m.name} onChange={(e) => setMenuItem(i, "name", e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 2 }} />
            <input type="text" placeholder="Preț" value={m.price ?? ""} onChange={(e) => setMenuItem(i, "price", e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
            {value.menu.length > 1 && (
              <button type="button" onClick={() => removeMenuItem(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0 }}><X size={16} color={C.inkSoft} /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={addMenuItem} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontWeight: 500, fontSize: 13, color: C.accent, padding: "8px 0 0" }}>
          <Plus size={14} /> Adaugă fel de mâncare
        </button>
      </div>

      <div>
        <label style={labelStyle}>Facilități</label>
        <div className="flex flex-wrap" style={{ gap: 8, marginTop: 8 }}>
          {FACILITIES.map((f) => (
            <Pill key={f} active={value.facilities.includes(f)} onClick={() => toggleFacility(f)}>{f}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

export function validateRestaurantForm(v: RestaurantFormState): string | null {
  if (!v.name.trim()) return "Numele restaurantului este obligatoriu.";
  if (!v.city) return "Alege orașul.";
  if (!v.address.trim()) return "Adresa este obligatorie.";
  if (!v.phone.trim()) return "Numărul de telefon este obligatoriu.";
  if (!/\d{3,}/.test(v.phone)) return "Introdu un număr de telefon valid.";
  if (!v.cuisine) return "Alege tipul bucătăriei.";
  if (!v.description.trim()) return "Descrierea este obligatorie.";
  if (!v.hours.trim()) return "Programul este obligatoriu.";
  const isHttpUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };
  if (v.website.trim() && !isHttpUrl(v.website.trim())) return "Website-ul trebuie să fie un link valid.";
  if (v.photos.some((photo) => photo.trim() && !isHttpUrl(photo.trim()))) return "Fotografiile trebuie să fie linkuri valide.";
  return null;
}
