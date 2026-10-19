import { Injectable, signal, computed } from '@angular/core';
import { 
  ErrorCode, 
  ErrorCodeFilter, 
  TabType,
  PaginationParams,
  ErrorCodeListRequest
} from '../models/error-code.model';

interface TabState {
  filters: ErrorCodeFilter;
  searchKeyword: string;
  pagination: PaginationParams;
  sort: string | null;
}

/**
 * State management service using Angular signals
 * Follows Angular signal-based state management best practices
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorCodeStateService {
  // Per-tab state storage
  private tabStates = new Map<TabType, TabState>();
  
  // Signals for reactive state management
  private currentTab = signal<TabType>(TabType.DONOR);
  private errorCodes = signal<ErrorCode[]>([]);
  private loading = signal<boolean>(false);
  private totalRecords = signal<number>(0);
  private currentFilters = signal<ErrorCodeFilter>({
    codeFrom: '',
    codeTo: '',
    errorType: null,
    auditFlag: null,
    showEmpty: false
  });
  private searchKeyword = signal<string>('');
  private pagination = signal<PaginationParams>({
    take: 25,
    skip: 0
  });
  private sort = signal<string | null>(null);

  // Computed values
  currentTab$ = computed(() => this.currentTab());
  errorCodes$ = computed(() => this.errorCodes());
  loading$ = computed(() => this.loading());
  totalRecords$ = computed(() => this.totalRecords());
  currentFilters$ = computed(() => this.currentFilters());
  searchKeyword$ = computed(() => this.searchKeyword());
  pagination$ = computed(() => this.pagination());
  sort$ = computed(() => this.sort());

  // Setters
  setCurrentTab(tab: TabType): void {
    // Switch to new tab
    this.currentTab.set(tab);

    // Always clear filters when switching tabs
    this.restoreTabState(tab);
  }

  private restoreTabState(tab: TabType): void {
    // Always use default/cleared state when switching tabs
    // Don't restore saved state - user wants filters cleared on tab switch
    this.currentFilters.set({
      codeFrom: '',
      codeTo: '',
      errorType: null,
      auditFlag: null,
      showEmpty: false
    });
    this.searchKeyword.set('');
    this.pagination.set({ take: 25, skip: 0 });
    this.sort.set(null);
  }

  setErrorCodes(codes: ErrorCode[]): void {
    this.errorCodes.set(codes);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setTotalRecords(total: number): void {
    this.totalRecords.set(total);
  }

  setFilters(filters: ErrorCodeFilter): void {
    this.currentFilters.set(filters);
    this.resetPagination();
  }

  setSearchKeyword(keyword: string): void {
    this.searchKeyword.set(keyword);
    this.resetPagination();
  }

  setPagination(params: PaginationParams): void {
    this.pagination.set(params);
  }

  setSort(sort: string | null): void {
    this.sort.set(sort);
  }

  resetPagination(): void {
    // Reset to first page but preserve the current page size
    const currentPageSize = this.pagination().take;
    this.pagination.set({ take: currentPageSize, skip: 0 });
  }

  clearFilters(): void {
    this.currentFilters.set({
      codeFrom: '',
      codeTo: '',
      errorType: null,
      auditFlag: null,
      showEmpty: false
    });
    this.searchKeyword.set('');
    this.resetPagination();
  }

  /**
   * Build API request from current state
   */
  buildListRequest(): ErrorCodeListRequest {
    const filters = this.currentFilters();
    const keyword = this.searchKeyword();
    const sortValue = this.sort();

    const request: ErrorCodeListRequest = {};

    if (keyword) {
      request.searchKeyword = keyword;
    }
    if (filters.codeFrom) {
      request.codeFrom = filters.codeFrom;
    }
    if (filters.codeTo) {
      request.codeTo = filters.codeTo;
    }
    if (filters.auditFlag) {
      request.auditFlag = filters.auditFlag;
    }
    if (filters.errorType) {
      request.errorType = filters.errorType;
    }
    // Only include showEmpty if it's true (checked)
    if (filters.showEmpty === true) {
      request.showEmpty = filters.showEmpty;
    }
    if (sortValue) {
      request.sort = sortValue;
    }
    return request;
  }

  /**
   * Update a specific error code in the list
   */
  updateErrorCodeInList(updatedCode: ErrorCode): void {
    const codes = this.errorCodes();
    const index = codes.findIndex(c => c.errorCode === updatedCode.errorCode);
    if (index !== -1) {
      const newCodes = [...codes];
      newCodes[index] = updatedCode;
      this.errorCodes.set(newCodes);
    }
  }

  /**
   * Add new error code to the list
   */
  addErrorCodeToList(newCode: ErrorCode): void {
    const codes = this.errorCodes();
    this.errorCodes.set([newCode, ...codes]);
    this.totalRecords.set(this.totalRecords() + 1);
  }

  /**
   * Clear all tab states when navigating away from component
   */
  resetAllStates(): void {
    // Clear saved tab states
    this.tabStates.clear();

    // Reset to default state
    this.currentFilters.set({
      codeFrom: '',
      codeTo: '',
      errorType: null,
      auditFlag: null,
      showEmpty: false
    });
    this.searchKeyword.set('');
    this.pagination.set({ take: 25, skip: 0 });
    this.sort.set(null);
    this.errorCodes.set([]);
    this.totalRecords.set(0);
  }
}