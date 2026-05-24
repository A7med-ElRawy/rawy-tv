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
  MovieData,
} from "../utils/firebaseUtils";

interface MovieContextType {
  favorites: MovieData[];
  watchLater: MovieData[];
  recentlyViewed: MovieData[];
  ratings: Record<string, number>;
  toggleFavorite: (movieData: MovieData) => Promise<void>;
  toggleWatchLater: (movieData: MovieData) => Promise<void>;
  setRating: (id: string, rating: number) => Promise<void>;
  addToRecent: (movieData: MovieData) => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  // Fetch user data from Firestore when user changes
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setWatchLater([]);
      setRatings({});
      setRecentlyViewed([]);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [favs, watchLaterMovies, userRatings, recentMovies] = await Promise.all([
          getUserFavorites(user.uid),
          getUserWatchLater(user.uid),
          getUserRatings(user.uid),
          getUserRecentlyViewed(user.uid),
        ]);

        setFavorites(favs);
        setWatchLater(watchLaterMovies);
        setRatings(userRatings);
        setRecentlyViewed(recentMovies);
      } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

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

  return (
    <MovieContext.Provider
      value={{
        favorites,
        watchLater,
        recentlyViewed,
        ratings,
        toggleFavorite: handleToggleFavorite,
        toggleWatchLater: handleToggleWatchLater,
        setRating: handleSetRating,
        addToRecent: handleAddToRecent,
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
