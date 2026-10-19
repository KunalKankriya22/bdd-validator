import { Injectable, inject } from '@angular/core';
import { ResetPasswordService } from '../../modules/reset-password-preview/reset-password.service';

interface PasswordResetTimer {
  userId: string;
  expiresAt: number; // timestamp
  timerId?: number; // setTimeout ID
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetTimerService {
  private readonly STORAGE_KEY = 'password_reset_timers';
  private readonly TIMER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private activeTimers = new Map<string, PasswordResetTimer>();
  private resetPasswordService = inject(ResetPasswordService);

  constructor() {
    // Initialize and check for expired timers on service creation
    this.initializeTimers();

    // Listen for storage changes from other tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.STORAGE_KEY) {
          this.syncTimersFromStorage();
        }
      });
    }
  }

  /**
   * Start a 24-hour timer for a user after password reset
   */
  startTimer(userId: string): void {
    // Clear any existing timer for this user
    this.clearTimer(userId);

    const expiresAt = Date.now() + this.TIMER_DURATION_MS;
    const timer: PasswordResetTimer = {
      userId,
      expiresAt
    };

    // Set up timeout to trigger password reset
    const timerId = window.setTimeout(() => {
      this.onTimerExpired(userId);
    }, this.TIMER_DURATION_MS);

    timer.timerId = timerId;
    this.activeTimers.set(userId, timer);

    // Persist to localStorage
    this.saveTimersToStorage();
  }

  /**
   * Clear/cancel timer for a specific user
   * Call this when user successfully changes their password
   */
  clearTimer(userId: string): void {
    const timer = this.activeTimers.get(userId);
    if (timer) {
      if (timer.timerId) {
        clearTimeout(timer.timerId);
      }

      this.activeTimers.delete(userId);
      this.saveTimersToStorage();
    }
  }

  /**
   * Check if a timer is active for a user
   */
  hasActiveTimer(userId: string): boolean {
    return this.activeTimers.has(userId);
  }

  /**
   * Get remaining time in milliseconds for a user's timer
   */
  getRemainingTime(userId: string): number | null {
    const timer = this.activeTimers.get(userId);
    if (!timer) {
      return null;
    }

    const remaining = timer.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Called when a timer expires - triggers password reset API
   */
  private onTimerExpired(userId: string): void {
    // Call the password reset API
    this.resetPasswordService.resetPassword(userId)
      .subscribe({
        next: () => {
          this.clearTimer(userId);
        },
        error: () => {
          // Retry after 1 minute if failed
          setTimeout(() => {
            if (this.activeTimers.has(userId)) {
              this.onTimerExpired(userId);
            }
          }, 60000); // 1 minute retry
        }
      });
  }

  /**
   * Initialize timers on app startup - restore from localStorage
   */
  private initializeTimers(): void {
    const stored = this.loadTimersFromStorage();
    const now = Date.now();

    stored.forEach(timer => {
      if (timer.expiresAt <= now) {
        // Timer has already expired - trigger immediately
        this.onTimerExpired(timer.userId);
      } else {
        // Timer still active - reschedule it
        const remainingTime = timer.expiresAt - now;

        const timerId = window.setTimeout(() => {
          this.onTimerExpired(timer.userId);
        }, remainingTime);

        this.activeTimers.set(timer.userId, {
          ...timer,
          timerId
        });
      }
    });
  }

  /**
   * Sync timers from localStorage (called when storage changes from another tab)
   */
  private syncTimersFromStorage(): void {
    // Clear all current timers
    this.activeTimers.forEach(timer => {
      if (timer.timerId) {
        clearTimeout(timer.timerId);
      }
    });
    this.activeTimers.clear();

    // Reinitialize from storage
    this.initializeTimers();
  }

  /**
   * Save timers to localStorage
   */
  private saveTimersToStorage(): void {
    const timersArray: PasswordResetTimer[] = Array.from(this.activeTimers.values()).map(timer => ({
      userId: timer.userId,
      expiresAt: timer.expiresAt
      // Don't store timerId - it's not serializable and will be recreated
    }));

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(timersArray));
    } catch (error) {
      // Silent fail - localStorage may be disabled
    }
  }

  /**
   * Load timers from localStorage
   */
  private loadTimersFromStorage(): PasswordResetTimer[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Silent fail - localStorage may be disabled or corrupted
    }
    return [];
  }

  /**
   * Clear all timers (for testing/debugging)
   */
  clearAllTimers(): void {
    this.activeTimers.forEach(timer => {
      if (timer.timerId) {
        clearTimeout(timer.timerId);
      }
    });

    this.activeTimers.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
