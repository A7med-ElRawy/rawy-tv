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
    await setDoc(userRef, {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      reviewPrivacy: "public",
      lastLogin: serverTimestamp(),
      favorites: [],
      watchLater: [],
      recentlyViewed: [],
      lastWatched: null,
      ratings: {},
      createdAt: serverTimestamp(),
    });
  } else {
    // Update existing user with new login info
    await updateDoc(userRef, {
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      lastLogin: serverTimestamp(),
    });
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
  const trimmedName = displayName.trim();
  if (!trimmedName) return false;

  const usersCol = collection(db, "users");
  const q = query(usersCol, where("displayName", "==", trimmedName));
  const snap = await getDocs(q);

  let taken = false;
  snap.forEach((docSnap) => {
    if (docSnap.id !== uid) {
      taken = true;
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


