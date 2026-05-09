import axios from 'axios';

const TMDB_API_KEY = '6dabc33f8502753bf6b3b3c57f591012';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  vote_average?: number;
  Response?: string;
  Error?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface DetailedMovie extends Movie {
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  Awards: string;
  backdrop_path?: string;
  cast?: CastMember[];
}

const formatMovie = (tmdbMovie: any): Movie => ({
  Title: tmdbMovie.title || tmdbMovie.name,
  Year: (tmdbMovie.release_date || tmdbMovie.first_air_date || '').split('-')[0],
  imdbID: tmdbMovie.id.toString(),
  Type: tmdbMovie.media_type || (tmdbMovie.title ? 'movie' : 'tv'),
  Poster: tmdbMovie.poster_path ? `${IMAGE_BASE_URL}${tmdbMovie.poster_path}` : 'N/A',
  vote_average: tmdbMovie.vote_average,
});

export interface SearchResponse {
  Response: string;
  Search: Movie[];
  totalResults: string;
  Error?: string;
}

export const movieService = {
  searchMovies: async (query: string, page = 1): Promise<SearchResponse> => {
    // Special handling for predefined categories
    let endpoint = '/search/multi';
    let params: any = { api_key: TMDB_API_KEY, query, page };

    if (query === 'Popular') {
      endpoint = '/movie/popular';
      delete params.query;
    } else if (query === 'Top 250') {
      endpoint = '/movie/top_rated';
      delete params.query;
    } else if (query === 'TV Series' || query === 'Popular Shows') {
      endpoint = '/tv/popular';
      delete params.query;
    } else if (query === 'Top Rated') {
      endpoint = '/tv/top_rated';
      delete params.query;
    } else if (query === '2026') {
      endpoint = '/discover/movie';
      params.primary_release_year = 2026;
      delete params.query;
    }

    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, { params });
    
    return {
      Response: 'True',
      Search: response.data.results.map(formatMovie),
      totalResults: response.data.total_results.toString(),
    };
  },

  getMovieDetails: async (id: string, type: string = 'movie') => {
    // Determine type if not provided (defaulting to movie for compatibility)
    // In a real app we'd track media_type from search results
    const response = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
      params: { 
        api_key: TMDB_API_KEY,
        append_to_response: 'credits,videos,release_dates'
      },
    });

    const data = response.data;
    const credits = data.credits || { crew: [], cast: [] };
    const director = credits.crew.find((p: any) => p.job === 'Director')?.name || 'N/A';
    const cast = credits.cast.slice(0, 5).map((a: any) => ({
      id: a.id,
      name: a.name,
      character: a.character,
      profile_path: a.profile_path ? `${IMAGE_BASE_URL}${a.profile_path}` : null
    }));
    const actors = cast.map((a: any) => a.name).join(', ') || 'N/A';
    
    const releaseDates = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US')?.release_dates || [];
    const certification = releaseDates[0]?.certification || 'N/A';

    const detailed: DetailedMovie = {
      Title: data.title || data.name,
      Year: (data.release_date || data.first_air_date || '').split('-')[0],
      imdbID: data.id.toString(),
      Type: type,
      Poster: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : 'N/A',
      Rated: certification,
      Released: data.release_date || data.first_air_date,
      Runtime: data.runtime ? `${data.runtime} min` : (data.episode_run_time ? `${data.episode_run_time[0]} min` : 'N/A'),
      Genre: data.genres?.map((g: any) => g.name).join(', ') || 'N/A',
      Director: director,
      Actors: actors,
      Plot: data.overview || 'N/A',
      Ratings: [
        { Source: 'TMDB', Value: `${data.vote_average}/10` },
        { Source: 'Popularity', Value: Math.round(data.popularity).toString() }
      ],
      Metascore: Math.round(data.vote_average * 10).toString(),
      imdbRating: data.vote_average.toFixed(1),
      Awards: 'N/A', // TMDB doesn't provide awards in primary response easily
      backdrop_path: data.backdrop_path ? `${BACKDROP_BASE_URL}${data.backdrop_path}` : undefined,
      cast: cast,
      Response: 'True'
    };

    return detailed;
  },
};
