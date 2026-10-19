import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * State interface for Batch In-Progress Query
 * Used to persist complete page state when navigating to related screens (NBEQ, etc.)
 */
export interface BatchInProgressState {
  // Contract context (for navigation to other screens)
  contractId: string;
  contractName: string | null;
  timestamp: number;

  // Full form state (for back navigation restoration)
  formState?: {
    queryMode: 'ALL' | 'EXCEPTIONS';
    includeUnitsWithoutResults: boolean;
  };

  // Filter state
  filterState?: {
    selectedChapterFilters: Array<{ unitId: string; label: string }>;
    selectedBatchFilters: Array<{ batchId: string; label: string }>;
  };

  // Search results state (optional - for performance, we don't cache heavy data)
  searchState?: {
    batches: any[];
    selectedBatchId: string | null;
    selectedUnitId: string | null;
    hasSearched: boolean;
    totalBatches: number;
    totalUnits: number;
    unitsWithoutResults: number;
  };
}

/**
 * Shared state service for Batch In-Progress Query
 *
 * Purpose: Preserves complete page state across navigation
 * - When user navigates away (e.g., to Non-Extracted Batch Query)
 * - And returns using browser back button
 * - All form data, filters, and search results are restored
 *
 * Pattern: Enhanced version of DonorStateService with both in-memory and sessionStorage
 *
 * Features:
 * - BehaviorSubject for reactive state updates
 * - Optional sessionStorage persistence (survives page refresh)
 * - Auto-expiry after 30 minutes
 * - Observable stream for component reactivity
 *
 * Usage:
 * ```typescript
 * // Save state before navigation
 * this.stateService.setPageState({
 *   contractId: '123',
 *   contractName: 'West Blood Center',
 *   timestamp: Date.now(),
 *   formState: { ... },
 *   filterState: { ... }
 * });
 *
 * // Restore state on component init
 * const savedState = this.stateService.getPageState();
 * if (savedState && this.isStateRecent(savedState)) {
 *   this.restoreFormAndFilters(savedState);
 * }
 *
 * // Subscribe to state changes (reactive)
 * this.stateService.getPageState$().subscribe(state => {
 *   if (state) {
 *     this.handleStateChange(state);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class BatchInProgressStateService {
  private static readonly STORAGE_KEY = 'batchInProgressQueryState';
  private static readonly MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * BehaviorSubject for reactive state management
   * Loads initial state from sessionStorage if available
   */
  private pageStateSubject = new BehaviorSubject<BatchInProgressState | null>(
    this.loadFromStorage()
  );

  /**
   * Observable stream of page state changes
   * Components can subscribe to react to state updates
   */
  getPageState$(): Observable<BatchInProgressState | null> {
    return this.pageStateSubject.asObservable();
  }

  /**
   * Get current page state synchronously
   * Automatically checks for expiry and clears if expired
   */
  getPageState(): BatchInProgressState | null {
    const current = this.pageStateSubject.value;

    // Check if state has expired
    if (current && this.isExpired(current)) {
      this.clearPageState();
      return null;
    }

    return current;
  }

  /**
   * Save complete page state
   * Stores in both memory (BehaviorSubject) and sessionStorage
   *
   * @param state - Complete page state to save
   * @param persistToStorage - If true, saves to sessionStorage (survives page refresh)
   */
  setPageState(state: BatchInProgressState, persistToStorage = false): void {
    const stateWithTimestamp: BatchInProgressState = {
      ...state,
      timestamp: Date.now(),
    };

    // Update in-memory state (reactive)
    this.pageStateSubject.next(stateWithTimestamp);

    // Optionally persist to sessionStorage
    if (persistToStorage) {
      this.saveToStorage(stateWithTimestamp);
    }
  }

  /**
   * Clear page state from both memory and storage
   */
  clearPageState(): void {
    this.pageStateSubject.next(null);
    this.removeFromStorage();
    this.clearNavigationFlag();
  }

  /**
   * Mark that user is navigating away from BIPQ
   * This flag tells us to restore state when they return
   */
  setNavigatingAway(): void {
    try {
      sessionStorage.setItem('bipq_navigating_away', 'true');
    } catch (error) {
      console.error('[BatchInProgressStateService] Failed to set navigation flag:', error);
    }
  }

  /**
   * Check if user navigated away (and should restore state on return)
   */
  isNavigatingBack(): boolean {
    try {
      const flag = sessionStorage.getItem('bipq_navigating_away');
      return flag === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear navigation flag after restoration
   */
  clearNavigationFlag(): void {
    try {
      sessionStorage.removeItem('bipq_navigating_away');
    } catch (error) {
      console.error('[BatchInProgressStateService] Failed to clear navigation flag:', error);
    }
  }

  /**
   * Check if page state exists
   */
  hasPageState(): boolean {
    return this.getPageState() !== null;
  }

  /**
   * Check if state is recent (within last 5 minutes)
   * Useful for deciding whether to auto-restore on navigation
   */
  isStateRecent(state: BatchInProgressState, maxAgeMinutes = 5): boolean {
    const maxAge = maxAgeMinutes * 60 * 1000;
    return (Date.now() - state.timestamp) < maxAge;
  }

  /**
   * Update only the contract context (lightweight)
   * Useful when navigating to related screens
   */
  updateContractContext(contractId: string, contractName: string | null): void {
    const current = this.getPageState();
    const updated: BatchInProgressState = current
      ? { ...current, contractId, contractName, timestamp: Date.now() }
      : { contractId, contractName, timestamp: Date.now() };

    this.setPageState(updated);
  }

  /**
   * Update only the filter state (without re-saving form or search data)
   */
  updateFilterState(filterState: BatchInProgressState['filterState']): void {
    const current = this.getPageState();
    if (!current) return;

    this.setPageState({
      ...current,
      filterState,
      timestamp: Date.now(),
    });
  }

  // ========================================
  // Private helper methods
  // ========================================

  /**
   * Check if state has expired (older than 30 minutes)
   */
  private isExpired(state: BatchInProgressState): boolean {
    return (Date.now() - state.timestamp) > BatchInProgressStateService.MAX_AGE_MS;
  }

  /**
   * Load state from sessionStorage on service initialization
   */
  private loadFromStorage(): BatchInProgressState | null {
    try {
      const stored = sessionStorage.getItem(BatchInProgressStateService.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const state: BatchInProgressState = JSON.parse(stored);

      // Validate required fields
      if (!state.contractId || !state.timestamp) {
        this.removeFromStorage();
        return null;
      }

      // Check expiry
      if (this.isExpired(state)) {
        this.removeFromStorage();
        return null;
      }

      return state;
    } catch (error) {
      console.error('[BatchInProgressStateService] Failed to load state from storage:', error);
      this.removeFromStorage();
      return null;
    }
  }

  /**
   * Save state to sessionStorage
   */
  private saveToStorage(state: BatchInProgressState): void {
    try {
      // Remove heavy data before storing (batches array can be large)
      const stateToStore: BatchInProgressState = {
        ...state,
        searchState: state.searchState
          ? {
              ...state.searchState,
              batches: [], // Don't store batches array - will re-fetch on restore
            }
          : undefined,
      };

      sessionStorage.setItem(
        BatchInProgressStateService.STORAGE_KEY,
        JSON.stringify(stateToStore)
      );
    } catch (error) {
      console.error('[BatchInProgressStateService] Failed to save state to storage:', error);
    }
  }

  /**
   * Get full search state including batches and selections
   * Used for restoring complete UI state on return
   */
  getSearchState(): BatchInProgressState['searchState'] | undefined {
    const state = this.getPageState();
    return state?.searchState;
  }

  /**
   * Update complete search state (including batches, selections)
   * Used to preserve full UI state before navigation
   */
  setSearchState(searchState: BatchInProgressState['searchState']): void {
    const current = this.getPageState();
    if (!current) return;

    this.setPageState({
      ...current,
      searchState,
      timestamp: Date.now(),
    }, false); // Don't persist heavy data to sessionStorage
  }

  /**
   * Remove state from sessionStorage
   */
  private removeFromStorage(): void {
    try {
      sessionStorage.removeItem(BatchInProgressStateService.STORAGE_KEY);
    } catch (error) {
      console.error('[BatchInProgressStateService] Failed to remove state from storage:', error);
    }
  }

  // ========================================
  // Legacy methods for backward compatibility
  // ========================================

  setSelectedContract(state: BatchInProgressState): void {
    this.setPageState(state);
  }

  getSelectedContract(): BatchInProgressState | null {
    return this.getPageState();
  }

  clearSelectedContract(): void {
    this.clearPageState();
  }

  hasSelectedContract(): boolean {
    return this.hasPageState();
  }
}
