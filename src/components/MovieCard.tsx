import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Movie } from '../services/movieService';
import { useMovies } from '../context/MovieContext';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { favorites, watchLater, toggleFavorite, toggleWatchLater, ratings } = useMovies();
  
  const isFavorite = favorites.includes(movie.imdbID);
  const isWatchLater = watchLater.includes(movie.imdbID);
  const userRating = ratings[movie.imdbID];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="group relative bg-surface rounded-none overflow-hidden border border-white/5 transition-all aspect-[2/3]"
    >
      <Link to={`/movie/${movie.imdbID}?type=${movie.Type}`} className="block w-full h-full">
        <img
          src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/400x600?text=No+Poster'}
          alt={movie.Title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Card Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col justify-end min-h-[50%]">
          <div className="flex justify-between items-end gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider mb-1 line-clamp-2 leading-tight">
                {movie.Title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-accent-green uppercase">{movie.Year}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                <span className="text-[9px] font-black text-zinc-500 uppercase">{movie.Type}</span>
              </div>
            </div>
            {userRating && (
              <div className="text-[10px] font-black text-accent-green mb-0.5">
                {userRating}/5
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Hover Actions */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(movie.imdbID);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-sm backdrop-blur-md border ${
            isFavorite ? 'bg-brand border-brand text-white' : 'bg-black/60 border-white/20 text-white hover:bg-white hover:text-black'
          } transition-colors`}
        >
          <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWatchLater(movie.imdbID);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-sm backdrop-blur-md border ${
            isWatchLater ? 'bg-white border-white text-black' : 'bg-black/60 border-white/20 text-white hover:bg-white hover:text-black'
          } transition-colors`}
        >
          <Clock className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default MovieCard;
