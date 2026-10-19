import { Injectable } from '@angular/core';
import { LovOption, ContractOption } from '../models/standing-order.model';

export interface StandingOrderListState {
  customerType: string | null;
  contractId: string | null;
  consigneeId: string | null;
  contracts: ContractOption[];
  consignees: LovOption[];
}

@Injectable({ providedIn: 'root' })
export class StandingOrderStateService {
  private savedState: StandingOrderListState | null = null;

  save(state: StandingOrderListState): void {
    this.savedState = state;
  }

  restore(): StandingOrderListState | null {
    const state = this.savedState;
    this.savedState = null;
    return state;
  }
}
