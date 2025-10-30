import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, switchMap} from 'rxjs';
import {Comment} from '../app/interfaces';
import {MovieService} from './movie-service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private _backendUrl = "http://localhost:3000";
  http = inject(HttpClient);
  movieService = inject(MovieService);

  getCommentsForMovie(imdbId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this._backendUrl}/comments/film/${imdbId}`);
  }

  createComment(userId: string, imdbId: string, commentText: string, parentCommentId?: string): Observable<Comment> {
    // Ensure movie exists in database before creating comment
    return this.movieService.ensureMovieInDb(imdbId).pipe(
      switchMap(() => {
        const commentData = {
          userId,
          imdbId,
          commentText,
          parentCommentId
        };
        return this.http.post<Comment>(`${this._backendUrl}/comments`, commentData);
      })
    );
  }
}

