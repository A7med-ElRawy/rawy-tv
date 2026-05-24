import React, { useState, useEffect } from "react";
import { Heart, Clock, Loader2, PlayCircle, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMovies } from "../context/MovieContext";
import { movieService, Movie } from "../services/movieService";
import MovieCard from "../components/MovieCard";
import { useLanguage } from "../context/LanguageContext";

const LibraryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { favorites, watchLater, recentlyViewed } = useMovies();
  const [activeTab, setActiveTab] = useState<"favorites" | "watchLater" | "recentlyViewed">(
    "favorites",
  );
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(
    favorites.length > 0 || watchLater.length > 0 || recentlyViewed.length > 0
  );

  useEffect(() => {
    const list =
      activeTab === "favorites"
        ? favorites
        : activeTab === "watchLater"
        ? watchLater
        : recentlyViewed;

    const fetchMovies = async () => {
      setLoading(true);
      try {
        const moviePromises = list.map((movieData) =>
          movieService.getMovieDetails(movieData.imdbID, movieData.Type || "movie", language),
        );
        const results = await Promise.all(moviePromises);
        setMovies(results.filter((m) => m.Response === "True"));
      } catch (err) {
        console.error("Error fetching library movies:", err);
      } finally {
        setLoading(false);
      }
    };

    if (list.length > 0) {
      fetchMovies();
    } else {
      setMovies([]);
      setLoading(false);
    }
  }, [activeTab, favorites, watchLater, recentlyViewed, language]);

  return (
    <div className="p-6 lg:p-10 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-16 border-b border-zinc-900 pb-10">
        <div>
          <h1 className="text-6xl lg:text-8xl font-black mb-2 leading-none">
            {t("library")}
          </h1>
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">
            {t("privateCollection")}
          </p>
        </div>

        <div className="flex bg-zinc-900/50 p-1 border border-white/5 rounded-none self-start overflow-x-auto">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
              activeTab === "favorites"
                ? "bg-white text-black"
                : "text-zinc-600 hover:text-white"
            }`}
          >
            {t("favorites")}
            {favorites.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black/20 rounded-none text-[9px]">
                {favorites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("watchLater")}
            className={`flex items-center gap-2 px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
              activeTab === "watchLater"
                ? "bg-white text-black"
                : "text-zinc-600 hover:text-white"
            }`}
          >
            {t("queue")}
            {watchLater.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black/20 rounded-none text-[9px]">
                {watchLater.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("recentlyViewed")}
            className={`flex items-center gap-2 px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
              activeTab === "recentlyViewed"
                ? "bg-white text-black"
                : "text-zinc-600 hover:text-white"
            }`}
          >
            {t("recent")}
            {recentlyViewed.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black/20 rounded-none text-[9px]">
                {recentlyViewed.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <Loader2 className="w-12 h-12 text-zinc-300 animate-spin mb-4" />
            <p className="text-zinc-500 font-medium">{t("updatingCollections")}</p>
          </motion.div>
        ) : movies.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              {activeTab === "favorites" ? (
                <PlusCircle className="w-10 h-10 text-zinc-800" />
              ) : activeTab === "watchLater" ? (
                <PlayCircle className="w-10 h-10 text-zinc-800" />
              ) : (
                <Clock className="w-10 h-10 text-zinc-800" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {activeTab === "recentlyViewed" ? t("noRecent") : t("noMoviesHere")}
            </h2>
            <p className="text-zinc-500 max-w-sm mb-8 text-xs leading-relaxed uppercase tracking-widest font-black opacity-60">
              {activeTab === "recentlyViewed"
                ? t("noRecentDesc")
                : `${t("startExploring")} ${
                    activeTab === "favorites"
                      ? t("favorites").toLowerCase()
                      : t("queue").toLowerCase()
                  } ${t("forQuickAccess")}`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8"
          >
            {movies.map((movie) => (
              <MovieCard key={movie.imdbID} movie={movie} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryPage;
