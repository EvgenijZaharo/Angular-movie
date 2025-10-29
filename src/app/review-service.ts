import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, switchMap} from 'rxjs';
import {Review} from './interfaces';
import {MovieService} from '../services/movie-service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private _backendUrl = "http://localhost:3000";
  http = inject(HttpClient);
  movieService = inject(MovieService);

  getReviewsForMovie(imdbId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this._backendUrl}/reviews/film/${imdbId}`);
  }

  createReview(userId: string, imdbId: string, rating: number, reviewText: string): Observable<Review> {
    return this.movieService.ensureMovieInDb(imdbId).pipe(
      switchMap(() => {
        const reviewData = {
          userId,
          imdbId,
          rating,
          reviewText
        };
        return this.http.post<Review>(`${this._backendUrl}/reviews`, reviewData);
      })
    );
  }
}
