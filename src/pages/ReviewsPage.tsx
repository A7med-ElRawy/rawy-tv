import React, { useState, useEffect } from "react";
import { MessageSquare, Star, Trash2, Edit, Loader2, ArrowLeft, LogIn, Heart, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PageLoader from "../components/PageLoader";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useMovies } from "../context/MovieContext";
import {
  getUserReviews,
  getAllPublicReviews,
  toggleLikeReview,
  addCommentToReview,
  deleteMovieReview,
  editCommentInReview,
  deleteCommentFromReview,
  updateMovieReview,
  ReviewData,
  ReviewComment
} from "../utils/firebaseUtils";
import MovieImage from "../components/MovieImage";

const ReviewsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, userProfile, loginWithGoogle } = useAuth();
  const { refreshReviewsCount } = useMovies();
  const navigate = useNavigate();
  const isAdminUser = userProfile?.isAdmin || user?.email === "ahmedrawy108@gmail.com";

  const [activeTab, setActiveTab] = useState<"feed" | "myReviews">("feed");
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state to manage expanded comments drawers by review ID
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  // Review Editing State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);

  // Comment Editing State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      if (activeTab === "feed") {
        const data = await getAllPublicReviews();
        setReviews(data);
      } else if (user) {
        const data = await getUserReviews(user.uid);
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeTab, user]);

  const handleLike = async (reviewId: string) => {
    if (!user) {
      alert(t("mustBeLoggedIn"));
      return;
    }

    try {
      // Optimistic update
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId) {
            const likes = rev.likes || [];
            const hasLiked = likes.includes(user.uid);
            const newLikes = hasLiked
              ? likes.filter((uid) => uid !== user.uid)
              : [...likes, user.uid];
            return { ...rev, likes: newLikes };
          }
          return rev;
        })
      );

      await toggleLikeReview(reviewId, user.uid);
    } catch (err) {
      console.error("Error toggling like:", err);
      // refetch to restore correct state on error
      fetchReviews();
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!user) {
      alert(t("mustBeLoggedIn"));
      return;
    }

    const text = newComments[reviewId]?.trim();
    if (!text) return;

    const commentData: ReviewComment = {
      id: `${user.uid}_${Date.now()}`,
      uid: user.uid,
      displayName: userProfile?.displayName || user.displayName || "User",
      photoURL: userProfile?.photoURL || user.photoURL || "",
      text,
      createdAt: new Date().toISOString()
    };

    try {
      // Optimistic update
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId) {
            const comments = rev.comments || [];
            return { ...rev, comments: [...comments, commentData] };
          }
          return rev;
        })
      );
      
      // Clear input
      setNewComments((prev) => ({ ...prev, [reviewId]: "" }));

      await addCommentToReview(reviewId, commentData);
    } catch (err) {
      console.error("Error adding comment:", err);
      fetchReviews();
    }
  };

  const handleDelete = async (authorUid: string, imdbID: string) => {
    if (!user) return;
    const confirmDelete = window.confirm(
      language === "ar"
        ? "هل أنت متأكد من حذف هذه المراجعة؟"
        : "Are you sure you want to delete this review?"
    );
    if (!confirmDelete) return;

    try {
      await deleteMovieReview(authorUid, imdbID);
      setReviews((prev) => prev.filter((r) => r.id !== `${authorUid}_${imdbID}`));
      refreshReviewsCount();
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const toggleCommentsDrawer = (reviewId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const handleCommentChange = (reviewId: string, val: string) => {
    setNewComments((prev) => ({
      ...prev,
      [reviewId]: val
    }));
  };
  const startEditReview = (review: ReviewData) => {
    setEditingReviewId(review.id);
    setEditReviewText(review.comment);
    setEditReviewRating(review.rating);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewText("");
    setEditReviewRating(5);
  };

  const handleSaveReview = async (reviewId: string) => {
    const text = editReviewText.trim();
    if (!text) return;

    try {
      // Optimistic update
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId) {
            return { ...rev, comment: text, rating: editReviewRating };
          }
          return rev;
        })
      );
      setEditingReviewId(null);

      await updateMovieReview(reviewId, editReviewRating, text);
    } catch (err) {
      console.error("Error editing review:", err);
      fetchReviews();
    }
  };

  const startEditComment = (comment: ReviewComment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleSaveComment = async (reviewId: string, commentId: string) => {
    const text = editCommentText.trim();
    if (!text) return;

    try {
      // Optimistic update
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId) {
            const updatedComments = (rev.comments || []).map((c) => {
              if (c.id === commentId) {
                return { ...c, text };
              }
              return c;
            });
            return { ...rev, comments: updatedComments };
          }
          return rev;
        })
      );
      setEditingCommentId(null);

      await editCommentInReview(reviewId, commentId, text);
    } catch (err) {
      console.error("Error editing comment:", err);
      fetchReviews();
    }
  };

  const handleDeleteComment = async (reviewId: string, commentId: string) => {
    const confirmDelete = window.confirm(
      language === "ar"
        ? "هل أنت متأكد من حذف هذا التعليق؟"
        : "Are you sure you want to delete this comment?"
    );
    if (!confirmDelete) return;

    try {
      // Optimistic update
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId) {
            const filteredComments = (rev.comments || []).filter((c) => c.id !== commentId);
            return { ...rev, comments: filteredComments };
          }
          return rev;
        })
      );

      await deleteCommentFromReview(reviewId, commentId);
    } catch (err) {
      console.error("Error deleting comment:", err);
      fetchReviews();
    }
  };
  const isRTL = language === "ar";
  const isFeed = activeTab === "feed";

  return (
    <div className={`p-6 lg:p-10 pb-32 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Page Header & Tabs */}
      <div className="mb-12 border-b border-zinc-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl lg:text-7xl font-black mb-2 leading-none flex items-center gap-3">
            {t("reviews")}
            {isFeed && <Sparkles className="w-8 h-8 text-brand animate-pulse" />}
          </h1>
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">
            {isFeed ? "Cinematic Social Feed" : `Critiques Portfolio of ${user?.displayName || "User"}`}
          </p>
        </div>

        {/* Feed vs My Portfolio Tab Selection */}
        <div className="flex bg-zinc-900/50 p-1 border border-white/5 rounded-none self-start">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
              isFeed ? "bg-white text-black" : "text-zinc-500 hover:text-white"
            }`}
          >
            {isRTL ? "المجتمع" : "Social Feed"}
          </button>
          {user && (
            <button
              onClick={() => setActiveTab("myReviews")}
              className={`px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                !isFeed ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              }`}
            >
              {isRTL ? "مراجعاتي" : "My Reviews"}
            </button>
          )}
        </div>
      </div>

      {/* Guest Locked Panel (Only if My Reviews selected while logged out) */}
      {!user && !isFeed && (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="max-w-md w-full bg-zinc-900/40 border border-zinc-800 p-8 text-center backdrop-blur-xl">
            <h2 className="text-xl font-black mb-3 tracking-wider uppercase text-white">{t("reviews")}</h2>
            <p className="text-xs text-zinc-400 mb-8 leading-relaxed">{t("mustBeLoggedIn")}</p>
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 bg-brand text-black px-6 py-3.5 font-black uppercase text-[10px] tracking-[2px] hover:bg-white transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> {t("loginWithGoogle")}
            </button>
          </div>
        </div>
      )}

      {/* Reviews feed mapping */}
      {(user || isFeed) && (
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <PageLoader />
              <p className="text-zinc-500 font-medium mt-4">{t("updatingCollections")}</p>
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
              className="space-y-8 max-w-4xl"
            >
              <AnimatePresence>
                {reviews.map((review) => {
                  const isOwn = review.uid === user?.uid;
                  const likesCount = review.likes?.length || 0;
                  const commentsCount = review.comments?.length || 0;
                  const userHasLiked = user ? (review.likes?.includes(user.uid) || false) : false;
                  const isDrawerOpen = expandedComments[review.id] || false;

                  const getInitials = (n: string | null) => {
                    if (!n) return "U";
                    return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                  };

                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/30 border border-zinc-800/40 p-6 lg:p-8 flex flex-col gap-6 relative"
                    >
                      {/* Top Header: Critic Info & rating */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {review.photoURL ? (
                            <img
                              src={review.photoURL}
                              alt="critic-avatar"
                              className="w-10 h-10 rounded-full object-cover border border-zinc-850"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center border border-zinc-850"><span class="text-xs font-black text-brand">${getInitials(review.displayName)}</span></div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center border border-zinc-850">
                              <span className="text-xs font-black text-brand">
                                {getInitials(review.displayName)}
                              </span>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 flex-wrap">
                              <span>{review.displayName || "User"}</span>
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 font-black tracking-tight uppercase inline-block align-middle shrink-0">
                                LVL {review.userLevel || 1}
                              </span>
                              {(review.isAdmin || (isOwn && user?.email === "ahmedrawy108@gmail.com")) && (
                                <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 font-black tracking-widest uppercase inline-block align-middle shrink-0 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                  ADMIN
                                </span>
                              )}
                              {isOwn && (
                                <span className="text-[8px] bg-brand text-black px-1.5 py-0.5 font-bold uppercase tracking-tight shrink-0">
                                  YOU
                                </span>
                              )}
                            </h4>
                            {review.publishedAt && (
                              <p className="text-[8px] font-bold text-zinc-650 uppercase tracking-wider">
                                {new Date(review.publishedAt.seconds * 1000).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Display Rating Stars */}
                        {editingReviewId === review.id ? (
                          <div className="flex items-center gap-1 bg-black/40 px-3 py-1 border border-brand/50">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditReviewRating(star)}
                                className="focus:outline-none transition-transform active:scale-90"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 cursor-pointer ${
                                    star <= editReviewRating
                                      ? "text-yellow-500 fill-current"
                                      : "text-zinc-850"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
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
                          </div>
                        )}
                      </div>

                      {/* Middle Body: Poster thumbnail & Critique Comment */}
                      <div className="flex flex-col sm:flex-row gap-6 items-start w-full">
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

                        <div className="flex-1 min-w-0 w-full">
                          <Link
                            to={`/movie/${review.imdbID}?type=${review.movieType}`}
                            className="hover:text-brand transition-colors"
                          >
                            <h3 className="text-xl font-black uppercase tracking-tight mb-1 leading-none">
                              {review.movieTitle}
                            </h3>
                          </Link>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-4">
                            {review.movieYear} • {review.movieType}
                          </p>

                          {editingReviewId === review.id ? (
                            <div className="space-y-4 w-full mt-2">
                              <textarea
                                value={editReviewText}
                                onChange={(e) => setEditReviewText(e.target.value)}
                                className="w-full bg-black/50 border border-brand/40 p-3.5 text-xs font-medium text-white focus:outline-none focus:border-brand transition-all resize-none tracking-wide"
                                rows={4}
                                required
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEditReview}
                                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                                >
                                  {language === "ar" ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveReview(review.id)}
                                  disabled={!editReviewText.trim()}
                                  className="px-4 py-2 bg-brand text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500"
                                >
                                  {language === "ar" ? "حفظ" : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-zinc-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Interaction Footer: Likes & Comments count */}
                      <div className="flex items-center gap-6 pt-4 border-t border-zinc-850/60 mt-2">
                        {/* Like Button */}
                        <button
                          onClick={() => handleLike(review.id)}
                          className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                            userHasLiked ? "text-brand" : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${userHasLiked ? "fill-current" : ""}`} />
                          <span>
                            {likesCount} {language === "ar" ? "إعجاب" : "Likes"}
                          </span>
                        </button>

                        {/* Expand Comments Button */}
                        <button
                          onClick={() => toggleCommentsDrawer(review.id)}
                          className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                            isDrawerOpen ? "text-white" : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>
                            {commentsCount} {language === "ar" ? "تعليق" : "Comments"}
                          </span>
                        </button>

                        {/* Personal Edit & Delete Review Buttons / Admin Delete */}
                        {(isOwn || isAdminUser) && (
                          <div className="ml-auto flex items-center gap-1.5">
                            {isOwn && (
                              <button
                                onClick={() => startEditReview(review)}
                                className="p-1.5 text-zinc-650 hover:text-brand hover:bg-brand/10 transition-all cursor-pointer"
                                title={language === "ar" ? "تعديل المراجعة" : "Edit Review"}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(review.uid, review.imdbID)}
                              className="p-1.5 text-zinc-650 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                              title={language === "ar" ? "حذف المراجعة" : "Delete Review"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Social Facebook-style Comments Drawer */}
                      <AnimatePresence>
                        {isDrawerOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-black/20 border-t border-zinc-850/60 pt-4 mt-2 space-y-4"
                          >
                            {/* Existing Comments List */}
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {(review.comments || []).map((comm) => (
                                <div key={comm.id} className="flex items-start gap-2.5 p-3 bg-zinc-900/30 border border-zinc-850/40">
                                  {comm.photoURL ? (
                                    <img
                                      src={comm.photoURL}
                                      alt="commentator-avatar"
                                      className="w-7 h-7 rounded-full object-cover border border-zinc-800"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                        const parent = (e.target as HTMLImageElement).parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<div class="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center border border-zinc-800"><span class="text-[9px] font-black text-brand">${getInitials(comm.displayName)}</span></div>`;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center border border-zinc-800">
                                      <span className="text-[9px] font-black text-brand">
                                        {getInitials(comm.displayName)}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-[10px] font-black text-white uppercase tracking-wide">
                                        {comm.displayName || "User"}
                                      </p>
                                      {/* Show edit/delete options if it's the user's comment or admin */}
                                      {user && (comm.uid === user.uid || isAdminUser) && (
                                        <div className="flex items-center gap-2 opacity-65 hover:opacity-100 transition-opacity">
                                          {comm.uid === user.uid && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => startEditComment(comm)}
                                                className="text-[9px] font-black uppercase text-zinc-500 hover:text-brand transition-colors cursor-pointer"
                                              >
                                                {language === "ar" ? "تعديل" : "Edit"}
                                              </button>
                                              <span className="text-[8px] text-zinc-700">•</span>
                                            </>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(review.id, comm.id)}
                                            className="text-[9px] font-black uppercase text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                                          >
                                            {language === "ar" ? "حذف" : "Delete"}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {editingCommentId === comm.id ? (
                                      <div className="mt-2 space-y-2">
                                        <input
                                          type="text"
                                          value={editCommentText}
                                          onChange={(e) => setEditCommentText(e.target.value)}
                                          className="w-full bg-black/60 border border-brand/40 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand font-medium rounded-none"
                                          required
                                          maxLength={300}
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            type="button"
                                            onClick={cancelEditComment}
                                            className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-800"
                                          >
                                            {language === "ar" ? "إلغاء" : "Cancel"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveComment(review.id, comm.id)}
                                            disabled={!editCommentText.trim()}
                                            className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider bg-brand text-white hover:bg-white hover:text-black transition-colors cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500"
                                          >
                                            {language === "ar" ? "حفظ" : "Save"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed font-medium">
                                        {comm.text}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Write a comment form */}
                            {user ? (
                              <form
                                onSubmit={(e) => handleCommentSubmit(e, review.id)}
                                className="flex gap-2"
                              >
                                <input
                                  type="text"
                                  value={newComments[review.id] || ""}
                                  onChange={(e) => handleCommentChange(review.id, e.target.value)}
                                  placeholder={language === "ar" ? "أكتب تعليقاً..." : "Write a comment..."}
                                  className="flex-1 bg-black/40 border border-zinc-800 py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-brand focus:bg-black/60 transition-all font-medium"
                                  required
                                  maxLength={300}
                                />
                                <button
                                  type="submit"
                                  disabled={!(newComments[review.id] || "").trim()}
                                  className="bg-brand text-white p-2.5 hover:bg-white hover:text-black transition-colors cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </form>
                            ) : (
                              <p className="text-[10px] font-black text-zinc-650 uppercase tracking-widest">
                                {t("mustBeLoggedIn")}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
};

export default ReviewsPage;
