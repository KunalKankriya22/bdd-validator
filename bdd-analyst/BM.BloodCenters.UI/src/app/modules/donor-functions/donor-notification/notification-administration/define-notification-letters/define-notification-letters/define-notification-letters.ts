import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { NotificationLettersService } from '../services/notification-letters.service';
import {
  LetterView,
  LetterVersion,
  LetterFilterCriteria,
  LetterCodeOption
} from '../models/notification-letter.model';
import { LetterFilterChipsUtil } from '../utils/letter-filter-chips.util';

/**
 * Main component for managing notification letters
 * Displays current version and version history in two separate tables
 */
@Component({
  selector: 'app-define-notification-letters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar
  ],
  templateUrl: './define-notification-letters.html',
  styleUrls: ['./define-notification-letters.scss']
})
export class DefineNotificationLetters implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Signals for reactive state
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Letter data
  currentVersionLetters: LetterView[] = [];
  versionHistoryLetters: LetterView[] = [];

  // Filtered data for display
  filteredCurrentLetters: LetterView[] = [];
  filteredHistoryLetters: LetterView[] = [];

  // Letter code dropdown
  letterCodeControl = new FormControl('', [Validators.required]);
  letterCodeOptions = signal<LetterCodeOption[]>([]);
  selectedLetterDescription = '';

  // Search functionality for letter code dropdown
  readonly letterCodeSearchControl = new FormControl('');
  readonly letterCodeSearch = signal('');

  // Computed property for filtered options
  readonly filteredLetterCodeOptions = computed(() => {
    const search = this.letterCodeSearch().toLowerCase();
    const options = this.letterCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  // Filter state
  filterCriteria: LetterFilterCriteria = {
    showTerminated: false
  };
  filterChips: FilterChip[] = [];
  hasSearched = false;

  // Table search - unified search across both tables
  tableSearch = '';

  // Table sorting
  currentSortColumn: string | null = null;
  currentSortDirection: 'asc' | 'desc' | null = null;
  historySortColumn: string | null = null;
  historySortDirection: 'asc' | 'desc' | null = null;

  // Search configuration - single search bar for both tables
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Letter Code or Title',
    minLength: 2,
    ariaLabel: 'Search notification letters',
    searchOnEnterOnly: true
  };

  // Table columns
  displayedColumns: string[] = [
    'letterCode',
    'description',
    'versionNo',
    'versionDate',
    'effectiveDate',
    'terminationDate',
    'actions'
  ];

  // Row selection
  selectedLetter: LetterView | null = null;

  // Tooltip truncation tracking
  descriptionTooltipDisabled = new Map<string, boolean>();
  titleTooltipDisabled = true;

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private service: NotificationLettersService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar
  ) {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;
        const breadcrumbs = state?.['fromDonorDetailQuery']
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
              { label: pageData.title, link: null }
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ];
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || 'Create and manage notification letters while tracking their versions and effective periods'
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadLetterCodes();
    this.setupLetterCodeSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes and reset state
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadLetterCodes();
      });
  }

  /**
   * Load letter codes for dropdown
   */
  private loadLetterCodes(): void {
    this.service
      .getLetterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.letterCodeOptions.set(codes);
          this.loadLetterDescriptions(codes);
        },
        error: () => {
          this.letterCodeOptions.set([]);
        }
      });
  }

  private loadLetterDescriptions(codes: LetterCodeOption[]): void {
    this.service
      .getLetters({ showTerminated: true }, 500, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          const descMap = new Map<string, string>();
          letters.forEach(l => {
            if (!descMap.has(l.letterCode)) {
              descMap.set(l.letterCode, l.title || l.description || '');
            }
          });
          const updatedCodes = codes.map(c => ({
            ...c,
            description: descMap.get(c.code) || c.description
          }));
          this.letterCodeOptions.set(updatedCodes);
        },
        error: () => {}
      });
  }

  /**
   * Setup search for letter code dropdown
   */
  private setupLetterCodeSearch(): void {
    // Subscribe to SEARCH control to update search signal
    this.letterCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.letterCodeSearch.set(searchTerm || '');
      });

    // Subscribe to SELECTION control to update description and filter criteria
    this.letterCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedCode) => {
        if (!selectedCode) {
          this.selectedLetterDescription = '';
          this.filterCriteria.letterCode = undefined;
          return;
        }

        this.filterCriteria.letterCode = selectedCode;

        // Fetch the letter details to get the actual description/title
        this.fetchLetterDescription(selectedCode);
      });
  }

  /**
   * Fetch letter description/title by calling the API
   */
  private fetchLetterDescription(letterCode: string): void {
    this.service
      .getLetters({
        showTerminated: true,
        letterCode: letterCode
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          if (letters && letters.length > 0) {
            // Use the title from the first letter found
            this.selectedLetterDescription = letters[0].title || letters[0].description || '';
          } else {
            this.selectedLetterDescription = '';
          }
        },
        error: () => {
          this.selectedLetterDescription = '';
        }
      });
  }

  /**
   * Retrieve letters based on current filter criteria
   */
  onRetrieve(): void {
    this.hasSearched = true;
    this.loading.set(true);
    this.error.set(null);

    // Clear previous data to avoid showing stale results
    this.currentVersionLetters = [];
    this.versionHistoryLetters = [];
    this.filteredCurrentLetters = [];
    this.filteredHistoryLetters = [];

    // Clear table search on new retrieval (like Drive Profile)
    // This ensures users see all results from the new retrieve
    this.tableSearch = '';

    // Reset sorting state on new retrieval
    this.currentSortColumn = null;
    this.currentSortDirection = null;
    this.historySortColumn = null;
    this.historySortDirection = null;

    // Don't automatically add chapter - allow retrieval across all chapters
    // Chapter filter is only applied if explicitly set in filterCriteria

    this.service
      .getLetters(this.filterCriteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.processLetters(letters);
          this.updateFilterChips();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load notification letters');
          this.loading.set(false);

          // Ensure data arrays are cleared on error
          this.currentVersionLetters = [];
          this.versionHistoryLetters = [];
          this.filteredCurrentLetters = [];
          this.filteredHistoryLetters = [];

          this.showError('Failed to load notification letters. Please try again.');
        }
      });
  }

  /**
   * Handle Create New Letter button click
   * Opens the Create Letter dialog
   */
  onCreateNewLetter(): void {
    this.openCreateDialog();
  }

  /**
   * Process and separate letters into current and history
   */
  private processLetters(letters: LetterView[]): void {
    this.currentVersionLetters = letters.filter(
      (letter) => letter.currentVersion?.isCurrent
    );
    this.versionHistoryLetters = letters.filter(
      (letter) => !letter.currentVersion?.isCurrent
    );

    // Apply table search if active
    this.applyTableSearch();
  }

  /**
   * Update filter criteria from filter panel
   */
  onFiltersApplied(criteria: LetterFilterCriteria): void {
    this.filterCriteria = criteria;
    this.onRetrieve();
  }

  /**
   * Update filter chips display
   */
  private updateFilterChips(): void {
    this.filterChips = LetterFilterChipsUtil.convertToChips(this.filterCriteria);
  }

  /**
   * Remove a filter chip
   */
  onRemoveChip(chipKey: string): void {
    this.filterCriteria = LetterFilterChipsUtil.removeChip(
      this.filterCriteria,
      chipKey
    );
    this.updateFilterChips();
    this.onRetrieve();
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    // Reset filter criteria (don't preserve chapter - allow clearing all)
    this.filterCriteria = LetterFilterChipsUtil.clearAllFilters(
      this.filterCriteria,
      false // don't preserve chapter
    );

    // Reset form controls
    this.letterCodeControl.setValue('', { emitEvent: false });
    this.letterCodeControl.markAsUntouched();
    this.letterCodeSearchControl.setValue('', { emitEvent: false });
    this.selectedLetterDescription = '';


    // Clear the search signal to reset filtered options
    this.letterCodeSearch.set('');

    // Clear displayed data
    this.currentVersionLetters = [];
    this.versionHistoryLetters = [];
    this.filteredCurrentLetters = [];
    this.filteredHistoryLetters = [];
    this.hasSearched = false;

    // Clear table search
    this.tableSearch = '';

    // Clear sorting state
    this.currentSortColumn = null;
    this.currentSortDirection = null;
    this.historySortColumn = null;
    this.historySortDirection = null;

    // Clear error state
    this.error.set(null);
    this.loading.set(false);

    // Update chips display
    this.updateFilterChips();
  }

  /**
   * Clear all state (called on chapter change)
   */
  private clearAll(): void {
    this.currentVersionLetters = [];
    this.versionHistoryLetters = [];
    this.filteredCurrentLetters = [];
    this.filteredHistoryLetters = [];
    this.selectedLetter = null;
    this.hasSearched = false;
    this.tableSearch = '';

    // Clear all filters including chapter
    this.filterCriteria = {
      showTerminated: false
    };
    this.letterCodeControl.setValue('', { emitEvent: false });
    this.letterCodeControl.markAsUntouched();
    this.letterCodeSearchControl.setValue('', { emitEvent: false });
    this.selectedLetterDescription = '';

    this.letterCodeSearch.set('');

    // Clear sorting state
    this.currentSortColumn = null;
    this.currentSortDirection = null;
    this.historySortColumn = null;
    this.historySortDirection = null;

    // Clear error state
    this.error.set(null);
    this.loading.set(false);

    this.updateFilterChips();
  }

  /**
   * Search across both tables (Current Version and Version History)
   * Matches Drive Profile pattern - single search bar
   */
  onSearch(searchTerm: string): void {
    this.tableSearch = searchTerm.toLowerCase().trim();
    this.applyTableSearch();
  }

  /**
   * Handle search cleared event from search bar
   */
  onSearchCleared(): void {
    this.tableSearch = '';
    this.applyTableSearch();
  }

  /**
   * Apply search filter to both tables
   */
  private applyTableSearch(): void {
    // Filter Current Version table
    if (!this.tableSearch) {
      this.filteredCurrentLetters = [...this.currentVersionLetters];
    } else {
      this.filteredCurrentLetters = this.currentVersionLetters.filter((letter) =>
        letter.letterCode.toLowerCase().includes(this.tableSearch) ||
        (letter.description || '').toLowerCase().includes(this.tableSearch) ||
        (letter.title || '').toLowerCase().includes(this.tableSearch)
      );
    }

    // Filter Version History table
    if (!this.tableSearch) {
      this.filteredHistoryLetters = [...this.versionHistoryLetters];
    } else {
      this.filteredHistoryLetters = this.versionHistoryLetters.filter((letter) =>
        letter.letterCode.toLowerCase().includes(this.tableSearch) ||
        (letter.description || '').toLowerCase().includes(this.tableSearch) ||
        (letter.title || '').toLowerCase().includes(this.tableSearch)
      );
    }

    // Apply sorting after filtering
    this.applyCurrentSort();
    this.applyHistorySort();
  }

  /**
   * Sort current version table by column
   */
  onSortCurrent(column: string): void {
    // Toggle sort direction
    if (this.currentSortColumn === column) {
      if (this.currentSortDirection === 'asc') {
        this.currentSortDirection = 'desc';
      } else if (this.currentSortDirection === 'desc') {
        // Clear sorting
        this.currentSortColumn = null;
        this.currentSortDirection = null;
      } else {
        this.currentSortDirection = 'asc';
      }
    } else {
      this.currentSortColumn = column;
      this.currentSortDirection = 'asc';
    }

    this.applyCurrentSort();
  }

  /**
   * Apply sorting to current version table
   * Default: letter_code ASC, version_no ASC
   */
  private applyCurrentSort(): void {
    if (!this.currentSortColumn || !this.currentSortDirection) {
      this.filteredCurrentLetters = [...this.filteredCurrentLetters].sort((a, b) => {
        const codeCompare = (a.letterCode || '').localeCompare(b.letterCode || '');
        if (codeCompare !== 0) return codeCompare;
        return (a.currentVersion?.versionNo || 0) - (b.currentVersion?.versionNo || 0);
      });
      return;
    }

    this.filteredCurrentLetters = [...this.filteredCurrentLetters].sort((a, b) => {
      const valueA: string = this.currentSortColumn === 'letterCode' ? (a.letterCode || '') : '';
      const valueB: string = this.currentSortColumn === 'letterCode' ? (b.letterCode || '') : '';

      const comparison = valueA.localeCompare(valueB);
      return this.currentSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Sort history version table by column
   */
  onSortHistory(column: string): void {
    // Toggle sort direction
    if (this.historySortColumn === column) {
      if (this.historySortDirection === 'asc') {
        this.historySortDirection = 'desc';
      } else if (this.historySortDirection === 'desc') {
        // Clear sorting
        this.historySortColumn = null;
        this.historySortDirection = null;
      } else {
        this.historySortDirection = 'asc';
      }
    } else {
      this.historySortColumn = column;
      this.historySortDirection = 'asc';
    }

    this.applyHistorySort();
  }

  /**
   * Apply sorting to history version table
   * Default: letter_code ASC, version_no DESC
   */
  private applyHistorySort(): void {
    if (!this.historySortColumn || !this.historySortDirection) {
      this.filteredHistoryLetters = [...this.filteredHistoryLetters].sort((a, b) => {
        const codeCompare = (a.letterCode || '').localeCompare(b.letterCode || '');
        if (codeCompare !== 0) return codeCompare;
        return (b.currentVersion?.versionNo || 0) - (a.currentVersion?.versionNo || 0);
      });
      return;
    }

    this.filteredHistoryLetters = [...this.filteredHistoryLetters].sort((a, b) => {
      const valueA: string = this.historySortColumn === 'letterCode' ? (a.letterCode || '') : '';
      const valueB: string = this.historySortColumn === 'letterCode' ? (b.letterCode || '') : '';

      const comparison = valueA.localeCompare(valueB);
      return this.historySortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get aria-sort value for a column
   */
  getAriaSort(table: 'current' | 'history', column: string): 'ascending' | 'descending' | 'none' {
    const sortColumn = table === 'current' ? this.currentSortColumn : this.historySortColumn;
    const sortDirection = table === 'current' ? this.currentSortDirection : this.historySortDirection;

    if (sortColumn !== column) return 'none';
    if (sortDirection === 'asc') return 'ascending';
    if (sortDirection === 'desc') return 'descending';
    return 'none';
  }

  /**
   * Get sort icon for a column
   */
  getSortIcon(table: 'current' | 'history', column: string): string {
    const sortColumn = table === 'current' ? this.currentSortColumn : this.historySortColumn;
    const sortDirection = table === 'current' ? this.currentSortDirection : this.historySortDirection;

    if (sortColumn !== column) {
      return 'unfold_more';
    }

    if (sortDirection === 'asc') {
      return 'arrow_upward';
    } else if (sortDirection === 'desc') {
      return 'arrow_downward';
    }

    return 'unfold_more';
  }

  /**
   * Select a letter row (highlight)
   */
  onSelectLetter(letter: LetterView): void {
    this.selectedLetter = letter;
  }

  /**
   * Check if a letter is selected
   */
  isLetterSelected(letter: LetterView): boolean {
    return this.selectedLetter?.letterCode === letter.letterCode &&
           this.selectedLetter?.currentVersion?.versionNo === letter.currentVersion?.versionNo;
  }

  /**
   * Open create new letter dialog
   */
  openCreateDialog(): void {
    const confirmData: ConfirmActionDialogData = {
      title: 'Create New Letter',
      message: 'Do you wish to create a new letter?',
      confirmText: 'YES',
      cancelText: 'NO'
    };

    const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: confirmData
    });

    confirmRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        import('../create-edit-letter/create-edit-letter').then(m => {
          const dialogRef = this.dialog.open(m.CreateEditLetter, {
            width: '800px',
            height: '100vh',
            position: { right: '0', top: '64px' },
            panelClass: ['notification-letter-drawer'],
            disableClose: true,
            data: {
              mode: 'add',
              letterCodes: this.letterCodeOptions()
            }
          });

          dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
              if (result?.success) {
                this.showSuccess('Letter created successfully');
                this.clearAllFilters();
                this.loadLetterCodes();
              }
            });
        });
      });
  }

  /**
   * Open revise letter dialog (create new version)
   */
  openReviseDialog(letter: LetterView): void {
    import('../create-edit-letter/create-edit-letter').then(m => {
      const dialogRef = this.dialog.open(m.CreateEditLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['notification-letter-drawer'],
        disableClose: true,
        data: {
          mode: 'edit',
          letter: letter,
          letterCodes: this.letterCodeOptions()
        }
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          this.blurActiveElement();
          if (result?.success) {
            this.showSuccess('New version created successfully');
            this.loadLetterCodes();
            this.onRetrieve();
          }
        });
    });
  }

  /**
   * Open view letter dialog
   */
  openViewDialog(letter: LetterView): void {
    import('../view-letter/view-letter').then(m => {
      const dialogRef = this.dialog.open(m.ViewLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['notification-letter-drawer'],
        disableClose: true,
        data: { letter }
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.blurActiveElement();
        });
    });
  }

  /**
   * Open preview letter dialog
   * Opens dialog immediately with the specific version number from the clicked row
   */
  openPreviewDialog(letter: LetterView): void {
    const letterId = letter.currentVersion?.letterId;

    if (letterId) {
      this.launchPreviewDialog(letterId);
      return;
    }

    const letterCode = letter.letterCode;
    const versionNo = letter.currentVersion?.versionNo;
    if (!letterCode || !versionNo) {
      this.showError('Letter ID is missing. Cannot preview letter.');
      return;
    }

    this.service.getLetterDetail(letterCode, 'N', versionNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          const fetchedId = detail.currentVersion?.letterId;
          if (!fetchedId) {
            this.showError('Letter ID is missing. Cannot preview letter.');
            return;
          }
          letter.currentVersion!.letterId = fetchedId;
          this.launchPreviewDialog(fetchedId);
        },
        error: () => {
          this.showError('Failed to fetch letter details for preview.');
        }
      });
  }

  private launchPreviewDialog(letterId: string): void {
    import('../preview-letter/preview-letter').then(m => {
      const dialogRef = this.dialog.open(m.PreviewLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['notification-letter-drawer', 'preview-letter-drawer'],
        disableClose: true,
        data: {
          letterId: letterId
        }
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.blurActiveElement();
        });
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // Error messages starting with "Error" should not auto-dismiss
    const config: any = {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    };

    // Only add duration if message does NOT start with "Error"
    if (!message.startsWith('Error')) {
      config.duration = 5000;
    }

    this.snackBar.open(message, 'DISMISS', config);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Check if current version table has data
   */
  get hasCurrentData(): boolean {
    return this.filteredCurrentLetters.length > 0;
  }

  /**
   * Check if history table has data
   */
  get hasHistoryData(): boolean {
    return this.filteredHistoryLetters.length > 0;
  }

  /**
   * Check if any data has been loaded
   */
  get hasData(): boolean {
    return this.hasCurrentData || this.hasHistoryData;
  }

  /**
   * Check if API returned data (before table search filtering)
   */
  get hasApiData(): boolean {
    return this.currentVersionLetters.length > 0 || this.versionHistoryLetters.length > 0;
  }

  /**
   * Check if table search is active and hiding results
   */
  get isSearchFiltering(): boolean {
    return this.tableSearch.length > 0 && this.hasApiData && !this.hasData;
  }

  onDescriptionHover(event: MouseEvent, key: string): void {
    const el = event.currentTarget as HTMLElement;
    this.descriptionTooltipDisabled.set(key, el.scrollWidth <= el.clientWidth);
  }

  onTitleHover(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    this.titleTooltipDisabled = el.scrollWidth <= el.clientWidth;
  }

  onMenuClosed(): void {
    this.selectedLetter = null;
    this.blurActiveElement();
  }

  private blurActiveElement(): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

}
