import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { User, ApiError } from './interfaces';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  private readonly BASE_URL = 'http://localhost:3000';
  private readonly ENDPOINTS = {
    users: `${this.BASE_URL}/users`,
    login: `${this.BASE_URL}/login`,
    register: `${this.BASE_URL}/register`,
  } as const;

  getUsers(token?: string): Observable<User[]> {
    return this.http.get<User[]>(this.ENDPOINTS.users, {
      headers: this.getAuthHeaders(token)
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getUserById(userId: string, token?: string): Observable<User> {
    return this.http.get<User>(`${this.ENDPOINTS.users}/${userId}`, {
      headers: this.getAuthHeaders(token)
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.ENDPOINTS.register, user).pipe(
      catchError(error => this.handleError(error))
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.ENDPOINTS.login, credentials).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private getAuthHeaders(token?: string): HttpHeaders {
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
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

    console.error('UserService Error:', apiError);
    return throwError(() => apiError);
  }
}
