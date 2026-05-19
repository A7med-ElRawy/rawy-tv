import React from "react";
import { Search, LogIn, LogOut, User, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";

function Navbar() {
  const { user, userProfile, loginWithGoogle, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

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

      <button
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        title="Switch Language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-widest">{language === "en" ? "AR" : "EN"}</span>
      </button>

      {/* Auth & Profile */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 group cursor-pointer">
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
                  // Fallback if image fails to load
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
              // Fallback avatar with initials
              <div className="w-8 h-8 rounded-full border-2 border-brand/50 group-hover:border-brand transition-all bg-brand/20 flex items-center justify-center">
                <span className="text-xs font-black text-brand">
                  {getInitials(userProfile?.displayName || user.displayName)}
                </span>
              </div>
            )}

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
