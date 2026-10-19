import { Injectable } from '@angular/core';
import { DonorSearchResultDto, ValueCodeOption, DriveLovOption } from '../models/donors-by-events-query.model';

export interface DeqSavedState {
  filterFormValues: {
    searchType: string | null;
    startDate: any;
    endDate: any;
    code: string;
    driveId: string;
    includePinMailed: boolean;
  };
  dataSource: DonorSearchResultDto[];
  totalCount: number;
  pageSize: number;
  pageIndex: number;
  donorIdSortDir: 'ASC' | 'DESC' | null;
  expandedRows: { [donorId: string]: boolean };
  valueCodes: ValueCodeOption[];
  drivesLov: DriveLovOption[];
  codeDescription: string | null;
  reopenDonorId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DonorsByEventsQueryStateService {
  private savedState: DeqSavedState | null = null;

  save(state: DeqSavedState): void {
    this.savedState = state;
  }

  restore(): DeqSavedState | null {
    const state = this.savedState;
    this.savedState = null;
    return state;
  }

  hasSavedState(): boolean {
    return this.savedState !== null;
  }
}
