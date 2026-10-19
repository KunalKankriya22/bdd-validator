import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed,
  effect,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { RecheckProductsService } from './services/recheck-products.service';
import {
  RecheckTableEntry,
  AvailableComponent,
  ValidateUnitRequest,
  ValidateComponentRequest,
  RecheckProcessRequest,
  RecheckResultResponse,
} from './models/recheck-products.model';

@Component({
  selector: 'app-recheck-products-from-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './recheck-products-from-inventory.html',
  styleUrls: ['./recheck-products-from-inventory.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecheckProductsFromInventoryComponent implements OnInit, OnDestroy {
  private readonly service = inject(RecheckProductsService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;
  @ViewChild('productSelect') productSelect?: MatSelect;

  private readonly defaultTitle = 'Re-Check Products from Inventory';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: 'Re-check inventory products to validate product details and availability.',
    actions: [],
  };

  searchForm!: FormGroup;

  entries = signal<RecheckTableEntry[]>([]);
  entriesCount = computed(() => this.entries().length);
  private readonly sortState = signal<TableSortEvent>({ column: 'unitId', direction: 'default' });

  tableData = computed(() => {
    const data = [...this.entries()];
    const sort = this.sortState();
    if (sort.direction === 'default') return data;
    return data.sort((a, b) => {
      const valA = (a[sort.column as keyof RecheckTableEntry] || '').toString().toLowerCase();
      const valB = (b[sort.column as keyof RecheckTableEntry] || '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });
  private readonly currentPageIndex = signal(0);
  private readonly currentPageSize = signal(25);
  paginatedData = computed(() => {
    const data = this.tableData();
    const pageIndex = this.currentPageIndex();
    const pageSize = this.currentPageSize();
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  });
  isProcessing = signal(false);
  isTransacting = signal(false);
  collectionDate = signal('');
  componentExpiryDate = signal<string | null>(null);
  availableComponents = signal<AvailableComponent[]>([]);
  readonly productCodeSearchControl = new FormControl('');
  private readonly productCodeSearch = signal('');
  private readonly selectedProductCode = signal('');
  private readonly codeScheme = signal<'I' | 'C'>('C');
  private readonly entryMode = signal<'S' | 'M'>('S');

  selectedProduct = computed(() => {
    const code = this.selectedProductCode();
    if (!code) return null;
    return this.availableComponents().find(p => p.productCode === code) || null;
  });

  filteredProducts = computed(() => {
    const search = this.productCodeSearch().toUpperCase();
    const products = this.availableComponents();
    if (!search) return products;
    return products.filter(
      (p) =>
        p.productCode.toUpperCase().includes(search) ||
        p.productDescription.toUpperCase().includes(search),
    );
  });

  private readonly ERROR_MESSAGES: Record<string, string> = {
    '0023': 'Product already rechecked into Blood Centers Lab.',
    '0063': 'Collection date not present - initial check-in not done.',
    '0080': 'Field must be entered.',
    '0104': 'Not available in inventory.',
    '0122': 'No components found.',
    '0230': 'Transaction failed. Please try again.',
    '1205': 'Invalid product code.',
    '9791': 'Interdiction(s) found for this unit.',
    '9794': 'This is a pooled product.',
    '9795': 'Product has already expired.',
    '9796': 'Interdiction(s) found for this unit.',
    '9797': 'Multiple aliquots found.',
    '9911': 'Donor not acceptable.',
    '9912': 'Donor not registered.',
    '9913': 'No donor record found.',
    '9914': 'Donor on hold.',
    '9915': 'Donor quarantined.',
    '9916': 'Donor status unknown.',
    '9917': 'Donor return deferral.',
    '9918': 'Donor interstate deferral.',
    '9919': 'Donor deferred hold.',
    '9931': 'Donor not acceptable.',
    '9932': 'No donor record found.',
    '9933': 'Donor on hold/quarantine.',
    '9934': 'Donor deferred hold.',
  };

  dataTableConfig: DataTableConfig<RecheckTableEntry> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '16%' },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '13%' },
      {
        key: 'productDescription',
        header: 'Product Description',
        sortable: false,
        width: '38%',
        valueFormatter: (value: string) => this.formatProductDescription(value),
      },
      {
        key: 'expiryDate',
        header: 'Expiration Date',
        sortable: false,
        width: '33%',
        valueFormatter: (value: string) => this.formatExpirationDate(value),
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: { column: 'unitId', direction: 'default' },
    stickyHeader: true,
    showPagination: true,
    enableSelection: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin.',
    loadingMessage: 'Processing...',
  };

  constructor() {
    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.productCodeSearch.set(value || '');
      });

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null },
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || 'Re-check inventory products to validate product details and availability.',
        };
      }
    });

    effect(() => {
      const count = this.entriesCount();
      const unitIdCol = this.dataTableConfig.columns.find(c => c.key === 'unitId');
      if (unitIdCol) {
        unitIdCol.header = count > 0 ? `Unit ID (${count})` : 'Unit ID';
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      productCode: ['', [Validators.maxLength(8)]],
    });

    this.searchForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.selectedProductCode.set(value || '');
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
      });
  }

  private storedParsedUnitId = signal('');

  onProductSelected(): void {
    this.processProductSelection();
  }

  onSortChange(event: TableSortEvent): void {
    this.sortState.set(event);
    if (this.dataTableConfig.sortConfig) {
      this.dataTableConfig.sortConfig = { column: event.column, direction: event.direction };
    }
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;
    this.codeScheme.set(event.data.codeScheme ?? 'C');
    this.entryMode.set(event.data.entryMode ?? 'S');

    this.isProcessing.set(true);
    this.componentExpiryDate.set(null);
    this.availableComponents.set([]);
    this.searchForm.get('productCode')?.setValue('');

    const request: ValidateUnitRequest = { unitId: parsedUnitId };
    this.service
      .validateUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.hasInterdictions && response.warnings?.length) {
            response.warnings.forEach(w =>
              this.snackbarService.showInfo(w.message)
            );
          } else if (response.hasInterdictions) {
            this.snackbarService.showInfo('Interdiction(s) found for this unit.');
          }

          this.storedParsedUnitId.set(parsedUnitId);
          this.collectionDate.set(response.collectionDate);
          this.populateAvailableComponents(response.availableComponents || []);
          event.confirm();
        },
        error: (error) => {
          this.isProcessing.set(false);
          const errorMessage = this.extractErrorMessage(error, 'Error validating unit');
          event.reject(errorMessage);
          this.cdr.detectChanges();
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {
    this.storedParsedUnitId.set('');
    this.collectionDate.set('');
    this.componentExpiryDate.set(null);
    this.availableComponents.set([]);
    this.selectedProductCode.set('');
    this.codeScheme.set('C');
    this.entryMode.set('S');
    this.searchForm.get('productCode')?.setValue('');
    this.productCodeSearchControl.setValue('');
  }

  private populateAvailableComponents(components: AvailableComponent[]): void {
    this.availableComponents.set(components);

    if (components.length === 1) {
      this.searchForm.get('productCode')?.setValue(components[0].productCode);
      this.processProductSelection();
    } else if (components.length === 0) {
      this.isProcessing.set(false);
      this.showErrorSnackbar('No valid products found for this unit.');
    } else {
      this.isProcessing.set(false);
      setTimeout(() => this.productSelect?.open());
    }
    this.cdr.detectChanges();
  }

  processProductSelection(): void {
    const productCode = this.searchForm.get('productCode')?.value?.trim()?.toUpperCase();
    if (!productCode) {
      this.showErrorSnackbar('Please select a product code.');
      return;
    }

    const unitId = this.storedParsedUnitId();
    const collDate = this.collectionDate();

    if (!unitId || !collDate) {
      this.showErrorSnackbar('Please scan a Unit ID first.');
      return;
    }

    const isDuplicate = this.entries().some(
      (e) => e.unitId === unitId && e.productCode === productCode,
    );
    if (isDuplicate) {
      this.showErrorSnackbar('This unit/product combination has already been processed.');
      return;
    }

    this.isProcessing.set(true);

    const validateRequest: ValidateComponentRequest = {
      unitId,
      productCode,
      collectionDate: collDate,
      chapterId: this.headerService.chapterId(),
      codeScheme: this.codeScheme(),
    };

    this.service
      .validateComponent(validateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validateResponse) => {
          if (validateResponse && 'success' in validateResponse && !validateResponse.success) {
            this.isProcessing.set(false);
            this.handleError(validateResponse, 'Error validating component');
            this.cdr.detectChanges();
            return;
          }

          this.componentExpiryDate.set(validateResponse?.expiryDate || null);
          this.isProcessing.set(false);
          this.cdr.detectChanges();
          this.liveAnnouncer.announce('Product validated. Processing recheck.');

          this.executeRecheck(unitId, productCode, collDate);
        },
        error: (error) => {
          this.isProcessing.set(false);

          const errorCode = this.extractErrorCode(error);
          if (errorCode === '9795') {
            const expiryDate = error?.error?.item?.expiryDate || null;
            this.componentExpiryDate.set(expiryDate);
            this.cdr.detectChanges();
            this.showExpiredProductConfirmation(unitId, productCode, collDate);
          } else {
            this.componentExpiryDate.set(null);
            this.handleError(error, 'Error processing recheck');
            this.cdr.detectChanges();
          }
        },
      });
  }

  private executeRecheck(unitId: string, productCode: string, collDate: string): void {
    this.isTransacting.set(true);
    this.cdr.detectChanges();

    const processRequest: RecheckProcessRequest = {
      unitId,
      productCode,
      collectionDate: collDate,
      chapterId: this.headerService.chapterId(),
      codeScheme: this.codeScheme(),
      entryMode: this.entryMode(),
    };

    this.service.processRecheck(processRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && 'success' in response && !response.success) {
            this.isProcessing.set(false);
            this.isTransacting.set(false);
            this.componentExpiryDate.set(null);
            this.handleError(response, 'Error processing recheck');
            this.cdr.detectChanges();
            return;
          }

          this.handleRecheckSuccess(response);
        },
        error: (error) => {
          this.isProcessing.set(false);
          this.isTransacting.set(false);
          this.componentExpiryDate.set(null);
          this.handleError(error, 'Error processing recheck');
          this.cdr.detectChanges();
        },
      });
  }

  onTablePageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = event.pageIndex;
      this.dataTableConfig.pagination.pageSize = event.pageSize;
    }
    this.cdr.detectChanges();
  }

  private showExpiredProductConfirmation(unitId: string, productCode: string, collDate: string): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Expired Product',
      message: 'Product has already expired. Do you want to proceed?',
      confirmText: 'Yes',
      cancelText: 'No',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processRecheckWithExpiredBypass(unitId, productCode, collDate);
        } else {
          this.clearInputsForNextScan();
        }
      });
  }

  private processRecheckWithExpiredBypass(unitId: string, productCode: string, collDate: string): void {
    this.isTransacting.set(true);
    this.cdr.detectChanges();

    const processRequest: RecheckProcessRequest = {
      unitId,
      productCode,
      collectionDate: collDate,
      chapterId: this.headerService.chapterId(),
      allowExpired: true,
      codeScheme: this.codeScheme(),
      entryMode: this.entryMode(),
    };

    this.service.processRecheck(processRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && 'success' in response && !response.success) {
            this.isTransacting.set(false);
            this.handleError(response, 'Error processing recheck');
            this.cdr.detectChanges();
            return;
          }

          this.handleRecheckSuccess(response);
        },
        error: (error) => {
          this.isTransacting.set(false);
          this.componentExpiryDate.set(null);
          this.handleError(error, 'Error processing recheck');
          this.cdr.detectChanges();
        },
      });
  }

  private handleRecheckSuccess(response: RecheckResultResponse): void {
    this.isProcessing.set(false);
    this.isTransacting.set(false);

    if (response?.warnings?.length) {
      response.warnings.forEach(w =>
        this.snackbarService.showInfo(w.message)
      );
    }

    const newEntry: RecheckTableEntry = {
      unitId: response.unitId,
      productCode: response.productCode,
      productDescription: response.productDescription,
      expiryDate: response.expiryDate,
    };

    this.entries.update((prev) => [newEntry, ...prev]);
    this.currentPageIndex.set(0);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.updatePaginationTotal();
    this.liveAnnouncer.announce(`Recheck successful. ${this.entriesCount()} unit(s) processed.`);
    this.showSuccessToast(this.entriesCount());
    this.clearInputsForNextScan();
    this.cdr.detectChanges();
  }

  private extractErrorCode(error: unknown): string | null {
    if (error && typeof error === 'object') {
      const err = error as {
        error?: {
          errorCode?: string;
          errorResponse?: { errorCode?: string };
        };
      };
      return err.error?.errorCode || err.error?.errorResponse?.errorCode || null;
    }
    return null;
  }

  private updatePaginationTotal(): void {
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.totalRecords = this.entries().length;
    }
  }

  private clearInputsForNextScan(): void {
    this.productSelect?.close();
    this.storedParsedUnitId.set('');
    this.collectionDate.set('');
    this.componentExpiryDate.set(null);
    this.availableComponents.set([]);
    this.selectedProductCode.set('');
    this.searchForm.get('productCode')?.setValue('');
    this.productCodeSearchControl.setValue('');
    this.unitIdField?.clear();
    setTimeout(() => this.unitIdField?.focus(), 100);
  }

  private resetState(): void {
    this.unitIdField?.clear();
    this.searchForm.get('productCode')?.setValue('');
    this.storedParsedUnitId.set('');
    this.entries.set([]);
    this.collectionDate.set('');
    this.componentExpiryDate.set(null);
    this.availableComponents.set([]);
    this.selectedProductCode.set('');
    this.codeScheme.set('C');
    this.entryMode.set('S');
    this.productCodeSearchControl.setValue('');
    this.isProcessing.set(false);
    this.currentPageIndex.set(0);
    this.currentPageSize.set(25);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
      this.dataTableConfig.pagination.totalRecords = 0;
    }
    this.cdr.detectChanges();
  }

  private showSuccessToast(count: number): void {
    this.snackbarService.showSuccess(`${count} unit(s) validated successfully.`);
  }

  private showErrorSnackbar(message: string): void {
    this.snackbarService.showError(message);
  }

  private extractErrorMessage(error: unknown, defaultMessage: string): string {
    if (error && typeof error === 'object') {
      const err = error as {
        error?: {
          message?: string;
          errorCode?: string;
          errorResponse?: { error?: string; errorCode?: string };
        };
      };

      const errorCode = err.error?.errorCode || err.error?.errorResponse?.errorCode;
      if (errorCode && this.ERROR_MESSAGES[errorCode]) {
        return this.ERROR_MESSAGES[errorCode];
      } else if (err.error?.message) {
        return err.error.message;
      } else if (err.error?.errorResponse?.error) {
        return err.error.errorResponse.error;
      }
    }

    return defaultMessage;
  }

  private handleError(error: unknown, defaultMessage: string): void {
    const message = this.extractErrorMessage(error, defaultMessage);
    this.liveAnnouncer.announce(`Error: ${message}`);
    this.showErrorSnackbar(message);
  }

  formatProductDescription(description: string): string {
    if (!description) return '';
    return description.split('|')[0].trim();
  }

  formatExpirationDate(value: string): string {
    if (!value) return '';
    const timezone = this.headerService.chapterTimeZone();
    const d = convertUTCToTimezone(new Date(value), timezone);
    if (isNaN(d.getTime())) return value;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${mon} ${yyyy} ${hh}:${mm}`;
  }
}
