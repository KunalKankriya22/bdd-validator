import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Selected Donor Context
 * Stores information about the currently selected donor
 */
export interface SelectedDonorContext {
  donorId: string;
  donorName?: string;
  timestamp: number; // When this selection was made
}

/**
 * Donor State Service
 * Manages the currently selected donor across the application
 * Provides persistence across navigation using BehaviorSubject
 *
 * Usage:
 * - Call setSelectedDonor() when a donor is selected from search
 * - Call getSelectedDonor$() to observe current selection
 * - Call clearSelectedDonor() to reset
 *
 * @example
 * // In search component (after selection):
 * this.donorStateService.setSelectedDonor({ donorId: '12345', donorName: 'Smith, John' });
 *
 * // In detail component (on init):
 * this.donorStateService.getSelectedDonor$().subscribe(donor => {
 *   if (donor) {
 *     this.loadDonorDetails(donor.donorId);
 *   }
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class DonorStateService {
  private readonly STORAGE_KEY = 'selectedDonor';
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  private selectedDonorSubject = new BehaviorSubject<SelectedDonorContext | null>(
    this.loadFromStorage()
  );

  /**
   * Observable stream of the currently selected donor
   * Emits null if no donor is selected or selection has expired
   */
  getSelectedDonor$(): Observable<SelectedDonorContext | null> {
    return this.selectedDonorSubject.asObservable();
  }

  /**
   * Get current selected donor synchronously
   * @returns Current donor context or null
   */
  getSelectedDonor(): SelectedDonorContext | null {
    const current = this.selectedDonorSubject.value;

    // Check if selection has expired
    if (current && this.isExpired(current)) {
      this.clearSelectedDonor();
      return null;
    }

    return current;
  }

  /**
   * Set the currently selected donor
   * Persists to sessionStorage for cross-navigation support
   * @param donor Donor context to set
   */
  setSelectedDonor(donor: SelectedDonorContext): void {
    const context: SelectedDonorContext = {
      ...donor,
      timestamp: Date.now(),
    };

    this.selectedDonorSubject.next(context);
    this.saveToStorage(context);
  }

  /**
   * Clear the currently selected donor
   */
  clearSelectedDonor(): void {
    this.selectedDonorSubject.next(null);
    this.removeFromStorage();
  }

  /**
   * Check if a donor context has expired
   */
  private isExpired(context: SelectedDonorContext): boolean {
    const age = Date.now() - context.timestamp;
    return age > this.MAX_AGE_MS;
  }

  /**
   * Load donor context from sessionStorage
   */
  private loadFromStorage(): SelectedDonorContext | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const context: SelectedDonorContext = JSON.parse(stored);

      // Validate and check expiry
      if (!context.donorId || this.isExpired(context)) {
        this.removeFromStorage();
        return null;
      }

      return context;
    } catch (error) {
      console.error('Failed to load donor context from storage:', error);
      this.removeFromStorage();
      return null;
    }
  }

  /**
   * Save donor context to sessionStorage
   */
  private saveToStorage(context: SelectedDonorContext): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Failed to save donor context to storage:', error);
    }
  }

  /**
   * Remove donor context from sessionStorage
   */
  private removeFromStorage(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove donor context from storage:', error);
    }
  }
}
