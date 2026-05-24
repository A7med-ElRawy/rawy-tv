import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Bookmark,
  Search,
  Menu,
  Play,
  Loader2,
  Film,
  PlayCircle,
  Settings,
  MessageSquare,
  Trophy,
  Heart,
  Star,
  Zap,
  Award,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { movieService, Movie } from "../services/movieService";
import NavBar from "./NavBar";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useMovies } from "../context/MovieContext";
import MovieImage from "./MovieImage";


const ACHIEVEMENTS_LIST = [
  {
    id: "first-love",
    nameKey: "firstLoveName",
    descKey: "firstLoveDesc",
    icon: Heart,
    color: "from-rose-500 to-pink-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
    goalType: "favorites" as const,
    goalValue: 1
  },
  {
    id: "critic-apprentice",
    nameKey: "criticApprenticeName",
    descKey: "criticApprenticeDesc",
    icon: MessageSquare,
    color: "from-brand to-red-650 shadow-[0_0_15px_rgba(229,9,20,0.4)]",
    goalType: "reviews" as const,
    goalValue: 1
  },
  {
    id: "score-collector",
    nameKey: "scoreCollectorName",
    descKey: "scoreCollectorDesc",
    icon: Star,
    color: "from-amber-400 to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    goalType: "ratings" as const,
    goalValue: 5
  },
  {
    id: "marathoner",
    nameKey: "marathonerName",
    descKey: "marathonerDesc",
    icon: Zap,
    color: "from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]",
    goalType: "watchLater" as const,
    goalValue: 5
  },
  {
    id: "grand-critic",
    nameKey: "grandCriticName",
    descKey: "grandCriticDesc",
    icon: Award,
    color: "from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(52,211,153,0.4)]",
    goalType: "reviews" as const,
    goalValue: 5
  }
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { favorites, watchLater, ratings, reviewsCount, loading } = useMovies();
  
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    nameKey: string;
    descKey: string;
    icon: React.ComponentType<any>;
    color: string;
  } | null>(null);

  const location = useLocation();

  useEffect(() => {
    if (!user || loading) return;

    const notifiedKey = `notified_badges_${user.uid}`;
    const stored = localStorage.getItem(notifiedKey);

    const ratingsCount = Object.keys(ratings).length;

    const getProgress = (type: string): number => {
      switch (type) {
        case "favorites":
          return favorites.length;
        case "reviews":
          return reviewsCount;
        case "ratings":
          return ratingsCount;
        case "watchLater":
          return watchLater.length;
        default:
          return 0;
      }
    };

    // Find all currently unlocked badges
    const currentUnlocked = ACHIEVEMENTS_LIST.filter((badge) => {
      const progress = getProgress(badge.goalType);
      return progress >= badge.goalValue;
    });

    const currentUnlockedIds = currentUnlocked.map((badge) => badge.id);

    if (stored === null) {
      // First time initialization for this user: store all their currently unlocked badges without triggering a popup
      localStorage.setItem(notifiedKey, JSON.stringify(currentUnlockedIds));
    } else {
      // Notified key exists. Check if there are any newly unlocked badges
      let notifiedBadges: string[] = [];
      try {
        notifiedBadges = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse notified badges:", e);
      }

      // Find the first badge that is currently unlocked but not in the notified list
      const newUnlocked = currentUnlocked.find(
        (badge) => !notifiedBadges.includes(badge.id)
      );

      if (newUnlocked) {
        // Trigger notification
        setActiveNotification(newUnlocked);

        // Update stored list
        const updatedNotified = [...notifiedBadges, newUnlocked.id];
        localStorage.setItem(notifiedKey, JSON.stringify(updatedNotified));
      }
    }
  }, [user, loading, favorites.length, watchLater.length, ratings, reviewsCount]);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);


  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await movieService.searchMovies(query);
      if (data.Response === "True") {
        // Limit to 5 suggestions
        setSuggestions(data.Search.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  const navItems = [
    { name: t("home"), path: "/", icon: Home },
    { name: t("library"), path: "/library", icon: Bookmark },
    { name: t("reviews"), path: "/reviews", icon: MessageSquare },
    { name: t("achievements"), path: "/achievements", icon: Trophy },
    { name: t("friends"), path: "/friends", icon: Users },
    { name: t("settings"), path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-card border-r border-zinc-900 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <Link to="/" className="flex items-center gap-2 mb-10 pl-2 group">
            <span className="text-2xl font-black tracking-tighter text-brand uppercase">
              Movie Hub
            </span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] mb-4 pl-2">
              {t("navigation")}
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-none transition-all border-l-2 ${
                    isActive
                      ? "border-brand bg-zinc-900 text-white"
                      : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {item.name}
                  </span>
                </Link>
              );
            })}

            <div className="pt-6 space-y-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] pl-2">
                {t("explore")}
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 px-4 text-[10px] font-black text-white/40 uppercase mb-2">
                    <Film className="w-3 h-3" /> {t("movies")}
                  </h4>
                  <div className="space-y-1">
                    {[
                      { name: t("mostPopular"), q: "Popular" },
                      { name: t("top250"), q: "Top 250" },
                      { name: t("releases2026"), q: "2026" },
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          navigate(`/?q=${cat.q}`);
                          setIsSidebarOpen(false);
                        }}
                        className="cursor-pointer w-full text-left px-4 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-tight"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 px-4 text-[10px] font-black text-white/40 uppercase mb-2">
                    <PlayCircle className="w-3 h-3" /> {t("tvShows")}
                  </h4>
                  <div className="space-y-1">
                    {[
                      { name: t("popularShows"), q: "TV Series" },
                      { name: t("top250Tv"), q: "Top Rated" },
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          navigate(`/?q=${cat.q}`);
                          setIsSidebarOpen(false);
                        }}
                        className="cursor-pointer w-full text-left px-4 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-tight"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="p-4 bg-zinc-900/30 rounded-none border border-zinc-800">
              <p className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                {t("eliteAccess")}
              </p>
              <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                {t("eliteAccessDesc")}
              </p>
              <button className="w-full py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                {t("upgrade")}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Unified Header with Search and Google Login */}
        <header className="px-4 lg:px-10 py-3 border-b border-zinc-900/50 bg-surface/95 backdrop-blur-xl z-30 shrink-0">
          {/* Row 1: Menu + Logo (mobile) + NavBar actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: hamburger (mobile) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 lg:hidden text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Center on mobile: logo text */}
            <span className="lg:hidden text-base font-black tracking-tighter text-brand uppercase">
              Movie Hub
            </span>

            {/* Desktop: search bar inline */}
            <div className="hidden lg:flex flex-1 max-w-2xl">
              <div className="relative group w-full" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-brand transition-all" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-black/20 border border-white/10 rounded-none py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-[2px] focus:outline-none focus:border-brand focus:bg-black/40 transition-all placeholder:text-zinc-700"
                  />
                </form>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-zinc-800 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-zinc-900 bg-zinc-900/50">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[2px]">
                          {t("quickResults")}
                        </p>
                      </div>
                      <div className="max-h-87.5 overflow-y-auto">
                        {suggestions.map((movie) => (
                          <button
                            key={movie.imdbID}
                            onClick={() => {
                              setSearchTerm("");
                              setShowSuggestions(false);
                              navigate(
                                `/movie/${movie.imdbID}?type=${movie.Type}`,
                              );
                            }}
                            className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 transition-colors text-left border-b border-zinc-900/50 last:border-0"
                          >
                            <div className="w-10 h-14 shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden">
                              <MovieImage
                                src={movie.Poster}
                                alt={movie.Title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black uppercase tracking-tight truncate mb-0.5">
                                {movie.Title}
                              </p>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                {movie.Year} • {movie.Type}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full p-3 bg-zinc-900 text-center hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                          {t("seeAllResults")} "{searchTerm}"
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: NavBar with Google Login */}
            <NavBar />
          </div>

          {/* Row 2 (mobile only): full-width search bar */}
          <div className="lg:hidden mt-3" ref={searchRef}>
            <div className="relative group">
              <form onSubmit={handleSearchSubmit}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-brand transition-all" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full bg-black/20 border border-white/10 rounded-none py-2.5 pl-12 pr-4 text-[10px] font-black uppercase tracking-[2px] focus:outline-none focus:border-brand focus:bg-black/40 transition-all placeholder:text-zinc-700"
                />
              </form>

              {/* Mobile Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-zinc-800 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-zinc-900 bg-zinc-900/50">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[2px]">
                        {t("quickResults")}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {suggestions.map((movie) => (
                        <button
                          key={movie.imdbID}
                          onClick={() => {
                            setSearchTerm("");
                            setShowSuggestions(false);
                            navigate(
                              `/movie/${movie.imdbID}?type=${movie.Type}`,
                            );
                          }}
                          className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 transition-colors text-left border-b border-zinc-900/50 last:border-0"
                        >
                          <div className="w-10 h-14 shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden">
                            <MovieImage
                              src={movie.Poster}
                              alt={movie.Title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight truncate mb-0.5">
                              {movie.Title}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">
                              {movie.Year} • {movie.Type}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full p-3 bg-zinc-900 text-center hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                        {t("seeAllResults")} "{searchTerm}"
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
      </main>

      {/* Achievement Unlocked Popup */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="max-w-md w-full bg-zinc-900 border-2 border-brand/40 p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(229,9,20,0.4)]"
            >
              {/* Decorative premium corner borders */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand" />
              
              {/* Animated glow ray behind icon */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand/10 rounded-full blur-[60px] animate-pulse pointer-events-none" />

              {/* Glowing Icon */}
              <div className="relative mb-6 flex justify-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className={`w-20 h-20 rounded-full bg-gradient-to-tr ${activeNotification.color} flex items-center justify-center border border-white/10 relative z-10 shadow-2xl`}
                >
                  {React.createElement(activeNotification.icon, {
                    className: "w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  })}
                </motion.div>
                
                {/* Ring animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-brand/35 animate-ping opacity-60" />
                </div>
              </div>

              {/* Title & Badge Details */}
              <h2 className="text-xl font-black text-brand tracking-widest uppercase mb-2">
                {t("achievementUnlocked")}
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-6">
                {t("congratsBadge")}
              </p>

              <div className="bg-zinc-950/60 border border-zinc-800 p-4 mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                  {t(activeNotification.nameKey)}
                </h3>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                  {t(activeNotification.descKey)}
                </p>
              </div>

              {/* Close Action */}
              <button
                onClick={() => setActiveNotification(null)}
                className="w-full bg-brand text-black font-black uppercase text-[10px] tracking-[2px] py-3.5 hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(229,9,20,0.3)] active:scale-95"
              >
                {language === "ar" ? "رائع!" : "AWESOME!"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
