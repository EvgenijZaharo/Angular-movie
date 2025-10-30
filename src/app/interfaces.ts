export interface User {
  id?: string;
  login: string;
  email: string;
  password: string;
  createdAt?: string;
}

export interface ApiError {
  error: string;
  status?: number;
  statusText?: string;
}

export interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: ApiError | null;
}

export interface Movie {
  imdbId: string;
  title: string;
  year: string;
  poster: string;
  plot: string;
  director: string;
  actors: string;
  genre: string;
  runtime: string;
  imdbRating: string;
  createdAt?: string;
}

export interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResult {
  Search: OmdbSearchItem[];
  totalResults: string;
  Response: string;
  Error?: string;
}

export interface OmdbMovieDetail {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  Error?: string;
}

export interface Review {
  id: string;
  userId: string;
  imdbId: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  imdbId: string;
  commentText: string;
  createdAt: string;
  parentCommentId?: string;
}

export type onChangeFn<T> = (value: T) => void;
export type onTouchFn = () => void;
