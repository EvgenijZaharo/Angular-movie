import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStore } from '../store/user-store';

export const guestGuard: CanActivateFn = () => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  if (!userStore.isLoggedIn()) {
    return true;
  }

  console.log('Already authenticated - redirecting to home');
  return router.createUrlTree(['/']);
};

