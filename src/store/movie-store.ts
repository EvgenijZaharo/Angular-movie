import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';
import { inject } from '@angular/core';
import { MovieService } from '../services/movie-service';
import {tap, catchError, of, finalize} from 'rxjs';
import { OmdbSearchItem, OmdbMovieDetail, ApiError } from '../app/interfaces';

interface MovieState {
  searchResults: OmdbSearchItem[];
  searchQuery: string;
  totalResults: number;
  movieDetails: OmdbMovieDetail | null;
  currentMovieId: string | null;
  isSearching: boolean;
  isLoadingDetails: boolean;
  searchError: string | null;
  detailsError: string | null;
}

export const MovieStore = signalStore(
  { providedIn: 'root' },
  withState<MovieState>({
    searchResults: [],
    searchQuery: '',
    totalResults: 0,
    movieDetails: null,
    currentMovieId: null,
    isSearching: false,
    isLoadingDetails: false,
    searchError: null,
    detailsError: null,
  }),
  withComputed(({  isSearching,  isLoadingDetails}) => ({
    isLoading: () => isSearching() || isLoadingDetails(),
  })),
  withMethods((store, movieService = inject(MovieService)) => ({
    searchMovies(query: string): void {
      if (!query.trim()) {
        patchState(store, {
          searchResults: [],
          searchQuery: '',
          searchError: 'Search query cannot be empty',
        });
        return;
      }

      patchState(store, { isSearching: true, searchError: null, searchQuery: query });

      movieService.searchMovies(query).pipe(
        tap((result) => {
          if (result.Response === 'True' && result.Search) {
            patchState(store, {
              searchResults: result.Search,
              totalResults: parseInt(result.totalResults, 10) || 0,
              searchError: null,
            });
          } else {
            patchState(store, {
              searchResults: [],
              totalResults: 0,
              searchError: result.Error || 'No movies found',
            });
          }
        }),
        catchError((error: ApiError) => {
          patchState(store, {
            searchResults: [],
            totalResults: 0,
            searchError: error.error || 'Failed to search movies. Please try again.',
          });
          console.error('Search error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isSearching: false })),
      ).subscribe();
    },

    loadMovieDetails(imdbId: string): void {
      if (!imdbId.trim()) {
        patchState(store, {
          movieDetails: null,
          detailsError: 'Movie ID cannot be empty',
        });
        return;
      }

      patchState(store, {
        isLoadingDetails: true,
        detailsError: null,
        currentMovieId: imdbId,
      });

      movieService.getMovieDetails(imdbId).pipe(
        tap((result) => {
          if (result.Response === 'True') {
            patchState(store, {
              movieDetails: result,
              detailsError: null,
            });
          } else {
            patchState(store, {
              movieDetails: null,
              detailsError: result.Error || 'Movie not found',
            });
          }
        }),
        catchError((error: ApiError) => {
          patchState(store, {
            movieDetails: null,
            detailsError: error.error || 'Failed to load movie details. Please try again.',
          });
          console.error('Movie details error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isLoadingDetails: false })),
      ).subscribe();
    },

  })),
);


