import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Tv, AlertCircle } from "lucide-react";
import { movieService, DetailedMovie } from "../services/movieService";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "motion/react";
import PageLoader from "../components/PageLoader";

const WatchPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<DetailedMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPlayer, setCheckingPlayer] = useState(true);
  const [playerAvailable, setPlayerAvailable] = useState<boolean | null>(null);

  const isRTL = language === "ar";
  const playerUrl = `https://vaplayer.ru/embed/${type}/${id}`;

  useEffect(() => {
    if (!id || !type) return;

    const loadMovieAndCheckPlayer = async () => {
      setLoading(true);
      setCheckingPlayer(true);

      // 1. Fetch movie details for premium title & background
      try {
        const details = await movieService.getMovieDetails(id, type, language);
        if (details.Response === "True") {
          setMovie(details);
        }
      } catch (err) {
        console.error("Failed to load movie details for watch page", err);
      } finally {
        setLoading(false);
      }

      // 2. Check player availability via CORS proxy — inspects actual HTML response for 404
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(playerUrl)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for proxy

        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          setPlayerAvailable(false);
        } else {
          const data = await response.json();
          const html: string = data.contents || "";
          // Detect 404 / Content not found in the embed page HTML
          const is404 = html.includes("404") || html.toLowerCase().includes("content not found") || html.toLowerCase().includes("not found");
          setPlayerAvailable(!is404);
        }
      } catch (err: any) {
        console.error("Vaplayer embed check failed", err);
        setPlayerAvailable(false);
      } finally {
        setCheckingPlayer(false);
      }
    };

    loadMovieAndCheckPlayer();
  }, [id, type, language, playerUrl]);

  if (loading || checkingPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <PageLoader />
        <p className="text-zinc-500 animate-pulse font-medium uppercase tracking-widest text-[10px] font-black mt-4">
          {language === "ar" ? "جاري تجهيز مشغل السينما..." : "Initializing Cinema Player..."}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[calc(100vh-80px)] p-6 lg:p-10 pb-32 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Background Backdrop for immersive cinema feel */}
      {movie && (
        <div className="absolute inset-0 h-[500px] z-0 overflow-hidden select-none pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent z-10" />
          <img
            src={movie.backdrop_path || (movie.Poster !== "N/A" ? movie.Poster : "")}
            className="w-full h-full object-cover opacity-15 scale-105 blur-[3px]"
            alt="Backdrop"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group self-start"
          >
            <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 border border-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-semibold uppercase tracking-widest text-[10px]">
              {t("return")}
            </span>
          </button>

          {movie && (
            <div className="text-zinc-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 flex-wrap">
              <Tv className="w-4 h-4 text-brand shrink-0 animate-pulse" />
              <span>{language === "ar" ? "أنت تشاهد الآن:" : "YOU ARE WATCHING:"}</span>
              <span className="text-white font-black">{movie.Title}</span>
              <span className="text-zinc-650">•</span>
              <span className="text-zinc-500">{movie.Year}</span>
            </div>
          )}
        </div>

        {/* Video Player Box */}
        <div className="w-full aspect-video bg-black border border-white/5 shadow-2xl relative group overflow-hidden">
          {playerAvailable ? (
            <>
              {/* Subtle ambient blur glow matching the player */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-brand/20 to-red-500/20 rounded-none blur opacity-45 group-hover:opacity-60 transition duration-1000 select-none pointer-events-none" />
              
              <iframe
                src={playerUrl}
                className="relative w-full h-full z-10"
                frameBorder="0"
                allowFullScreen
                title={movie?.Title || "Cinema Player"}
              />
            </>
          ) : (
            /* Coming Soon Fallback Card */
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/60 backdrop-blur-md">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 animate-pulse">
                <AlertCircle className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-wider mb-3 leading-none">
                {language === "ar" ? "قريباً جداً" : "Coming Soon"}
              </h2>
              <p className="text-zinc-500 max-w-md text-xs font-bold tracking-widest uppercase leading-relaxed mb-8">
                {language === "ar"
                  ? "مشغل هذا العمل السينمائي غير متوفر حالياً. نقوم بتحديث الروابط باستمرار وسيتم توفيره قريباً."
                  : "The stream player for this cinematic work is currently unavailable. Links are updated continuously and will be live shortly."}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-black uppercase text-[10px] tracking-[2px] hover:bg-white hover:text-black transition-all cursor-pointer active:scale-95 shadow-[0_15px_40px_rgba(229,9,20,0.3)] hover:shadow-none"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>{t("return")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
