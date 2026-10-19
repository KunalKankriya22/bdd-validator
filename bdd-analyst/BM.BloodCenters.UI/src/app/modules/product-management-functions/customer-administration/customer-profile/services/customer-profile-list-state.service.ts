import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CustomerProfileDto } from '../models/customer-profile.model';
import { CustomerProfileFilterValue } from '../customer-profile-list/customer-profile-list';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

export interface CustomerProfileListSavedState {
  showTerminated: string;
  dataSource: CustomerProfileDto[];
  totalRecords: number;
  searchKeyword: string;
  pageSize: number;
  pageIndex: number;
  sortColumn: string;
  sortOrder: string;
  appliedFilters: CustomerProfileFilterValue | null;
  filterChips: FilterChip[];
  hasSearched: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerProfileListStateService {
  private readonly router = inject(Router);
  private savedState: CustomerProfileListSavedState | null = null;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      if (this.savedState && !e.urlAfterRedirects.includes('/create-customer-profile')) {
        this.savedState = null;
      }
    });
  }

  save(state: CustomerProfileListSavedState): void {
    this.savedState = state;
  }

  restore(): CustomerProfileListSavedState | null {
    const state = this.savedState;
    this.savedState = null;
    return state;
  }

  clear(): void {
    this.savedState = null;
  }

  hasSavedState(): boolean {
    return this.savedState !== null;
  }
}
