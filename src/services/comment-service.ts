import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SERVER_URL} from '../app/api-token';
import {Comment} from '../app/interfaces';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private _backendUrl = inject(SERVER_URL);
  http = inject(HttpClient);

  getCommentsForMovie(imdbId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this._backendUrl}/comments?imdbId=${imdbId}`);
  }

  createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Observable<Comment> {
    return this.http.post<Comment>(`${this._backendUrl}/comments`, {
      ...comment,
      createdAt: new Date().toISOString()
    });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this._backendUrl}/comments/${id}`);
  }
}

