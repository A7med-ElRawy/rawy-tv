import React from "react";
import { Search, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <>
      <nav className="flex items-center justify-between p-6 bg-zinc-950 border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-sm flex items-center justify-center">
            <span className="text-black font-black text-xl">M</span>
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">
            MOVIEHUB
          </span>
        </div>

        {/* Auth & Profile */}
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">
                  Welcome back
                </p>
                <p className="text-xs font-bold text-white">
                  {user.displayName}
                </p>
              </div>
              <img
                src={user.photoURL || ""}
                alt="profile"
                className="w-10 h-10 rounded-full border-2 border-brand/50 group-hover:border-brand transition-all"
              />
              <button
                onClick={logout}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 bg-brand text-black px-6 py-2.5 font-black uppercase text-[10px] tracking-[2px] hover:bg-white transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" /> Login with Google
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
