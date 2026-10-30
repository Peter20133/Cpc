import React, { useState, useEffect } from "react";
import { C, DISPLAY, BODY, FONT, CITIES, Restaurant, CatalogStats } from "@/data/constants";
import { Header, Footer } from "@/components/Layout";
import { SearchWizard } from "@/components/SearchWizard";
import { Home } from "@/pages/Home";
import { ResultsPage } from "@/pages/ResultsPage";
import { RestaurantDetail } from "@/pages/RestaurantDetail";
import { SurpriseMe } from "@/pages/SurpriseMe";
import { HowItWorks } from "@/pages/HowItWorks";
import { ForRestaurants } from "@/pages/ForRestaurants";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { ReservationForm } from "@/pages/ReservationForm";
import { ReservationConfirmation } from "@/pages/ReservationConfirmation";
import { AddRestaurant } from "@/pages/AddRestaurant";
import { Admin } from "@/pages/Admin";
import { OwnerDashboard } from "@/pages/OwnerDashboard";
import { useAuth } from "@/lib/auth";
import { useMonetization } from "@/lib/monetization";
import { listApproved, getCatalogStats, getById, loadSaved, persistSaved } from "@/lib/db";
import { AuthProvider } from "@/lib/auth";
import { MonetizationProvider } from "@/lib/monetization";
import { CursorHalftone } from "@/components/CursorHalftone";

/* ── Search view (tiny — kept inline) ───────────────────────────── */
function SearchPage({ answers, setAnswers, onSubmit, availableCities }: { answers: any; setAnswers: React.Dispatch<React.SetStateAction<any>>; onSubmit: () => void; availableCities: string[] }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 680, padding: "56px 24px 96px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: C.ink }}>Unde vrei să mănânci?</h1>
      </div>
       <SearchWizard answers={answers} setAnswers={setAnswers} onSubmit={onSubmit} availableCities={availableCities} />
    </div>
  );
}

/* ── Tiny, design-consistent loading state (plain text, no new visual system) ─────── */
function LoadingNotice() {
  return (
    <div className="mx-auto" style={{ maxWidth: 1200, padding: "80px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: BODY, color: C.inkSoft, fontSize: 14.5 }}>Se încarcă restaurantele...</p>
    </div>
  );
}

function DataErrorNotice({ message }: { message: string }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 680, padding: "80px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: BODY, color: C.accent, fontSize: 14.5, lineHeight: 1.55 }}>{message}</p>
    </div>
  );
}

/* ── App Root ────────────────────────────────────────────────── */
export default function App() {
  return <AuthProvider><MonetizationProvider><AppInner /></MonetizationProvider></AuthProvider>;
}

function AppInner() {
  const [view, setViewRaw] = useState("home");
  const [answers, setAnswers] = useState<any>({ minRating: 4 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | undefined>(undefined);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<number>>(() => loadSaved());
  const { user, signOut } = useAuth();
  const mon = useMonetization();
  const loggedIn = !!user;
  const setLoggedIn = (_: boolean) => {};
  const [reservationDetails, setReservationDetails] = useState<any>(null);

  // Restaurants now live in a real (or localStorage-fallback) database and are fetched
  // asynchronously — `dataVersion` is bumped after any change (new submission, admin
  // approve/reject/edit/delete) to trigger a fresh fetch.
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = () => setDataVersion((v) => v + 1);

  useEffect(() => {
    let active = true;
    Promise.all([listApproved(), getCatalogStats()]).then(([data, stats]) => {
      if (active) { setRestaurants(data); setCatalogStats(stats); setRestaurantsError(null); setRestaurantsLoaded(true); }
    }).catch((error: unknown) => {
      if (active) {
        setRestaurants([]);
        setCatalogStats(null);
        setRestaurantsError(error instanceof Error ? error.message : "Nu am putut încărca restaurantele.");
        setRestaurantsLoaded(true);
      }
    });
    return () => { active = false; };
  }, [dataVersion]);

  // Keep the currently-open restaurant in sync with the data layer too (e.g. right after
  // an admin edits it, or right after someone submits a brand-new one and wants a preview).
  useEffect(() => {
    let active = true;
    if (selectedId != null) {
      setSelectedError(null);
      getById(selectedId)
        .then((r) => { if (active) setSelectedRestaurant(r); })
        .catch((error: unknown) => {
          if (active) {
            setSelectedRestaurant(undefined);
            setSelectedError(error instanceof Error ? error.message : "Nu am putut încărca restaurantul.");
          }
        });
    } else {
      setSelectedRestaurant(undefined);
      setSelectedError(null);
    }
    return () => { active = false; };
  }, [selectedId, dataVersion]);

  const setView = (v: string) => { setViewRaw(v); window.scrollTo?.(0, 0); };
  const openRestaurant = (id: number) => { setSelectedId(id); setView("restaurant"); };
  const toggleSaved = (id: number) => setSaved((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    persistSaved(n);
    return n;
  });
  const goSearch = () => setView("results");
  const confirmReservation = (details: any) => { setReservationDetails(details); setView("reserve-confirm"); };

  const showLoadingNotice = !restaurantsLoaded && ["home", "results", "dashboard", "surprise"].includes(view);

  return (
    <div className="rm-site-background" style={{ backgroundColor: C.bg, minHeight: "100%", fontFamily: BODY }}>
      <CursorHalftone />
      <link rel="stylesheet" href={FONT} />
      <Header view={view} setView={setView} loggedIn={loggedIn} />
      {showLoadingNotice ? (
        <LoadingNotice />
      ) : (restaurantsError && ["home", "results", "dashboard", "surprise"].includes(view)) ? (
        <DataErrorNotice message={restaurantsError} />
      ) : (selectedError && view === "restaurant") ? (
        <DataErrorNotice message={selectedError} />
      ) : (
        <>
          {view === "home" && <Home setView={setView} answers={answers} setAnswers={setAnswers} goSearch={goSearch} restaurants={restaurants} catalogStats={catalogStats} onOpenRestaurant={openRestaurant} />}
          {view === "search" && <SearchPage answers={answers} setAnswers={setAnswers} onSubmit={goSearch} availableCities={restaurants.length > 0 ? Array.from(new Set(restaurants.map((restaurant) => restaurant.city))).sort((a, b) => a.localeCompare(b, "ro")) : CITIES} />}
          {view === "results" && <ResultsPage restaurants={restaurants} answers={answers} setView={setView} openRestaurant={openRestaurant} saved={saved} toggleSaved={toggleSaved} />}
          {view === "restaurant" && <RestaurantDetail restaurant={selectedRestaurant} setView={setView} saved={saved} toggleSaved={toggleSaved} />}
          {view === "reserve" && <ReservationForm restaurant={selectedRestaurant} setView={setView} onConfirm={confirmReservation} />}
          {view === "reserve-confirm" && <ReservationConfirmation restaurant={selectedRestaurant} details={reservationDetails} setView={setView} />}
          {view === "surprise" && <SurpriseMe restaurants={restaurants} answers={answers} openRestaurant={openRestaurant} />}
          {view === "how" && <HowItWorks setView={setView} />}
          {view === "for-restaurants" && <ForRestaurants />}
          {view === "add-restaurant" && <AddRestaurant setView={setView} onSubmitted={refreshData} />}
          {view === "owner" && <OwnerDashboard restaurants={restaurants} setView={setView} onChanged={() => { refreshData(); mon.reload(); }} />}
          {view === "admin" && <Admin onDataChanged={refreshData} />}
          {view === "login" && <Login setView={setView} onLogin={() => { setLoggedIn(true); setView("dashboard"); }} />}
          {view === "dashboard" && (loggedIn ? <Dashboard restaurants={restaurants} setView={setView} saved={saved} toggleSaved={toggleSaved} openRestaurant={openRestaurant} onLogout={() => { void signOut(); setView("home"); }} /> : <Login setView={setView} onLogin={() => { setLoggedIn(true); setView("dashboard"); }} />)}
        </>
      )}
      <Footer setView={setView} />
    </div>
  );
}
