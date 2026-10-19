import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin, distinctUntilChanged } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

import { DonorDocumentLibraryService } from './services/donor-document-library.service';
import {
  DonorDocumentDisplay,
  LinkedValueRow,
} from './models/donor-document-library.model';
import { UploadDocumentPanelComponent } from './upload-document-panel/upload-document-panel';

@Component({
  selector: 'app-donor-document-library',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './donor-document-library.html',
  styleUrl: './donor-document-library.scss',
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class DonorDocumentLibraryComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(DonorDocumentLibraryService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly documents = signal<DonorDocumentDisplay[]>([]);
  readonly selectedDocument = signal<DonorDocumentDisplay | null>(null);
  readonly linkedValues = signal<LinkedValueRow[]>([]);
  readonly selectedLinkedValues = signal<LinkedValueRow[]>([]);
  readonly loading = signal(false);
  readonly downloading = signal(false);
  readonly deleting = signal(false);
  readonly hasRetrieved = signal(false);

  // Donor context
  readonly donorId = signal('');
  readonly donorName = signal('');

  // Dropdown options — LOV from MASTER_CODES
  tableOptions: string[] = [];
  filteredTableOptions: string[] = [];
  tableSearchControl = new FormControl<string>('');

  columnOptions: string[] = [];
  filteredColumnOptions: string[] = [];
  columnSearchControl = new FormControl<string>('');

  isLoadingFilters = false;

  // Computed
  readonly hasDocuments = computed(() => this.documents().length > 0);
  readonly hasLinkedValues = computed(() => this.linkedValues().length > 0);
  readonly hasSelectedLinkedValues = computed(
    () => this.selectedLinkedValues().length > 0,
  );

  readonly maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    return chapterDate ? chapterDate.toDate() : new Date();
  });

  // Filter form
  filterForm: FormGroup = this.fb.group({
    table: [''],
    column: [''],
    value: ['', Validators.maxLength(30)],
    docId: ['', Validators.maxLength(30)],
    fromDate: [''],
    toDate: [''],
  });

  // Page header
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      {
        label: 'Donor Detail Query',
        link: ROUTE_REGISTRY[RouteKey.DonorDetailQuery]?.path || '/donor-functions/donor-profile/donor-detail-query',
      },
      { label: 'Document Library' },
    ],
    title: 'Document Library',
    subtitle: 'Attach, remove, and print documents across records.',
    showBackButton: true,
    onBackClick: () => this.navigateBack(),
    actions: [
      {
        label: 'UPLOAD AND LINK DOCUMENT',
        icon: 'cloud_upload',
        variant: 'filled',
        onClick: () => this.onOpenUploadPanel(),
      },
    ],
  };

  // Linked values table — checkbox FIRST, then columns, then download action
  linkedValuesTableConfig: DataTableConfig<LinkedValueRow> = {
    columns: [
      { key: 'docLinkedTable', header: 'Linked Table', sortable: true },
      { key: 'docLinkedColumn', header: 'Linked Column', sortable: false },
      { key: 'linkedValue', header: 'Linked Value', sortable: false },
      { key: 'docLinkedDesc', header: 'Description', sortable: false },
    ],
    stickyHeader: true,
    enableSelection: true,
    selectionPosition: 'first',
    showTableOnEmpty: false,
    emptyMessage: 'No linked values found',
    enableRowHighlight: true,
    sortConfig: { column: 'docLinkedTable', direction: 'D' },
    stickyActionsColumn: true,
    rowActions: [
      {
        icon: 'download',
        label: 'Download',
        action: 'download',
      },
    ],
  };

  ngOnInit(): void {
    this.setupSearchListeners();
    this.loadFilterOptions();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['donorId']) {
        this.donorId.set(params['donorId']);
      }
      if (params['donorName']) {
        this.donorName.set(params['donorName']);
      }
      if (this.donorId()) {
        this.setDefaultFilters();
        this.retrieveDocuments();
      }
    });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateBack(): void {
    const path = ROUTE_REGISTRY[RouteKey.DonorDetailQuery]?.path || '/donor-functions/donor-profile/donor-detail-query';
    this.router.navigate([path], {
      queryParams: { donorId: this.donorId() },
    });
  }

  // ==============================
  // Searchable dropdown setup
  // ==============================

  private setupSearchListeners(): void {
    // Table search filtering
    this.tableSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredTableOptions = this.tableOptions.filter((t) =>
          t.toLowerCase().includes(term),
        );
      });

    // Column search filtering
    this.columnSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredColumnOptions = this.columnOptions.filter((c) =>
          c.toLowerCase().includes(term),
        );
      });

    // Cascading: when Table changes, reload Column options
    this.filterForm.get('table')!.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((tableName) => {
        if (tableName) {
          this.loadColumnOptions(tableName);
        } else {
          this.loadColumnOptions();
        }
      });
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;
    this.tableOptions = [];
    this.filteredTableOptions = [];
    this.columnOptions = [];
    this.filteredColumnOptions = [];

    forkJoin({
      categories: this.apiService.getLinkCategories(),
      columns: this.apiService.getColumnCodes(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categories, columns }) => {
          const tableNames = categories.map((c: any) => c.linkTable).filter(Boolean);
          this.tableOptions = tableNames.sort();
          this.filteredTableOptions = [...this.tableOptions];
          this.tableSearchControl.setValue('', { emitEvent: false });

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
        },
      });
  }

  private loadColumnOptions(tableName?: string): void {
    this.isLoadingFilters = true;
    this.columnOptions = [];
    this.filteredColumnOptions = [];

    this.apiService
      .getColumnCodes(tableName)
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
          this.filteredColumnOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ==============================
  // Filters & retrieval
  // ==============================

  private setDefaultFilters(): void {
    this.filterForm.patchValue({
      table: '',
      column: '',
      value: this.donorId(),
      docId: '',
      fromDate: '',
      toDate: '',
    }, { emitEvent: false });
  }

  retrieveDocuments(): void {
    if (this.filterForm.invalid) return;

    const formValues = this.filterForm.value;
    const filters: any = {};

    if (formValues.table) filters.docLinkedTable = formValues.table;
    if (formValues.column) filters.docLinkedColumn = formValues.column;
    if (formValues.value) filters.docLinkedValue = formValues.value;
    if (formValues.docId) filters.docId = formValues.docId;
    if (formValues.fromDate) {
      const fromMoment = moment.isMoment(formValues.fromDate)
        ? formValues.fromDate
        : moment(formValues.fromDate);
      filters.fromDate = fromMoment.format('YYYY-MM-DD');
    }
    if (formValues.toDate) {
      const toMoment = moment.isMoment(formValues.toDate)
        ? formValues.toDate
        : moment(formValues.toDate);
      filters.toDate = toMoment.format('YYYY-MM-DD');
    }

    this.loading.set(true);
    this.hasRetrieved.set(true);

    this.apiService
      .searchDocuments(filters, 1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const mapped = this.mapDocumentsToDisplay(response.documents);
          this.documents.set(mapped);
          if (mapped.length > 0) {
            this.selectDocument(mapped[0]);
          } else {
            this.selectedDocument.set(null);
            this.linkedValues.set([]);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to retrieve documents');
        },
      });
  }

  private mapDocumentsToDisplay(dtos: any[]): DonorDocumentDisplay[] {
    const docMap = new Map<string, DonorDocumentDisplay>();

    dtos.forEach((dto) => {
      const key = dto.sessionId;
      if (!docMap.has(key)) {
        docMap.set(key, {
          sessionId: dto.sessionId,
          docName: dto.docName,
          docType: dto.docType || this.getFileExtension(dto.docName),
          docId: dto.docId,
          docLinkedTable: dto.docLinkedTable,
          docLinkedColumn: dto.docLinkedColumn,
          docLinkedDesc: dto.docLinkedDesc || '',
          linkedValues: dto.linkedValues || [],
        });
      }
    });

    return Array.from(docMap.values());
  }

  // ==============================
  // Document & linked value actions
  // ==============================

  selectDocument(doc: DonorDocumentDisplay): void {
    this.selectedDocument.set(doc);
    this.selectedLinkedValues.set([]);

    const rows: LinkedValueRow[] = (doc.linkedValues || []).map((val) => ({
      sessionId: doc.sessionId,
      docLinkedTable: doc.docLinkedTable,
      docLinkedColumn: doc.docLinkedColumn,
      linkedValue: val,
      docLinkedDesc: doc.docLinkedDesc,
    }));

    this.linkedValues.set(rows);
  }

  onSelectionChange(selected: LinkedValueRow[]): void {
    this.selectedLinkedValues.set(selected);
  }

  onLinkedValuesSortChange(event: TableSortEvent): void {
    this.linkedValuesTableConfig = {
      ...this.linkedValuesTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };

    const sorted = [...this.linkedValues()].sort((a, b) => {
      const valA = (a[event.column as keyof LinkedValueRow] ?? '').toString().toLowerCase();
      const valB = (b[event.column as keyof LinkedValueRow] ?? '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return event.direction === 'D' ? -cmp : cmp;
    });
    this.linkedValues.set(sorted);
  }

  onRowAction(event: { action: string; row: LinkedValueRow }): void {
    if (event.action === 'download') {
      this.onDownloadFromRow(event.row);
    }
  }

  onDownloadFromRow(row: LinkedValueRow): void {
    this.downloadDocument(row.sessionId, this.selectedDocument()?.docName || 'document');
  }

  private downloadDocument(sessionId: string, fileName: string): void {
    this.downloading.set(true);
    this.apiService
      .downloadDocument(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.downloading.set(false);
          this.snackbarService.showSuccess(`Downloaded: ${fileName}`);
        },
        error: () => {
          this.downloading.set(false);
          this.snackbarService.showError('Failed to download document');
        },
      });
  }

  onDeleteDocument(doc: DonorDocumentDisplay, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Document',
        message: `Are you sure you want to delete "${doc.docName}"?`,
        confirmText: 'DELETE',
        cancelText: 'CANCEL',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(doc);
        }
      });
  }

  private performDelete(doc: DonorDocumentDisplay): void {
    this.deleting.set(true);
    this.apiService
      .deleteDocument(doc.sessionId, { deleteAll: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          const updated = this.documents().filter(
            (d) => d.sessionId !== doc.sessionId,
          );
          this.documents.set(updated);

          if (this.selectedDocument()?.sessionId === doc.sessionId) {
            if (updated.length > 0) {
              this.selectDocument(updated[0]);
            } else {
              this.selectedDocument.set(null);
              this.linkedValues.set([]);
            }
          }
          this.snackbarService.showSuccess('Document deleted successfully');
        },
        error: () => {
          this.deleting.set(false);
          this.snackbarService.showError('Failed to delete document');
        },
      });
  }

  onOpenUploadPanel(): void {
    const dialogRef = this.dialog.open(UploadDocumentPanelComponent, {
      width: '520px',
      maxHeight: '100vh',
      height: '100vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: this.donorId(),
        donorName: this.donorName(),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((uploaded) => {
        if (uploaded) {
          this.retrieveDocuments();
          this.snackbarService.showSuccess('Document uploaded successfully');
        }
      });
  }

  onLinkDocumentClick(): void {
    const doc = this.selectedDocument();
    if (!doc) return;

    const dialogRef = this.dialog.open(UploadDocumentPanelComponent, {
      width: '520px',
      maxHeight: '100vh',
      height: '100vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: this.donorId(),
        donorName: this.donorName(),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((linked) => {
        if (linked) {
          this.retrieveDocuments();
        }
      });
  }

  private resetState(): void {
    this.documents.set([]);
    this.selectedDocument.set(null);
    this.linkedValues.set([]);
    this.selectedLinkedValues.set([]);
    this.hasRetrieved.set(false);
    this.filterForm.reset();
    this.setDefaultFilters();
    this.loadFilterOptions();
  }

  // ==============================
  // Helpers
  // ==============================

  getFileExtension(filename: string): string {
    return filename?.split('.').pop()?.toUpperCase() || '';
  }

  getFileIcon(filename: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'image';
      default:
        return 'insert_drive_file';
    }
  }

  getFileIconClass(docType: string | undefined): string {
    const ext = (docType || '').toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'file-icon--pdf';
      case 'doc':
      case 'docx':
        return 'file-icon--doc';
      case 'xls':
      case 'xlsx':
        return 'file-icon--xls';
      default:
        return 'file-icon--default';
    }
  }

  trackBySessionId(_index: number, item: DonorDocumentDisplay): string {
    return item.sessionId;
  }
}
