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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { movieService, DetailedMovie } from "../services/movieService";
import { useMovies } from "../context/MovieContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { publishMovieReview, getMovieReviewForUser, getMovieReviews, ReviewData } from "../utils/firebaseUtils";
import MovieImage from "../components/MovieImage";


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

  const [movie, setMovie] = useState<DetailedMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
              <button
                onClick={() =>
                  window.open(
                    `https://streamimdb.ru/embed/${movie.Type}/${movie.externalImdbId || movie.imdbID}`,
                    "_blank",
                  )
                }
                className="flex items-center justify-center gap-3 py-5 bg-brand text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-brand/80 mb-2 shadow-[0_20px_50px_rgba(229,9,20,0.4)] group/watch"
              >
                <Play className="w-5 h-5 fill-current group-hover/watch:scale-110 transition-transform" />
                {t("watchNow")}
              </button>

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
              {movie.Genre.split(", ").map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-white/5 text-white text-[10px] font-black rounded-none border border-white/10 uppercase tracking-[2px]"
                >
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-6xl lg:text-9xl font-black mb-8 leading-[0.85] tracking-[-0.04em] uppercase break-words">
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
                <span className="border border-zinc-700 px-1.5 py-0.5 text-white">
                  {movie.Rated}
                </span>
              </div>
            </div>

            <div className="mb-16 max-w-3xl">
              <h3 className="text-sm font-black uppercase tracking-[3px] text-zinc-600 mb-4 font-display">
                {t("synopsis")}
              </h3>
              <p className="text-white leading-relaxed text-xl lg:text-2xl font-medium tracking-tight">
                {movie.Plot}
              </p>
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

            {/* Write a Review Block */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-10 bg-white/5 rounded-none border border-white/10 relative overflow-hidden group"
              >
                <h3 className="text-xs font-black uppercase tracking-[3px] text-zinc-500 mb-6 font-display">
                  {t("writeReview")}
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
                    {isSubmittingReview ? t("publishing") : t("publish")}
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
