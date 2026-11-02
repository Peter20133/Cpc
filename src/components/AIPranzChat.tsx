import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  X,
  MapPin,
  Compass,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import {
  searchFastLunch,
  detectClosestCity,
  FastLunchItem,
  ROMANIAN_CITIES_COORDS,
} from "@/data/fastLunchData";

type Message = {
  id: string;
  sender: "user" | "ai";
  text?: string;
  results?: FastLunchItem[];
  location?: string;
};

interface AIPranzChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRestaurant?: (id: number) => void;
}

const STORAGE_KEY = "ai_pranz_location";

export function AIPranzChat({ isOpen, onClose }: AIPranzChatProps) {
  const [userCity, setUserCity] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      return [
        {
          id: "init",
          sender: "ai",
          text: `Locație: ${saved}. Ce mănânci azi cu 30 lei?`,
        },
      ];
    }
    return [
      {
        id: "init",
        sender: "ai",
        text: "În ce oraș ești? Alege din listă sau apasă „Folosește GPS”:",
      },
    ];
  });

  const [inputText, setInputText] = useState("");
  const [activeMapItem, setActiveMapItem] = useState<FastLunchItem | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, isOpen, activeMapItem]);

  // Voice input
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = "ro-RO";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const text = e.results[0]?.[0]?.transcript;
        if (text) {
          setInputText(text);
          executeSearch(text);
        }
      };
      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, [userCity, userCoords]);

  const saveCity = (city: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, city);
      setUserCity(city);
    } catch {
      // ignore
    }
  };

  const executeSearch = (query: string, explicitCoords?: { lat: number; lng: number } | null) => {
    const q = query.trim();
    if (!q) return;

    setInputText("");

    const userMsg: Message = { id: String(Date.now()), sender: "user", text: q };

    const coordsToUse = explicitCoords !== undefined ? explicitCoords : userCoords;

    const { location, results } = searchFastLunch(q, coordsToUse, userCity || undefined);

    if (location && location !== userCity) {
      saveCity(location);
    }

    const aiMsg: Message = {
      id: String(Date.now() + 1),
      sender: "ai",
      location,
      results,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
  };

  // Buton real GPS: detectează coordonatele reale ale utilizatorului
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: "ai",
          text: "Geolocația nu este suportată în acest browser. În ce oraș ești?",
        },
      ]);
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        const realCity = detectClosestCity(coords.lat, coords.lng);
        saveCity(realCity);

        // Căutare instantanee cu coordonatele reale
        executeSearch("Lângă mine", coords);
      },
      (err) => {
        setIsLocating(false);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: "ai",
            text: "Nu am putut accesa GPS-ul. Alege orașul tău mai jos sau scrie-l în chat.",
          },
        ]);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const quickCities = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Brașov", "Craiova", "Constanța", "Sibiu"];

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[520px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header Compact */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#304B3D] text-white">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-semibold text-sm tracking-tight">AI Prânz 30 Lei</h3>
          {userCity && (
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full text-white/90 font-medium">
              📍 {userCity}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUseMyLocation}
            disabled={isLocating}
            title="Detectează locația GPS reală"
            className="flex items-center gap-1 text-[11px] bg-white/15 hover:bg-white/25 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <MapPin size={11} className={isLocating ? "animate-bounce" : ""} />
            <span>{isLocating ? "Detectez..." : "Folosește GPS"}</span>
          </button>
          <button
            onClick={onClose}
            aria-label="Închide"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Vedere Traseu Google Maps când se apasă [Vezi pe Maps] */}
      {activeMapItem ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center justify-between p-2.5 bg-stone-100 border-b border-stone-200">
            <button
              onClick={() => setActiveMapItem(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1D211E] hover:text-[#B95635] cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Înapoi la chat</span>
            </button>
            <span className="text-xs font-bold text-[#304B3D] truncate max-w-[180px]">
              {activeMapItem.name}
            </span>
          </div>

          <div className="flex-1 w-full bg-stone-200">
            <iframe
              title={`Traseu ${activeMapItem.name}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="eager"
              src={`https://maps.google.com/maps?daddr=${activeMapItem.latitude},${activeMapItem.longitude}&dirflg=w&output=embed`}
            />
          </div>

          <div className="p-2.5 bg-white border-t border-stone-200 flex items-center justify-between gap-2">
            <span className="text-xs text-stone-600 font-medium">
              {activeMapItem.distanceMeters}m ({activeMapItem.walkingTimeMin} min pe jos)
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeMapItem.latitude},${activeMapItem.longitude}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#304B3D] text-white hover:bg-[#20352B]"
            >
              <span>Deschide Maps</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Listă Mesaje */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FAF8F5]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                {m.text && (
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[85%] ${
                      m.sender === "user"
                        ? "bg-[#B95635] text-white rounded-br-xs"
                        : "bg-white text-stone-800 border border-stone-200 shadow-xs rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                )}

                {/* Butoane rapide de orașe când utilizatorul nu a ales încă */}
                {m.id === "init" && !userCity && (
                  <div className="w-full mt-2 flex flex-wrap gap-1.5">
                    {quickCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          saveCity(city);
                          executeSearch(`Prânz în ${city}`);
                        }}
                        className="text-[11px] font-medium px-2 py-1 bg-white hover:bg-[#F5E7DE] hover:text-[#B95635] border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}

                {/* Rezultate curate: Doar [Vezi pe Maps] (fără Rezervă) */}
                {m.results && m.results.length > 0 && (
                  <div className="w-full mt-1.5 space-y-2">
                    {m.results.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white border border-stone-200 rounded-xl p-2.5 shadow-xs hover:border-[#B95635]/50 transition-colors"
                      >
                        {/* Format exact cerut: Nume - Distanță - Preț - Ofertă */}
                        <div className="text-xs font-semibold text-stone-900 leading-snug">
                          <span className="text-stone-900 font-bold">{r.name}</span>
                          <span className="text-stone-500 font-normal"> — {r.distanceMeters}m — </span>
                          <span className="text-[#B95635] font-bold">{r.price} lei</span>
                          <span className="text-stone-600 font-normal"> — {r.deal}</span>
                        </div>

                        {/* Doar butonul [Vezi pe Maps] - butonul de rezervă a fost scos */}
                        <div className="mt-2 pt-1.5 border-t border-stone-100">
                          <button
                            onClick={() => setActiveMapItem(r)}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-stone-100 hover:bg-[#304B3D] hover:text-white text-stone-800 cursor-pointer transition-colors"
                          >
                            <Compass size={13} className="text-[#304B3D] group-hover:text-white" />
                            <span>Vezi pe Maps</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Doar 2 cipuri rapide */}
          <div className="px-3 py-1.5 bg-white border-t border-stone-200 flex items-center gap-1.5">
            <button
              onClick={() => executeSearch("30 lei prânz")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#F5E7DE] hover:text-[#B95635] text-stone-700 transition-colors border border-stone-200 cursor-pointer"
            >
              30 lei prânz
            </button>
            <button
              onClick={() => executeSearch("Lângă mine")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#F5E7DE] hover:text-[#B95635] text-stone-700 transition-colors border border-stone-200 cursor-pointer"
            >
              Lângă mine
            </button>
          </div>

          {/* Formular Input */}
          <div className="p-2.5 bg-white border-t border-stone-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch(inputText);
              }}
              className="flex items-center gap-1.5"
            >
              {recognitionRef.current && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                  title="Voice input"
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ce mănânci azi? 30 lei?"
                className="flex-1 bg-stone-100 text-stone-900 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#B95635]"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-9 h-9 rounded-xl bg-[#B95635] hover:bg-[#8E3C24] disabled:bg-stone-200 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Buton plutitor pe homepage: "🎙️ Ce mănânc azi? 30 lei"
 */
export function AIPranzFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 bg-[#B95635] text-white border border-white/20 cursor-pointer"
      aria-label="Vorbește cu AI-ul: Ce mănânc azi?"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>
      <span className="text-base">🎙️</span>
      <span className="text-xs font-semibold">Ce mănânc azi? 30 lei</span>
    </button>
  );
}
