import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, catchError, throwError} from 'rxjs';
import {OmdbSearchResult, OmdbMovieDetail, ApiError} from '../app/interfaces';
import {SERVER_URL} from '../app/api-token';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);

  private readonly BASE_URL = inject(SERVER_URL);

  private readonly ENDPOINTS = {
    search: `${this.BASE_URL}/movies/search`,
    details: `${this.BASE_URL}/movies/details`,
  } as const;

  searchMovies(title: string): Observable<OmdbSearchResult> {
    return this.http.get<OmdbSearchResult>(this.ENDPOINTS.search, {
      params: { title }
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getMovieDetails(imdbId: string): Observable<OmdbMovieDetail> {
    return this.http.get<OmdbMovieDetail>(`${this.ENDPOINTS.details}/${imdbId}`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      apiError = {
        error: `Network error: ${error.error.message}`,
        status: 0,
        statusText: 'Network Error'
      };
    } else {
      apiError = {
        error: error.error?.error || error.message || 'An unknown error occurred',
        status: error.status,
        statusText: error.statusText
      };
    }

    console.error('MovieService Error:', apiError);
    return throwError(() => apiError);
  }
}
