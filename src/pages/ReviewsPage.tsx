import React, { useState, useEffect } from "react";
import { MessageSquare, Star, Trash2, Loader2, ArrowLeft, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getUserReviews, deleteMovieReview, ReviewData } from "../utils/firebaseUtils";
import MovieImage from "../components/MovieImage";

const ReviewsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserReviews(user.uid);
      setReviews(data);
    } catch (err) {
      console.error("Error fetching user reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = async (imdbID: string) => {
    if (!user) return;
    try {
      await deleteMovieReview(user.uid, imdbID);
      // Update local state optimistically
      setReviews((prev) => prev.filter((r) => r.imdbID !== imdbID));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const isRTL = language === "ar";

  if (!user) {
    return (
      <div className="p-6 lg:p-10 pb-32 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900/40 border border-zinc-800 p-8 text-center backdrop-blur-xl relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand" />
          
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-zinc-500" />
          </div>
          
          <h2 className="text-xl font-black mb-3 tracking-wider uppercase text-white">
            {t("reviews")}
          </h2>
          
          <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
            {t("mustBeLoggedIn")}
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-brand text-black px-6 py-3.5 font-black uppercase text-[10px] tracking-[2px] hover:bg-white transition-all active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> {t("loginWithGoogle")}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-10 pb-32 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Page Header */}
      <div className="mb-12 border-b border-zinc-900 pb-8">
        <h1 className="text-5xl lg:text-7xl font-black mb-2 leading-none">
          {t("reviews")}
        </h1>
        <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">
          {t("writtenOn")} {user.displayName || "User"}
        </p>
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
        ) : reviews.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              <MessageSquare className="w-10 h-10 text-zinc-800" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("noReviews")}</h2>
            <p className="text-zinc-500 max-w-sm mb-8 text-xs leading-relaxed uppercase tracking-widest font-black opacity-60">
              {t("noReviewsDesc")}
            </p>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-black font-black uppercase text-[10px] tracking-[2px] hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>{t("return")}</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 max-w-4xl"
          >
            <AnimatePresence>
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/30 border border-zinc-800/40 p-6 lg:p-8 flex flex-col md:flex-row gap-6 relative group"
                >
                  {/* Movie Poster thumbnail */}
                  <Link
                    to={`/movie/${review.imdbID}?type=${review.movieType}`}
                    className="w-24 aspect-[2/3] shrink-0 bg-zinc-950 border border-white/5 overflow-hidden block"
                  >
                    <MovieImage
                      src={review.moviePoster}
                      alt={review.movieTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div>
                        <Link
                          to={`/movie/${review.imdbID}?type=${review.movieType}`}
                          className="hover:text-brand transition-colors"
                        >
                          <h3 className="text-lg font-black uppercase tracking-tight">
                            {review.movieTitle}
                          </h3>
                        </Link>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">
                          {review.movieYear} • {review.movieType}
                        </p>
                      </div>

                      {/* Display Rating Stars */}
                      <div className="flex items-center gap-1 bg-black/30 px-3 py-1 border border-zinc-800">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= review.rating
                                ? "text-yellow-500 fill-current"
                                : "text-zinc-800"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-[10px] font-black text-yellow-500">
                          {review.rating.toFixed(1)}/5.0
                        </span>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-zinc-300 text-sm font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                      "{review.comment}"
                    </p>

                    {/* Footer / Date */}
                    {review.publishedAt && (
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                        {new Date(review.publishedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Delete Button (Retract Review) */}
                  <button
                    onClick={() => handleDelete(review.imdbID)}
                    className="absolute top-6 right-6 md:static self-start p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer rounded-none"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewsPage;
