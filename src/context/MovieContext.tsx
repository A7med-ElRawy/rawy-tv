import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  toggleFavorite,
  toggleWatchLater,
  setMovieRating,
  getUserFavorites,
  getUserWatchLater,
  getUserRatings,
  getUserRecentlyViewed,
  addToRecentlyViewed,
  getUserReviews,
  MovieData,
  updateUserLevel,
} from "../utils/firebaseUtils";

interface MovieContextType {
  favorites: MovieData[];
  watchLater: MovieData[];
  recentlyViewed: MovieData[];
  ratings: Record<string, number>;
  reviewsCount: number;
  toggleFavorite: (movieData: MovieData) => Promise<void>;
  toggleWatchLater: (movieData: MovieData) => Promise<void>;
  setRating: (id: string, rating: number) => Promise<void>;
  addToRecent: (movieData: MovieData) => Promise<void>;
  refreshReviewsCount: () => Promise<void>;
  loading: boolean;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<MovieData[]>([]);
  const [watchLater, setWatchLater] = useState<MovieData[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<MovieData[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch user data from Firestore when user changes
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setWatchLater([]);
      setRatings({});
      setRecentlyViewed([]);
      setReviewsCount(0);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [favs, watchLaterMovies, userRatings, recentMovies, userReviews] = await Promise.all([
          getUserFavorites(user.uid),
          getUserWatchLater(user.uid),
          getUserRatings(user.uid),
          getUserRecentlyViewed(user.uid),
          getUserReviews(user.uid),
        ]);

        setFavorites(favs);
        setWatchLater(watchLaterMovies);
        setRatings(userRatings);
        setRecentlyViewed(recentMovies);
        setReviewsCount(userReviews.length);
      } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Synchronize calculated user level in Firestore when profile metrics change
  useEffect(() => {
    if (!user || loading) return;

    const favsCount = favorites.length;
    const wlCount = watchLater.length;
    const rCount = Object.keys(ratings).length;

    // Calculate level
    const ACHIEVEMENTS_LIST = [
      { goalType: "favorites", goalValue: 1 },
      { goalType: "reviews", goalValue: 1 },
      { goalType: "ratings", goalValue: 5 },
      { goalType: "watchLater", goalValue: 5 },
      { goalType: "reviews", goalValue: 5 },
    ];

    const getProgress = (type: string): number => {
      switch (type) {
        case "favorites":
          return favsCount;
        case "reviews":
          return reviewsCount;
        case "ratings":
          return rCount;
        case "watchLater":
          return wlCount;
        default:
          return 0;
      }
    };

    const unlockedCount = ACHIEVEMENTS_LIST.filter((badge) => {
      return getProgress(badge.goalType) >= badge.goalValue;
    }).length;

    const badgeXp = unlockedCount * 100;
    const activityXp =
      favsCount * 10 +
      reviewsCount * 20 +
      rCount * 5 +
      wlCount * 5;
    const totalXp = badgeXp + activityXp;
    const calculatedLevel = Math.floor(totalXp / 500) + 1;

    // Sync to Firestore in the background
    updateUserLevel(user.uid, calculatedLevel).catch((err) => {
      console.error("Failed to sync user level in Firestore:", err);
    });
  }, [user, loading, favorites.length, watchLater.length, ratings, reviewsCount]);

  const handleToggleFavorite = async (movieData: MovieData) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      // Optimistic update
      setFavorites((prev) =>
        prev.some((fav) => fav.imdbID === movieData.imdbID)
          ? prev.filter((fav) => fav.imdbID !== movieData.imdbID)
          : [...prev, movieData],
      );

      // Update Firestore
      await toggleFavorite(user.uid, movieData);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update
      const favs = await getUserFavorites(user.uid);
      setFavorites(favs);
    }
  };

  const handleToggleWatchLater = async (movieData: MovieData) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      // Optimistic update
      setWatchLater((prev) =>
        prev.some((m) => m.imdbID === movieData.imdbID)
          ? prev.filter((m) => m.imdbID !== movieData.imdbID)
          : [...prev, movieData],
      );

      // Update Firestore
      await toggleWatchLater(user.uid, movieData);
    } catch (error) {
      console.error("Error toggling watch later:", error);
      // Revert optimistic update
      const watchLaterMovies = await getUserWatchLater(user.uid);
      setWatchLater(watchLaterMovies);
    }
  };

  const handleSetRating = async (id: string, rating: number) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      // Optimistic update
      setRatings((prev) => ({ ...prev, [id]: rating }));

      // Update Firestore
      await setMovieRating(user.uid, id, rating);
    } catch (error) {
      console.error("Error setting rating:", error);
      // Revert optimistic update
      const userRatings = await getUserRatings(user.uid);
      setRatings(userRatings);
    }
  };

  const handleAddToRecent = useCallback(async (movieData: MovieData) => {
    if (!user) return;
    try {
      // Optimistic update
      setRecentlyViewed((prev) => {
        const filtered = prev.filter((m) => m.imdbID !== movieData.imdbID);
        return [movieData, ...filtered].slice(0, 15);
      });
      await addToRecentlyViewed(user.uid, movieData);
    } catch (error) {
      console.error("Error adding to recently viewed:", error);
    }
  }, [user]);

  const handleRefreshReviewsCount = async () => {
    if (!user) return;
    try {
      const data = await getUserReviews(user.uid);
      setReviewsCount(data.length);
    } catch (err) {
      console.error("Error refreshing reviews count:", err);
    }
  };

  return (
    <MovieContext.Provider
      value={{
        favorites,
        watchLater,
        recentlyViewed,
        ratings,
        reviewsCount,
        toggleFavorite: handleToggleFavorite,
        toggleWatchLater: handleToggleWatchLater,
        setRating: handleSetRating,
        addToRecent: handleAddToRecent,
        refreshReviewsCount: handleRefreshReviewsCount,
        loading,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error("useMovies must be used within a MovieProvider");
  }
  return context;
};
