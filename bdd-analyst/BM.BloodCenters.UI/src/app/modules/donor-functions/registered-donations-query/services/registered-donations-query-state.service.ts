import { Injectable } from '@angular/core';
import { DonationQueryResult, DriveOption, UserOption, SetOption } from '../models/registered-donations-query.model';

export interface RdqSavedState {
  filterFormValues: {
    driveDateFrom: any;
    driveDateTo: any;
    driveId: string | null;
    userId: string | null;
    setId: string | null;
  };
  unitIdRaw: string;
  allData: DonationQueryResult[];
  dataSource: DonationQueryResult[];
  totalFound: number;
  hasRetrievedData: boolean;
  showEmptyState: boolean;
  currentSortColumn: string;
  currentSortDirection: 'A' | 'D' | 'default';
  driveOptions: DriveOption[];
  userOptions: UserOption[];
  setOptions: SetOption[];
}

@Injectable({
  providedIn: 'root',
})
export class RegisteredDonationsQueryStateService {
  private savedState: RdqSavedState | null = null;

  save(state: RdqSavedState): void {
    this.savedState = state;
  }

  restore(): RdqSavedState | null {
    const state = this.savedState;
    this.savedState = null;
    return state;
  }

  hasSavedState(): boolean {
    return this.savedState !== null;
  }
}
