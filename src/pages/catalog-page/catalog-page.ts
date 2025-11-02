import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MovieStore} from '../../store/movie-store';

@Component({
  selector: 'app-catalog-page',
  imports: [CommonModule],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  movieStore = inject(MovieStore);

  movies = this.movieStore.searchResults;
  isLoading = this.movieStore.isSearching;
  error = this.movieStore.searchError;
  searchQuery = this.movieStore.searchQuery;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const query = params['query'];
      if (query) {
        this.movieStore.searchMovies(query);
      }
    });
  }

  navigateToMovie(imdbId: string): void {
    this.router.navigate(['/movie', imdbId]);
  }
}
