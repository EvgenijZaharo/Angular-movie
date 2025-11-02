import { ChangeDetectionStrategy, Component, inject, input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommentReviewStore } from '../../store/comment-review-store';
import { UserStore } from '../../store/user-store';
import { UserService } from '../../services/user-service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../app/interfaces';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-movie-comments',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './movie-comments.html',
  styleUrl: './movie-comments.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieCommentsComponent implements OnInit, OnDestroy {
  imdbId = input.required<string>();

  commentReviewStore = inject(CommentReviewStore);
  userStore = inject(UserStore);
  userService = inject(UserService);

  comments = this.commentReviewStore.comments;
  averageRating = this.commentReviewStore.averageRating;
  totalReviews = this.commentReviewStore.totalReviews;
  userReview = this.commentReviewStore.userReview;
  isLoading = this.commentReviewStore.isLoading;
  isSaving = this.commentReviewStore.isSaving;

  currentUser = this.userStore.currentUser;
  isAuthenticated = this.userStore.isAuthenticated;

  hoveredRating = signal<number>(0);
  userCache = signal<Map<string, User>>(new Map());

  currentRating = computed(() => {
    const review = this.userReview();
    return review ? review.rating : 0;
  });

  commentForm = new FormGroup({
    commentText: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(500)])
  });

  constructor() {
    toObservable(this.comments).pipe(
      switchMap(comments => {
        const uniqueUserIds = [...new Set(comments.map(c => c.userId))];
        const uncachedUserIds = uniqueUserIds.filter(userId => !this.userCache().has(userId));

        if (uncachedUserIds.length === 0) {
          return of(null);
        }

        return forkJoin(
          uncachedUserIds.map(userId =>
            this.userService.getUserById(userId).pipe(
              tap(user => {
                const cache = new Map(this.userCache());
                cache.set(userId, user);
                this.userCache.set(cache);
              })
            )
          )
        );
      }),
      takeUntilDestroyed()
    ).subscribe({
      error: (error) => console.error('Error loading user data:', error)
    });
  }

  ngOnInit(): void {
    const imdbId = this.imdbId();
    this.commentReviewStore.loadCommentsForMovie(imdbId);
    this.commentReviewStore.loadReviewsForMovie(imdbId);

    const user = this.currentUser();
    if (user) {
      this.commentReviewStore.loadUserReview(user.id, imdbId);
    }
  }

  ngOnDestroy(): void {
    this.commentReviewStore.clearState();
  }

  setRating(rating: number): void {
    if (!this.isAuthenticated()) return;

    const user = this.currentUser();
    if (!user) return;

    this.commentReviewStore.submitRating({
      userId: user.id,
      imdbId: this.imdbId(),
      rating
    });
  }

  hoverRating(rating: number): void {
    this.hoveredRating.set(rating);
  }

  clearHover(): void {
    this.hoveredRating.set(0);
  }

  submitComment(): void {
    if (!this.isAuthenticated() || this.commentForm.invalid) return;

    const user = this.currentUser();
    if (!user) return;

    const commentText = this.commentForm.value.commentText?.trim();
    if (!commentText) return;

    this.commentReviewStore.addComment({
      userId: user.id,
      imdbId: this.imdbId(),
      commentText
    }, () => {
      this.commentForm.reset();
    });
  }

  deleteComment(commentId: string): void {
    const user = this.currentUser();
    if (!user) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentReviewStore.deleteComment(commentId, user.id);
    }
  }

  deleteRating(): void {
    const user = this.currentUser();
    if (!user) return;

    if (confirm('Are you sure you want to delete your rating?')) {
      this.commentReviewStore.deleteRating(user.id, this.imdbId());
    }
  }

  canDeleteComment(comment: { userId: string }): boolean {
    const user = this.currentUser();
    return !!user && user.id === comment.userId;
  }

  getDisplayRating(): number {
    return this.hoveredRating() || this.currentRating();
  }

  isStarFilled(starNumber: number): boolean {
    return starNumber <= this.getDisplayRating();
  }

  getUserLogin(userId: string): string {
    const user = this.userCache().get(userId);
    return user?.login || `User ${userId.substring(0, 8)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

