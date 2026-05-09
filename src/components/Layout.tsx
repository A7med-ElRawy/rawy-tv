import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Bookmark, Search, Menu, Play, Loader2, Film, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieService, Movie } from '../services/movieService';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await movieService.searchMovies(query);
      if (data.Response === 'True') {
        // Limit to 5 suggestions
        setSuggestions(data.Search.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Library', path: '/library', icon: Bookmark },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-card border-r border-zinc-900 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <Link to="/" className="flex items-center gap-2 mb-10 pl-2 group">
            <span className="text-2xl font-black tracking-tighter text-brand uppercase">RAWY-TV</span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] mb-4 pl-2">Navigation</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-none transition-all border-l-2 ${
                    isActive
                      ? 'border-brand bg-zinc-900 text-white'
                      : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-6 space-y-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] pl-2">Explore</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 px-4 text-[10px] font-black text-white/40 uppercase mb-2">
                    <Film className="w-3 h-3" /> Movies
                  </h4>
                  <div className="space-y-1">
                    {[
                      { name: 'Most Popular', q: 'Popular' },
                      { name: 'Top 250', q: 'Top 250' },
                      { name: '2026 Releases', q: '2026' }
                    ].map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          navigate(`/?q=${cat.q}`);
                          setIsSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-tight"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 px-4 text-[10px] font-black text-white/40 uppercase mb-2">
                    <PlayCircle className="w-3 h-3" /> TV shows
                  </h4>
                  <div className="space-y-1">
                    {[
                      { name: 'Popular Shows', q: 'TV Series' },
                      { name: 'Top 250 TV', q: 'Top Rated' }
                    ].map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          navigate(`/?q=${cat.q}`);
                          setIsSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-tight"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="p-4 bg-zinc-900/30 rounded-none border border-zinc-800">
              <p className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Elite Access</p>
              <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">Unlock the full cinematic library and high-definition details.</p>
              <button className="w-full py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-zinc-900/50 bg-surface/95 backdrop-blur-xl z-30 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 lg:hidden text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 max-w-2xl mx-auto px-4">
            <div className="relative group" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-brand transition-all" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Find Your Next Obsession..."
                  className="w-full bg-black/20 border border-white/10 rounded-none py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-[2px] focus:outline-none focus:border-brand focus:bg-black/40 transition-all placeholder:text-zinc-700 shadow-2xl"
                />
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-zinc-800 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-zinc-900 bg-zinc-900/50">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[2px]">Quick Results</p>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {suggestions.map((movie) => (
                        <button
                          key={movie.imdbID}
                          onClick={() => {
                            setSearchTerm('');
                            setShowSuggestions(false);
                            navigate(`/movie/${movie.imdbID}?type=${movie.Type}`);
                          }}
                          className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 transition-colors text-left border-b border-zinc-900/50 last:border-0"
                        >
                          <div className="w-10 h-14 shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden">
                            <img
                              src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/100x150'}
                              alt={movie.Title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight truncate mb-0.5">{movie.Title}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{movie.Year} • {movie.Type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full p-3 bg-zinc-900 text-center hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">See all results for "{searchTerm}"</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[11px] font-black text-white uppercase tracking-widest">Ahmed Rawy</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase">Pro Tier</p>
            </div>
            <div className="w-9 h-9 rounded-none bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-[10px] text-white">
              AR
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
