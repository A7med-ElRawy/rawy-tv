import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Star,
  Heart,
  Clock,
  Calendar,
  User,
  Film,
  Globe,
  Award,
  Loader2,
  ArrowLeft,
  Play,
  Trash2,
  Share2,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { movieService, DetailedMovie } from "../services/movieService";
import { useMovies } from "../context/MovieContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import {
  publishMovieReview,
  getMovieReviewForUser,
  getMovieReviews,
  deleteMovieReview,
  ReviewData,
  getUserProfile,
  getFriendsProfiles,
  shareMovieWithFriend,
  UserProfile,
} from "../utils/firebaseUtils";
import MovieImage from "../components/MovieImage";


const getGenreColorClass = (genre: string): { bg: string; text: string; border: string; hover: string } => {
  const g = genre.toLowerCase().trim();
  if (g.includes("action")) {
    return {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/30",
      hover: "hover:bg-red-500/20 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
    };
  }
  if (g.includes("adventure")) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      hover: "hover:bg-amber-500/20 hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]"
    };
  }
  if (g.includes("animation")) {
    return {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      border: "border-pink-500/30",
      hover: "hover:bg-pink-500/20 hover:border-pink-500/60 hover:shadow-[0_0_15px_rgba(236,72,153,0.25)]"
    };
  }
  if (g.includes("comedy")) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      hover: "hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
    };
  }
  if (g.includes("crime")) {
    return {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
      hover: "hover:bg-indigo-500/20 hover:border-indigo-500/60 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]"
    };
  }
  if (g.includes("documentary")) {
    return {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      border: "border-teal-500/30",
      hover: "hover:bg-teal-500/20 hover:border-teal-500/60 hover:shadow-[0_0_15px_rgba(20,184,166,0.25)]"
    };
  }
  if (g.includes("drama")) {
    return {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
      hover: "hover:bg-blue-500/20 hover:border-blue-500/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
    };
  }
  if (g.includes("family")) {
    return {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      border: "border-sky-500/30",
      hover: "hover:bg-sky-500/20 hover:border-sky-500/60 hover:shadow-[0_0_15px_rgba(14,165,233,0.25)]"
    };
  }
  if (g.includes("fantasy")) {
    return {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/30",
      hover: "hover:bg-purple-500/20 hover:border-purple-500/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
    };
  }
  if (g.includes("history")) {
    return {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/30",
      hover: "hover:bg-orange-500/20 hover:border-orange-500/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)]"
    };
  }
  if (g.includes("horror")) {
    return {
      bg: "bg-rose-950/40",
      text: "text-red-500",
      border: "border-rose-900/60",
      hover: "hover:bg-rose-900/40 hover:border-rose-500/60 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]"
    };
  }
  if (g.includes("music")) {
    return {
      bg: "bg-fuchsia-500/10",
      text: "text-fuchsia-400",
      border: "border-fuchsia-500/30",
      hover: "hover:bg-fuchsia-500/20 hover:border-fuchsia-500/60 hover:shadow-[0_0_15px_rgba(217,70,239,0.25)]"
    };
  }
  if (g.includes("mystery")) {
    return {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/30",
      hover: "hover:bg-violet-500/20 hover:border-violet-500/60 hover:shadow-[0_0_15px_rgba(139,92,246,0.25)]"
    };
  }
  if (g.includes("romance")) {
    return {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      hover: "hover:bg-rose-500/20 hover:border-rose-500/60 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]"
    };
  }
  if (g.includes("science fiction") || g.includes("sci-fi")) {
    return {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      hover: "hover:bg-cyan-500/20 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
    };
  }
  if (g.includes("thriller")) {
    return {
      bg: "bg-red-950/20",
      text: "text-amber-500",
      border: "border-red-900/30",
      hover: "hover:bg-red-900/20 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]"
    };
  }
  if (g.includes("war")) {
    return {
      bg: "bg-stone-500/10",
      text: "text-stone-400",
      border: "border-stone-500/30",
      hover: "hover:bg-stone-500/20 hover:border-stone-500/60 hover:shadow-[0_0_15px_rgba(120,113,108,0.25)]"
    };
  }
  if (g.includes("western")) {
    return {
      bg: "bg-yellow-600/10",
      text: "text-yellow-500",
      border: "border-yellow-600/30",
      hover: "hover:bg-yellow-600/20 hover:border-yellow-600/60 hover:shadow-[0_0_15px_rgba(234,179,8,0.25)]"
    };
  }
  return {
    bg: "bg-white/5",
    text: "text-white",
    border: "border-white/10",
    hover: "hover:bg-white/10 hover:border-white/30"
  };
};

const MovieDetailPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    favorites,
    watchLater,
    toggleFavorite,
    toggleWatchLater,
    ratings,
    setRating,
    addToRecent,
    refreshReviewsCount,
  } = useMovies();

  const { user, userProfile } = useAuth();
  const isAdminUser = userProfile?.isAdmin || user?.email === "ahmedrawy108@gmail.com";

  const [movie, setMovie] = useState<DetailedMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sharing states
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriendUid, setSelectedFriendUid] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isSharingMovie, setIsSharingMovie] = useState(false);
  const [statusShare, setStatusShare] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      try {
        const freshProfile = await getUserProfile(user.uid);
        if (freshProfile && freshProfile.friends && freshProfile.friends.length > 0) {
          const data = await getFriendsProfiles(freshProfile.friends);
          setFriends(data);
        }
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    };
    fetchFriends();
  }, [user]);

  const handleInternalShare = async () => {
    if (!user || !selectedFriendUid || !movie) return;
    setIsSharingMovie(true);
    setStatusShare(null);
    try {
      const friendObj = friends.find((f) => f.uid === selectedFriendUid);
      const friendName = friendObj?.displayName || "User";
      
      const moviePayload = {
        imdbID: movie.imdbID,
        Title: movie.Title,
        Poster: movie.Poster,
        Type: movie.Type
      };
      
      const freshSenderProfile = await getUserProfile(user.uid);
      if (!freshSenderProfile) throw new Error("Sender profile not found");
      
      await shareMovieWithFriend(freshSenderProfile, selectedFriendUid, moviePayload, shareMessage.trim());
      
      setStatusShare({
        type: "success",
        message: language === "ar"
          ? `تمت مشاركة الفيلم مع ${friendName} بنجاح!`
          : `Movie shared with ${friendName} successfully!`
      });
      setShareMessage("");
      setSelectedFriendUid("");
    } catch (err) {
      console.error(err);
      setStatusShare({
        type: "error",
        message: language === "ar"
          ? "فشلت مشاركة الفيلم. يرجى المحاولة مرة أخرى."
          : "Failed to share movie. Please try again."
      });
    } finally {
      setIsSharingMovie(false);
    }
  };

  // Synopsis translation states
  const [displayedPlot, setDisplayedPlot] = useState("");
  const [plotLang, setPlotLang] = useState<"en" | "ar">("en");
  const [isTranslatingPlot, setIsTranslatingPlot] = useState(false);

  // Stream checking states
  const [isStreamAvailable, setIsStreamAvailable] = useState<boolean>(true);
  const [isStreamChecking, setIsStreamChecking] = useState<boolean>(false);

  const [communityReviews, setCommunityReviews] = useState<ReviewData[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  useEffect(() => {
    if (!id) return;

    // In search results we might have media_type in state or query params
    const type = new URLSearchParams(location.search).get("type") || "movie";

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await movieService.getMovieDetails(id, type, language);
        if (data.Response === "True") {
          setMovie(data);
          setDisplayedPlot(data.Plot);
          setPlotLang(language === "ar" ? "ar" : "en");
          addToRecent({
            imdbID: data.imdbID,
            Title: data.Title,
            Poster: data.Poster,
            Year: data.Year,
            Type: data.Type,
          });
        } else {
          setError("Movie not found");
        }
      } catch (err) {
        setError("Failed to fetch details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo(0, 0);
  }, [id, location.search, language, addToRecent]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchUserReview = async () => {
      try {
        const existing = await getMovieReviewForUser(user.uid, id);
        if (existing) {
          setReviewComment(existing.comment);
          setHasExistingReview(true);
        } else {
          setHasExistingReview(false);
        }
      } catch (err) {
        console.error("Error fetching user review:", err);
      }
    };
    fetchUserReview();
  }, [user, id]);

  const fetchCommunityReviews = async () => {
    if (!id) return;
    try {
      const data = await getMovieReviews(id);
      setCommunityReviews(data);
    } catch (err) {
      console.error("Error fetching community reviews:", err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  useEffect(() => {
    fetchCommunityReviews();
  }, [id]);

  const handlePublishReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmittingReview(true);
    setReviewStatus(null);

    try {
      await publishMovieReview(
        user.uid,
        userProfile,
        movieData,
        userRating || 5,
        reviewComment.trim(),
        userProfile?.reviewPrivacy || "public"
      );
      setReviewStatus({
        type: "success",
        message: t("reviewPublished"),
      });
      setHasExistingReview(true);
      fetchCommunityReviews();
      refreshReviewsCount();
    } catch (err) {
      console.error(err);
      setReviewStatus({
        type: "error",
        message: t("reviewError"),
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (authorUid: string) => {
    if (!user || !movie) return;
    const confirmDelete = window.confirm(
      language === "ar"
        ? "هل أنت متأكد من حذف هذه المراجعة؟"
        : "Are you sure you want to delete this review?"
    );
    if (!confirmDelete) return;

    try {
      await deleteMovieReview(authorUid, movie.imdbID);
      fetchCommunityReviews();
      refreshReviewsCount();
      
      // If the review deleted was the current logged in user's review, reset fields
      if (authorUid === user.uid) {
        setReviewComment("");
        setHasExistingReview(false);
      }
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const handleTranslatePlot = async (targetLang: "en" | "ar") => {
    if (!id || !movie || isTranslatingPlot || plotLang === targetLang) return;

    setIsTranslatingPlot(true);
    try {
      const data = await movieService.getMovieDetails(id, movie.Type, targetLang);
      if (data && data.Response === "True") {
        setDisplayedPlot(data.Plot);
        setPlotLang(targetLang);
      }
    } catch (err) {
      console.error("Error translating plot:", err);
    } finally {
      setIsTranslatingPlot(false);
    }
  };

  useEffect(() => {
    if (!movie) return;

    const checkStreamAvailability = async () => {
      setIsStreamChecking(true);

      // 1. Future Year Check: if movie release year is in the future, it's not out yet
      const currentYear = new Date().getFullYear();
      const movieYear = parseInt(movie.Year);
      if (!isNaN(movieYear) && movieYear > currentYear) {
        setIsStreamAvailable(false);
        setIsStreamChecking(false);
        return;
      }

      // 2. IMDb ID presence check
      const hasImdbId = movie.externalImdbId && movie.externalImdbId.startsWith("tt");
      if (!hasImdbId) {
        setIsStreamAvailable(false);
        setIsStreamChecking(false);
        return;
      }

      // 3. Network pre-check via CORS proxy
      const url = `https://vaplayer.ru/embed/${movie.Type}/${movie.externalImdbId || movie.imdbID}`;
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for proxy

        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          setIsStreamAvailable(false);
        } else {
          const data = await response.json();
          const html: string = data.contents || "";
          // If the page content contains 404 indicators, stream is not available
          const is404 = html.includes("404") || html.toLowerCase().includes("content not found") || html.toLowerCase().includes("not found");
          setIsStreamAvailable(!is404);
        }
      } catch (err: any) {
        // If proxy call fails or times out, mark as unavailable to be safe
        setIsStreamAvailable(false);
      } finally {
        setIsStreamChecking(false);
      }
    };

    checkStreamAvailability();
  }, [movie]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
        <p className="text-zinc-500 animate-pulse font-medium">
          Loading high-quality cinematics...
        </p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Oops!</h2>
        <p className="text-zinc-500 mb-8">{error || "Movie not found"}</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-3 bg-brand rounded-full font-bold transition-transform hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back Home
        </button>
      </div>
    );
  }

  const isFavorite = favorites.some((fav) => fav.imdbID === movie.imdbID);
  const isWatchLater = watchLater.some((m) => m.imdbID === movie.imdbID);
  const userRating = ratings[movie.imdbID] || 0;

  const movieData = {
    imdbID: movie.imdbID,
    Title: movie.Title,
    Poster: movie.Poster,
    Year: movie.Year,
    Type: movie.Type,
  };

  const handleStarInteration = (starValue: number, isHalf: boolean) => {
    const value = isHalf ? starValue - 0.5 : starValue;
    setRating(movie.imdbID, value);
  };

  const handleHoverInteraction = (starValue: number, isHalf: boolean) => {
    const value = isHalf ? starValue - 0.5 : starValue;
    setHoverRating(value);
  };

  return (
    <div className="relative min-h-full">
      {/* Background Backdrop */}
      <div className="absolute inset-0 h-[700px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent z-10" />
        <img
          src={
            movie.backdrop_path || (movie.Poster !== "N/A" ? movie.Poster : "")
          }
          className="w-full h-full object-cover opacity-30 scale-105"
          alt="Backdrop"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-surface/20 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 px-6 lg:px-16 pt-8 pb-32">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 border border-zinc-800">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="font-semibold uppercase tracking-widest text-xs">
            {t("return")}
          </span>
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left Column: Poster & Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full lg:w-[400px] shrink-0"
          >
            <div className="relative aspect-[2/3] rounded-none overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] bg-card border border-white/10">
              <MovieImage
                src={movie.Poster}
                alt={movie.Title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Floating IMDB Badge */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-accent-green text-black font-black text-xs rounded-none shadow-xl uppercase tracking-tighter">
                {movie.imdbRating} SCORE
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              {isStreamChecking ? (
                <div className="flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-sm mb-2 select-none">
                  <Loader2 className="w-5 h-5 animate-spin text-brand" />
                  <span>{language === "ar" ? "جاري الفحص..." : "Checking Stream..."}</span>
                </div>
              ) : isStreamAvailable ? (
                <button
                  onClick={() =>
                    navigate(`/watch/${movie.Type}/${movie.externalImdbId || movie.imdbID}`)
                  }
                  className="flex items-center justify-center gap-3 py-5 bg-brand text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-brand/80 mb-2 shadow-[0_20px_50px_rgba(229,9,20,0.4)] group/watch cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current group-hover/watch:scale-110 transition-transform" />
                  {t("watchNow")}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3 py-5 bg-zinc-900/40 border border-zinc-800/60 text-zinc-600 font-black uppercase tracking-widest text-sm mb-2 select-none cursor-not-allowed">
                  <Play className="w-5 h-5 opacity-30" />
                  <span>{language === "ar" ? "قريباً.." : "SooN.."}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleFavorite(movieData)}
                  className={`flex items-center justify-center gap-2 py-4 rounded-none font-black uppercase tracking-widest text-[10px] transition-all ${
                    isFavorite
                      ? "bg-zinc-800 text-brand outline outline-1 outline-brand/50"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`}
                  />
                  {isFavorite ? t("saved") : t("favorite")}
                </button>
                <button
                  onClick={() => toggleWatchLater(movieData)}
                  className={`flex items-center justify-center gap-2 py-4 rounded-none font-black uppercase tracking-widest text-[10px] transition-all ${
                    isWatchLater
                      ? "bg-zinc-800 text-white"
                      : "bg-transparent text-white hover:bg-white/10 border border-white/20"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {isWatchLater ? t("queued") : t("later")}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Information */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {movie.Genre.split(", ").map((g) => {
                const colors = getGenreColorClass(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => navigate(`/?q=${g.trim()}`)}
                    className={`px-3 py-1.5 ${colors.bg} ${colors.text} ${colors.border} ${colors.hover} text-[10px] font-black rounded-none border uppercase tracking-[2.5px] cursor-pointer transition-all duration-350 active:scale-95`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-none tracking-tight uppercase break-words">
              {movie.Title}
            </h1>

            <div className="flex flex-wrap items-center gap-8 mb-12 text-zinc-500 font-black text-xs uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="text-zinc-700">{t("year")}</span>
                <span className="text-white">{movie.Year}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-700">{t("length")}</span>
                <span className="text-white">{movie.Runtime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-700">{t("cert")}</span>
                <button
                  type="button"
                  onClick={() => navigate(`/?q=${movie.Rated}`)}
                  className="border border-zinc-700 hover:border-brand hover:text-brand hover:shadow-[0_0_12px_rgba(229,9,20,0.3)] px-2 py-0.5 text-white font-black transition-all cursor-pointer rounded-none active:scale-95 text-[10px]"
                  title={language === "ar" ? `البحث عن تصنيف ${movie.Rated}` : `Search for ${movie.Rated} Classification`}
                >
                  {movie.Rated}
                </button>
              </div>
            </div>

            <div className="mb-16 max-w-3xl">
              <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-black uppercase tracking-[3px] text-zinc-650 font-display">
                  {t("synopsis")}
                </h3>

                {/* Language translation buttons */}
                <div className="flex bg-zinc-900/40 p-0.5 border border-zinc-800 rounded-none text-[9px] font-black uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleTranslatePlot("en")}
                    className={`px-3 py-1.5 transition-all cursor-pointer ${
                      plotLang === "en" ? "bg-brand text-white" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTranslatePlot("ar")}
                    className={`px-3 py-1.5 transition-all cursor-pointer ${
                      plotLang === "ar" ? "bg-brand text-white" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    AR
                  </button>
                </div>
              </div>

              <div className="relative">
                {isTranslatingPlot ? (
                  <div className="flex items-center gap-2 py-4 text-zinc-500 font-bold text-xs uppercase tracking-widest animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                    <span>{language === "ar" ? "جاري الترجمة..." : "Translating synopsis..."}</span>
                  </div>
                ) : (
                  <p
                    className="text-white leading-relaxed text-xl lg:text-2xl font-medium tracking-tight whitespace-pre-wrap transition-opacity duration-300"
                    style={{ direction: plotLang === "ar" ? "rtl" : "ltr", textAlign: plotLang === "ar" ? "right" : "left" }}
                  >
                    {displayedPlot || movie.Plot}
                  </p>
                )}
              </div>
            </div>

            {movie.trailerKey && (
              <div className="mb-16">
                <h3 className="text-sm font-black uppercase tracking-[3px] text-zinc-600 mb-6 font-display uppercase">
                  {t("officialTrailer")}
                </h3>
                <div className="aspect-video w-full bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                    title={`${movie.Title} Trailer`}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-12 mb-16">
              <div>
                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[3px] mb-4">
                  {t("direction")}
                </h4>
                <p className="text-lg font-bold uppercase tracking-tight">
                  {movie.Director}
                </p>
              </div>
              <div className="sm:col-span-2">
                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[3px] mb-6">
                  {t("starring")}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {movie.cast && movie.cast.length > 0 ? (
                    movie.cast.map((actor) => (
                      <div key={actor.id} className="group/actor">
                        <div className="aspect-[3/4] bg-zinc-900 border border-white/5 mb-3 overflow-hidden">
                          <img
                            src={
                              actor.profile_path ||
                              "https://via.placeholder.com/300x400?text=No+Photo"
                            }
                            alt={actor.name}
                            className="w-full h-full object-cover grayscale group-hover/actor:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-tight leading-tight mb-1 truncate">
                          {actor.name}
                        </p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter truncate">
                          {actor.character}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-lg font-bold uppercase tracking-tight leading-snug">
                      {movie.Actors}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Critical Reviews & Awards Section */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16 pt-16 border-t border-zinc-900">
              <div>
                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[3px] mb-6">
                  {t("criticalConsensus")}
                </h4>
                <div className="space-y-4">
                  {movie.Ratings && movie.Ratings.length > 0 ? (
                    movie.Ratings.map((rating) => (
                      <div
                        key={rating.Source}
                        className="flex items-center justify-between group/rating"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover/rating:text-white transition-colors">
                            {rating.Source}
                          </span>
                          {rating.Source === "TMDB" && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <span
                          className={`text-lg font-black tracking-tighter ${rating.Source === "TMDB" ? "text-yellow-500" : "text-brand"}`}
                        >
                          {rating.Value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                      {t("noCriticScores")}
                    </p>
                  )}
                  {movie.Metascore && movie.Metascore !== "N/A" && (
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-900/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {t("metascore")}
                      </span>
                      <div className="w-10 h-10 bg-accent-green text-black flex items-center justify-center font-black text-xs">
                        {movie.Metascore}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[3px] mb-6">
                  {t("recognition")}
                </h4>
                <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-none">
                  <Award className="w-8 h-8 text-brand mb-4 opacity-50" />
                  <p className="text-lg font-bold uppercase tracking-tight leading-tight mb-2">
                    {movie.Awards !== "N/A"
                      ? movie.Awards
                      : t("noAwards")}
                  </p>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px]">
                    {t("recognitionDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction: Star Rating */}
            <div className="p-10 bg-white/5 rounded-none border border-white/10 relative overflow-hidden group">
              <h3 className="text-xs font-black uppercase tracking-[3px] text-zinc-500 mb-6 font-display">
                {t("rateTitle")}
              </h3>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="relative flex">
                    {/* Left half */}
                    <div
                      className="w-6 h-12 cursor-pointer z-10"
                      onMouseEnter={() => handleHoverInteraction(star, true)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleStarInteration(star, true)}
                    />
                    {/* Right half */}
                    <div
                      className="w-6 h-12 cursor-pointer z-10"
                      onMouseEnter={() => handleHoverInteraction(star, false)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleStarInteration(star, false)}
                    />

                    {/* Visual Star */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative">
                        <Star className="w-10 h-10 text-zinc-800" />
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            width: `${Math.max(0, Math.min(100, ((hoverRating || userRating) - (star - 1)) * 100))}%`,
                          }}
                        >
                          <Star className="w-10 h-10 text-yellow-500 fill-current drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(userRating > 0 || hoverRating > 0) && (
                  <span className="ml-6 text-sm font-black uppercase tracking-widest text-yellow-500">
                    {(hoverRating || userRating).toFixed(1)}/5.0
                  </span>
                )}
              </div>
              <p className="mt-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                {t("hoverRate")}
              </p>
            </div>

            {/* Share Movie Section */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-10 bg-white/5 rounded-none border border-white/10 relative overflow-hidden group"
              >
                <h3 className="text-xs font-black uppercase tracking-[3px] text-zinc-500 mb-6 font-display">
                  {language === "ar" ? "مشاركة هذا العمل السينمائي" : "Share This Cinematic Masterpiece"}
                </h3>

                {/* Grid for external and internal sharing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left: External Social Sharing */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {language === "ar" ? "منصات التواصل الاجتماعي" : "Social Networks"}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `${language === "ar" ? "شاهد هذا الفيلم الرائع: " : "Check out this awesome title: "} ${movie.Title} - ${window.location.href}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] px-4 py-3.5 text-[10px] font-black uppercase tracking-wider hover:bg-[#25D366] hover:text-black transition-all"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 .02c-6.627 0-12 5.373-12 12 0 2.159.57 4.186 1.564 5.952L.05 23.95l6.147-1.613c1.7.925 3.639 1.455 5.703 1.455 6.628 0 12-5.373 12-12s-5.372-12-12-12zm6.273 17.062c-.273.766-1.373 1.405-2.023 1.488-.58.073-1.336.13-2.13-.13-.509-.166-1.127-.403-1.928-.745-3.415-1.457-5.617-4.943-5.787-5.17-.17-.226-1.353-1.802-1.353-3.435 0-1.633.853-2.437 1.156-2.766.303-.33.659-.41.879-.41.22 0 .439.002.632.012.2.01.424-.038.665.54.244.58.835 2.03.906 2.18.07.148.118.322.018.518-.098.196-.148.318-.293.493-.146.176-.307.391-.439.524-.146.147-.298.307-.127.603.17.296.758 1.252 1.625 2.027.9.805 1.662 1.055 1.958 1.176.297.12.47.1.645-.1.176-.2.766-.89.966-1.196.2-.303.402-.254.678-.152.278.102 1.766.83 2.072.986.307.156.51.234.586.366.073.13.073.766-.2 1.532z" />
                        </svg>
                        WhatsApp
                      </a>

                      {/* Facebook */}
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] px-4 py-3.5 text-[10px] font-black uppercase tracking-wider hover:bg-[#1877F2] hover:text-white transition-all"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </a>

                      {/* Copy Link */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setStatusShare({
                            type: "success",
                            message: language === "ar" ? "تم نسخ الرابط بنجاح!" : "Link copied to clipboard!"
                          });
                        }}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-brand/40 px-4 py-3.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        {language === "ar" ? "نسخ الرابط" : "Copy Link"}
                      </button>
                    </div>
                  </div>

                  {/* Right: Internal Sharing */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {language === "ar" ? "المشاركة مع الأصدقاء على المنصة" : "Share with Web Friends"}
                    </h4>
                    
                    {friends.length === 0 ? (
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tight">
                        {language === "ar"
                          ? "يجب إضافة أصدقاء أولاً لتتمكن من مشاركة الفيلم معهم"
                          : "You need to add friends first to share directly on this platform."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={selectedFriendUid}
                          onChange={(e) => {
                            setSelectedFriendUid(e.target.value);
                            setStatusShare(null);
                          }}
                          className="w-full bg-black/40 border border-zinc-800 py-3.5 px-4 text-xs font-bold text-white focus:outline-none focus:border-brand focus:bg-black/60 transition-all uppercase tracking-wider"
                        >
                          <option value="" className="bg-zinc-950 text-zinc-600">
                            {language === "ar" ? "اختر صديقاً..." : "Select Friend..."}
                          </option>
                          {friends.map((friend) => (
                            <option
                              key={friend.uid}
                              value={friend.uid}
                              className="bg-zinc-950 text-white"
                            >
                              {friend.displayName || "User"}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={shareMessage}
                          onChange={(e) => {
                            setShareMessage(e.target.value);
                            setStatusShare(null);
                          }}
                          placeholder={
                            language === "ar"
                              ? "أضف رسالة قصيرة اختيارية..."
                              : "Add a short optional message..."
                          }
                          className="w-full bg-black/40 border border-zinc-800 py-3.5 px-4 text-xs font-medium text-white focus:outline-none focus:border-brand focus:bg-black/60 transition-all tracking-wide placeholder:text-zinc-650"
                        />

                        <button
                          onClick={handleInternalShare}
                          disabled={isSharingMovie || !selectedFriendUid}
                          className="w-full py-3.5 bg-brand text-black font-black uppercase text-[10px] tracking-[2px] hover:bg-white hover:text-black disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSharingMovie ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{language === "ar" ? "جاري الإرسال..." : "Sharing..."}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>{language === "ar" ? "إرسال إلى صديق" : "Send to Friend"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status banner */}
                <AnimatePresence>
                  {statusShare && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`p-4 mt-6 flex items-start gap-3 border ${
                        statusShare.type === "success"
                          ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-400"
                          : "bg-red-950/20 border-red-800/50 text-red-400"
                      }`}
                    >
                      <span className="text-xs font-bold leading-relaxed">{statusShare.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Write a Review Block */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-10 bg-white/5 rounded-none border border-white/10 relative overflow-hidden group"
              >
                <h3 className="text-xs font-black uppercase tracking-[3px] text-zinc-500 mb-6 font-display">
                  {hasExistingReview
                    ? (language === "ar" ? "تعديل مراجعتك" : "Update Your Review")
                    : t("writeReview")}
                </h3>

                <AnimatePresence mode="wait">
                  {reviewStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 mb-6 flex items-start gap-3 border ${
                        reviewStatus.type === "success"
                          ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-400"
                          : "bg-red-950/20 border-red-800/50 text-red-400"
                      }`}
                    >
                      <span className="text-xs font-bold leading-relaxed">{reviewStatus.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handlePublishReview} className="space-y-4">
                  <textarea
                    value={reviewComment}
                    onChange={(e) => {
                      setReviewComment(e.target.value);
                      setReviewStatus(null);
                    }}
                    required
                    placeholder={t("reviewPlaceholder")}
                    rows={4}
                    className="w-full bg-black/40 border border-zinc-800 py-3.5 px-4 text-xs font-medium text-white focus:outline-none focus:border-brand focus:bg-black/60 transition-all tracking-wide resize-none placeholder:text-zinc-600"
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="py-3.5 px-8 bg-brand text-white font-black uppercase text-[10px] tracking-[2px] hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(229,9,20,0.4)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingReview
                      ? t("publishing")
                      : hasExistingReview
                        ? (language === "ar" ? "تحديث التقييم" : "Update Review")
                        : t("publish")}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Community Reviews Section */}
            <div className="mt-12 pt-12 border-t border-zinc-900">
              <h3 className="text-xl font-black uppercase tracking-[3px] text-white mb-8">
                {t("communityReviews")}
              </h3>

              {loadingCommunity ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                </div>
              ) : (() => {
                const visibleReviews = communityReviews.filter((r) => {
                  if (user && r.uid === user.uid) return true;
                  return r.privacy === "public" || !r.privacy;
                });

                if (visibleReviews.length === 0) {
                  return (
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-relaxed">
                      {t("noCommunityReviews")}
                    </p>
                  );
                }

                return (
                  <div className="space-y-6">
                    {visibleReviews.map((rev) => {
                      const isOwn = rev.uid === user?.uid;
                      const getReviewInitials = (n: string | null) => {
                        if (!n) return "U";
                        return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                      };
                      return (
                        <div
                          key={rev.id}
                          className={`p-6 border transition-all ${
                            isOwn
                              ? "bg-brand/5 border-brand/20"
                              : "bg-zinc-900/20 border-zinc-800/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              {rev.photoURL ? (
                                <img
                                  src={rev.photoURL}
                                  alt="reviewer"
                                  className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center border border-zinc-700"><span class="text-xs font-black text-brand">${getReviewInitials(rev.displayName)}</span></div>`;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center border border-zinc-700">
                                  <span className="text-xs font-black text-brand">
                                    {getReviewInitials(rev.displayName)}
                                  </span>
                                </div>
                              )}
                              
                              <div>
                                <p className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 flex-wrap">
                                  <span>{rev.displayName || "User"}</span>
                                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 font-black tracking-tight uppercase inline-block align-middle shrink-0">
                                    LVL {rev.userLevel || 1}
                                  </span>
                                  {(rev.isAdmin || (isOwn && user?.email === "ahmedrawy108@gmail.com")) && (
                                    <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 font-black tracking-widest uppercase inline-block align-middle shrink-0 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                      ADMIN
                                    </span>
                                  )}
                                  {isOwn && (
                                    <span className="text-[8px] bg-brand text-black px-1.5 py-0.5 font-bold uppercase tracking-tight shrink-0">
                                      YOU
                                    </span>
                                  )}
                                </p>
                                {rev.publishedAt && (
                                  <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
                                    {new Date(rev.publishedAt.seconds * 1000).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= rev.rating
                                        ? "text-yellow-500 fill-current"
                                        : "text-zinc-800"
                                    }`}
                                  />
                                ))}
                              </div>

                              {(isOwn || isAdminUser) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.uid)}
                                  className="p-1 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                                  title={language === "ar" ? "حذف المراجعة" : "Delete Review"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-zinc-300 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                            "{rev.comment}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
