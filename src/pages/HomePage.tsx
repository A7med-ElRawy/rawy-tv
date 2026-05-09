import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Popcorn, Loader2, TrendingUp, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieService, Movie } from '../services/movieService';
import MovieCard from '../components/MovieCard';

const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || 'Popular';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [query, setQuery] = useState(initialQuery);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchMovies = useCallback(async (searchQuery: string, pageNum: number) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await movieService.searchMovies(searchQuery, pageNum);
      if (data.Response === 'True') {
        setMovies(data.Search);
        setTotalResults(parseInt(data.totalResults, 10));
      } else {
        setMovies([]);
        setError(data.Error || 'No results');
        setTotalResults(0);
      }
    } catch (err) {
      setError('Failed to fetch movies. Please check your connection.');
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPopular = useCallback(async () => {
    try {
      const data = await movieService.searchMovies('Popular', 1);
      if (data.Response === 'True') {
        setPopularMovies(data.Search.slice(0, 5));
      }
    } catch (err) {
      console.error('Popular fetch failed', err);
    }
  }, []);

  useEffect(() => {
    fetchPopular();
  }, [fetchPopular]);

  useEffect(() => {
    const q = searchParams.get('q') || initialQuery;
    const page = parseInt(searchParams.get('page') || '1', 10);
    setQuery(q);
    fetchMovies(q, page);
  }, [searchParams, fetchMovies, initialQuery]);

  // Auto-slide effect
  useEffect(() => {
    if (popularMovies.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % popularMovies.length);
    }, 12000); // Slower transition (12s)
    return () => clearInterval(interval);
  }, [popularMovies]);

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev - 1 + popularMovies.length) % popularMovies.length);
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev + 1) % popularMovies.length);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query, page: '1' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString() });
  };

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = Math.ceil(totalResults / 20);

  return (
    <div className="min-h-full pb-32">
      {/* Hero Slider Section */}
      <section className="relative h-[650px] overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {popularMovies.length > 0 && (
            <motion.div
              key={popularMovies[activeSlide].imdbID}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-linear-to-r from-surface via-surface/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-linear-to-t from-surface via-transparent to-transparent z-10" />
              <img
                src={(popularMovies[activeSlide] as any).Poster?.replace('w500', 'original') || ''}
                className="w-full h-full object-cover"
                alt="Backdrop"
              />
              
              <div className="absolute inset-0 z-20 flex flex-col justify-end px-6 lg:px-16 pb-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl"
                >
                  <div className="flex items-center gap-2 text-accent-green font-black tracking-[4px] text-[10px] uppercase mb-6">
                    <TrendingUp className="w-4 h-4" />
                    <span className="bg-accent-green text-black px-1.5 py-0.5 font-black mr-2">POPULAR NOW</span>
                    <span className="text-white">TMDB RATING: {popularMovies[activeSlide].vote_average?.toFixed(1)}</span>
                  </div>
                  
                  <h1 className="text-7xl lg:text-[140px] font-black mb-8 leading-[0.8] tracking-[-0.05em] uppercase drop-shadow-2xl">
                    {popularMovies[activeSlide].Title.split(' ').map((word, idx) => (
                      <React.Fragment key={idx}>
                        {idx % 2 === 1 ? <span className="text-brand">{word}</span> : word}{' '}
                      </React.Fragment>
                    ))}
                  </h1>

                  <div className="flex items-center gap-4 mt-10">
                    <button 
                      onClick={() => navigate(`/movie/${popularMovies[activeSlide].imdbID}`)}
                      className="px-10 py-4 bg-white text-black font-black uppercase text-xs tracking-[3px] hover:bg-zinc-200 transition-all flex items-center gap-3"
                    >
                      <Play className="w-4 h-4 fill-current" /> Watch Info
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Slider Controls */}
        <div className="absolute bottom-10 left-10 lg:left-16 z-30 flex items-center gap-6">
          <div className="flex gap-2">
            {popularMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1 transition-all ${idx === activeSlide ? 'w-12 bg-white' : 'w-6 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          
          <div className="flex gap-2 ml-4 border-l border-white/10 pl-6">
            <button
              onClick={handlePrevSlide}
              className="p-3 bg-black/40 hover:bg-white hover:text-black transition-all border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextSlide}
              className="p-3 bg-black/40 hover:bg-white hover:text-black transition-all border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="px-6 lg:px-10 mt-16">
        <div className="flex items-center justify-between mb-10 border-b border-zinc-900 pb-4">
          <h2 className="text-xl font-black tracking-widest uppercase flex items-center gap-3">
            {loading ? 'Scanning...' : query ? `Results: ${query}` : 'Curated Selection'}
          </h2>
          {!loading && totalResults > 0 && (
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              Found {totalResults} Titles • Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
              <p className="text-zinc-500 font-medium uppercase tracking-widest text-[10px] font-black">Fetching cinematic magic...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Popcorn className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-black uppercase mb-2">No movies found</h3>
              <p className="text-zinc-500 max-w-xs uppercase text-[10px] font-bold tracking-widest leading-relaxed">{error}</p>
            </motion.div>
          ) : (
            <div className="space-y-16">
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8"
              >
                {movies.map((movie) => (
                  <MovieCard key={movie.imdbID} movie={movie} />
                ))}
              </motion.div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-8 pt-8 border-t border-zinc-900">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    
                    <div className="flex items-center bg-zinc-900/50 border border-white/5 p-1">
                      {/* Show current page and potential siblings */}
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        // Logic to show pages around current
                        let pageNum = currentPage;
                        if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-12 h-12 text-xs font-black uppercase tracking-widest transition-all ${
                              currentPage === pageNum 
                                ? 'bg-white text-black' 
                                : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-[2px]">
                    <span className="text-zinc-800">Total</span>
                    <span className="text-white">{totalPages} Pages Found</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default HomePage;

