import {ChangeDetectionStrategy, Component, inject, OnInit, signal, computed} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MovieService} from '../../services/movie-service';
import {ReviewService} from '../review-service';
import {CommentService} from '../comment-service';
import {UserStore} from '../../store/user-store';
import {OmdbMovieDetail, Review, Comment} from '../interfaces';

@Component({
  selector: 'app-movie-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './movie-page.html',
  styleUrl: './movie-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoviePage implements OnInit {
  route = inject(ActivatedRoute);
  movieService = inject(MovieService);
  reviewService = inject(ReviewService);
  commentService = inject(CommentService);
  userStore = inject(UserStore);

  movie = signal<OmdbMovieDetail | null>(null);
  reviews = signal<Review[]>([]);
  comments = signal<Comment[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Review form
  reviewRating = signal(5);
  reviewText = signal('');
  isSubmittingReview = signal(false);

  // Comment form
  commentText = signal('');
  isSubmittingComment = signal(false);

  isLoggedIn = computed(() => this.userStore.isAuthenticated());
  currentUser = computed(() => this.userStore.currentUser());

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const imdbId = params['imdbId'];
      if (imdbId) {
        this.loadMovieDetails(imdbId);
        this.loadReviews(imdbId);
        this.loadComments(imdbId);
      }
    });
  }

  loadMovieDetails(imdbId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.movieService.getMovieDetails(imdbId).subscribe({
      next: (movie) => {
        this.isLoading.set(false);
        if (movie.Response === 'True') {
          this.movie.set(movie);
        } else {
          this.error.set(movie.Error || 'Movie not found');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load movie details');
        console.error('Movie details error:', err);
      }
    });
  }

  loadReviews(imdbId: string): void {
    this.reviewService.getReviewsForMovie(imdbId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
      }
    });
  }

  loadComments(imdbId: string): void {
    this.commentService.getCommentsForMovie(imdbId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      }
    });
  }

  submitReview(): void {
    const movie = this.movie();
    const user = this.currentUser();

    if (!movie || !user) return;

    this.isSubmittingReview.set(true);

    this.reviewService.createReview(
      user.id!,
      movie.imdbID,
      this.reviewRating(),
      this.reviewText()
    ).subscribe({
      next: (review) => {
        this.reviews.update(reviews => [...reviews, review]);
        this.reviewText.set('');
        this.reviewRating.set(5);
        this.isSubmittingReview.set(false);
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        this.isSubmittingReview.set(false);
        alert('Failed to submit review. Please try again.');
      }
    });
  }

  submitComment(): void {
    const movie = this.movie();
    const user = this.currentUser();

    if (!movie || !user) return;

    this.isSubmittingComment.set(true);

    this.commentService.createComment(
      user.id!,
      movie.imdbID,
      this.commentText()
    ).subscribe({
      next: (comment) => {
        this.comments.update(comments => [...comments, comment]);
        this.commentText.set('');
        this.isSubmittingComment.set(false);
      },
      error: (err) => {
        console.error('Failed to submit comment:', err);
        this.isSubmittingComment.set(false);
        alert('Failed to submit comment. Please try again.');
      }
    });
  }

  getStarArray(rating: number): boolean[] {
    return Array.from({ length: 10 }, (_, i) => i < rating);
  }
}
