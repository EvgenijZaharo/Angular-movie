import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SERVER_URL} from '../app/api-token';
import {Review} from '../app/interfaces';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private _backendUrl = inject(SERVER_URL);
  http = inject(HttpClient);

  getReviewsForMovie(imdbId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this._backendUrl}/reviews?imdbId=${imdbId}`);
  }

  getUserReviewForMovie(userId: string, imdbId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this._backendUrl}/reviews?userId=${userId}&imdbId=${imdbId}`);
  }

  createReview(review: Omit<Review, 'id' | 'createdAt'>): Observable<Review> {
    return this.http.post<Review>(`${this._backendUrl}/reviews`, {
      ...review,
      createdAt: new Date().toISOString()
    });
  }

  updateReview(id: string, rating: number): Observable<Review> {
    return this.http.patch<Review>(`${this._backendUrl}/reviews/${id}`, {
      rating,
      createdAt: new Date().toISOString()
    });
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this._backendUrl}/reviews/${id}`);
  }
}
