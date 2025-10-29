import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, of, switchMap} from 'rxjs';
import {OmdbSearchResult, OmdbMovieDetail, Movie} from '../app/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private _apiUrl = "http://www.omdbapi.com/";
  private _apiUrlKey = "584a9ebe";
  private _backendUrl = "http://localhost:3000";
  http = inject(HttpClient);

  searchMovies(title: string): Observable<OmdbSearchResult> {
    return this.http.get<OmdbSearchResult>(`${this._apiUrl}?s=${title}&apikey=${this._apiUrlKey}`)
      .pipe(
        catchError(error => {
          console.error('Error searching movies:', error);
          return of({ Search: [], totalResults: '0', Response: 'False', Error: 'Search failed' });
        })
      );
  }

  getMovieDetails(imdbId: string): Observable<OmdbMovieDetail> {
    return this.http.get<OmdbMovieDetail>(`${this._apiUrl}?i=${imdbId}&apikey=${this._apiUrlKey}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching movie details:', error);
          throw error;
        })
      );
  }

  saveMovieToDb(movieData: OmdbMovieDetail): Observable<Movie> {
    const movie: Partial<Movie> = {
      imdbId: movieData.imdbID,
      title: movieData.Title,
      year: movieData.Year,
      poster: movieData.Poster,
      plot: movieData.Plot,
      director: movieData.Director,
      actors: movieData.Actors,
      genre: movieData.Genre,
      runtime: movieData.Runtime,
      imdbRating: movieData.imdbRating
    };

    return this.http.post<Movie>(`${this._backendUrl}/films`, movie);
  }

  getMovieFromDb(imdbId: string): Observable<Movie | null> {
    return this.http.get<Movie>(`${this._backendUrl}/films/${imdbId}`)
      .pipe(
        catchError(() => of(null))
      );
  }

  ensureMovieInDb(imdbId: string): Observable<Movie> {
    return this.getMovieFromDb(imdbId).pipe(
      switchMap(existingMovie => {
        if (existingMovie) {
          return of(existingMovie);
        }
        return this.getMovieDetails(imdbId).pipe(
          switchMap(movieDetails => this.saveMovieToDb(movieDetails))
        );
      })
    );
  }
}
