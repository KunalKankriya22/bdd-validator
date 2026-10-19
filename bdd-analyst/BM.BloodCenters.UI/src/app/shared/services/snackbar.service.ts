import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Shared service for displaying snackbar notifications
 * Provides consistent styling and positioning for success and error messages
 */
@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Display a success snackbar notification
   * @param message The message to display
   * @param action Optional action button text (default: 'Close')
   */
  showSuccess(message: string, action: string = 'DISMISS'): void {
    // Dismiss any existing snackbar first to prevent stacking
    this.snackBar.dismiss();

    const config: MatSnackBarConfig = {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 8000,
      panelClass: ['success-snackbar']
    };

    const snackBarRef = this.snackBar.open(message, action, config);

    // Ensure dismiss button works
    snackBarRef.onAction().subscribe(() => {
      snackBarRef.dismiss();
    });
  }

  /**
   * Display an error snackbar notification
   * @param message The error message to display
   * @param action Optional action button text (default: 'Close')
   * @param duration Optional duration in milliseconds (default: 0 for indefinite)
   */
  showError(message: string, action: string = 'DISMISS', duration: number = 0): void {
    // Dismiss any existing snackbar first to prevent stacking
    this.snackBar.dismiss();

    const config: MatSnackBarConfig = {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: duration,
      panelClass: ['error-snackbar']
    };

    const snackBarRef = this.snackBar.open(message, action, config);

    snackBarRef.onAction().subscribe(() => {
      snackBarRef.dismiss();
    });
  }

  showInfo(message: string, action: string = 'DISMISS'): void {
    this.snackBar.dismiss();

    const config: MatSnackBarConfig = {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 8000,
      panelClass: ['info-snackbar']
    };

    const snackBarRef = this.snackBar.open(message, action, config);

    snackBarRef.onAction().subscribe(() => {
      snackBarRef.dismiss();
    });
  }
}
