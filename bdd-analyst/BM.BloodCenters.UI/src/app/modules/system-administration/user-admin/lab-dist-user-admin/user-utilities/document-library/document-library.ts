import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, effect, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, distinctUntilChanged, forkJoin } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { DocumentLibraryApiService } from './services/document-library-api.service';
import {
  DocumentLibraryDto,
  DocumentLibrarySearchDto,
  DocumentDisplay
} from './models/document-library.model';
import { UploadAndLinkDialogComponent } from './dialogs/upload-and-link-dialog';
import { LinkExistingDocumentDialogComponent, LinkExistingDocumentDialogData, LinkExistingDocumentResult } from './dialogs/link-existing-document-dialog';
import { DetachLinkedEntriesDialogComponent, DetachLinkedEntriesDialogData } from './dialogs/detach-linked-entries-dialog';
import { DeleteDocumentDialogComponent } from './dialogs/delete-document-dialog';

/**
 * Factory function to create a chapter-aware no future date validator.
 * Validates that a date is not in the future based on chapter's local date.
 * Used for From Date and To Date fields to prevent future date selection.
 *
 * The validator reactively checks the chapter's current date on each validation,
 * ensuring it always validates against the most up-to-date chapter timezone.
 *
 * @param chapterTimezoneService - Service to get chapter's local date
 * @returns ValidatorFn that validates against chapter's current date
 */
function noFutureDateValidatorFactory(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const selectedDate = moment(value).startOf('day');
    // Get the chapter's local date from the signal (reactive)
    const chapterDate = chapterTimezoneService.chapterLocalDate();
    const today = chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');

    if (selectedDate.isAfter(today, 'day')) {
      return { futureDate: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './document-library.html',
  styleUrls: ['./document-library.scss']
})
export class DocumentLibraryComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(DocumentLibraryApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();

  @ViewChild(DataTable) dataTable?: DataTable<DocumentDisplay>;
  @ViewChild('linkedValuesTable') linkedValuesTable?: DataTable<DocumentDisplay>;

  headerConfig: PageHeaderConfig = {
    title: '',
    subtitle: '',
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    actions: [
      {
        label: 'UPLOAD AND LINK DOCUMENT',
        icon: 'file_upload',
        variant: 'filled',
        onClick: () => this.onOpenUploadDialog()
      }
    ]
  };

  filterForm!: FormGroup;

  documents: DocumentDisplay[] = [];
  selectedDocument: DocumentDisplay | null = null;
  selectedDocumentLinkedValues: DocumentDisplay[] = [];
  selectedLinkedValues: DocumentDisplay[] = [];
  isLoading = false;
  isDownloading = false;
  isDeleting = false;
  isUnlinking = false;
  isLoadingFilters = false;

  // Dropdown options
  tableOptions: string[] = [];
  filteredTableOptions: string[] = [];
  tableSearchControl = new FormControl<string>('');

  columnOptions: string[] = [];
  filteredColumnOptions: string[] = [];
  columnSearchControl = new FormControl<string>('');

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   * Not valid codes; options are disabled so they never become the control value.
   */
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  /**
   * Computed signal for max date based on chapter's local date
   * Returns chapter's current date to prevent future date selection
   * Reactively updates when chapter local date changes
   */
  maxToDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });

  linkedValuesTableConfig: DataTableConfig<DocumentDisplay> = {
    columns: [
      { key: 'docLinkedTable', header: 'Linked Table', sortable: true },
      { key: 'docLinkedColumn', header: 'Linked Column', sortable: false },
      { key: 'linkedValue', header: 'Linked Value', sortable: false },
      { key: 'docLinkedDesc', header: 'Description', sortable: false }
    ],
    sortConfig: {
      column: 'docLinkedTable',
      direction: 'default'
    },
    rowActions: [
      {
        icon: 'get_app',
        label: 'Download',
        ariaLabel: 'Download {{docName}}',
        action: 'download'
      }
    ],
    stickyHeader: true,
    enableSelection: true,
    showTableOnEmpty: false,
    enableRowHighlight: true
  };

  private lastChangedDateField: 'from' | 'to' | null = null;

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getFromDateError());
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getToDateError());

  constructor() {
    this.iconRegistry.addSvgIcon(
      'neg-circle',
      this.sanitizer.bypassSecurityTrustResourceUrl('/assets/images/icons/neg-circle.svg')
    );

    // Effect to set page header from menu items
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const state = window.history.state;
        const breadcrumbs = state?.fromSamplesQuery
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Samples Query', link: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/samples-query' },
              { label: pageData.title, link: null },
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null },
            ];

        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });

    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupDateValidationListeners();
    this.subscribeToChapterChanges();
    this.setupDropdownSearchListeners();
    this.loadFilterOptions();
    this.applyQueryParamFilters();
  }

  private applyQueryParamFilters(): void {
    const params = this.route.snapshot.queryParams;
    const linkedTable = params['linkedTable'];
    const linkedColumn = params['linkedColumn'];
    const linkedValue = params['linkedValue'];

    if (linkedTable || linkedColumn || linkedValue) {
      this.filterForm.patchValue({
        table: linkedTable || null,
        column: linkedColumn || null,
        value: linkedValue || '',
      });
      this.retrieveByValueOnly(linkedValue, linkedTable, linkedColumn);
    }
  }

  private retrieveByValueOnly(value?: string, table?: string, column?: string): void {
    const filters: DocumentLibrarySearchDto = {
      docLinkedTable: table || undefined,
      docLinkedColumn: column || undefined,
      docLinkedValue: value || undefined,
    };

    this.isLoading = true;
    this.apiService.searchDocuments(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.documents = this.mapDocumentsToDisplay(result.documents);
          this.isLoading = false;
          const first = this.uniqueDocuments[0];
          if (first) {
            this.onSelectDocument(first);
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from header
   * When chapter changes, clear all data and reset forms
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear all data and reset to initial state
        this.resetFilterFormAndRetrieve();
      });
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      table: [null],
      column: [null],
      value: [''],
      docId: ['', [Validators.maxLength(30)]],
      fromDate: [null, [Validators.required, noFutureDateValidatorFactory(this.chapterTimezoneService)]],
      toDate: [null, [Validators.required, noFutureDateValidatorFactory(this.chapterTimezoneService)]]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')] });
  }

  private setupDateValidationListeners(): void {
    this.filterForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.filterForm.get('fromDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'from';
      });

    this.filterForm.get('toDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => { this.lastChangedDateField = 'to'; });
  }

  /**
   * Setup search listeners for dropdowns
   */
  private setupDropdownSearchListeners(): void {
    // Setup table dropdown search
    this.tableSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredTableOptions = this.tableOptions.filter((table) =>
          table.toLowerCase().includes(term)
        );
      });

    // Setup column dropdown search
    this.columnSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredColumnOptions = this.columnOptions.filter((column) =>
          column.toLowerCase().includes(term)
        );
      });

    // When table selection changes, reload columns filtered by that table
    this.filterForm.get('table')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tableName) => {
        if (tableName) {
          this.loadColumnOptions(tableName);
        } else {
          // If table is cleared, reload all columns
          this.loadColumnOptions();
        }
      });
  }

  /**
   * Load filter options (tables and columns) from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;
    this.tableOptions = [];
    this.filteredTableOptions = [];
    this.columnOptions = [];
    this.filteredColumnOptions = [];

    // Load both tables and columns in parallel using forkJoin
    forkJoin({
      categories: this.apiService.getLinkCategories(),
      columns: this.apiService.getColumnCodes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categories, columns }) => {
          // Process table options
          const tableNames = categories.map(cat => cat.linkTable);
          this.tableOptions = [...new Set(tableNames)].sort();
          this.filteredTableOptions = [...this.tableOptions];
          this.tableSearchControl.setValue('', { emitEvent: false });

          // Process column options
          this.columnOptions = columns;
          this.filteredColumnOptions = [...this.columnOptions];
          this.columnSearchControl.setValue('', { emitEvent: false });

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.tableOptions = [];
          this.filteredTableOptions = [];
          this.columnOptions = [];
          this.filteredColumnOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Load column options from backend API
   * @param tableName Optional table name to filter columns
   */
  private loadColumnOptions(tableName?: string): void {
    this.isLoadingFilters = true;
    this.columnOptions = [];
    this.filteredColumnOptions = [];

    this.apiService.getColumnCodes(tableName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (columns) => {
          this.columnOptions = columns;
          this.filteredColumnOptions = [...this.columnOptions];
          this.columnSearchControl.setValue('', { emitEvent: false });

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.columnOptions = [];
          this.filteredColumnOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate')
    );
  }

  onFromDateChange(): void {
    this.filterForm.get('fromDate')?.markAsTouched();
    this.filterForm.get('fromDate')?.markAsDirty();
    this.filterForm.updateValueAndValidity();
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate'),
      false
    );
  }

  onToDateChange(): void {
    this.filterForm.get('toDate')?.markAsTouched();
    this.filterForm.get('toDate')?.markAsDirty();
    this.filterForm.updateValueAndValidity();
  }

  onDatePickerClosed(): void {
    // Remove focus from the datepicker toggle button when datepicker closes
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  getFromDateError(): string {
    const fromDateControl = this.filterForm.get('fromDate');

    if (fromDateControl?.hasError('futureDate')) {
      return 'From Date cannot be a future date';
    }

    return DateFieldValidationUtility.getStartDateCrossFieldError(
      fromDateControl,
      'From Date',
      'To Date',
      this.filterForm.errors
    );
  }

  getToDateError(): string {
    const toDateControl = this.filterForm.get('toDate');

    if (toDateControl?.hasError('futureDate')) {
      return 'To Date cannot be a future date';
    }

    return DateFieldValidationUtility.getEndDateCrossFieldError(
      toDateControl,
      'To Date',
      'From Date',
      this.filterForm.errors
    );
  }

  /**
   * Open Upload and Link Document dialog
   */
  onOpenUploadDialog(): void {
    // Remove focus from the UPLOAD AND LINK DOCUMENT button
    this.removeFocus();

    const dialogRef = this.dialog.open(UploadAndLinkDialogComponent, {
      width: '710px',
      maxHeight: '100vh',
      height: '100vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'right-side-dialog',
      position: { right: '0' }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: boolean) => {
      // Remove focus from button after dialog closes
      this.removeFocus();

      if (result) {
        // Reload documents after successful upload
        this.retrieveDocuments();
      }
    });
  }

  /**
   * Select a document from the list
   */
  onSelectDocument(doc: DocumentDisplay): void {
    this.selectedDocument = doc;
    this.selectedDocumentLinkedValues = this.documents.filter(d => d.sessionId === doc.sessionId);
    this.selectedLinkedValues = [];
    // Remove focus from document item
    this.removeFocus();
  }

  /**
   * Check if a document is selected
   */
  isDocumentSelected(doc: DocumentDisplay): boolean {
    return this.selectedDocument?.sessionId === doc.sessionId;
  }

  /**
   * Open Link Document dialog for existing document
   */
  onLinkDocumentClick(): void {
    if (!this.selectedDocument) {
      return;
    }

    // Remove focus from the LINK DOCUMENT button
    this.removeFocus();

    const dialogData: LinkExistingDocumentDialogData = {
      documents: this.documents,
      selectedDocument: this.selectedDocument
    };

    const dialogRef = this.dialog.open(LinkExistingDocumentDialogComponent, {
      width: '710px',
      maxHeight: '100vh',
      height: '100vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'right-side-dialog',
      position: { right: '0' },
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: LinkExistingDocumentResult | null) => {
      // Remove focus from button after dialog closes
      this.removeFocus();

      if (result) {
        this.refreshAndSelectDocument(result.document.sessionId);
      }
    });
  }

  private refreshAndSelectDocument(sessionId: string): void {
    this.retrieveDocuments(() => {
      const doc = this.uniqueDocuments.find(d => d.sessionId === sessionId);
      if (doc) {
        this.onSelectDocument(doc);
      }
    });
  }

  /**
   * Handle linked values selection change
   */
  onLinkedValuesSelectionChange(selectedRows: DocumentDisplay[]): void {
    this.selectedLinkedValues = selectedRows;
    if (this.linkedValuesTable && selectedRows.length === 0) {
      this.linkedValuesTable.activeRow = null;
    }
    this.removeFocus();
  }

  private removeFocus(): void {
    setTimeout(() => {
      // Double setTimeout to ensure it runs after all event handlers
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 0);
    }, 0);
  }

  /**
   * Handle linked values sort change
   */
  onLinkedValuesSortChange(event: TableSortEvent): void {
    if (this.linkedValuesTableConfig.sortConfig) {
      this.linkedValuesTableConfig.sortConfig.column = event.column;
      this.linkedValuesTableConfig.sortConfig.direction = event.direction;
    }

    // Apply sorting to linked values
    this.applySortToLinkedValues();
  }

  private applySortToLinkedValues(): void {
    if (!this.linkedValuesTableConfig.sortConfig || this.linkedValuesTableConfig.sortConfig.direction === 'default') {
      // Reset to original order - re-filter from all documents
      if (this.selectedDocument) {
        this.selectedDocumentLinkedValues = this.documents.filter(d => d.sessionId === this.selectedDocument!.sessionId);
      }
      return;
    }

    const column = this.linkedValuesTableConfig.sortConfig.column;
    const direction = this.linkedValuesTableConfig.sortConfig.direction;

    this.selectedDocumentLinkedValues.sort((a, b) => {
      const aValue = (a as any)[column] || '';
      const bValue = (b as any)[column] || '';

      if (direction === 'A') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  }

  /**
   * Open detach dialog
   */
  onDetachClick(): void {
    if (!this.selectedDocument || this.selectedLinkedValues.length === 0) {
      return;
    }

    // Remove focus from the DETACH button
    this.removeFocus();

    const dialogData: DetachLinkedEntriesDialogData = {
      documentName: this.selectedDocument.docName,
      entries: this.selectedLinkedValues.map(v => ({
        linkTable: v.docLinkedTable,
        linkColumn: v.docLinkedColumn,
        linkedValue: v.linkedValue
      }))
    };

    const dialogRef = this.dialog.open(DetachLinkedEntriesDialogComponent, {
      width: '710px',
      maxHeight: '100vh',
      height: '100vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'right-side-dialog',
      position: { right: '0' },
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
      // Remove focus from button after dialog closes
      this.removeFocus();

      if (confirmed && this.selectedDocument) {
        this.detachLinkedValues();
      }
    });
  }

  private detachLinkedValues(): void {
    if (!this.selectedDocument) return;

    const sessionId = this.selectedDocument.sessionId;
    const deleteRequest = {
      deleteAll: false,
      selectedValues: this.selectedLinkedValues.map(v => v.linkedValue)
    };

    this.isUnlinking = true;
    this.cdr.detectChanges();

    this.apiService.deleteDocument(sessionId, deleteRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess(`Values detached from "${this.selectedDocument!.docName}" successfully`);
          this.selectedLinkedValues = [];
          this.refreshAndSelectDocument(sessionId);
          setTimeout(() => {
            this.isUnlinking = false;
            this.cdr.detectChanges();
          }, 500);
        },
        error: () => {
          this.isUnlinking = false;
          this.cdr.detectChanges();
        }
      });
  }

  onClearAll(): void {
    this.removeFocus();
    this.resetFilterFormAndRetrieve();
  }

  onRetrieve(): void {
    // Remove focus from the RETRIEVE button
    this.removeFocus();

    if (!this.hasFilterValues) {
      this.showError('Please enter at least one search criteria');
      return;
    }

    this.filterForm.markAllAsTouched();
    this.cdr.markForCheck();

    if (this.filterForm.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'from';
    }

    if (this.filterForm.invalid) {
      this.showError('Please fix validation errors before retrieving');
      return;
    }

    this.retrieveDocuments();
  }

  private retrieveDocuments(onComplete?: () => void): void {
    const fromDateValue = this.filterForm.get('fromDate')?.value;
    const toDateValue = this.filterForm.get('toDate')?.value;

    const serializedFromDate = fromDateValue
      ? DateFieldValidationUtility.serializeDateForApi(fromDateValue)
      : null;
    const serializedToDate = toDateValue
      ? DateFieldValidationUtility.serializeDateForApi(toDateValue)
      : null;

    // Get table and column values (they are already in uppercase from the dropdown)
    const tableValue = this.filterForm.get('table')?.value;
    const columnValue = this.filterForm.get('column')?.value;

    const filters: DocumentLibrarySearchDto = {
      docLinkedTable: tableValue || undefined,
      docLinkedColumn: columnValue || undefined,
      docLinkedValue: this.filterForm.get('value')?.value || undefined,
      docId: this.filterForm.get('docId')?.value || undefined,
      fromDate: serializedFromDate || undefined,
      toDate: serializedToDate || undefined
    };

    this.isLoading = true;

    this.apiService.searchDocuments(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.documents = this.mapDocumentsToDisplay(result.documents);
          this.isLoading = false;
          if (onComplete) onComplete();
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private mapDocumentsToDisplay(dtos: DocumentLibraryDto[]): DocumentDisplay[] {
    const displayDocs: DocumentDisplay[] = [];

    dtos.forEach(dto => {
      dto.linkedValues.forEach(value => {
        displayDocs.push({
          sessionId: dto.sessionId,
          docName: dto.docName,
          docLinkedDesc: dto.docLinkedDesc,
          docId: dto.docId,
          docLinkedTable: dto.docLinkedTable,
          docLinkedColumn: dto.docLinkedColumn,
          linkedValue: value,
          docType: dto.docType
        });
      });
    });

    return displayDocs;
  }

  onRowAction(event: TableRowActionEvent<DocumentDisplay>): void {
    if (event.action === 'download') {
      this.onDownloadLinkedValue(event.row);
    }
  }

  onDownloadLinkedValue(doc: DocumentDisplay): void {
    this.isDownloading = true;
    this.cdr.detectChanges();

    const startTime = Date.now();

    this.downloadDocument(doc, () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      setTimeout(() => {
        this.isDownloading = false;
        this.cdr.detectChanges();
      }, remainingTime);
    });
  }

  onDeleteDocumentClick(event: Event, doc: DocumentDisplay): void {
    event.stopPropagation();
    // Remove focus from the delete button
    this.removeFocus();
    this.onDeleteDocument(doc);
  }

  onDeleteDocument(doc: DocumentDisplay): void {
    const dialogData = {
      documentName: doc.docName,
      fileSize: undefined // We don't have file size in the current data model
    };

    const dialogRef = this.dialog.open(DeleteDocumentDialogComponent, {
      width: '420px',
      disableClose: true,
      autoFocus: false,
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
      // Remove focus from button after dialog closes
      this.removeFocus();

      if (confirmed) {
        this.deleteDocument(doc.sessionId, doc.docName);
      }
    });
  }

  private deleteDocument(sessionId: string, docName: string): void {
    const deleteRequest = { deleteAll: true };

    this.isDeleting = true;
    this.cdr.detectChanges();

    this.apiService.deleteDocument(sessionId, deleteRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess(`Document "${docName}" deleted successfully`);
          // Clear selection if deleted document was selected
          if (this.selectedDocument?.sessionId === sessionId) {
            this.selectedDocument = null;
            this.selectedDocumentLinkedValues = [];
            this.selectedLinkedValues = [];
          }
          this.retrieveDocuments();
          setTimeout(() => {
            this.isDeleting = false;
            this.cdr.detectChanges();
          }, 500);
        },
        error: () => {
          this.isDeleting = false;
          this.cdr.detectChanges();
        }
      });
  }

  private resetFilterFormAndRetrieve(): void {
    this.filterForm.reset({
      table: null,
      column: null,
      value: '',
      docId: '',
      fromDate: null,
      toDate: null
    });
    this.lastChangedDateField = null;
    this.selectedDocument = null;
    this.selectedDocumentLinkedValues = [];
    this.selectedLinkedValues = [];
    this.documents = [];
    this.tableSearchControl.setValue('', { emitEvent: false });
    this.columnSearchControl.setValue('', { emitEvent: false });
    this.cdr.markForCheck();
  }

  private downloadDocument(doc: DocumentDisplay, onComplete?: () => void): void {
    this.apiService.downloadDocument(doc.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const isPdf = doc.docType?.toLowerCase() === 'pdf';

          if (isPdf) {
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
              this.showError('Please allow popups to view the document');
            }
          } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.docName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            this.showSuccess(`Downloaded: ${doc.docName}`);
          }

          if (onComplete) onComplete();
        },
        error: () => {
          this.showError(`Failed to download: ${doc.docName}`);
          if (onComplete) onComplete();
        }
      });
  }

  /**
   * Get unique documents from the documents list
   */
  get uniqueDocuments(): DocumentDisplay[] {
    const uniqueMap = new Map<string, DocumentDisplay>();
    this.documents.forEach(doc => {
      if (!uniqueMap.has(doc.sessionId)) {
        uniqueMap.set(doc.sessionId, {
          ...doc,
          docType: this.getDocumentType(doc.docName)
        });
      }
    });
    return Array.from(uniqueMap.values());
  }

  get hasSelectedLinkedValues(): boolean {
    return this.selectedLinkedValues.length > 0;
  }

  /**
   * Get document type from filename
   */
  private getDocumentType(filename: string): string {
    const extension = filename.split('.').pop()?.toUpperCase() || '';
    return extension;
  }

  /**
   * Get document icon based on file type
   */
  getDocumentIcon(doc: DocumentDisplay): string {
    const name = doc.docName.toLowerCase();
    if (name.endsWith('.pdf')) return 'picture_as_pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'grid_on';
    return 'insert_drive_file';
  }

  isPdfDocument(doc: DocumentDisplay): boolean {
    return doc.docName.toLowerCase().endsWith('.pdf');
  }

  isDocDocument(doc: DocumentDisplay): boolean {
    const name = doc.docName.toLowerCase();
    return name.endsWith('.doc') || name.endsWith('.docx');
  }

  isXlsDocument(doc: DocumentDisplay): boolean {
    const name = doc.docName.toLowerCase();
    return name.endsWith('.xls') || name.endsWith('.xlsx');
  }

  /**
   * Show tooltip only if text is truncated (overflowing)
   */
  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  get hasDocuments(): boolean {
    return this.documents.length > 0;
  }

  get hasFilterValues(): boolean {
    const table = this.filterForm.get('table')?.value;
    const column = this.filterForm.get('column')?.value;
    const value = this.filterForm.get('value')?.value;
    const docId = this.filterForm.get('docId')?.value;
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    return !!(table || column || value || docId || fromDate || toDate);
  }

  get isClearAllDisabled(): boolean {
    return this.filterForm.pristine || this.isLoading;
  }

  /**
   * Get error message for Filter Document ID field
   */
  getFilterDocIdError(): string {
    const control = this.filterForm.get('docId');
    if (!control || !control.touched) return '';

    if (control.hasError('maxlength')) {
      return 'Maximum 30 characters allowed';
    }
    return '';
  }
}
