import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Sparkles,
  Phone,
  Clock,
  Compass,
  RotateCcw,
} from "lucide-react";
import { C, DISPLAY, BODY } from "@/data/constants";
import { askAIPranz, CheapLunchOption } from "@/lib/aiPranz.functions";

type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  restaurants?: CheapLunchOption[];
  detectedLocation?: string;
  showLocationPrompt?: boolean;
};

interface AIPranzChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRestaurant?: (id: number) => void;
}

export function AIPranzChat({ isOpen, onClose, onOpenRestaurant }: AIPranzChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "ai",
      text: "Salut! Sunt asistentul tău culinar RestoMatch. Spune-mi ce ai poftă să mănânci la prânz — găsim ceva super gustos și ieftin lângă tine, sub 30 de lei!",
      timestamp: "Acum",
      showLocationPrompt: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [selectedRouteRestaurant, setSelectedRouteRestaurant] = useState<CheapLunchOption | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Verificare suport SpeechRecognition
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
      const rec = new SpeechRec();
      rec.lang = "ro-RO";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
          // Trimite automat mesajul după încheierea vorbirii
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [userCoords]);

  // Derulare la ultimul mesaj
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Închidere la tasta Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Solicitare Geolocation
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocationState("granted");
        // Trimite un mic mesaj de confirmare
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: "ai",
            text: "Te-am localizat cu succes prin GPS! Spune-mi ce vrei să mănânci azi (ex: 'Vreau să mănânc cu 30 de lei la prânz' sau 'Ceva ieftin lângă mine').",
            timestamp: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      },
      () => {
        setLocationState("denied");
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: "ai",
            text: "Nu am putut accesa locația ta automată. În ce zonă sau oraș ești? (ex: Craiova Centru, București Unirii, Cluj etc.)",
            timestamp: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      },
      { timeout: 9000, enableHighAccuracy: true },
    );
  };

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Nu s-a putut porni recunoașterea vocală:", err);
      }
    }
  };

  const handleSendMessage = async (rawText?: string) => {
    const query = (rawText ?? inputText).trim();
    if (!query || isLoading) return;

    setInputText("");
    const userMsgId = String(Date.now());
    const nowStr = new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: query,
        timestamp: nowStr,
      },
    ]);

    setIsLoading(true);

    try {
      // Apelăm server function askAIPranz
      const res = await askAIPranz({
        data: {
          message: query,
          latitude: userCoords?.lat ?? null,
          longitude: userCoords?.lng ?? null,
          areaQuery: query,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: res.message,
          timestamp: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
          restaurants: res.restaurants,
          detectedLocation: res.detectedLocation,
        },
      ]);
    } catch (error) {
      console.error("Eroare AI Pranz:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: "Scuze, am întâmpinat o mică problemă la căutare. Te rog încearcă din nou sau specifică orașul în care ești (ex: '30 lei prânz în Craiova').",
          timestamp: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Vreau să mănânc cu 30 de lei la prânz",
    "Ceva ieftin lângă mine",
    "Meniul zilei sub 35 lei",
    "Shaorma sau burger rapid",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="flex flex-col w-full max-w-2xl bg-[#FFFDF9] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E7E4DC] overflow-hidden"
        style={{ height: "min(88vh, 740px)", maxHeight: "100%" }}
      >
        {/* Header Chat */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[#E7E4DC]"
          style={{ background: `linear-gradient(135deg, ${C.green} 0%, #20352B 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B95635] text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 style={{ fontFamily: DISPLAY }} className="font-semibold text-lg text-white">
                  AI Prânz — 30 Lei
                </h3>
                <span className="text-[11px] font-medium bg-white/20 text-[#FFFDF9] px-2 py-0.5 rounded-full">
                  RestoMatch AI
                </span>
              </div>
              <p className="text-xs text-white/70">
                {locationState === "granted" ? "📍 GPS activat" : "Recomandări inteligente la preț de student"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {locationState !== "granted" && (
              <button
                onClick={requestLocation}
                title="Activează locația GPS"
                className="hidden sm:flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded-xl transition-all"
              >
                <Navigation size={13} />
                <span>Locație</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Închide chat"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Zona Mesaje */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F7F5F0]/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[82%]">
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-[#304B3D] text-white flex-shrink-0 flex items-center justify-center text-xs shadow-sm mb-1">
                    🤖
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#B95635] text-white rounded-br-xs"
                      : "bg-[#FFFDF9] text-[#1D211E] border border-[#E7E4DC] rounded-bl-xs"
                  }`}
                  style={{ fontFamily: BODY }}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>

              {/* Solicitare inițială de locație dacă e prima intrare */}
              {msg.showLocationPrompt && locationState === "idle" && (
                <div className="mt-3 ml-9 max-w-sm">
                  <button
                    onClick={requestLocation}
                    className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-[#304B3D] hover:bg-[#20352B] text-white transition-all shadow-sm"
                  >
                    <MapPin size={14} className="text-[#EBC9A4]" />
                    <span>Permite locația pentru recomandări la pas</span>
                  </button>
                </div>
              )}

              {/* Carduri Interactive de Restaurante afișate sub mesaj */}
              {msg.restaurants && msg.restaurants.length > 0 && (
                <div className="w-full mt-3.5 ml-0 sm:ml-9 space-y-2.5 max-w-xl">
                  {msg.restaurants.map((rest, index) => (
                    <div
                      key={rest.id || index}
                      className="bg-[#FFFDF9] border border-[#E7E4DC] rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1D211E] truncate">
                            📍 {rest.name}
                          </span>
                          <span className="text-[11px] font-semibold text-[#B95635] bg-[#F5E7DE] px-2 py-0.5 rounded-full">
                            {rest.price} lei
                          </span>
                        </div>
                        <p className="text-xs text-[#6F756D] mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#304B3D] font-semibold">
                            {rest.distanceMeters}m ({rest.walkingTimeMin} min pe jos 🚶)
                          </span>
                          <span>•</span>
                          <span className="truncate">{rest.deal}</span>
                        </p>
                        {rest.address && (
                          <p className="text-[11px] text-[#8F958D] mt-0.5 truncate">
                            {rest.address}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EEE8]">
                        <button
                          onClick={() => setSelectedRouteRestaurant(rest)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#304B3D] hover:bg-[#20352B] text-white transition-colors"
                        >
                          <Compass size={13} />
                          <span>Vezi traseul pe Maps</span>
                        </button>
                        {onOpenRestaurant && (
                          <button
                            onClick={() => {
                              onOpenRestaurant(rest.id);
                              onClose();
                            }}
                            className="flex items-center justify-center text-xs font-medium px-2.5 py-1.5 rounded-xl bg-[#F0EEE8] hover:bg-[#E7E4DC] text-[#1D211E] transition-colors"
                          >
                            <span>Detalii</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-[#8F958D] mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Indicator "AI se gândește..." */}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-[#6F756D] ml-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-[#304B3D] text-white flex items-center justify-center text-[10px]">
                🤖
              </div>
              <div className="bg-[#FFFDF9] border border-[#E7E4DC] px-3.5 py-2 rounded-2xl shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B95635] animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-[#B95635] animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-[#B95635] animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="ml-1 font-medium">Caut cel mai bun prânz sub 30 lei...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugestii rapide */}
        <div className="px-4 py-2 border-t border-[#E7E4DC] bg-[#FFFDF9] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-[#8F958D] uppercase tracking-wider flex-shrink-0">
            Sugestii:
          </span>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-[#F7F5F0] hover:bg-[#F5E7DE] hover:text-[#B95635] text-[#1D211E] px-3 py-1 rounded-full whitespace-nowrap transition-colors border border-[#E7E4DC] font-medium disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Zona Input (Voice + Text) */}
        <div className="p-3.5 sm:p-4 bg-[#FFFDF9] border-t border-[#E7E4DC]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Buton Vocal */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                title={isRecording ? "Oprește înregistrarea" : "Vorbește în română (Voice Input)"}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse shadow-md scale-105"
                    : "bg-[#F7F5F0] hover:bg-[#F0EEE8] text-[#304B3D] border border-[#E7E4DC]"
                }`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                {isRecording && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
                )}
              </button>
            )}

            {/* Câmp Text */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isRecording
                  ? "Te ascult... vorbește acum"
                  : "Scrie: 'Vreau ceva cu 30 lei' sau 'prânz ieftin în Craiova'..."
              }
              disabled={isLoading}
              className="flex-1 bg-[#F7F5F0] text-[#1D211E] text-sm px-4 py-2.5 rounded-2xl border border-[#E7E4DC] focus:outline-none focus:ring-2 focus:ring-[#B95635]/40 transition-all placeholder:text-[#8F958D]"
            />

            {/* Buton Trimitere */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-11 h-11 rounded-2xl bg-[#B95635] hover:bg-[#8E3C24] disabled:bg-[#E7E4DC] disabled:text-[#8F958D] text-white flex items-center justify-center transition-all shadow-sm"
              title="Trimite mesajul"
            >
              <Send size={18} />
            </button>
          </form>

          {isRecording && (
            <p className="text-[11px] text-red-600 font-medium text-center mt-2 flex items-center justify-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              Microfon activ: Spune comanda ta în limba română...
            </p>
          )}
        </div>
      </div>

      {/* Modal Traseu Google Maps Embed */}
      {selectedRouteRestaurant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E7E4DC] w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E7E4DC] flex items-center justify-between bg-[#F7F5F0]">
              <div className="flex items-center gap-2">
                <Compass className="text-[#304B3D]" size={18} />
                <div>
                  <h4 style={{ fontFamily: DISPLAY }} className="font-semibold text-sm sm:text-base text-[#1D211E]">
                    Traseu pietonal către {selectedRouteRestaurant.name}
                  </h4>
                  <p className="text-xs text-[#6F756D]">
                    {selectedRouteRestaurant.distanceMeters}m • aproximativ {selectedRouteRestaurant.walkingTimeMin} min pe jos 🚶
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRouteRestaurant(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E7E4DC] flex items-center justify-center text-[#1D211E] hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Google Maps Walking Route Embed */}
            <div className="relative w-full h-80 sm:h-96 bg-gray-100">
              <iframe
                title={`Traseu pe Maps către ${selectedRouteRestaurant.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?saddr=${
                  userCoords ? `${userCoords.lat},${userCoords.lng}` : `${selectedRouteRestaurant.city}, Romania`
                }&daddr=${selectedRouteRestaurant.latitude},${selectedRouteRestaurant.longitude}&dirflg=w&output=embed`}
              />
            </div>

            <div className="p-4 bg-[#FFFDF9] flex items-center justify-between gap-3 border-t border-[#E7E4DC]">
              <div className="text-xs text-[#1D211E]">
                <p className="font-medium text-[#B95635]">{selectedRouteRestaurant.deal}</p>
                <p className="text-[#8F958D] text-[11px] truncate max-w-xs">{selectedRouteRestaurant.address}</p>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${
                  userCoords ? `${userCoords.lat},${userCoords.lng}` : ""
                }&destination=${selectedRouteRestaurant.latitude},${selectedRouteRestaurant.longitude}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#304B3D] hover:bg-[#20352B] text-white transition-colors"
              >
                <span>Deschide în Google Maps</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Butonul plutitor de pe homepage cerut la Pasul 1:
 * "🎙️ Vorbeste cu AI-ul: Ce mananc azi?"
 */
export function AIPranzFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
      style={{
        background: `linear-gradient(135deg, ${C.accent} 0%, #8E3C24 100%)`,
        boxShadow: "0 12px 32px rgba(185, 86, 53, 0.35)",
      }}
      aria-label="Vorbește cu AI-ul: Ce mănânc azi?"
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
      </span>

      <span className="text-lg">🎙️</span>

      <span
        style={{ fontFamily: BODY }}
        className="text-sm font-semibold text-white tracking-tight"
      >
        Vorbește cu AI-ul: Ce mănânc azi?
      </span>

      <span className="text-[10px] font-bold uppercase bg-white/25 text-white px-2 py-0.5 rounded-full ml-0.5">
        Prânz 30 Lei
      </span>
    </button>
  );
}
