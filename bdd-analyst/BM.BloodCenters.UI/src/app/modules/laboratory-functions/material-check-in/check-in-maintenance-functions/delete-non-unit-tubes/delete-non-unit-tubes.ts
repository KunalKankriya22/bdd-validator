import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { NonUnitTubeDto } from './models/delete-non-unit-tubes.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { getDateInTimezone } from '@shared/date/timezone.util';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog';
import { DeleteNonUnitTubesService } from './services/delete-non-unit-tubes.service';

@Component({
  selector: 'app-delete-non-unit-tubes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './delete-non-unit-tubes.html',
  styleUrls: ['./delete-non-unit-tubes.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteNonUnitTubesComponent implements OnInit, OnDestroy {

  @ViewChild('startDateInput') startDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('endDateInput') endDateInput?: ElementRef<HTMLInputElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID',
    minLength: 1,
    ariaLabel: 'Search by Unit ID',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  searchText = '';

  filterForm = new FormGroup({
    startDate: new FormControl<Moment | null>(null, [Validators.required, this.validateStartDate.bind(this)]),
    endDate: new FormControl<Moment | null>(null, [Validators.required, this.validateEndDate.bind(this)]),
  });

  allData: NonUnitTubeDto[] = [];
  dataSource: NonUnitTubeDto[] = [];
  totalCount = 0;
  isLoading = false;
  hasRetrieved = false;
  hasError = false;
  noRecordsMessage = '';
  noRecordsSnackbarMessage = '';

  selectedUnitIds = new Set<string>();
  currentSearchKeyword = '';
  sortColumn = 'unitId';
  sortDirection: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();
  private lastChangedDateField: 'start' | 'end' | null = null;

  // Error state matchers - control when Angular Material shows error state (red label)
  // Only show error state when there's an actual error message to display
  startDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control) return false;
      // Show error state only if this field has an error AND it should show an error message
      // For date range errors, only show on the field that was last changed
      if (!control.touched) return false;

      // Show for field-specific errors (required, futureDate, parse errors)
      if (control.hasError('required') || control.hasError('futureDate') || control.hasError('matDatepickerParse')) {
        return true;
      }

      // For date range error, only show if this was the last changed field
      if (control.hasError('greaterThanEndDate') && this.lastChangedDateField === 'start') {
        return true;
      }

      return false;
    }
  };

  endDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control) return false;
      // Show error state only if this field has an error AND it should show an error message
      // For date range errors, only show on the field that was last changed
      if (!control.touched) return false;

      // Show for field-specific errors (required, futureDate, parse errors)
      if (control.hasError('required') || control.hasError('futureDate') || control.hasError('matDatepickerParse')) {
        return true;
      }

      // For date range error, only show if this was the last changed field
      if (control.hasError('lessThanStartDate') && this.lastChangedDateField === 'end') {
        return true;
      }

      return false;
    }
  };

  get isRetrieveDisabled(): boolean {
    return this.filterForm.invalid || this.isLoading;
  }

  get isDeleteDisabled(): boolean {
    return this.selectedUnitIds.size === 0;
  }

  get isClearAllDisabled(): boolean {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;
    return !startDate && !endDate;
  }

  // Max date for datepickers - prevent future date selection
  // Must match the chapter timezone used in validation
  get today(): Moment {
    const chapterTimezone = this.headerService.chapterTimeZone();
    const { year, month, day } = getDateInTimezone(chapterTimezone);
    return moment([year, month, day]);
  }

  get startDateError(): string {
    const control = this.filterForm.get('startDate');
    if (!control || !control.touched || !control.invalid) return '';

    // Check parse error FIRST - incomplete dates show "invalid" not "required"
    if (control.hasError('matDatepickerParse')) return 'Start Date is invalid';

    // Check if input has text but value is null (invalid date typed)
    const inputElement = this.startDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Start Date is invalid';
    }

    if (control.hasError('required')) return 'Start Date is required';
    if (control.hasError('futureDate')) return 'Start Date cannot be in the future';
    // Show date range error ONLY on the field that was last changed
    if (this.lastChangedDateField === 'start' && control.hasError('greaterThanEndDate')) {
      return 'Start Date must be before or equal to End Date';
    }
    return '';
  }

  get endDateError(): string {
    const control = this.filterForm.get('endDate');
    if (!control || !control.touched || !control.invalid) return '';

    // Check parse error FIRST - incomplete dates show "invalid" not "required"
    if (control.hasError('matDatepickerParse')) return 'End Date is invalid';

    // Check if input has text but value is null (invalid date typed)
    const inputElement = this.endDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'End Date is invalid';
    }

    if (control.hasError('required')) return 'End Date is required';
    if (control.hasError('futureDate')) return 'End Date cannot be in the future';
    // Show date range error ONLY on the field that was last changed
    if (this.lastChangedDateField === 'end' && control.hasError('lessThanStartDate')) {
      return 'End Date must be after or equal to Start Date';
    }
    return '';
  }

  constructor(
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private deleteNonUnitTubesService: DeleteNonUnitTubesService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.setupDateValidationSync();
  }

  private setupDateValidationSync(): void {
    // Track which field was last changed and re-validate the other field
    this.filterForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        const endDateControl = this.filterForm.get('endDate');
        if (endDateControl?.value) {
          endDateControl.updateValueAndValidity({ emitEvent: false });
        }
      });

    this.filterForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
        const startDateControl = this.filterForm.get('startDate');
        if (startDateControl?.value) {
          startDateControl.updateValueAndValidity({ emitEvent: false });
        }
      });
  }

  private validateStartDate(control: FormControl): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const startDate = moment(control.value).startOf('day');

    // Use chapter timezone for "today" comparison
    const chapterTimezone = this.headerService.chapterTimeZone();
    const { year, month, day } = getDateInTimezone(chapterTimezone);
    const today = moment([year, month, day]);

    // Check if start date is in the future (error code 0143 from FMB)
    if (startDate.isAfter(today)) {
      return { futureDate: true };
    }

    // Check if start date is after end date (error code 0073 from FMB)
    const endDate = this.filterForm?.get('endDate')?.value;
    if (endDate && startDate.isAfter(moment(endDate).startOf('day'))) {
      return { greaterThanEndDate: true };
    }

    return null;
  }

  private validateEndDate(control: FormControl): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const endDate = moment(control.value).startOf('day');

    // Use chapter timezone for "today" comparison
    const chapterTimezone = this.headerService.chapterTimeZone();
    const { year, month, day } = getDateInTimezone(chapterTimezone);
    const today = moment([year, month, day]);

    // Check if end date is in the future (error code 0072 from FMB)
    if (endDate.isAfter(today)) {
      return { futureDate: true };
    }

    // Check if end date is before start date (error code 0073 from FMB)
    const startDate = this.filterForm?.get('startDate')?.value;
    if (startDate && endDate.isBefore(moment(startDate).startOf('day'))) {
      return { lessThanStartDate: true };
    }

    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.cdr.markForCheck();
      });
  }

  onStartDateBlur(): void {
    const control = this.filterForm.get('startDate');
    control?.markAsTouched();
    this.cdr.markForCheck();
  }

  onEndDateBlur(): void {
    const control = this.filterForm.get('endDate');
    control?.markAsTouched();
    this.cdr.markForCheck();
  }

  retrieve(): void {
    if (this.isRetrieveDisabled) return;

    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (!startDate || !endDate) return;

    this.isLoading = true;
    this.hasError = false;
    this.hasRetrieved = true;
    this.searchText = '';
    this.currentSearchKeyword = '';
    this.clearSelection();

    // Convert dates to YYYY-MM-DD format for API
    const startDateStr = startDate.format('YYYY-MM-DD');
    const endDateStr = endDate.format('YYYY-MM-DD');

    this.deleteNonUnitTubesService
      .getTubes(startDateStr, endDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Ensure we have properly typed objects
          this.allData = response.data.map((item: any) => ({
            unitId: item.unitId,
            chapterId: item.chapterId,
            tubeCheckinDats: item.tubeCheckinDats,
            chkDigit: item.chkDigit
          }));

          // Set no records message and show snackbar if no data
          if (this.allData.length === 0) {
            // Page message - simple
            this.noRecordsMessage = 'No records found';

            // Snackbar message - with error code if available
            if (response.message && response.errorCode) {
              this.noRecordsSnackbarMessage = `${response.message} (Error Code: ${response.errorCode})`;
            } else {
              this.noRecordsSnackbarMessage = 'No records found';
            }

            // Show snackbar for no records - error code 0161 from FMB
            this.snackbarService.showError(this.noRecordsSnackbarMessage);
          } else {
            this.noRecordsMessage = '';
            this.noRecordsSnackbarMessage = '';
          }

          this.applyClientSearch();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.hasError = true;
          this.isLoading = false;
          this.snackbarService.showError('Failed to load tubes. Please try again.');
          this.cdr.markForCheck();
        },
      });
  }

  clearAll(): void {
    this.filterForm.reset();
    this.allData = [];
    this.dataSource = [];
    this.totalCount = 0;
    this.hasRetrieved = false;
    this.hasError = false;
    this.currentSearchKeyword = '';
    this.clearSelection();
  }

  onSearch(searchText: string): void {
    this.currentSearchKeyword = searchText;
    if (this.hasRetrieved) {
      this.applyClientSearch();
    }
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyClientSearch();
  }

  toggleAllRows(): void {
    if (this.allRowsSelected()) {
      this.dataSource.forEach(row => this.selectedUnitIds.delete(row.unitId));
    } else {
      this.dataSource.forEach(row => this.selectedUnitIds.add(row.unitId));
    }
  }

  toggleRowSelection(unitId: string): void {
    if (this.selectedUnitIds.has(unitId)) {
      this.selectedUnitIds.delete(unitId);
    } else {
      this.selectedUnitIds.add(unitId);
    }
  }

  isRowSelected(unitId: string): boolean {
    return this.selectedUnitIds.has(unitId);
  }

  allRowsSelected(): boolean {
    return this.dataSource.length > 0 && this.dataSource.every(row => this.selectedUnitIds.has(row.unitId));
  }

  someRowsSelected(): boolean {
    const selectedCount = this.dataSource.filter(row => this.selectedUnitIds.has(row.unitId)).length;
    return selectedCount > 0 && selectedCount < this.dataSource.length;
  }

  confirmDelete(): void {
    if (this.isDeleteDisabled) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '560px',
      disableClose: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.deleteSelectedTubes();
        }
      });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  private deleteSelectedTubes(): void {
    const selectedIds = Array.from(this.selectedUnitIds);
    const count = selectedIds.length;

    if (count === 0) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.deleteNonUnitTubesService
      .deleteTubes(selectedIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Remove deleted items from local data
            this.allData = this.allData.filter(row => !this.selectedUnitIds.has(row.unitId));
            this.clearSelection();
            this.applyClientSearch();
            this.snackbarService.showSuccess(`${this.numberToWords(count)} tubes deleted successfully.`);
          } else {
            this.snackbarService.showError(response.message || 'Failed to delete tubes.');
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.snackbarService.showError('Failed to delete tubes. Please try again.');
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private applyClientSearch(): void {
    const keyword = this.currentSearchKeyword?.toLowerCase().trim();
    let filtered: NonUnitTubeDto[];

    if (!keyword) {
      filtered = [...this.allData];
    } else {
      filtered = this.allData.filter(row =>
        row.unitId?.toLowerCase().includes(keyword)
      );
    }

    if (this.sortColumn && this.sortDirection) {
      filtered.sort((a, b) => {
        const valA = this.sortColumn === 'unitId' ? a.unitId : a.tubeCheckinDats;
        const valB = this.sortColumn === 'unitId' ? b.unitId : b.tubeCheckinDats;
        const comparison = (valA || '').localeCompare(valB || '');
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    this.dataSource = [...filtered]; // Create new array reference for OnPush
    this.totalCount = this.allData.length;
    this.cdr.markForCheck(); // Explicitly trigger change detection
  }

  private numberToWords(n: number): string {
    const words = [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
      'Eighteen', 'Nineteen', 'Twenty'
    ];
    return n >= 0 && n <= 20 ? words[n] : String(n);
  }

  private clearSelection(): void {
    this.selectedUnitIds.clear();
  }
}
