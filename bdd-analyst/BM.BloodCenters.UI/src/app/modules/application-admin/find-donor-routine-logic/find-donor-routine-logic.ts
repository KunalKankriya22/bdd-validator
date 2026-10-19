import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import moment from 'moment';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';

import { DonorRoutineLogicService } from './services/donor-routine-logic.service';
import {
  DonorSearchResult,
  MatchGradeSummary,
  SessionResult,
  GradeFilter
} from './models/donor-routine-logic.model';
// Lazy-loaded to avoid circular dependency
// import { SessionResultsDialog } from './session-results-dialog';

@Component({
  selector: 'app-find-donor-routine-logic',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable
  ],
  templateUrl: './find-donor-routine-logic.html',
  styleUrl: './find-donor-routine-logic.scss'
})
export class FindDonorRoutineLogic implements OnInit, OnDestroy {
  private readonly donorRoutineLogicService = inject(DonorRoutineLogicService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);

  // Signal-based state
  protected readonly donors = signal<DonorSearchResult[]>([]);
  protected readonly selectedDonor = signal<DonorSearchResult | null>(null);
  protected readonly matchGradeSummary = signal<MatchGradeSummary | null>(null);
  protected readonly sessionResults = signal<SessionResult[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly searchLoading = signal<boolean>(false);
  protected readonly initialLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedGrade = signal<GradeFilter>('all');
  protected readonly searchTerm = signal<string>('');
  protected readonly totalRecords = signal<number>(0);
  protected readonly pageSize = signal<number>(300);
  protected readonly currentPage = signal<number>(0);

  // Computed values
  protected readonly filteredSessionResults = computed(() => {
    const results = this.sessionResults();
    const grade = this.selectedGrade();

    if (grade === 'all') {
      return results;
    }

    return results.filter(r => r.grade === parseInt(grade));
  });

  protected readonly hasResults = computed(() => this.donors().length > 0);
  protected readonly isEmpty = computed(() => {
    const isSearching = this.searchTerm().length > 0;
    const isLoading = this.searchLoading() || this.initialLoading();
    const noDonors = this.donors().length === 0;
    return !isLoading && noDonors && isSearching;
  });
  protected readonly hasDonorSelected = computed(() => this.selectedDonor() !== null);
  protected readonly totalSessionResults = computed(() => this.matchGradeSummary()?.totalDonors ?? 0);
  protected readonly isLoading = computed(() => this.searchLoading() || this.initialLoading());
  protected readonly hasMoreRecords = computed(() => {
    // Only show "Load More" when viewing initial list (not search results)
    const isSearchActive = this.searchTerm().length > 0;
    return !isSearchActive && this.donors().length < this.totalRecords();
  });
  protected readonly loadingMore = signal<boolean>(false);

  // Group donors by donorId (API returns multiple records per donor with different DGM IDs)
  protected readonly groupedDonors = computed(() => {
    const donorsMap = new Map<string, DonorSearchResult>();

    for (const donor of this.donors()) {
      if (!donorsMap.has(donor.donorId)) {
        donorsMap.set(donor.donorId, donor);
      }
    }

    return Array.from(donorsMap.values());
  });

  // Computed grade counts
  protected readonly grade1Count = computed(() => this.matchGradeSummary()?.grade1Count ?? 0);
  protected readonly grade2Count = computed(() => this.matchGradeSummary()?.grade2Count ?? 0);
  protected readonly grade3Count = computed(() => this.matchGradeSummary()?.grade3Count ?? 0);
  protected readonly grade4Count = computed(() => this.matchGradeSummary()?.grade4Count ?? 0);
  protected readonly grade5Count = computed(() => this.matchGradeSummary()?.grade5Count ?? 0);

  // Configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Find Donor Routine Logic', link: null }
    ],
    title: 'Find Donor Routine Logic',
    subtitle: ''
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title || this.headerConfig.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Name, Donor ID, DOB or ABO',
    minLength: 1,
    ariaLabel: 'Search for donors',
    debounceTime: 300,
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<SessionResult> = {
    columns: [
      {
        key: 'sessionId',
        header: 'Session ID',
        sortable: false,
        truncate: true,
        truncateLength: 20
      },
      {
        key: 'donorId',
        header: 'Donor ID',
        sortable: false
      },
      {
        key: 'grade',
        header: 'Grade',
        sortable: false
      },
      {
        key: 'dgmId',
        header: 'DGM ID',
        sortable: false
      },
      {
        key: 'insertDate',
        header: 'Initiation Date',
        sortable: false,
        valueFormatter: (value) => {
          if (!value) return '-';
          const [year, month, day] = (value as string).split('T')[0].split('-');
          const monthName = new Date(+year, +month - 1, 1)
            .toLocaleString('en-US', { month: 'short' })
            .toUpperCase();
          return `${day}-${monthName}-${year}`;
        }
      }
    ],
    rowActions: [
      {
        icon: 'visibility',
        label: 'View Details',
        ariaLabel: 'View session details',
        action: 'view'
      }
    ],
    stickyHeader: true,
    emptyMessage: 'No session results found',
    showPagination: false
  };

  ngOnInit(): void {
    // Load initial donor list on page load
    this.loadInitialDonors();
  }

  /**
   * Load initial donor list from paginated endpoint
   */
  private loadInitialDonors(): void {
    this.initialLoading.set(true);
    this.error.set(null);

    const take = this.pageSize();
    const skip = this.currentPage() * this.pageSize();

    this.donorRoutineLogicService.getDonorRoutineLogic(take, skip).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Convert SessionResult to DonorSearchResult format for display
        const donorResults: DonorSearchResult[] = response.data.map(session => ({
          sessionId: session.sessionId,
          donorId: session.donorId,
          ssn: session.ssn,
          lastName: session.lastName,
          firstName: session.firstName,
          dateOfBirth: session.dateOfBirth,
          gender: session.gender,
          bloodType: session.bloodType,
          soundexKey: session.soundexKey,
          grade: session.grade,
          dgmId: session.dgmId,
          insertDate: session.insertDate,
          chapterId: session.chapterId,
          programId: session.programId
        }));

        this.donors.set(donorResults);
        this.totalRecords.set(response.total);
        this.initialLoading.set(false);

        // Auto-select first donor if available
        const grouped = this.groupedDonors();
        if (grouped.length > 0) {
          this.onDonorSelect(grouped[0]);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load donor records');
        this.initialLoading.set(false);
        this.donors.set([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(searchText: string): void {
    this.searchTerm.set(searchText);

    // If search is cleared, reload initial donor list
    if (!searchText || searchText.trim().length === 0) {
      this.currentPage.set(0);
      this.loadInitialDonors();
      return;
    }

    this.searchLoading.set(true);
    this.error.set(null);

    // Parse search term to determine which field to search
    const searchRequest = this.parseSearchTerm(searchText);

    this.donorRoutineLogicService.searchDonors(searchRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.donors.set(response.donors);
        this.searchLoading.set(false);

        // Auto-select first unique donor if available
        const grouped = this.groupedDonors();
        if (grouped.length > 0) {
          this.onDonorSelect(grouped[0]);
        } else {
          this.selectedDonor.set(null);
          this.matchGradeSummary.set(null);
          this.sessionResults.set([]);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to search donors');
        this.searchLoading.set(false);
        this.donors.set([]);
        this.selectedDonor.set(null);
        this.matchGradeSummary.set(null);
        this.sessionResults.set([]);
      }
    });
  }

  /**
   * Parse search term to determine which field to search.
   * Supports: Name, Donor ID, DOB (MM/DD/YYYY → DD-MON-YYYY), ABO blood type
   */
  private parseSearchTerm(searchText: string): any {
    const trimmed = searchText.trim();

    // ABO blood type pattern:
    // - Letter-based: A, B, O, AB with optional Rh/suffix (e.g. A+, O-, AB1)
    // - Numeric codes: 1-2 digit numbers (e.g. 06, 51, 62, 84) — ISBT codes used in this system
    // Routes to dedicated bloodType field — searches ONLY blood type column, not DOB or Donor ID
    const aboPattern = /^(AB|A|B|O)[0-9+\-]{0,3}$|^\d{1,2}$/i;
    if (aboPattern.test(trimmed)) {
      return {
        bloodType: trimmed.toUpperCase()
      };
    }

    // Full date MM/DD/YYYY or MM-DD-YYYY → convert to DD-MON-YYYY
    // so the SQL matches: TO_CHAR(DATE_OF_BIRTH, 'DD-MON-YYYY') LIKE '%23-SEP-1966%'
    const fullDatePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    if (fullDatePattern.test(trimmed)) {
      const parsed = moment(trimmed, ['MM/DD/YYYY', 'MM-DD-YYYY'], true);
      if (parsed.isValid()) {
        return {
          searchItem: parsed.format('DD-MMM-YYYY').toUpperCase()
        };
      }
    }

    // Partial date MM/DD or MM-DD — send as-is, SQL handles multiple formats
    const partialDatePattern = /^(\d{1,2})[\/\-](\d{1,2})$/;
    if (partialDatePattern.test(trimmed)) {
      return {
        searchItem: trimmed
      };
    }

    // Default: general text search (name, donor ID, etc.)
    return {
      searchItem: trimmed.toUpperCase()
    };
  }

  onDonorSelect(donor: DonorSearchResult): void {
    this.selectedDonor.set(donor);
    this.loadMatchGradeSummary(donor.sessionId);
  }

  private loadMatchGradeSummary(sessionId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.donorRoutineLogicService.getSessionResults(sessionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (summary) => {
        this.matchGradeSummary.set(summary);
        this.sessionResults.set(summary.results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load match grade summary');
        this.loading.set(false);
        this.matchGradeSummary.set(null);
        this.sessionResults.set([]);
      }
    });
  }

  onGradeFilterChange(grade: GradeFilter): void {
    this.selectedGrade.set(grade);
  }

  /**
   * Load more donors (pagination)
   */
  loadMoreDonors(): void {
    if (this.loadingMore() || !this.hasMoreRecords()) {
      return;
    }

    this.loadingMore.set(true);
    this.currentPage.set(this.currentPage() + 1);

    const take = this.pageSize();
    const skip = this.currentPage() * this.pageSize();

    this.donorRoutineLogicService.getDonorRoutineLogic(take, skip).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Convert SessionResult to DonorSearchResult format
        const newDonors: DonorSearchResult[] = response.data.map(session => ({
          sessionId: session.sessionId,
          donorId: session.donorId,
          ssn: session.ssn,
          lastName: session.lastName,
          firstName: session.firstName,
          dateOfBirth: session.dateOfBirth,
          gender: session.gender,
          bloodType: session.bloodType,
          soundexKey: session.soundexKey,
          grade: session.grade,
          dgmId: session.dgmId,
          insertDate: session.insertDate,
          chapterId: session.chapterId,
          programId: session.programId
        }));

        // Append new donors to existing list
        this.donors.set([...this.donors(), ...newDonors]);
        this.loadingMore.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load more donors');
        this.loadingMore.set(false);
        this.currentPage.set(this.currentPage() - 1); // Revert page increment
      }
    });
  }

  onSessionSortChange(event: TableSortEvent): void {
    const sorted = [...this.sessionResults()].sort((a, b) => {
      const valA = (a as any)[event.column];
      const valB = (b as any)[event.column];

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      const comparison = typeof valA === 'string'
        ? valA.localeCompare(valB)
        : (valA > valB ? 1 : valA < valB ? -1 : 0);

      return event.direction === 'D' ? -comparison : comparison;
    });

    this.sessionResults.set(sorted);
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
  }

  onRowAction(event: TableRowActionEvent<SessionResult>): void {
    if (event.action === 'view') {
      this.openSessionResultsDialog(event.row);
    }
  }


  private async openSessionResultsDialog(sessionResult: SessionResult): Promise<void> {
    // Lazy-load dialog component to avoid circular dependency
    const { SessionResultsDialog } = await import('./session-results-dialog');

    this.dialog.open(SessionResultsDialog, {
      width: '800px',
      maxWidth: '90vw',
      height: '100vh',
      position: { right: '0' },
      data: {
        sessionResult,
        donor: this.selectedDonor()
      },
      panelClass: 'session-results-dialog',
      autoFocus: 'button[aria-label="Close dialog"]',
      restoreFocus: true,
      hasBackdrop: true,
      disableClose: false
    });
  }

  getBloodTypeClass(bloodType?: string): string {
    if (!bloodType) return '';
    return bloodType.includes('+') ? 'positive' : 'negative';
  }

  getGenderIcon(gender: 'M' | 'F'): string {
    return gender === 'M' ? 'man' : 'woman';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const monthName = new Date(+year, +month - 1, 1)
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase();
    return `${day}-${monthName}-${year}`;
  }
}
