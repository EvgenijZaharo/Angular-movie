import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MovieStore} from '../../store/movie-store';
import {MovieCommentsComponent} from '../../shared/movie-comments/movie-comments';

@Component({
  selector: 'app-movie-page',
  imports: [
    MovieCommentsComponent
  ],
  templateUrl: './movie-page.html',
  styleUrl: './movie-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviePage implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  movieStore = inject(MovieStore);
  movie = this.movieStore.movieDetails;
  error = this.movieStore.detailsError;
  isLoading = this.movieStore.isLoadingDetails;
  currentImdbId = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      const imdbId = params['imdbId'];
      if (imdbId) {
        this.currentImdbId.set(imdbId);
        this.movieStore.loadMovieDetails(imdbId);
      }
    })
  }
}
