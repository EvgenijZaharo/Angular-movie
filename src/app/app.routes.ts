import { Routes } from '@angular/router';
import { MainPage } from '../pages/main-page/main-page';
import { guestGuard } from '../guards/guest.guard';

export const routes: Routes = [
  { path: '', component: MainPage },
  {
    path: 'authorization',
    loadComponent: () => import('../pages/authorization-page/authorization-page').then(m => m.AuthorizationPage),
    canActivate: [guestGuard]
  },
  {
    path: 'catalog/:query',
    loadComponent: () => import('../pages/catalog-page/catalog-page').then(m => m.CatalogPage)
  },
  {
    path: 'movie/:imdbId',
    loadComponent: () => import('../pages/movie-page/movie-page').then(m => m.MoviePage),
  }
];
