import { Routes } from '@angular/router';
import {AuthorizationPage} from '../pages/authorization-page/authorization-page';
import {CatalogPage} from '../pages/catalog-page/catalog-page';
import {MainPage} from '../pages/main-page/main-page';

export const routes: Routes = [
  {path: '', component: MainPage},
  {path: 'authorization', component: AuthorizationPage},
  {path: 'catalog/:query', component: CatalogPage},
  {path: 'filmer', component: CatalogPage},
];
