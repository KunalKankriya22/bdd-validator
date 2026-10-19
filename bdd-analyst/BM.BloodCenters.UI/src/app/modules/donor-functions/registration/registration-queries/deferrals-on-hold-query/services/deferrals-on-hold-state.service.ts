import { Injectable } from '@angular/core';

/**
 * Service to manage navigation state for Deferrals on Hold Query
 * Preserves filter state when navigating to child screens and back
 */
@Injectable({
  providedIn: 'root'
})
export class DeferralsOnHoldStateService {
  private savedState: Record<string, any> | null = null;

  /**
   * Save current filter state
   */
  saveState(state: Record<string, any>): void {
    this.savedState = { ...state };
  }

  /**
   * Get saved filter state
   */
  getState(): Record<string, any> | null {
    return this.savedState ? { ...this.savedState } : null;
  }

  /**
   * Clear saved state
   */
  clearState(): void {
    this.savedState = null;
  }

  /**
   * Check if there is saved state
   */
  hasState(): boolean {
    return this.savedState !== null && Object.keys(this.savedState).length > 0;
  }
}
