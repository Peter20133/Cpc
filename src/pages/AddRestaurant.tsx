import React, { useState } from "react";
import { Store, CheckCircle2 } from "lucide-react";
import { C, DISPLAY, BODY, CUISINES } from "@/data/constants";
import { Card, BtnPrimary, BtnOutline, Eyebrow } from "@/components/ui";
import { RestaurantFormFields, RestaurantFormState, EMPTY_RESTAURANT_FORM, validateRestaurantForm } from "@/components/RestaurantFormFields";
import { submitRestaurant } from "@/lib/db";

export function AddRestaurant({ setView, onSubmitted }: { setView: (v: string) => void; onSubmitted: () => void }) {
  const [form, setForm] = useState<RestaurantFormState>(EMPTY_RESTAURANT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (submitting) return;
    const err = validateRestaurantForm(form);
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);
    const cuisineMeta = CUISINES.find((c) => c.id === form.cuisine);
    try {
      await submitRestaurant({
        name: form.name.trim(),
        city: form.city,
        address: form.address.trim(),
        cuisine: form.cuisine,
        cuisineLabel: cuisineMeta?.label ?? form.cuisine,
        mood: "casual",
        price: form.price,
        description: form.description.trim(),
        hours: form.hours.trim(),
        image: form.photos.find((p) => p.trim()) || "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1000",
        photos: form.photos.filter((p) => p.trim()),
        menu: form.menu.filter((m) => m.name.trim()),
        facilities: form.facilities,
        phone: form.phone.trim(),
        website: form.website.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
      });
      setSubmitted(true);
      onSubmitted();
    } catch (e: any) {
      setError(e?.message || "Ceva nu a mers bine la trimitere. Încearcă din nou.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto" style={{ maxWidth: 520, padding: "90px 24px 120px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle2 size={26} color={C.accent} />
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: C.ink }}>Restaurantul tău a fost trimis spre verificare.</h1>
        <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>
          Un membru al echipei RestoMatch va revizui informațiile. După aprobare, restaurantul tău va apărea automat în secțiunea Explorează.
        </p>
        <div className="flex flex-col sm:flex-row" style={{ gap: 12, marginTop: 30, justifyContent: "center" }}>
          <BtnOutline onClick={() => setView("home")}>Înapoi la pagina principală</BtnOutline>
          <BtnPrimary onClick={() => { setForm(EMPTY_RESTAURANT_FORM); setError(null); setSubmitted(false); }}>Adaugă alt restaurant</BtnPrimary>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 680, padding: "48px 24px 100px" }}>
      <div className="flex items-center" style={{ gap: 12, marginBottom: 8 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Store size={19} color={C.accent} />
        </span>
        <div>
          <Eyebrow>Pentru proprietari de restaurante</Eyebrow>
        </div>
      </div>
      <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: C.ink, marginBottom: 8 }}>Adaugă-ți restaurantul pe RestoMatch</h1>
      <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 15, marginBottom: 30, lineHeight: 1.6 }}>
        Completează formularul de mai jos. Restaurantul va avea statusul „În verificare" și va apărea public după ce este aprobat de un administrator.
      </p>

      <form onSubmit={handleSubmit}>
        <Card style={{ padding: "28px 26px" }}>
          <RestaurantFormFields value={form} onChange={setForm} />
          {error && <p style={{ fontFamily: BODY, color: C.accent, fontSize: 13.5, marginTop: 16 }}>{error}</p>}
          <BtnPrimary full type="submit" style={{ marginTop: 24, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Se trimite..." : "Trimite spre verificare"}</BtnPrimary>
        </Card>
      </form>
    </div>
  );
}
