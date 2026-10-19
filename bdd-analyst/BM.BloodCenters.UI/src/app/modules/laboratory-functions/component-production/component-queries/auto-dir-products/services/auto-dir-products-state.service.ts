import { Injectable } from '@angular/core';
import {
  AutoDirProductsFilterForm,
  AutoDirProductsUnitDto,
  FilterChip
} from '../models/auto-dir-products.model';

const STATE_KEY = 'auto-dir-products-state';

/**
 * State interface for Auto/Dir Products screen
 */
export interface AutoDirProductsState {
  filters: AutoDirProductsFilterForm | null;
  units: AutoDirProductsUnitDto[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  selectedUnitId: string | null;
  filterChips: FilterChip[];
  searched: boolean;
}

/**
 * Service to preserve Auto/Dir Products screen state during navigation
 * Uses sessionStorage to ensure state clears on logout/tab close
 */
@Injectable({
  providedIn: 'root'
})
export class AutoDirProductsStateService {

  /**
   * Save current screen state to sessionStorage
   * Automatically cleared on browser tab close or logout
   */
  saveState(state: AutoDirProductsState): void {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save Auto/Dir Products state:', error);
    }
  }

  /**
   * Restore saved screen state from sessionStorage
   * Converts date strings back to Date objects
   */
  restoreState(): AutoDirProductsState | null {
    try {
      const stateJson = sessionStorage.getItem(STATE_KEY);
      if (!stateJson) {
        return null;
      }

      const state = JSON.parse(stateJson) as AutoDirProductsState;

      // Convert date strings back to Date objects in filters
      if (state.filters) {
        state.filters.fromDate = state.filters.fromDate ? new Date(state.filters.fromDate) : null;
        state.filters.toDate = state.filters.toDate ? new Date(state.filters.toDate) : null;
        state.filters.needByDate = state.filters.needByDate ? new Date(state.filters.needByDate) : null;
        state.filters.surgeryDate = state.filters.surgeryDate ? new Date(state.filters.surgeryDate) : null;
      }

      // Convert date strings back to Date objects in units
      if (state.units && state.units.length > 0) {
        state.units = state.units.map(unit => ({
          ...unit,
          collectionDate: new Date(unit.collectionDate),
          needByDate: unit.needByDate ? new Date(unit.needByDate) : undefined,
          surgeryDate: unit.surgeryDate ? new Date(unit.surgeryDate) : undefined,
          components: unit.components?.map(comp => ({
            ...comp,
            expiryDate: comp.expiryDate ? new Date(comp.expiryDate) : undefined
          })) || []
        }));
      }

      return state;
    } catch (error) {
      console.error('Failed to restore Auto/Dir Products state:', error);
      // Clear corrupted state
      this.clearState();
      return null;
    }
  }

  /**
   * Clear saved state from sessionStorage
   */
  clearState(): void {
    try {
      sessionStorage.removeItem(STATE_KEY);
    } catch (error) {
      console.error('Failed to clear Auto/Dir Products state:', error);
    }
  }

  /**
   * Check if state exists in sessionStorage
   */
  hasState(): boolean {
    try {
      return sessionStorage.getItem(STATE_KEY) !== null;
    } catch {
      return false;
    }
  }
}
