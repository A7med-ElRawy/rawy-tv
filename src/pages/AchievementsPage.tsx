import React, { useState, useEffect } from "react";
import { Award, Heart, MessageSquare, Star, Zap, Trophy, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useMovies } from "../context/MovieContext";

interface AchievementItem {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ComponentType<any>;
  color: string;
  goalType: "favorites" | "reviews" | "ratings" | "watchLater";
  goalValue: number;
}

const ACHIEVEMENTS_LIST: AchievementItem[] = [
  {
    id: "first-love",
    nameKey: "firstLoveName",
    descKey: "firstLoveDesc",
    icon: Heart,
    color: "from-rose-500 to-pink-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
    goalType: "favorites",
    goalValue: 1
  },
  {
    id: "critic-apprentice",
    nameKey: "criticApprenticeName",
    descKey: "criticApprenticeDesc",
    icon: MessageSquare,
    color: "from-brand to-red-650 shadow-[0_0_15px_rgba(229,9,20,0.4)]",
    goalType: "reviews",
    goalValue: 1
  },
  {
    id: "score-collector",
    nameKey: "scoreCollectorName",
    descKey: "scoreCollectorDesc",
    icon: Star,
    color: "from-amber-400 to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    goalType: "ratings",
    goalValue: 5
  },
  {
    id: "marathoner",
    nameKey: "marathonerName",
    descKey: "marathonerDesc",
    icon: Zap,
    color: "from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]",
    goalType: "watchLater",
    goalValue: 5
  },
  {
    id: "grand-critic",
    nameKey: "grandCriticName",
    descKey: "grandCriticDesc",
    icon: Award,
    color: "from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(52,211,153,0.4)]",
    goalType: "reviews",
    goalValue: 5
  }
];

const AchievementsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loginWithGoogle } = useAuth();
  const { favorites, watchLater, ratings, reviewsCount } = useMovies();

  const isRTL = language === "ar";
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

  // Determine unlocked achievements
  const unlockedBadges = ACHIEVEMENTS_LIST.filter((badge) => {
    const current = getProgress(badge.goalType);
    return current >= badge.goalValue;
  });

  const unlockedCount = unlockedBadges.length;

  // Calculate XP points for premium leveling dashboard
  // 100 XP per badge + 10 per Favorite + 20 per Review + 5 per Rating + 5 per Watch Later
  const badgeXp = unlockedCount * 100;
  const activityXp =
    favorites.length * 10 +
    reviewsCount * 20 +
    ratingsCount * 5 +
    watchLater.length * 5;
  const totalXp = badgeXp + activityXp;

  // Level ranks based on badges unlocked
  const getRank = (): { title: string; subtitle: string } => {
    if (unlockedCount === 0) {
      return {
        title: isRTL ? "هاوٍ سينمائي" : "Amateur Fan",
        subtitle: isRTL ? "ابدأ في استكشاف السينما وحصد الأوسمة!" : "Start exploring cinema to earn badges!"
      };
    }
    if (unlockedCount === 1) {
      return {
        title: isRTL ? "مبتدئ سينمائي" : "Cinema Apprentice",
        subtitle: isRTL ? "لقد خطوت خطواتك الأولى في عالم النقد!" : "You have taken your first steps in critiques!"
      };
    }
    if (unlockedCount === 2) {
      return {
        title: isRTL ? "عاشق الأفلام" : "Film Enthusiast",
        subtitle: isRTL ? "تعشق تفاصيل المشاهدة وتشارك رأيك!" : "You appreciate detailed views and share insights!"
      };
    }
    if (unlockedCount === 3) {
      return {
        title: isRTL ? "ناقد باحث" : "Scholarly Critic",
        subtitle: isRTL ? "تقييماتك مبنية على خبرة سينمائية عميقة!" : "Your ratings stem from deep cinematic knowledge!"
      };
    }
    if (unlockedCount === 4) {
      return {
        title: isRTL ? "خبير السينما" : "Master Cinephile",
        subtitle: isRTL ? "السينما تجري في عروقك، أوشكت على القمة!" : "Cinema runs in your veins, almost at the peak!"
      };
    }
    return {
      title: isRTL ? "مخرج أسطوري" : "Legendary Director",
      subtitle: isRTL ? "لقد حصلت على كل الأوسمة! أنت الآن أسطورة سينمائية!" : "You unlocked all badges! You are a cinema legend!"
    };
  };

  const rank = getRank();
  const xpProgressPercent = Math.min(100, (totalXp % 500) / 5);

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
            <Trophy className="w-8 h-8 text-zinc-500" />
          </div>
          
          <h2 className="text-xl font-black mb-3 tracking-wider uppercase text-white">
            {t("achievements")}
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
        <h1 className="text-5xl lg:text-7xl font-black mb-2 leading-none flex items-center gap-3">
          {t("achievements")}
        </h1>
        <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">
          {t("badgeGallery")}
        </p>
      </div>

      {/* Ranks & XP Leveling Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 items-stretch">
        
        {/* Left Card: Main Rank Wheel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-5 bg-gradient-to-br from-zinc-900/50 to-zinc-950/20 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-amber-500 to-emerald-500" />
          
          <div className="relative mb-6">
            {/* Outer spinning ring design */}
            <div className="absolute -inset-2 rounded-full border border-dashed border-brand/30 animate-[spin_40s_linear_infinite]" />
            <div className="absolute -inset-4 rounded-full border border-zinc-800/60" />
            
            {/* Glowing Rank Ring */}
            <div className="w-32 h-32 rounded-full bg-zinc-950/80 border-2 border-brand/60 flex items-center justify-center relative shadow-[0_0_30px_rgba(229,9,20,0.2)]">
              <Trophy className="w-14 h-14 text-brand drop-shadow-[0_0_12px_rgba(229,9,20,0.5)]" />
              
              {/* Unlocked badges count pill */}
              <div className="absolute -bottom-2 bg-white text-black text-[9px] font-black uppercase px-3 py-1 rounded-none tracking-widest shadow-xl">
                {unlockedCount} / {ACHIEVEMENTS_LIST.length}
              </div>
            </div>
          </div>

          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            {t("rankTitle")}
          </p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2 leading-none">
            {rank.title}
          </h2>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs font-semibold">
            {rank.subtitle}
          </p>
        </motion.div>

        {/* Right Card: XP Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-7 bg-zinc-900/30 border border-zinc-800 p-8 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {t("xpPoints")}
              </span>
              <span className="text-3xl font-black tracking-tighter text-brand">
                {totalXp} XP
              </span>
            </div>

            {/* Level Rank XP Progress bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-zinc-950 border border-zinc-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-brand to-amber-500 transition-all duration-1000"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                <span>LVL {Math.floor(totalXp / 500) + 1}</span>
                <span>{totalXp % 500} / 500 XP TO NEXT LEVEL</span>
              </div>
            </div>
          </div>

          {/* Individual Statistics Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800/60 text-center">
            {[
              { label: t("favorites"), val: favorites.length },
              { label: t("queue"), val: watchLater.length },
              { label: t("score"), val: ratingsCount },
              { label: t("reviews"), val: reviewsCount }
            ].map((stat) => (
              <div key={stat.label} className="bg-black/20 p-3 border border-zinc-850/60">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-xl font-black tracking-tight text-white leading-none">
                  {stat.val}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Badges Gallery Grid */}
      <h3 className="text-xs font-black uppercase tracking-[3px] text-zinc-500 mb-8 font-display">
        {t("badgeGallery")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ACHIEVEMENTS_LIST.map((badge) => {
          const progress = getProgress(badge.goalType);
          const isUnlocked = progress >= badge.goalValue;
          const progressPercent = Math.min(100, (progress / badge.goalValue) * 100);
          const IconComponent = badge.icon;

          // Dynamic progress bar color: brand red when completed/unlocked, green when in-progress ("one from five is move")
          const progressBarColor = isUnlocked ? "bg-brand" : "bg-accent-green";

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-6 border transition-all relative flex flex-col justify-between ${
                isUnlocked
                  ? "bg-zinc-900/30 border-zinc-800"
                  : "bg-zinc-950/10 border-zinc-900 opacity-40 grayscale"
              }`}
            >
              {/* Unlocked glow badge indicator */}
              {isUnlocked && (
                <div className="absolute top-0 right-0 p-1.5 bg-brand text-black text-[7px] font-black uppercase tracking-wider">
                  UNLOCKED
                </div>
              )}

              <div className="flex gap-4 items-start mb-6">
                {/* Badge Icon container */}
                <div
                  className={`w-14 h-14 shrink-0 rounded-full bg-gradient-to-tr flex items-center justify-center border border-white/5 relative ${
                    isUnlocked ? badge.color : "from-zinc-900 to-zinc-950 text-zinc-650"
                  }`}
                >
                  <IconComponent className={`w-6 h-6 ${isUnlocked ? "text-white" : "text-zinc-600"}`} />
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1">
                    {t(badge.nameKey)}
                  </h4>
                  <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">
                    {t(badge.descKey)}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Goal Status */}
              <div className="space-y-1 mt-auto">
                <div className="h-2.5 w-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${progressBarColor} transition-all duration-500`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                  <span>PROGRESS</span>
                  <span>
                    {progress} / {badge.goalValue}
                  </span>
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

export default AchievementsPage;
