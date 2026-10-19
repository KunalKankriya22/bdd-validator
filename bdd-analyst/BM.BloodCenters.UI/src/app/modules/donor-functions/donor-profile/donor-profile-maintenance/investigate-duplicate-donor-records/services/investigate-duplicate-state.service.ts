import { Injectable } from '@angular/core';
import { InvestCheckSection } from '../models/investigate-duplicate-donor-records.model';

export interface InvestigateSavedState {
  batchId: string;
  selectedDonorId: string;
  visitedSections: Record<InvestCheckSection, boolean>;
  localChecks?: Record<InvestCheckSection, boolean>;
  localCheckMeta?: Record<InvestCheckSection, { user: string; date: string } | null>;
  localMergeFlag?: string;
  hadLocalChanges?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InvestigateDuplicateStateService {
  private savedState: InvestigateSavedState | null = null;

  save(state: InvestigateSavedState): void {
    this.savedState = state;
  }

  restore(): InvestigateSavedState | null {
    const state = this.savedState;
    this.savedState = null;
    return state;
  }

  hasSavedState(): boolean {
    return this.savedState !== null;
  }
}
