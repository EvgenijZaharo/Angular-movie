import { Routes } from '@angular/router';
import {AuthorizationPage} from './authorization-page/authorization-page';
import {CatalogPage} from './catalog-page/catalog-page';
import {MainPage} from './main-page/main-page';
import {MoviePage} from './movie-page/movie-page';

export const routes: Routes = [
  {path: '', component: MainPage},
  {path: 'authorization', component: AuthorizationPage},
  {path: 'catalog/:query', component: CatalogPage},
  {path: 'movie/:imdbId', component: MoviePage},
  {path: 'filmer', component: CatalogPage},
];
