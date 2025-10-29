import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MovieService} from '../../services/movie-service';
import {OmdbSearchItem} from '../interfaces';

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
  movieService = inject(MovieService);

  movies = signal<OmdbSearchItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const query = params['query'];
      if (query) {
        this.searchQuery.set(query);
        this.searchMovies(query);
      }
    });
  }

  searchMovies(query: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.movies.set([]);

    this.movieService.searchMovies(query).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        if (result.Response === 'True' && result.Search) {
          this.movies.set(result.Search);
        } else {
          this.error.set(result.Error || 'No movies found');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to search movies. Please try again.');
        console.error('Search error:', err);
      }
    });
  }

  navigateToMovie(imdbId: string): void {
    this.router.navigate(['/movie', imdbId]);
  }
}
