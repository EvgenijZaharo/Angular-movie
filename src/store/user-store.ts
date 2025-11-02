import { UserState, User, ApiError } from '../app/interfaces';
import { signalStore, withMethods, withState, patchState, withComputed, withHooks } from '@ngrx/signals';
import { inject } from '@angular/core';
import { UserService,  LoginCredentials } from '../services/user-service';
import { tap, catchError, of, finalize } from 'rxjs';

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
    register(userData: Omit<User, 'id' | 'createdAt'>, onSuccess?: () => void): void {
      patchState(store, { isLoading: true, error: null });

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
            onSuccess?.();
          }
        }),
        catchError((error: ApiError) => {
          patchState(store, { error });
          console.error('Registration error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isLoading: false })),
      ).subscribe();
    },

    login(credentials: LoginCredentials, onSuccess?: () => void): void {
      patchState(store, { isLoading: true, error: null });

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
            onSuccess?.();
          }
        }),
        catchError((error: ApiError) => {
          patchState(store, { error });
          console.error('Login error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isLoading: false })),
      ).subscribe();
    },

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
