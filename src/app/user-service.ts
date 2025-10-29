import {Injectable, inject} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, catchError, throwError} from 'rxjs';
import {User, ApiError} from './interfaces';

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


  protected readonly STORAGE_KEYS = {
    token: 'auth_token',
    user: 'auth_user',
  } as const;

   readTokenFromStorage(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.token);
    } catch (error) {
      console.error('Error reading token from storage:', error);
      return null;
    }
  }

   readUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.user);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (error) {
      console.error('Error reading user from storage:', error);
      return null;
    }
  }

   saveTokenToStorage(token: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.token, token);
    } catch (error) {
      console.error('Error saving token to storage:', error);
    }
  }

   saveUserToStorage(user: User): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.user, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

   clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.token);
      localStorage.removeItem(this.STORAGE_KEYS.user);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
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
