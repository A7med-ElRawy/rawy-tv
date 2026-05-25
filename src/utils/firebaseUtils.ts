import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  reviewPrivacy?: "public" | "friends" | "private";
  lastLogin: any;
  favorites: MovieData[];
  watchLater: MovieData[];
  recentlyViewed?: MovieData[];
  lastWatched: MovieData | null;
  ratings: Record<string, number>;
  friends?: string[];
  level?: number;
  createdAt: any;
}

export interface MovieData {
  imdbID: string;
  Title: string;
  Poster: string;
  Year: string;
  Type: string;
  addedAt?: any;
}

/**
 * Initialize user profile in Firestore
 */
export const initializeUserProfile = async (
  uid: string,
  userData: {
    email: string;
    displayName: string | null;
    photoURL: string | null;
  },
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    let finalDisplayName = userData.displayName;
    if (finalDisplayName) {
      const taken = await isDisplayNameTaken(uid, finalDisplayName);
      if (taken) {
        let suffix = 1;
        while (await isDisplayNameTaken(uid, `${finalDisplayName} ${suffix}`)) {
          suffix++;
        }
        finalDisplayName = `${finalDisplayName} ${suffix}`;
      }
    }

    await setDoc(userRef, {
      uid,
      email: userData.email,
      displayName: finalDisplayName,
      photoURL: userData.photoURL,
      reviewPrivacy: "public",
      lastLogin: serverTimestamp(),
      favorites: [],
      watchLater: [],
      recentlyViewed: [],
      lastWatched: null,
      ratings: {},
      friends: [],
      level: 1,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update existing user login time and set missing info, preserving custom details
    const existingData = userSnap.data();
    const updateData: any = {
      lastLogin: serverTimestamp(),
    };
    if (!existingData?.displayName) {
      updateData.displayName = userData.displayName;
    }
    if (!existingData?.photoURL) {
      updateData.photoURL = userData.photoURL;
    }
    await updateDoc(userRef, updateData);
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as UserProfile;
};

/**
 * Toggle favorite movie (add/remove)
 */
export const toggleFavorite = async (
  uid: string,
  movieData: MovieData,
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  const favorites = userSnap.data().favorites || [];
  const isFavorite = favorites.some(
    (fav: MovieData) => fav.imdbID === movieData.imdbID,
  );

  if (isFavorite) {
    // Remove from favorites
    const newFavorites = favorites.filter((fav: MovieData) => fav.imdbID !== movieData.imdbID);
    await updateDoc(userRef, {
      favorites: newFavorites,
    });
  } else {
    // Add to favorites
    const newFavorites = [...favorites, { ...movieData, addedAt: new Date().toISOString() }];
    await updateDoc(userRef, {
      favorites: newFavorites,
    });
  }
};

/**
 * Toggle watch later movie (add/remove)
 */
export const toggleWatchLater = async (
  uid: string,
  movieData: MovieData,
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  const watchLater = userSnap.data().watchLater || [];
  const isInWatchLater = watchLater.some(
    (movie: MovieData) => movie.imdbID === movieData.imdbID,
  );

  if (isInWatchLater) {
    // Remove from watch later
    const newWatchLater = watchLater.filter((movie: MovieData) => movie.imdbID !== movieData.imdbID);
    await updateDoc(userRef, {
      watchLater: newWatchLater,
    });
  } else {
    // Add to watch later
    const newWatchLater = [...watchLater, { ...movieData, addedAt: new Date().toISOString() }];
    await updateDoc(userRef, {
      watchLater: newWatchLater,
    });
  }
};

/**
 * Update last watched movie
 */
export const updateLastWatched = async (
  uid: string,
  movieData: MovieData,
): Promise<void> => {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    lastWatched: {
      ...movieData,
      watchedAt: serverTimestamp(),
    },
  });
};

/**
 * Set movie rating
 */
export const setMovieRating = async (
  uid: string,
  movieId: string,
  rating: number,
): Promise<void> => {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    [`ratings.${movieId}`]: rating,
  });
};

/**
 * Get all user favorites
 */
export const getUserFavorites = async (uid: string): Promise<MovieData[]> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  return userSnap.data().favorites || [];
};

/**
 * Get all user watch later movies
 */
export const getUserWatchLater = async (uid: string): Promise<MovieData[]> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  return userSnap.data().watchLater || [];
};

/**
 * Get user ratings
 */
export const getUserRatings = async (
  uid: string,
): Promise<Record<string, number>> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return {};
  }

  return userSnap.data().ratings || {};
};

/**
 * Check if movie is in user's favorites
 */
export const isMovieFavorite = async (
  uid: string,
  movieId: string,
): Promise<boolean> => {
  const favorites = await getUserFavorites(uid);
  return favorites.some((fav) => fav.imdbID === movieId);
};

/**
 * Check if movie is in user's watch later
 */
export const isMovieInWatchLater = async (
  uid: string,
  movieId: string,
): Promise<boolean> => {
  const watchLater = await getUserWatchLater(uid);
  return watchLater.some((movie) => movie.imdbID === movieId);
};

/**
 * Update user profile details in Firestore
 */
/**
 * Check if a display name is already taken by another user
 */
export const isDisplayNameTaken = async (
  uid: string,
  displayName: string
): Promise<boolean> => {
  const trimmedName = displayName.trim().toLowerCase();
  if (!trimmedName) return false;

  const usersCol = collection(db, "users");
  const snap = await getDocs(usersCol);

  let taken = false;
  snap.forEach((docSnap) => {
    if (docSnap.id !== uid) {
      const existingName = docSnap.data().displayName;
      if (existingName && existingName.trim().toLowerCase() === trimmedName) {
        taken = true;
      }
    }
  });

  return taken;
};

export const updateUserProfile = async (
  uid: string,
  displayName: string | null,
  photoURL: string | null,
  reviewPrivacy?: "public" | "friends" | "private",
): Promise<void> => {
  // Check if display name is already taken by another user
  if (displayName) {
    const taken = await isDisplayNameTaken(uid, displayName);
    if (taken) {
      throw new Error("NAME_TAKEN");
    }
  }

  const userRef = doc(db, "users", uid);
  const updateData: any = {
    displayName,
    photoURL,
  };
  if (reviewPrivacy) {
    updateData.reviewPrivacy = reviewPrivacy;
  }
  await updateDoc(userRef, updateData);

  // Synchronize review credentials and privacy settings on all their past published reviews
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("uid", "==", uid));
  const snap = await getDocs(q);
  const promises = snap.docs.map((docSnap) => {
    const updateObj: any = {};
    if (displayName) updateObj.displayName = displayName;
    if (photoURL !== undefined) updateObj.photoURL = photoURL;
    if (reviewPrivacy) updateObj.privacy = reviewPrivacy;
    return updateDoc(docSnap.ref, updateObj);
  });
  await Promise.all(promises);
};

/**
 * Add a movie to user's recently viewed list
 */
export const addToRecentlyViewed = async (
  uid: string,
  movieData: MovieData,
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const currentRecent = userSnap.data().recentlyViewed || [];

  // Remove duplicate of this movie
  const filteredRecent = currentRecent.filter(
    (movie: MovieData) => movie.imdbID !== movieData.imdbID
  );

  // Add to the front of the list, limit to 15
  const newRecent = [
    { ...movieData, viewedAt: new Date().toISOString() },
    ...filteredRecent
  ].slice(0, 15);

  await updateDoc(userRef, {
    recentlyViewed: newRecent,
    lastWatched: {
      ...movieData,
      watchedAt: serverTimestamp(),
    }
  });
};

/**
 * Get user's recently viewed movies
 */
export const getUserRecentlyViewed = async (uid: string): Promise<MovieData[]> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return [];

  return userSnap.data().recentlyViewed || [];
};

export interface ReviewComment {
  id: string;
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  text: string;
  createdAt: string;
}

export interface ReviewData {
  id: string;
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  userLevel?: number;
  isAdmin?: boolean;
  imdbID: string;
  movieTitle: string;
  moviePoster: string;
  movieYear: string;
  movieType: string;
  rating: number;
  comment: string;
  privacy?: "public" | "friends" | "private";
  likes?: string[];
  comments?: ReviewComment[];
  publishedAt: any;
}

/**
 * Update the user's level in Firestore and synchronize it on all their reviews
 */
export const updateUserLevel = async (
  uid: string,
  level: number
): Promise<void> => {
  // Update in user profile
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const email = userSnap.exists() ? (userSnap.data().email || "") : "";
  const isAdmin = email === "ahmedrawy108@gmail.com";

  await updateDoc(userRef, { level, isAdmin });

  // Update in all their past reviews
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("uid", "==", uid));
  const snap = await getDocs(q);
  const promises = snap.docs.map((docSnap) => {
    return updateDoc(docSnap.ref, { 
      userLevel: level,
      isAdmin: isAdmin
    });
  });
  await Promise.all(promises);
};

/**
 * Publish a movie review in Firestore, preserving existing likes/comments
 */
export const publishMovieReview = async (
  uid: string,
  userProfile: any,
  movieData: MovieData,
  rating: number,
  comment: string,
  privacy: "public" | "friends" | "private" = "public",
): Promise<void> => {
  const reviewRef = doc(db, "reviews", `${uid}_${movieData.imdbID}`);
  const reviewSnap = await getDoc(reviewRef);

  const existingLikes = reviewSnap.exists() ? (reviewSnap.data().likes || []) : [];
  const existingComments = reviewSnap.exists() ? (reviewSnap.data().comments || []) : [];

  await setDoc(reviewRef, {
    id: `${uid}_${movieData.imdbID}`,
    uid,
    displayName: userProfile?.displayName || "User",
    photoURL: userProfile?.photoURL || "",
    userLevel: userProfile?.level || 1,
    isAdmin: userProfile?.email === "ahmedrawy108@gmail.com" || false,
    imdbID: movieData.imdbID,
    movieTitle: movieData.Title,
    moviePoster: movieData.Poster,
    movieYear: movieData.Year,
    movieType: movieData.Type,
    rating,
    comment,
    privacy,
    likes: existingLikes,
    comments: existingComments,
    publishedAt: serverTimestamp(),
  });
};

/**
 * Toggle like on a review (add/remove user ID)
 */
export const toggleLikeReview = async (reviewId: string, uid: string): Promise<void> => {
  const reviewRef = doc(db, "reviews", reviewId);
  const snap = await getDoc(reviewRef);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  const hasLiked = likes.includes(uid);
  if (hasLiked) {
    await updateDoc(reviewRef, {
      likes: arrayRemove(uid)
    });
  } else {
    await updateDoc(reviewRef, {
      likes: arrayUnion(uid)
    });
  }
};

/**
 * Append a comment to a review
 */
export const addCommentToReview = async (
  reviewId: string,
  commentData: ReviewComment
): Promise<void> => {
  const reviewRef = doc(db, "reviews", reviewId);
  await updateDoc(reviewRef, {
    comments: arrayUnion(commentData)
  });
};

/**
 * Edit a comment in a review
 */
export const editCommentInReview = async (
  reviewId: string,
  commentId: string,
  newText: string
): Promise<void> => {
  const reviewRef = doc(db, "reviews", reviewId);
  const snap = await getDoc(reviewRef);
  if (!snap.exists()) return;
  const comments: ReviewComment[] = snap.data().comments || [];
  const updatedComments = comments.map((comm) => {
    if (comm.id === commentId) {
      return { ...comm, text: newText };
    }
    return comm;
  });
  await updateDoc(reviewRef, {
    comments: updatedComments
  });
};

/**
 * Delete a comment from a review
 */
export const deleteCommentFromReview = async (
  reviewId: string,
  commentId: string
): Promise<void> => {
  const reviewRef = doc(db, "reviews", reviewId);
  const snap = await getDoc(reviewRef);
  if (!snap.exists()) return;
  const comments: ReviewComment[] = snap.data().comments || [];
  const updatedComments = comments.filter((comm) => comm.id !== commentId);
  await updateDoc(reviewRef, {
    comments: updatedComments
  });
};

/**
 * Update a review's rating and comment
 */
export const updateMovieReview = async (
  reviewId: string,
  rating: number,
  comment: string
): Promise<void> => {
  const reviewRef = doc(db, "reviews", reviewId);
  await updateDoc(reviewRef, {
    rating,
    comment,
    publishedAt: serverTimestamp()
  });
};

/**
 * Get all public reviews for the Facebook-style social feed
 */
export const getAllPublicReviews = async (): Promise<ReviewData[]> => {
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("privacy", "==", "public"));
  const snap = await getDocs(q);
  const reviews: ReviewData[] = [];
  snap.forEach((doc) => {
    reviews.push(doc.data() as ReviewData);
  });

  // Sort by publishedAt desc
  return reviews.sort((a, b) => {
    const timeA = a.publishedAt?.seconds || 0;
    const timeB = b.publishedAt?.seconds || 0;
    return timeB - timeA;
  });
};

/**
 * Get all reviews published for a specific movie
 */
export const getMovieReviews = async (imdbID: string): Promise<ReviewData[]> => {
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("imdbID", "==", imdbID));
  const snap = await getDocs(q);
  const reviews: ReviewData[] = [];
  snap.forEach((doc) => {
    reviews.push(doc.data() as ReviewData);
  });

  // Sort by publishedAt desc
  return reviews.sort((a, b) => {
    const timeA = a.publishedAt?.seconds || 0;
    const timeB = b.publishedAt?.seconds || 0;
    return timeB - timeA;
  });
};

/**
 * Get all reviews written by a specific user
 */
export const getUserReviews = async (uid: string): Promise<ReviewData[]> => {
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("uid", "==", uid));
  const snap = await getDocs(q);
  const reviews: ReviewData[] = [];
  snap.forEach((doc) => {
    reviews.push(doc.data() as ReviewData);
  });
  
  // Sort by publishedAt desc
  return reviews.sort((a, b) => {
    const timeA = a.publishedAt?.seconds || 0;
    const timeB = b.publishedAt?.seconds || 0;
    return timeB - timeA;
  });
};

/**
 * Check if a user has written a review for a specific movie
 */
export const getMovieReviewForUser = async (uid: string, imdbID: string): Promise<ReviewData | null> => {
  const reviewRef = doc(db, "reviews", `${uid}_${imdbID}`);
  const reviewSnap = await getDoc(reviewRef);
  if (reviewSnap.exists()) {
    return reviewSnap.data() as ReviewData;
  }
  return null;
};

/**
 * Delete a user review
 */
export const deleteMovieReview = async (uid: string, imdbID: string): Promise<void> => {
  const reviewRef = doc(db, "reviews", `${uid}_${imdbID}`);
  await deleteDoc(reviewRef);
};

export interface FriendRequest {
  id: string;
  senderUid: string;
  senderName: string;
  senderPhoto: string;
  receiverUid: string;
  receiverName: string;
  receiverPhoto: string;
  status: "pending";
  createdAt: string;
}

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (
  sender: UserProfile,
  receiverUid: string
): Promise<void> => {
  const receiverProfile = await getUserProfile(receiverUid);
  if (!receiverProfile) throw new Error("Receiver not found");

  const requestId = `${sender.uid}_${receiverUid}`;
  await setDoc(doc(db, "friend_requests", requestId), {
    id: requestId,
    senderUid: sender.uid,
    senderName: sender.displayName || "User",
    senderPhoto: sender.photoURL || "",
    receiverUid,
    receiverName: receiverProfile.displayName || "User",
    receiverPhoto: receiverProfile.photoURL || "",
    status: "pending",
    createdAt: new Date().toISOString()
  });
};

/**
 * Accept an incoming friend request
 */
export const acceptFriendRequest = async (
  request: FriendRequest
): Promise<void> => {
  const senderRef = doc(db, "users", request.senderUid);
  const receiverRef = doc(db, "users", request.receiverUid);

  // Update both users' friends arrays
  await updateDoc(senderRef, {
    friends: arrayUnion(request.receiverUid)
  });
  await updateDoc(receiverRef, {
    friends: arrayUnion(request.senderUid)
  });

  // Delete the pending friend request document
  await deleteDoc(doc(db, "friend_requests", request.id));
};

/**
 * Decline an incoming friend request
 */
export const declineFriendRequest = async (requestId: string): Promise<void> => {
  await deleteDoc(doc(db, "friend_requests", requestId));
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (
  senderUid: string,
  receiverUid: string
): Promise<void> => {
  const requestId = `${senderUid}_${receiverUid}`;
  await deleteDoc(doc(db, "friend_requests", requestId));
};

/**
 * Remove an existing friendship
 */
export const removeFriend = async (
  uid1: string,
  uid2: string
): Promise<void> => {
  const ref1 = doc(db, "users", uid1);
  const ref2 = doc(db, "users", uid2);
  await updateDoc(ref1, {
    friends: arrayRemove(uid2)
  });
  await updateDoc(ref2, {
    friends: arrayRemove(uid1)
  });
};

/**
 * Fetch incoming and outgoing pending friend requests
 */
export const getFriendRequests = async (
  uid: string
): Promise<{
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> => {
  const requestsCol = collection(db, "friend_requests");

  // Query incoming
  const qIncoming = query(
    requestsCol,
    where("receiverUid", "==", uid),
    where("status", "==", "pending")
  );
  const snapIncoming = await getDocs(qIncoming);
  const incoming: FriendRequest[] = [];
  snapIncoming.forEach((doc) => {
    incoming.push(doc.data() as FriendRequest);
  });

  // Query outgoing
  const qOutgoing = query(
    requestsCol,
    where("senderUid", "==", uid),
    where("status", "==", "pending")
  );
  const snapOutgoing = await getDocs(qOutgoing);
  const outgoing: FriendRequest[] = [];
  snapOutgoing.forEach((doc) => {
    outgoing.push(doc.data() as FriendRequest);
  });

  return { incoming, outgoing };
};

/**
 * Get all registered user profiles
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersCol = collection(db, "users");
  const snap = await getDocs(usersCol);
  const users: UserProfile[] = [];
  snap.forEach((doc) => {
    users.push(doc.data() as UserProfile);
  });
  return users;
};

/**
 * Get multiple user profiles by list of UIDs
 */
export const getFriendsProfiles = async (
  uids: string[]
): Promise<UserProfile[]> => {
  if (!uids || uids.length === 0) return [];
  const profiles = await Promise.all(
    uids.map((uid) => getUserProfile(uid))
  );
  return profiles.filter((p): p is UserProfile => p !== null);
};

export interface SharedMovie {
  id: string;
  senderUid: string;
  senderName: string;
  senderPhoto: string;
  receiverUid: string;
  imdbID: string;
  movieTitle: string;
  moviePoster: string;
  movieType: string;
  message: string;
  createdAt: string;
}

/**
 * Share a movie internally with a friend
 */
export const shareMovieWithFriend = async (
  sender: UserProfile,
  friendUid: string,
  movie: { imdbID: string; Title: string; Poster: string; Type: string },
  message: string
): Promise<void> => {
  const shareRef = doc(collection(db, "shares"));
  await setDoc(shareRef, {
    id: shareRef.id,
    senderUid: sender.uid,
    senderName: sender.displayName || "User",
    senderPhoto: sender.photoURL || "",
    receiverUid: friendUid,
    imdbID: movie.imdbID,
    movieTitle: movie.Title,
    moviePoster: movie.Poster,
    movieType: movie.Type,
    message,
    createdAt: new Date().toISOString()
  });
};

/**
 * Get all movies shared with a specific user
 */
export const getSharedMovies = async (uid: string): Promise<SharedMovie[]> => {
  const sharesCol = collection(db, "shares");
  const q = query(sharesCol, where("receiverUid", "==", uid));
  const snap = await getDocs(q);
  const shares: SharedMovie[] = [];
  snap.forEach((doc) => {
    shares.push(doc.data() as SharedMovie);
  });
  // Sort by createdAt descending
  return shares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get all reviews posted by a list of friend UIDs
 */
export const getFriendsReviews = async (friendUids: string[]): Promise<ReviewData[]> => {
  if (!friendUids || friendUids.length === 0) return [];
  try {
    const reviewsArrays = await Promise.all(
      friendUids.map((friendUid) => getUserReviews(friendUid))
    );
    const allReviews = reviewsArrays.flat();
    return allReviews.sort((a, b) => {
      const timeA = a.publishedAt?.seconds || 0;
      const timeB = b.publishedAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error("Error fetching friends reviews:", err);
    return [];
  }
};

/**
 * Seed 100 mock community users in Firestore database
 */
export const seedMockUsers = async (): Promise<void> => {
  const firstNames = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Jamie", "Riley", "Cameron", "Skyler", "Rowan",
    "Avery", "Peyton", "Quinn", "Hayden", "Logan", "Charlie", "Reese", "Parker", "Dakota", "Phoenix",
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "Elijah", "Isabella", "James",
    "Amelia", "Benjamin", "Mia", "Lucas", "Charlotte", "Mason", "Harper", "Ethan", "Evelyn", "Alexander",
    "Abigail", "Daniel", "Emily", "Matthew", "Elizabeth", "Henry", "Sofia", "Joseph", "Aria", "Jackson"
  ];
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
  ];

  const avatarUrls = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80"
  ];

  const batchSize = 100;
  const promises = [];

  for (let i = 0; i < batchSize; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const displayName = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${Math.floor(Math.random() * 90 + 10)}@moviehub.com`;
    const photoURL = avatarUrls[Math.floor(Math.random() * avatarUrls.length)];
    const level = Math.floor(Math.random() * 10) + 1;
    const mockUid = `mock_user_${i + 1}`;

    const userRef = doc(db, "users", mockUid);
    promises.push(
      setDoc(userRef, {
        uid: mockUid,
        email,
        displayName,
        photoURL,
        reviewPrivacy: "public",
        lastLogin: new Date().toISOString(),
        favorites: [],
        watchLater: [],
        recentlyViewed: [],
        lastWatched: null,
        ratings: {},
        friends: [],
        level,
        createdAt: new Date().toISOString()
      })
    );
  }

  await Promise.all(promises);
};


