import React, { useState, useEffect, useRef } from "react";
import { User, Image, Loader2, CheckCircle2, AlertCircle, Camera, LogIn, Upload, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const AVATAR_PRESETS = [
  {
    id: "preset-1",
    name: "Modern Classic",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "preset-2",
    name: "Neon Glow",
    url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "preset-3",
    name: "Pop Portrait",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "preset-4",
    name: "Retro Minimal",
    url: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "preset-5",
    name: "3D Render",
    url: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "preset-6",
    name: "Studio Chic",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80"
  }
];

const SettingsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, userProfile, updateProfileDetails, loginWithGoogle } = useAuth();
  
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [reviewPrivacy, setReviewPrivacy] = useState<"public" | "friends" | "private">("public");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setPhotoURL(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Sync state with loaded user profile
  useEffect(() => {
    if (user) {
      setDisplayName(userProfile?.displayName || user.displayName || "");
      setPhotoURL(userProfile?.photoURL || user.photoURL || "");
      setReviewPrivacy(userProfile?.reviewPrivacy || "public");
    }
  }, [user, userProfile]);

  const handlePresetSelect = (url: string) => {
    setPhotoURL(url);
    setStatus(null);
  };

  const getInitials = (nameStr: string): string => {
    if (!nameStr) return "U";
    return nameStr
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setStatus(null);

    try {
      await updateProfileDetails(displayName.trim(), photoURL.trim(), reviewPrivacy);
      setStatus({
        type: "success",
        message: t("updateSuccess"),
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message === "NAME_TAKEN") {
        setStatus({
          type: "error",
          message: t("nameTaken"),
        });
      } else {
        setStatus({
          type: "error",
          message: t("updateError"),
        });
      }
    } finally {
      setIsSaving(false);
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
          {/* Subtle brand colored indicator line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand" />
          
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-zinc-500" />
          </div>
          
          <h2 className="text-xl font-black mb-3 tracking-wider uppercase text-white">
            {t("settings")}
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
          {t("settings")}
        </h1>
        <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">
          {t("profileSettings")}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-5xl">
        
        {/* Left Column - Form fields */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 bg-zinc-900/30 border border-zinc-800/40 p-6 lg:p-8 backdrop-blur-xl"
        >
          {/* Status Alert Banners */}
          <AnimatePresence mode="wait">
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 mb-6 flex items-start gap-3 border ${
                  status.type === "success"
                    ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-400"
                    : "bg-red-950/20 border-red-800/50 text-red-400"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span className="text-xs font-bold leading-relaxed">{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <User className="w-3.5 h-3.5" />
                {t("profileName")}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={40}
                placeholder="eg. John Doe"
                className="w-full bg-black/40 border border-zinc-800 py-3.5 px-4 text-xs font-bold text-white focus:outline-none focus:border-brand focus:bg-black/60 transition-all uppercase tracking-wider"
              />
            </div>

            {/* Photo URL Field & Local Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Image className="w-3.5 h-3.5" />
                {t("profilePhoto")}
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => {
                      setPhotoURL(e.target.value);
                      setStatus(null);
                    }}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-black/40 border border-zinc-800 py-3.5 px-4 text-xs font-medium text-white focus:outline-none focus:border-brand focus:bg-black/60 transition-all tracking-wide"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-zinc-900 border border-zinc-800 hover:border-brand/50 px-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("uploadPhoto")}</span>
                </button>
              </div>
            </div>

            {/* Review Privacy Options Card */}
            <div className="space-y-4 pt-4 border-t border-zinc-800/60">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <MessageSquare className="w-3.5 h-3.5" />
                {t("privacySettings")}
              </label>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: "public", label: t("showToAll") },
                  { value: "friends", label: t("showToFriends") },
                  { value: "private", label: t("dontShow") }
                ].map((opt) => {
                  const isSelected = reviewPrivacy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReviewPrivacy(opt.value as any)}
                      className={`w-full p-4 border text-left cursor-pointer transition-all flex items-center justify-between rounded-none ${
                        isSelected
                          ? "bg-brand/10 border-brand/60 text-white"
                          : "bg-black/30 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${isSelected ? "text-white" : "text-zinc-300"}`}>
                          {opt.label}
                        </p>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-brand bg-brand" : "border-zinc-700 bg-transparent"}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Changes Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="relative w-full py-4 bg-brand text-black font-black uppercase text-[10px] tracking-[2px] hover:bg-white hover:shadow-[0_0_20px_rgba(229,9,20,0.4)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none transition-all active:scale-98 cursor-pointer overflow-hidden flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                  <span>{t("updatingProfile")}</span>
                </>
              ) : (
                <span>{t("saveChanges")}</span>
              )}
            </button>
          </form>
        </motion.div>

        {/* Right Column - Avatar Preview & Preset Selection */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-8"
        >
          {/* Avatar Preview Box */}
          <div className="bg-zinc-900/30 border border-zinc-800/40 p-8 flex flex-col items-center text-center backdrop-blur-xl relative">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px] mb-6 self-start">
              {t("avatarPreview")}
            </h3>

            {/* Avatar Container with glowing border */}
            <div className="relative group mb-4">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-brand to-red-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              
              <div className="relative w-28 h-28 rounded-full bg-zinc-900 border-2 border-brand/50 overflow-hidden flex items-center justify-center">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="avatar-preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // fallback to initials on load failure
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallbackMarkup = `<div class="w-full h-full bg-zinc-900/80 flex items-center justify-center"><span class="text-3xl font-black text-brand">${getInitials(displayName)}</span></div>`;
                        parent.innerHTML = fallbackMarkup;
                      }
                    }}
                  />
                ) : (
                  <span className="text-3xl font-black text-brand">
                    {getInitials(displayName)}
                  </span>
                )}

                {/* Subtle camera icon overlay */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-brand" />
                </div>
              </div>
            </div>

            <p className="text-xs font-black uppercase text-white tracking-widest mb-1 truncate max-w-full">
              {displayName || "User"}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 truncate max-w-full">
              {user.email}
            </p>
          </div>

          {/* Sleek Preset Avatars Selection */}
          <div className="bg-zinc-900/30 border border-zinc-800/40 p-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">
              {t("choosePreset")}
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = photoURL === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.url)}
                    className="relative aspect-square border-2 transition-all overflow-hidden cursor-pointer group rounded-none"
                    style={{
                      borderColor: isSelected ? "#E50914" : "rgba(63, 63, 70, 0.4)",
                    }}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Active highlight overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand/10 flex items-center justify-center">
                        <div className="bg-brand text-black p-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </motion.div>

      </div>
    </div>
  );
};

export default SettingsPage;
