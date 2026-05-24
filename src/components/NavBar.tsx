import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, LogIn, LogOut, User, Globe, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  getFriendRequests,
  getSharedMovies,
  getFriendsReviews,
  getUserProfile,
} from "../utils/firebaseUtils";

function Navbar() {
  const { user, userProfile, loginWithGoogle, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (displayName: string | null | undefined): string => {
    if (!displayName) return "U";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Compile and fetch chronological notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch friend requests
      const { incoming } = await getFriendRequests(user.uid);
      
      // 2. Fetch shared movies
      const sharedList = await getSharedMovies(user.uid);

      // 3. Fetch friend reviews
      const freshProfile = await getUserProfile(user.uid);
      const friendUids = freshProfile?.friends || [];
      const reviews = await getFriendsReviews(friendUids);

      const list: any[] = [];

      // A. Requests
      incoming.forEach((req) => {
        list.push({
          id: `req_${req.id}`,
          type: "friend_request",
          title: language === "ar" ? "طلب صداقة جديد" : "New Friend Request",
          message: `${req.senderName} ${t("newFriendRequestNotif")}`,
          senderName: req.senderName,
          senderPhoto: req.senderPhoto,
          timestamp: new Date(req.createdAt).getTime(),
          link: "/friends",
        });
      });

      // B. Shared Movies
      sharedList.forEach((share) => {
        list.push({
          id: `share_${share.id}`,
          type: "movie_share",
          title: language === "ar" ? "توصية صديق" : "Friend Recommendation",
          message: `${share.senderName} ${t("newMovieShareNotif")} "${share.movieTitle}"`,
          senderName: share.senderName,
          senderPhoto: share.senderPhoto,
          timestamp: new Date(share.createdAt).getTime(),
          link: `/friends`, // Navigate to the "Shared Movies" tab on the Friends page
        });
      });

      // C. Friend reviews in last 7 days
      reviews.forEach((rev) => {
        const reviewTime = rev.publishedAt?.seconds ? rev.publishedAt.seconds * 1000 : 0;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (reviewTime > sevenDaysAgo) {
          list.push({
            id: `rev_${rev.id}`,
            type: "friend_review",
            title: language === "ar" ? "مراجعة صديق جديدة" : "New Friend Review",
            message: `${rev.displayName} ${t("newFriendReviewNotif")} "${rev.movieTitle}" (${rev.rating}/5)`,
            senderName: rev.displayName,
            senderPhoto: rev.photoURL,
            timestamp: reviewTime,
            link: `/movie/${rev.imdbID}?type=${rev.movieType}`,
          });
        }
      });

      const sorted = list.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(sorted);

      // Unread count check
      const lastRead = localStorage.getItem(`notif_read_${user.uid}`);
      if (lastRead) {
        const lastReadTime = parseInt(lastRead);
        const unread = sorted.filter((n) => n.timestamp > lastReadTime).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(sorted.length);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }, [user, language, t]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!user) return;
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      // Mark as read
      localStorage.setItem(`notif_read_${user.uid}`, Date.now().toString());
      setUnreadCount(0);
    }
  };

  const timeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (language === "ar") {
      if (mins < 1) return "الآن";
      if (mins < 60) return `منذ ${mins} دقيقة`;
      if (hours === 1) return "منذ ساعة";
      if (hours === 2) return "منذ ساعتين";
      if (hours < 24) return `منذ ${hours} ساعة`;
      if (days === 1) return "منذ يوم";
      if (days === 2) return "منذ يومين";
      return `منذ ${days} يوم`;
    } else {
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  };

  return (
    <div className="flex items-center gap-4 shrink-0">
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 mr-4">
        <Link to="/" className="text-xs font-black text-zinc-400 hover:text-white transition-colors uppercase tracking-widest">
          {t("home")}
        </Link>
        <Link to="/library" className="text-xs font-black text-zinc-400 hover:text-white transition-colors uppercase tracking-widest">
          {t("library")}
        </Link>
      </nav>

      {/* Switch language */}
      <button
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        title="Switch Language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-widest">{language === "en" ? "AR" : "EN"}</span>
      </button>

      {/* Notifications bell button */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer relative"
            title={language === "ar" ? "الإشعارات" : "Notifications"}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 shadow-2xl z-[999] overflow-hidden ${
                  language === "ar" ? "text-right" : "text-left"
                }`}
              >
                <div className="p-3 border-b border-zinc-900 bg-zinc-900/50 flex justify-between items-center">
                  <p className="text-[10px] font-black text-white uppercase tracking-[2px]">
                    {t("notifications")}
                  </p>
                  {unreadCount > 0 && (
                    <span className="text-[8px] bg-brand text-black px-1.5 py-0.5 font-black uppercase">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-650 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      {t("noNotifications")}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        to={notif.link}
                        onClick={() => setShowDropdown(false)}
                        className="w-full flex items-start gap-3 p-3.5 hover:bg-zinc-900/50 transition-colors border-b border-zinc-900/50 last:border-0"
                      >
                        {/* Sender Avatar */}
                        <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                          {notif.senderPhoto ? (
                            <img
                              src={notif.senderPhoto}
                              alt={notif.senderName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[9px] font-black text-brand">
                              {getInitials(notif.senderName)}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black text-brand uppercase tracking-[1.5px] mb-0.5">
                            {notif.title}
                          </p>
                          <p className="text-[10px] text-zinc-300 font-medium leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter mt-1">
                            {timeAgo(notif.timestamp)}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Auth & Profile */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 group cursor-pointer">
            <Link to="/settings" className="flex items-center gap-3">
              <div className={`text-${language === 'ar' ? 'left' : 'right'} hidden md:block`}>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">
                  {t("welcomeBack")}
                </p>
                <p className="text-xs font-bold text-white">
                  {userProfile?.displayName || user.displayName || "User"}
                </p>
              </div>

              {/* Profile Avatar with fallback */}
              {userProfile?.photoURL || user.photoURL ? (
                <img
                  src={userProfile?.photoURL || user.photoURL || ""}
                  alt="profile"
                  className="w-8 h-8 rounded-full border-2 border-brand/50 group-hover:border-brand transition-all object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="w-8 h-8 rounded-full border-2 border-brand/50 group-hover:border-brand transition-all bg-brand/20 flex items-center justify-center"><span class="text-xs font-black text-brand">' +
                        getInitials(userProfile?.displayName || user.displayName) +
                        "</span></div>";
                    }
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-brand/50 group-hover:border-brand transition-all bg-brand/20 flex items-center justify-center">
                  <span className="text-xs font-black text-brand">
                    {getInitials(userProfile?.displayName || user.displayName)}
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 bg-brand text-black px-4 py-2 font-black uppercase text-[10px] tracking-[2px] hover:bg-white transition-all active:scale-95 shrink-0"
          >
            <LogIn className="w-3 h-3" /> {t("loginWithGoogle")}
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar;
