import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';

import { ViewItemsDialogComponent, ViewItemsDialogData } from './view-items-dialog/view-items-dialog';
import { OdtoffApiService } from './services/odtoff-api.service';
import {
  PickSlipDropdownDto,
  PickSlipSummaryDto,
  PickSlipProductDto,
  RemovedProductModel,
  EligibleProductOption,
  RemoveProductRequestDto,
  ODTOFF_ERROR_CODES,
} from './models/odtoff.model';

@Component({
  selector: 'app-odtoff',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './odtoff.html',
  styleUrl: './odtoff.scss',
})
export class Odtoff implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `odtoff-${Odtoff.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(OdtoffApiService);
  private readonly loggingService = inject(LoggingService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  readonly activePickSlips = signal<PickSlipDropdownDto[]>([]);
  readonly selectedPickSlipSummary = signal<PickSlipSummaryDto | null>(null);
  readonly allPickSlipProducts = signal<PickSlipProductDto[]>([]);
  readonly eligibleProducts = signal<EligibleProductOption[]>([]);
  readonly removedProducts = signal<RemovedProductModel[]>([]);
  readonly validatedProduct = signal<EligibleProductOption | null>(null);
  readonly parsedUnitId = signal<string | null>(null);
  readonly unitCodeScheme = signal<string>('I');
  readonly loading = signal<boolean>(false);
  readonly loadingPickSlips = signal<boolean>(false);
  readonly loadingSummary = signal<boolean>(false);
  readonly loadingProducts = signal<boolean>(false);
  readonly removing = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal<boolean>(false);
  readonly pickSlipSearchTerm = signal<string>('');
  readonly productCodeSearchTerm = signal<string>('');

  // Search controls for searchable dropdowns
  readonly pickSlipSearchControl = new FormControl('');
  readonly productCodeSearchControl = new FormControl('');

  // Computed values
  readonly hasPickSlipSelected = computed(() => this.selectedPickSlipSummary() !== null);
  readonly hasRemovedProducts = computed(() => this.removedProducts().length > 0);

  readonly filteredPickSlips = computed(() => {
    const search = this.pickSlipSearchTerm().toLowerCase();
    const items = this.activePickSlips();
    if (!search) return items;
    return items.filter((ps) => ps.pickSlipId.toLowerCase().includes(search));
  });

  readonly filteredProductCodes = computed(() => {
    const search = this.productCodeSearchTerm().toLowerCase();
    const items = this.eligibleProducts();
    if (!search) return items;
    return items.filter((p) => p.productCode.toLowerCase().includes(search));
  });

  // Forms
  pickSlipForm!: FormGroup;
  productForm!: FormGroup;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: 'Removal from Outdate List',
    subtitle: 'Remove products that are currently outdated from the pickslip, but were not when packed and shipped.',
    actions: [],
  };

  // Removed products table configuration
  tableConfig: DataTableConfig<RemovedProductModel> = {
    columns: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Enter outdate pickslip to begin.',
    noDataIcon: 'search',
    loadingMessage: 'Loading...',
    showPagination: true,
  };

  private removedCount = 0;
  private removalSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  constructor() {
    this.initializeForms();
    this.initializeTableConfig();

    this.pickSlipSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.pickSlipSearchTerm.set(value || ''));

    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.productCodeSearchTerm.set(value || ''));

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle || '',
        };
      }
    });

  }

  ngOnInit(): void {
    this.loadActivePickSlips();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadActivePickSlips();
      });
  }

  ngOnDestroy(): void {
    this.dismissRemovalSnackbar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.pickSlipForm = this.fb.group({
      pickSlipId: ['', [Validators.required]],
    });

    this.productForm = this.fb.group({
      productCode: ['', [Validators.required]],
    });
  }

  private initializeTableConfig(): void {
    const removedColumns: TableColumn<RemovedProductModel>[] = [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        width: '219px',
        valueFormatter: (_v, row) => row.checkDigit ? `${row.unitId}-${row.checkDigit}` : row.unitId,
      },
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: false,
        width: '200px',
      },
      {
        key: 'productDescription',
        header: 'Product Description',
        sortable: false,
        width: '219px',
      },
      {
        key: 'aboRh',
        header: 'ABORh',
        sortable: false,
        width: '194px',
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        width: '225px',
        valueFormatter: (value: string) => this.formatDateTime(value),
      },
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns: removedColumns,
      caption: 'Removed products',
    };
  }

  private loadActivePickSlips(): void {
    this.loadingPickSlips.set(true);

    this.apiService
      .getActivePickSlips()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.activePickSlips.set(data);
          this.loadingPickSlips.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load active pick slips', error);
          this.showError('Failed to load active pick slips');
          this.loadingPickSlips.set(false);
        },
      });
  }

  onPickSlipSelected(): void {
    const pickSlipId = this.pickSlipForm.get('pickSlipId')?.value;
    if (!pickSlipId) return;

    this.productForm.reset();
    this.unitIdField?.clear();
    this.eligibleProducts.set([]);
    this.validatedProduct.set(null);
    this.parsedUnitId.set(null);
    this.submitted.set(false);

    this.loadPickSlipSummary(pickSlipId);
    this.loadAllPickSlipProducts(pickSlipId);
  }

  private loadPickSlipSummary(pickSlipId: string): void {
    this.loadingSummary.set(true);
    this.error.set(null);

    this.apiService
      .getPickSlipSummary(pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.selectedPickSlipSummary.set(response.item);
          } else {
            this.error.set(response.message || 'Failed to load pick slip summary');
          }
          this.loadingSummary.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load pick slip summary', error);
          this.showError('Failed to load pick slip summary');
          this.loadingSummary.set(false);
        },
      });
  }

  private loadAllPickSlipProducts(pickSlipId: string): void {
    this.loadingProducts.set(true);

    this.apiService
      .getPickSlipProducts(pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allPickSlipProducts.set(data);
          this.loadingProducts.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load pick slip products', error);
          this.loadingProducts.set(false);
        },
      });
  }

  onUnitIdValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    this.parsedUnitId.set(unitId);
    this.unitCodeScheme.set(data.codeScheme);
    this.validatedProduct.set(null);
    this.productForm.patchValue({ productCode: '' }, { emitEvent: false });

    const matching = this.allPickSlipProducts()
      .filter((p) => p.unitId === unitId && p.productStatus === 'OD')
      .map((p) => ({
        productCode: p.productCode,
        productDescription: p.productDescription,
        aboRh: p.aboRh,
        expirationDate: p.expirationDate,
      }));

    if (matching.length === 0) {
      this.showError('No eligible outdate products found for this Unit ID');
      this.eligibleProducts.set([]);
    } else {
      this.eligibleProducts.set(matching);
    }
  }

  onUnitIdCleared(): void {
    this.parsedUnitId.set(null);
    this.eligibleProducts.set([]);
    this.validatedProduct.set(null);
    this.productForm.patchValue({ productCode: '' }, { emitEvent: false });
  }

  onProductCodeChange(): void {
    const unitId = this.parsedUnitId();
    const productCode = this.productForm.get('productCode')?.value;
    const pickSlipId = this.pickSlipForm.get('pickSlipId')?.value;

    if (!unitId || !productCode || !pickSlipId) return;

    const selected = this.eligibleProducts().find((p) => p.productCode === productCode);
    if (selected) {
      this.validatedProduct.set(selected);
    }

    this.removeProduct(pickSlipId, unitId, productCode);
  }

  private removeProduct(pickSlipId: string, unitId: string, productCode: string): void {
    this.removing.set(true);

    const request: RemoveProductRequestDto = {
      pickSlipId,
      unitId,
      productCode,
      codeScheme: this.unitCodeScheme(),
    };

    this.apiService
      .removeProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            const result = response.item;
            const checkDigit = this.allPickSlipProducts().find(p => p.unitId === result.unitId)?.checkDigit ?? null;
            const newProduct: RemovedProductModel = {
              unitId: result.unitId,
              checkDigit,
              productCode: result.productCode,
              productDescription: result.productType,
              aboRh: result.aboRh,
              expirationDate: result.expirationDate,
            };

            this.removedProducts.update((products) => [...products, newProduct]);
            this.updateTableData();
            this.showRemovalSnackbar();

            if (result.pickSlipAutoClosed) {
              this.snackBar.open(
                'All outdate products have been removed. Pick slip has been automatically closed.',
                'Close',
                { duration: 8000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['info-snackbar'] }
              );
              this.selectedPickSlipSummary.set(null);
              this.allPickSlipProducts.set([]);
              this.pickSlipForm.reset();
              this.loadActivePickSlips();
            }

            this.productForm.reset();
            this.productForm.markAsPristine();
            this.productForm.markAsUntouched();
            this.eligibleProducts.set([]);
            this.validatedProduct.set(null);
            this.parsedUnitId.set(null);
            this.unitIdField?.clear();

            if (!result.pickSlipAutoClosed) {
              this.loadAllPickSlipProducts(pickSlipId);
            }

            setTimeout(() => {
              this.unitIdField?.unitIdInput?.nativeElement?.focus();
            }, 100);
          } else {
            this.showError(response.message || 'Failed to remove product');
          }
          this.removing.set(false);
        },
        error: (error) => {
          const errorMessage = this.getErrorMessage(error?.error);
          this.showError(errorMessage);
          this.removing.set(false);
        },
      });
  }

  onClear(): void {
    this.dismissRemovalSnackbar();
    this.pickSlipForm.reset();
    this.productForm.reset();
    this.unitIdField?.clear();
    this.selectedPickSlipSummary.set(null);
    this.allPickSlipProducts.set([]);
    this.eligibleProducts.set([]);
    this.removedProducts.set([]);
    this.validatedProduct.set(null);
    this.parsedUnitId.set(null);
    this.error.set(null);
    this.submitted.set(false);
    this.updateTableData();
  }

  onClearAll(): void {
    this.dismissRemovalSnackbar();
    this.productForm.reset();
    this.unitIdField?.clear();
    this.removedProducts.set([]);
    this.eligibleProducts.set([]);
    this.validatedProduct.set(null);
    this.parsedUnitId.set(null);
    this.updateTableData();
  }

  onViewItemsOnPickSlip(): void {
    const pickSlipId = this.pickSlipForm.get('pickSlipId')?.value;
    if (!pickSlipId) return;

    const dialogData: ViewItemsDialogData = {
      pickSlipId,
    };

    this.dialog.open(ViewItemsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: dialogData,
      ariaLabel: 'View Items On Pick Slip',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
  }

  onSortChange(event: TableSortEvent): void {
    const sorted = [...this.removedProducts()];
    if (event.direction === 'A') {
      sorted.sort((a, b) => a.unitId.localeCompare(b.unitId));
    } else if (event.direction === 'D') {
      sorted.sort((a, b) => b.unitId.localeCompare(a.unitId));
    }
    this.removedProducts.set(sorted);
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
  }

  private updateTableData(): void {
    const products = this.removedProducts();
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: products.length,
      },
    };
  }

  private showRemovalSnackbar(): void {
    this.dismissRemovalSnackbar();
    this.removedCount++;
    const message = `${this.removedCount} ${this.removedCount === 1 ? 'product' : 'products'} removed.`;
    this.removalSnackBarRef = this.snackBar.open(message, 'DISMISS', {
      duration: 0,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
    this.removalSnackBarRef.onAction().subscribe(() => {
      this.removalSnackBarRef?.dismiss();
      this.removalSnackBarRef = null;
    });
  }

  private dismissRemovalSnackbar(): void {
    if (this.removalSnackBarRef) {
      this.removalSnackBarRef.dismiss();
      this.removalSnackBarRef = null;
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private getErrorMessage(error: any): string {
    if (error?.errorCode) {
      const mapped = ODTOFF_ERROR_CODES[error.errorCode as number];
      if (mapped) return mapped;
    }
    return error?.message || 'An error occurred while removing the product';
  }

  protected formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY  HH:mm').toUpperCase() : dateString;
  }

  protected formatDate(dateString: string): string {
    if (!dateString) return '-';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  get psf() {
    return this.pickSlipForm.controls;
  }

  get pf() {
    return this.productForm.controls;
  }

  get dataSource(): RemovedProductModel[] {
    return this.removedProducts();
  }
}
