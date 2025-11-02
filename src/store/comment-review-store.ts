import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';
import { inject } from '@angular/core';
import { ReviewService } from '../services/review-service';
import { CommentService } from '../services/comment-service';
import { tap, catchError, of, finalize } from 'rxjs';
import { Review, Comment } from '../app/interfaces';

interface CommentReviewState {
  comments: Comment[];
  reviews: Review[];
  userReview: Review | null;
  isLoadingComments: boolean;
  isLoadingReviews: boolean;
  isSavingComment: boolean;
  isSavingReview: boolean;
  commentsError: string | null;
  reviewsError: string | null;
  averageRating: number;
  totalReviews: number;
}

export const CommentReviewStore = signalStore(
  { providedIn: 'root' },
  withState<CommentReviewState>({
    comments: [],
    reviews: [],
    userReview: null,
    isLoadingComments: false,
    isLoadingReviews: false,
    isSavingComment: false,
    isSavingReview: false,
    commentsError: null,
    reviewsError: null,
    averageRating: 0,
    totalReviews: 0,
  }),
  withComputed((store) => ({
    isLoading: () => store.isLoadingComments() || store.isLoadingReviews(),
    isSaving: () => store.isSavingComment() || store.isSavingReview(),
    hasUserReview: () => store.userReview() !== null,
  })),
  withMethods((store, reviewService = inject(ReviewService), commentService = inject(CommentService)) => ({
    loadCommentsForMovie(imdbId: string): void {
      if (!imdbId) return;

      patchState(store, { isLoadingComments: true, commentsError: null });

      commentService.getCommentsForMovie(imdbId).pipe(
        tap((comments) => {
          patchState(store, {
            comments: comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            commentsError: null,
          });
        }),
        catchError((error) => {
          patchState(store, {
            comments: [],
            commentsError: error.error || 'Failed to load comments',
          });
          console.error('Load comments error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isLoadingComments: false })),
      ).subscribe();
    },

    loadReviewsForMovie(imdbId: string): void {
      if (!imdbId) return;

      patchState(store, { isLoadingReviews: true, reviewsError: null });

      reviewService.getReviewsForMovie(imdbId).pipe(
        tap((reviews) => {
          const total = reviews.length;
          const average = total > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
            : 0;

          patchState(store, {
            reviews,
            averageRating: Math.round(average * 10) / 10,
            totalReviews: total,
            reviewsError: null,
          });
        }),
        catchError((error) => {
          patchState(store, {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            reviewsError: error.error || 'Failed to load reviews',
          });
          console.error('Load reviews error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isLoadingReviews: false })),
      ).subscribe();
    },

    loadUserReview(userId: string, imdbId: string): void {
      if (!userId || !imdbId) return;

      reviewService.getUserReviewForMovie(userId, imdbId).pipe(
        tap((reviews) => {
          patchState(store, {
            userReview: reviews.length > 0 ? reviews[0] : null,
          });
        }),
        catchError((error) => {
          console.error('Load user review error:', error);
          patchState(store, { userReview: null });
          return of(null);
        }),
      ).subscribe();
    },

    addComment(comment: Omit<Comment, 'id' | 'createdAt'>, onSuccess?: () => void): void {
      patchState(store, { isSavingComment: true, commentsError: null });

      commentService.createComment(comment).pipe(
        tap((newComment) => {
          const updatedComments = [newComment, ...store.comments()];
          patchState(store, {
            comments: updatedComments,
            commentsError: null,
          });
          onSuccess?.();
        }),
        catchError((error) => {
          patchState(store, {
            commentsError: error.error || 'Failed to add comment',
          });
          console.error('Add comment error:', error);
          return of(null);
        }),
        finalize(() => patchState(store, { isSavingComment: false })),
      ).subscribe();
    },

    deleteComment(commentId: string, userId: string): void {
      const comment = store.comments().find(c => c.id === commentId);
      if (!comment || comment.userId !== userId) {
        console.error('Unauthorized to delete this comment');
        return;
      }

      commentService.deleteComment(commentId).pipe(
        tap(() => {
          const updatedComments = store.comments().filter(c => c.id !== commentId);
          patchState(store, { comments: updatedComments });
        }),
        catchError((error) => {
          console.error('Delete comment error:', error);
          return of(null);
        }),
      ).subscribe();
    },

    submitRating(review: Omit<Review, 'id' | 'createdAt'>, onSuccess?: () => void): void {
      const existingReview = store.userReview();

      patchState(store, { isSavingReview: true, reviewsError: null });

      if (existingReview) {
        reviewService.updateReview(existingReview.id, review.rating).pipe(
          tap((updatedReview) => {
            patchState(store, {
              userReview: updatedReview,
              reviewsError: null,
            });
            this.loadReviewsForMovie(review.imdbId);
            onSuccess?.();
          }),
          catchError((error) => {
            patchState(store, {
              reviewsError: error.error || 'Failed to update rating',
            });
            console.error('Update review error:', error);
            return of(null);
          }),
          finalize(() => patchState(store, { isSavingReview: false })),
        ).subscribe();
      } else {
        reviewService.createReview(review).pipe(
          tap((newReview) => {
            patchState(store, {
              userReview: newReview,
              reviewsError: null,
            });
            this.loadReviewsForMovie(review.imdbId);
            onSuccess?.();
          }),
          catchError((error) => {
            patchState(store, {
              reviewsError: error.error || 'Failed to submit rating',
            });
            console.error('Create review error:', error);
            return of(null);
          }),
          finalize(() => patchState(store, { isSavingReview: false })),
        ).subscribe();
      }
    },

    deleteRating(userId: string, imdbId: string): void {
      const userReview = store.userReview();
      if (!userReview || userReview.userId !== userId) {
        console.error('Unauthorized to delete this review');
        return;
      }

      reviewService.deleteReview(userReview.id).pipe(
        tap(() => {
          patchState(store, { userReview: null });
          this.loadReviewsForMovie(imdbId);
        }),
        catchError((error) => {
          console.error('Delete review error:', error);
          return of(null);
        }),
      ).subscribe();
    },

    clearState(): void {
      patchState(store, {
        comments: [],
        reviews: [],
        userReview: null,
        isLoadingComments: false,
        isLoadingReviews: false,
        isSavingComment: false,
        isSavingReview: false,
        commentsError: null,
        reviewsError: null,
        averageRating: 0,
        totalReviews: 0,
      });
    },
  })),
);

