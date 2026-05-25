import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Mail,
  LogIn,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageLoader from "../components/PageLoader";
import {
  UserProfile,
  FriendRequest,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendRequests,
  getAllUsers,
  getFriendsProfiles,
  getUserProfile,
  getSharedMovies,
  SharedMovie,
  seedMockUsers,
} from "../utils/firebaseUtils";

const FriendsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"myFriends" | "findUsers" | "requests" | "sharedMovies">("myFriends");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Social states loaded from Firestore
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [sharedMovies, setSharedMovies] = useState<SharedMovie[]>([]);

  // Status banner state
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isRTL = language === "ar";

  // Fetch all social data
  const fetchSocialData = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch fresh user profile
      const freshProfile = await getUserProfile(user.uid);
      setCurrentUserProfile(freshProfile);

      // 2. Fetch requests
      const reqs = await getFriendRequests(user.uid);
      setIncomingRequests(reqs.incoming);
      setOutgoingRequests(reqs.outgoing);

      // 3. Fetch all other users
      const usersList = await getAllUsers();
      // Filter out the current user
      const filteredUsersList = usersList.filter((u) => u.uid !== user.uid);
      setAllUsers(filteredUsersList);

      // 4. Fetch friends profiles
      const friendsList = freshProfile?.friends || [];
      const friendsData = await getFriendsProfiles(friendsList);
      setFriends(friendsData);

      // 5. Fetch shared movies
      const sharedList = await getSharedMovies(user.uid);
      setSharedMovies(sharedList);
    } catch (error) {
      console.error("Error fetching social data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchSocialData();
    }
  }, [user, fetchSocialData]);

  // Handle auto-clear alert banner
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const triggerAction = async (
    actionId: string,
    actionFn: () => Promise<void>,
    successMsg: string
  ) => {
    setActionLoadingId(actionId);
    setStatus(null);
    try {
      await actionFn();
      setStatus({ type: "success", message: successMsg });
      await fetchSocialData();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: t("updateError") });
    } finally {
      setActionLoadingId(null);
    }
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

  // Helper to determine friendship request state for a user
  const getRequestState = (otherUid: string) => {
    const sent = outgoingRequests.find((r) => r.receiverUid === otherUid);
    if (sent) return { status: "sent" as const, request: sent };

    const received = incomingRequests.find((r) => r.senderUid === otherUid);
    if (received) return { status: "received" as const, request: received };

    const isFriend = currentUserProfile?.friends?.includes(otherUid) || false;
    if (isFriend) return { status: "friends" as const };

    return { status: "none" as const };
  };

  // Filtered list of users for Explore tab based on search query
  const filteredExploreUsers = allUsers.filter((u) => {
    const name = (u.displayName || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

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
            <Users className="w-8 h-8 text-zinc-500" />
          </div>
          
          <h2 className="text-xl font-black mb-3 tracking-wider uppercase text-white">
            {t("friends")}
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
      <div className="mb-12 border-b border-zinc-900 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-5xl lg:text-7xl font-black mb-2 leading-none uppercase">
            {t("friends")}
          </h1>
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">
            {t("friendsList")} • {friends.length} {t("friends")}
          </p>
        </div>

        {/* Custom Tab Triggers */}
        <div className="flex bg-zinc-900/60 border border-zinc-800 p-1 rounded-none self-start">
          {[
            { id: "myFriends", label: t("myFriends"), count: friends.length },
            { id: "findUsers", label: t("findUsers"), count: null },
            { id: "requests", label: t("friendRequests"), count: incomingRequests.length + outgoingRequests.length },
            { id: "sharedMovies", label: language === "ar" ? "توصيات الأصدقاء" : "Shared Movies", count: sharedMovies.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all relative ${
                activeTab === tab.id
                  ? "bg-brand text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 font-black rounded-none ${
                      activeTab === tab.id ? "bg-black text-brand" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action alerts */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 mb-8 flex items-start gap-3 border max-w-5xl ${
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

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[30vh]">
          <PageLoader />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4">
            {t("scanning")}
          </p>
        </div>
      ) : (
        <div className="max-w-5xl">
          {/* TAB: MY FRIENDS */}
          {activeTab === "myFriends" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {friends.length === 0 ? (
                <div className="bg-zinc-900/20 border border-zinc-800/60 p-12 text-center max-w-2xl mx-auto backdrop-blur-xl">
                  <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    {t("noFriendsYet")}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto mb-6">
                    {t("noFriendsDesc")}
                  </p>
                  <button
                    onClick={() => setActiveTab("findUsers")}
                    className="bg-brand hover:bg-white text-black font-black uppercase text-[10px] tracking-[2px] px-6 py-3 transition-colors cursor-pointer"
                  >
                    {t("findUsers")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.map((friend) => (
                    <motion.div
                      key={friend.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/30 border border-zinc-800/40 p-6 flex flex-col items-center text-center backdrop-blur-xl relative group"
                    >
                      {/* Glow frame */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-red-500 opacity-30 group-hover:opacity-100 transition-opacity" />

                      {/* Avatar container */}
                      <div className="relative mb-4">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-brand to-red-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                          {friend.photoURL ? (
                            <img
                              src={friend.photoURL}
                              alt={friend.displayName || "friend"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-2xl font-black text-brand">
                              {getInitials(friend.displayName || "User")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info details */}
                      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 truncate max-w-full">
                        {friend.displayName || "User"}
                      </h3>

                      {/* Metadata level & stars */}
                      <div className="flex items-center gap-4 bg-black/40 border border-zinc-800/60 px-4 py-1.5 mb-6 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t("levelText")} {friend.level || 1}</span>
                        </span>
                        <div className="w-px h-3 bg-zinc-800" />
                        <span>{friend.favorites?.length || 0} ★</span>
                      </div>

                      {/* Delete friendship trigger */}
                      <button
                        disabled={actionLoadingId === friend.uid}
                        onClick={() =>
                          triggerAction(
                            friend.uid,
                            () => removeFriend(user.uid, friend.uid),
                            t("friendRemovedSuccess")
                          )
                        }
                        className="w-full py-2.5 bg-zinc-900 border border-zinc-800/60 hover:border-red-800/40 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        {actionLoadingId === friend.uid ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                        <span>{t("removeFriendText")}</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: FIND USERS */}
          {activeTab === "findUsers" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Search Box */}
              <div className="relative group w-full max-w-xl">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-brand transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchUsersPlaceholder")}
                  className="w-full bg-zinc-900/30 border border-zinc-800 py-3.5 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-brand focus:bg-black/40 transition-all placeholder:text-zinc-650 uppercase tracking-widest"
                />
              </div>

              {filteredExploreUsers.length === 0 ? (
                <div className="bg-zinc-900/10 border border-zinc-900 p-12 text-center">
                  <ShieldAlert className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                    {t("userNotFound")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExploreUsers.map((item) => {
                    const reqState = getRequestState(item.uid);
                    const actionId = `find_${item.uid}`;
                    const isLoading = actionLoadingId === actionId;

                    return (
                      <motion.div
                        key={item.uid}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900/30 border border-zinc-800/40 p-6 flex flex-col items-center text-center backdrop-blur-xl relative"
                      >
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center mb-4">
                          {item.photoURL ? (
                            <img
                              src={item.photoURL}
                              alt={item.displayName || "user"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xl font-black text-brand">
                              {getInitials(item.displayName || "User")}
                            </span>
                          )}
                        </div>

                        {/* Text */}
                        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 truncate max-w-full">
                          {item.displayName || "User"}
                        </h3>

                        <div className="bg-black/30 border border-zinc-900 px-3 py-1 mb-6 text-[8px] font-black uppercase text-zinc-400">
                          {t("levelText")} {item.level || 1}
                        </div>

                        {/* Interactive dynamic actions */}
                        <div className="w-full mt-auto">
                          {reqState.status === "friends" ? (
                            <div className="w-full py-2.5 bg-brand/10 border border-brand/40 text-[9px] font-black uppercase tracking-widest text-brand flex items-center justify-center gap-2">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{t("friendAlready")}</span>
                            </div>
                          ) : reqState.status === "sent" ? (
                            <button
                              disabled={isLoading}
                              onClick={() =>
                                triggerAction(
                                  actionId,
                                  () => cancelFriendRequest(user.uid, item.uid),
                                  t("friendRequestCancelledSuccess")
                                )
                              }
                              className="w-full py-2.5 bg-zinc-800 border border-zinc-700/60 hover:border-red-800/40 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                              <span>{t("cancelRequest")}</span>
                            </button>
                          ) : reqState.status === "received" ? (
                            <button
                              disabled={isLoading}
                              onClick={() =>
                                triggerAction(
                                  actionId,
                                  () => acceptFriendRequest(reqState.request!),
                                  t("friendRequestAcceptedSuccess")
                                )
                              }
                              className="w-full py-2.5 bg-brand text-black hover:bg-white text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              <span>{t("acceptRequest")}</span>
                            </button>
                          ) : (
                            <button
                              disabled={isLoading}
                              onClick={() =>
                                triggerAction(
                                  actionId,
                                  () =>
                                    sendFriendRequest(
                                      currentUserProfile || (item as any),
                                      item.uid
                                    ),
                                  t("friendRequestSentSuccess")
                                )
                              }
                              className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-brand/40 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              <span>{t("sendRequest")}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: FRIEND REQUESTS */}
          {activeTab === "requests" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* SECTION: INCOMING */}
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand" />
                  <span>{t("incomingRequests")}</span>
                  <span className="bg-brand text-black text-[9px] font-black px-1.5 py-0.5">
                    {incomingRequests.length}
                  </span>
                </h2>

                {incomingRequests.length === 0 ? (
                  <div className="bg-zinc-900/10 border border-zinc-900/60 p-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    {t("noFriendRequests")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incomingRequests.map((req) => {
                      const actionAcceptId = `accept_${req.id}`;
                      const actionDeclineId = `decline_${req.id}`;
                      const isAccepting = actionLoadingId === actionAcceptId;
                      const isDeclining = actionLoadingId === actionDeclineId;

                      return (
                        <motion.div
                          key={req.id}
                          layout
                          className="bg-zinc-900/20 border border-zinc-800 p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                              {req.senderPhoto ? (
                                <img
                                  src={req.senderPhoto}
                                  alt={req.senderName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-sm font-black text-brand">
                                  {getInitials(req.senderName)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                                {req.senderName}
                              </h4>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase">
                                {t("incomingRequests")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={isAccepting || isDeclining}
                              onClick={() =>
                                triggerAction(
                                  actionAcceptId,
                                  () => acceptFriendRequest(req),
                                  t("friendRequestAcceptedSuccess")
                                )
                              }
                              className="px-4 py-2 bg-brand hover:bg-white text-black text-[9px] font-black uppercase tracking-widest cursor-pointer disabled:opacity-40"
                            >
                              {isAccepting ? (
                                <Loader2 className="w-3 animate-spin" />
                              ) : (
                                t("acceptRequest")
                              )}
                            </button>
                            <button
                              disabled={isAccepting || isDeclining}
                              onClick={() =>
                                triggerAction(
                                  actionDeclineId,
                                  () => declineFriendRequest(req.id),
                                  t("friendRequestDeclinedSuccess")
                                )
                              }
                              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 text-[9px] font-black uppercase tracking-widest cursor-pointer disabled:opacity-40"
                            >
                              {isDeclining ? (
                                <Loader2 className="w-3 animate-spin" />
                              ) : (
                                t("declineRequest")
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: OUTGOING / SENT */}
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-zinc-500" />
                  <span>{t("outgoingRequests")}</span>
                  <span className="bg-zinc-850 text-zinc-400 text-[9px] font-black px-1.5 py-0.5">
                    {outgoingRequests.length}
                  </span>
                </h2>

                {outgoingRequests.length === 0 ? (
                  <div className="bg-zinc-900/10 border border-zinc-900/60 p-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    {t("noFriendRequests")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outgoingRequests.map((req) => {
                      const actionCancelId = `cancel_${req.id}`;
                      const isCancelling = actionLoadingId === actionCancelId;

                      return (
                        <motion.div
                          key={req.id}
                          layout
                          className="bg-zinc-900/20 border border-zinc-800 p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                              {req.receiverPhoto ? (
                                <img
                                  src={req.receiverPhoto}
                                  alt={req.receiverName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-sm font-black text-brand">
                                  {getInitials(req.receiverName)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                                {req.receiverName}
                              </h4>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase">
                                {t("requestSent")}
                              </p>
                            </div>
                          </div>

                          <button
                            disabled={isCancelling}
                            onClick={() =>
                              triggerAction(
                                actionCancelId,
                                () => cancelFriendRequest(user.uid, req.receiverUid),
                                t("friendRequestCancelledSuccess")
                              )
                            }
                            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-red-800/40 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-400 cursor-pointer disabled:opacity-40"
                          >
                            {isCancelling ? (
                              <Loader2 className="w-3 animate-spin" />
                            ) : (
                              t("cancelRequest")
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: SHARED MOVIES */}
          {activeTab === "sharedMovies" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {sharedMovies.length === 0 ? (
                <div className="bg-zinc-900/20 border border-zinc-800/60 p-12 text-center max-w-2xl mx-auto backdrop-blur-xl">
                  <Mail className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    {language === "ar" ? "لا توجد توصيات بعد" : "No recommendations yet"}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                    {language === "ar"
                      ? "عندما يشارك أصدقاؤك أفلاماً معك في المنصة، ستظهر هنا مع تعليقاتهم!"
                      : "When friends share movies with you on this platform, they will appear here with their messages!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sharedMovies.map((shared) => (
                    <motion.div
                      key={shared.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/30 border border-zinc-800/40 p-6 flex flex-col md:flex-row gap-6 items-start backdrop-blur-xl relative group"
                    >
                      {/* Glow frame */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-red-500 opacity-30 group-hover:opacity-100 transition-opacity" />

                      {/* Poster */}
                      <div className="w-24 aspect-[2/3] bg-zinc-900 border border-zinc-800 shrink-0 overflow-hidden relative">
                        <img
                          src={shared.moviePoster}
                          alt={shared.movieTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Details Content */}
                      <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
                        <div>
                          <span className="text-[8px] font-black text-brand uppercase tracking-widest bg-brand/10 border border-brand/20 px-2 py-0.5 inline-block mb-2">
                            {shared.movieType}
                          </span>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 truncate">
                            {shared.movieTitle}
                          </h3>

                          {/* Sender details */}
                          <div className="flex items-center gap-2 mb-4 bg-black/30 border border-zinc-900/60 p-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                              {shared.senderPhoto ? (
                                <img
                                  src={shared.senderPhoto}
                                  alt={shared.senderName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[10px] font-black text-brand">
                                  {getInitials(shared.senderName)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight truncate">
                                {language === "ar" ? "أوصى به " : "Recommended by "} {shared.senderName}
                              </p>
                            </div>
                          </div>

                          {/* Message bubble */}
                          {shared.message && (
                            <div className="bg-zinc-950/60 border border-zinc-850/80 p-3 mb-4 rounded-none">
                              <p className="text-[11px] text-zinc-300 italic font-medium leading-relaxed">
                                "{shared.message}"
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => navigate(`/movie/${shared.imdbID}?type=${shared.movieType}`)}
                          className="w-full mt-2 py-2 bg-brand text-black font-black uppercase text-[9px] tracking-[2px] hover:bg-white hover:text-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>{language === "ar" ? "شاهد التفاصيل" : "View Details"}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
