import { Injectable } from '@angular/core';
import { UnitRecord, UnitDetailsResponse, UnitTestResult, UnitAttribute, UnitInterdiction } from '../models/samples-query.model';

export interface SamplesQuerySavedState {
  filterFormValues: {
    osUnitId: string;
    collDate: any;
    receivedDate: any;
    batchId: string;
  };
  validatedUnitId: string | null;
  selectedBatchId: string | null;
  batchOptions: string[];
  units: UnitRecord[];
  totalRecords: number;
  pageSize: number;
  pageIndex: number;
  sortColumn: string;
  sortOrder: string;
  hasSearched: boolean;
  selectedUnit: UnitRecord | null;
  unitDetails: UnitDetailsResponse | null;
  testResults: UnitTestResult[];
  attributes: UnitAttribute[];
  interdictions: UnitInterdiction[];
  contractExpanded: boolean;
  testSortDir: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class SamplesQueryStateService {
  private savedState: SamplesQuerySavedState | null = null;

  save(state: SamplesQuerySavedState): void {
    this.savedState = state;
  }

  restore(): SamplesQuerySavedState | null {
    const state = this.savedState;
    this.savedState = null;
    return state;
  }

  hasSavedState(): boolean {
    return this.savedState !== null;
  }
}
