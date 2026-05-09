import React, { useState, useEffect } from 'react';
import { Heart, Clock, Loader2, PlayCircle, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMovies } from '../context/MovieContext';
import { movieService, Movie } from '../services/movieService';
import MovieCard from '../components/MovieCard';

const LibraryPage: React.FC = () => {
  const { favorites, watchLater } = useMovies();
  const [activeTab, setActiveTab] = useState<'favorites' | 'watchLater'>('favorites');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const list = activeTab === 'favorites' ? favorites : watchLater;
    
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const moviePromises = list.map(id => movieService.getMovieDetails(id));
        const results = await Promise.all(moviePromises);
        setMovies(results.filter(m => m.Response === 'True'));
      } catch (err) {
        console.error('Error fetching library movies:', err);
      } finally {
        setLoading(false);
      }
    };

    if (list.length > 0) {
      fetchMovies();
    } else {
      setMovies([]);
    }
  }, [activeTab, favorites, watchLater]);

  return (
    <div className="p-6 lg:p-10 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-16 border-b border-zinc-900 pb-10">
        <div>
          <h1 className="text-6xl lg:text-8xl font-black mb-2 leading-none">Library</h1>
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[4px]">Private Collection</p>
        </div>

        <div className="flex bg-zinc-900/50 p-1 border border-white/5 rounded-none self-start">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'favorites' 
                ? 'bg-white text-black' 
                : 'text-zinc-600 hover:text-white'
            }`}
          >
            Favorites
            {favorites.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black/20 rounded-none text-[9px]">{favorites.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('watchLater')}
            className={`flex items-center gap-2 px-8 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'watchLater' 
                ? 'bg-white text-black' 
                : 'text-zinc-600 hover:text-white'
            }`}
          >
            Queue
            {watchLater.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black/20 rounded-none text-[9px]">{watchLater.length}</span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <Loader2 className="w-12 h-12 text-zinc-300 animate-spin mb-4" />
            <p className="text-zinc-500 font-medium">Updating collections...</p>
          </motion.div>
        ) : movies.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              {activeTab === 'favorites' ? (
                <PlusCircle className="w-10 h-10 text-zinc-800" />
              ) : (
                <PlayCircle className="w-10 h-10 text-zinc-800" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">No movies here yet</h2>
            <p className="text-zinc-500 max-w-sm mb-8">
              Start exploring and save movies to your {activeTab === 'favorites' ? 'favorites' : 'watch later'} list for quick access.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8"
          >
            {movies.map((movie) => (
              <MovieCard key={movie.imdbID} movie={movie} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryPage;
