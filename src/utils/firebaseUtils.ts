import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: any;
  favorites: MovieData[];
  watchLater: MovieData[];
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
      lastLogin: serverTimestamp(),
      favorites: [],
      watchLater: [],
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
