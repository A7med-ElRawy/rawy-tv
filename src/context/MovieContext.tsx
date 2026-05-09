import React, { createContext, useContext, useState, useEffect } from 'react';

interface MovieContextType {
  favorites: string[];
  watchLater: string[];
  ratings: Record<string, number>;
  toggleFavorite: (id: string) => void;
  toggleWatchLater: (id: string) => void;
  setRating: (id: string, rating: number) => void;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [watchLater, setWatchLater] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchLater');
    return saved ? JSON.parse(saved) : [];
  });

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('ratings');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('watchLater', JSON.stringify(watchLater));
  }, [watchLater]);

  useEffect(() => {
    localStorage.setItem('ratings', JSON.stringify(ratings));
  }, [ratings]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleWatchLater = (id: string) => {
    setWatchLater(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const setRating = (id: string, rating: number) => {
    setRatings(prev => ({ ...prev, [id]: rating }));
  };

  return (
    <MovieContext.Provider value={{ favorites, watchLater, ratings, toggleFavorite, toggleWatchLater, setRating }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
};
