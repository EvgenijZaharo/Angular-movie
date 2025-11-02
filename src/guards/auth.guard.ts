import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStore } from '../store/user-store';

export const authGuard: CanActivateFn = () => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  if (userStore.isLoggedIn()) {
    return true;
  }

  console.log('Access denied - redirecting to authorization');
  return router.createUrlTree(['/authorization']);
};

