import { Injectable, inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorCodeApiService } from './error-code-api.service';
import { ErrorCodeStateService } from './error-code-state.service';
import { 
  ErrorCodeCreateRequest, 
  ErrorCodeFilter,
  TabType,
  PaginationParams
} from '../models/error-code.model';

/**
 * Facade service that orchestrates API calls and state management
 * Follows modern Angular standards using inject() for dependency injection
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorCodeFacadeService {
  private apiService = inject(ErrorCodeApiService);
  private stateService = inject(ErrorCodeStateService);
  private snackBar = inject(MatSnackBar);

  // Expose state observables
  get currentTab$() { return this.stateService.currentTab$; }
  get errorCodes$() { return this.stateService.errorCodes$; }
  get loading$() { return this.stateService.loading$; }
  get totalRecords$() { return this.stateService.totalRecords$; }
  get currentFilters$() { return this.stateService.currentFilters$; }
  get searchKeyword$() { return this.stateService.searchKeyword$; }
  get pagination$() { return this.stateService.pagination$; }
  get sort$() { return this.stateService.sort$; }

  /**
   * Load error codes for current tab with current filters and pagination
   */
  loadErrorCodes(): void {
    const tab = this.stateService.currentTab$();
    const request = this.stateService.buildListRequest();
    const pagination = this.stateService.pagination$();

    this.stateService.setLoading(true);

    this.apiService.getErrorCodes(tab, request, pagination)
      .pipe(
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe({
        next: (response) => {
          this.stateService.setErrorCodes(response.data);
          this.stateService.setTotalRecords(response.total);
        },
        error: (error) => {
          this.showError(error?.error?.message || error?.message || 'Failed to load error codes');
          console.error('Load error codes failed:', error);
        }
      });
  }

  /**
   * Create a new error code (from dialog - doesn't show main grid loader initially)
   */
  createErrorCode(request: ErrorCodeCreateRequest): Observable<void> {
    const tab = this.stateService.currentTab$();

    return new Observable(observer => {
      this.apiService.createErrorCode(tab, request)
        .subscribe({
          next: (response) => {
            this.showSuccess(response.message || 'Error code added successfully');
            // Only show loader when reloading the list
            this.loadErrorCodes();
            observer.next();
            observer.complete();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || error?.error?.error || error?.message || 'Failed to add error code';
            this.showError(errorMessage);
            console.error('Create error code failed:', error);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Update an existing error code (from dialog - doesn't show main grid loader initially)
   */
  updateErrorCode(errorCode: string, request: ErrorCodeCreateRequest): Observable<void> {
    const tab = this.stateService.currentTab$();

    return new Observable(observer => {
      this.apiService.updateErrorCode(tab, errorCode, request)
        .subscribe({
          next: (response) => {
            this.showSuccess(response.message || 'Error code updated successfully');
            // Only show loader when reloading the list
            this.loadErrorCodes();
            observer.next();
            observer.complete();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || error?.error?.error || error?.message || 'Failed to update error code';
            this.showError(errorMessage);
            console.error('Update error code failed:', error);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Change current tab
   */
  changeTab(tab: TabType): void {
    this.stateService.setCurrentTab(tab);
    this.loadErrorCodes();
  }

  /**
   * Apply filters
   */
  applyFilters(filters: ErrorCodeFilter): void {
    this.stateService.setFilters(filters);
    this.loadErrorCodes();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.stateService.clearFilters();
    this.loadErrorCodes();
  }

  /**
   * Search error codes
   */
  search(keyword: string): void {
    this.stateService.setSearchKeyword(keyword);
    this.loadErrorCodes();
  }

  /**
   * Change pagination
   */
  changePagination(params: PaginationParams): void {
    this.stateService.setPagination(params);
    this.loadErrorCodes();
  }

  /**
   * Change sort
   */
  changeSort(sort: string | null): void {
    this.stateService.setSort(sort);
    this.loadErrorCodes();
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
  }
}