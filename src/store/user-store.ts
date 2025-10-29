import { UserState, User, ApiError } from '../app/interfaces';
import { signalStore, withMethods, withState, patchState, withComputed, withHooks } from '@ngrx/signals';
import { inject } from '@angular/core';
import { UserService,  LoginCredentials } from '../app/user-service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, of, switchMap, finalize } from 'rxjs';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState<UserState>(() => {
    const userService = inject(UserService);
    const storedUser = userService.readUserFromStorage();
    const storedToken = userService.readTokenFromStorage();
    return {
      user: storedUser,
      token: storedToken,
      isLoggedIn: !!(storedUser && storedToken),
      isLoading: false,
      error: null,
    };
  }),
  withComputed(({ user, isLoggedIn }) => ({
    currentUser: user,
    isAuthenticated: isLoggedIn,
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

    register: rxMethod<Omit<User, 'id' | 'createdAt'>>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((userData) =>
          userService.createUser(userData).pipe(
            tap((response) => {
              const { accessToken, user } = response;
              if (accessToken && user) {
                userService.saveTokenToStorage(accessToken);
                userService.saveUserToStorage(user);
                patchState(store, {
                  user,
                  token: accessToken,
                  isLoggedIn: true,
                  error: null,
                });
                console.log('User authenticated successfully');
              }
            }),
            catchError((error: ApiError) => {
              patchState(store, { error });
              console.error('Registration error:', error);
              return of(null);
            }),
            finalize(() => patchState(store, { isLoading: false })),
          ),
        ),
      ),
    ),

    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) =>
          userService.login(credentials).pipe(
            tap((response) => {
              const { accessToken, user } = response;
              if (accessToken && user) {
                userService.saveTokenToStorage(accessToken);
                userService.saveUserToStorage(user);
                patchState(store, {
                  user,
                  token: accessToken,
                  isLoggedIn: true,
                  error: null,
                });
                console.log('User authenticated successfully');
              }
            }),
            catchError((error: ApiError) => {
              patchState(store, { error: error });
              console.error('Login error:', error);
              return of(null);
            }),
            finalize(() => patchState(store, { isLoading: false })),
          ),
        ),
      ),
    ),

    logout(): void {
      userService.clearStorage();
      patchState(store, {
        user: null,
        token: null,
        isLoggedIn: false,
        error: null,
      });
      console.log('User logged out successfully');
    },

    getToken(): string | null {
      return store.token();
    },

    validateStoredAuth(): void {
      const token = store.token();
      const user = store.user();
      if ((token && !user) || (!token && user)) {
        console.warn('Invalid auth state detected, clearing storage');
        userService.clearStorage();
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
  }),
);
