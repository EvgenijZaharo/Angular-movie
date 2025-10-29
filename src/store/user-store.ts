import { UserState, User, ApiError } from '../app/interfaces';
import { signalStore, withMethods, withState, patchState, withComputed, withHooks } from '@ngrx/signals';
import { inject } from '@angular/core';
import { UserService, AuthResponse, LoginCredentials } from '../app/user-service';
import { computed } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, of, switchMap, finalize } from 'rxjs';

const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'auth_user',
} as const;

function readTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.token);
  } catch (error) {
    console.error('Error reading token from storage:', error);
    return null;
  }
}

function readUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch (error) {
    console.error('Error reading user from storage:', error);
    return null;
  }
}

function saveTokenToStorage(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.token, token);
  } catch (error) {
    console.error('Error saving token to storage:', error);
  }
}

function saveUserToStorage(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

const storedUser = readUserFromStorage();
const storedToken = readTokenFromStorage();

const initialState: UserState = {
  user: storedUser,
  token: storedToken,
  isLoggedIn: !!(storedUser && storedToken),
  isLoading: false,
  error: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    currentUser: computed(() => store.user()),
    isAuthenticated: computed(() => store.isLoggedIn()),
  })),
  withMethods((store, userService = inject(UserService)) => ({
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },

    setError(error: ApiError | null): void {
      patchState(store, { error });
    },

    clearError(): void {
      patchState(store, { error: null });
    },

    handleAuthSuccess(response: AuthResponse): void {
      const { accessToken, user } = response;

      if (accessToken && user) {
        saveTokenToStorage(accessToken);
        saveUserToStorage(user);

        patchState(store, {
          user,
          token: accessToken,
          isLoggedIn: true,
          error: null,
          isLoading: false,
        });

        console.log('User authenticated successfully');
      }
    },

    register: rxMethod<Omit<User, 'id' | 'createdAt'>>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((userData) =>
          userService.createUser(userData).pipe(
            tap((response) => {
              const { accessToken, user } = response;
              saveTokenToStorage(accessToken);
              saveUserToStorage(user);
              patchState(store, {
                user,
                token: accessToken,
                isLoggedIn: true,
                error: null,
              });
            }),
            catchError((error: ApiError) => {
              patchState(store, { error });
              console.error('Registration error:', error);
              return of(null);
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),

    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) =>
          userService.login(credentials).pipe(
            tap((response) => {
              const { accessToken, user } = response;
              saveTokenToStorage(accessToken);
              saveUserToStorage(user);
              patchState(store, {
                user,
                token: accessToken,
                isLoggedIn: true,
                error: null,
              });
            }),
            catchError((error: ApiError) => {
              patchState(store, { error });
              console.error('Login error:', error);
              return of(null);
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),

    logout(): void {
      clearStorage();
      patchState(store, {
        user: null,
        token: null,
        isLoggedIn: false,
        error: null,
      });
      console.log('User logged out successfully');
    },

    updateUser(updates: Partial<User>): void {
      const currentUser = store.user();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        saveUserToStorage(updatedUser);
        patchState(store, { user: updatedUser });
      }
    },

    getToken(): string | null {
      return store.token();
    },

    validateStoredAuth(): void {
      const token = store.token();
      const user = store.user();

      if ((token && !user) || (!token && user)) {
        console.warn('Invalid auth state detected, clearing storage');
        clearStorage();
        patchState(store, {
          user: null,
          token: null,
          isLoggedIn: false,
        });
      }
    },
  })),
  withHooks({
    onInit(store) {
      store.validateStoredAuth();
      console.log('UserStore initialized');
    },
  })
);
