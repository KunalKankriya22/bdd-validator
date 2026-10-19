import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ViewChild,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import {
  UnitIdFieldComponent,
} from '@shared/components/unit-id-field';
import type { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';

import { ReleaseSpecialProcessingService } from './services/release-special-processing.service';
import {
  ProcessCodeDto,
  ProductDto,
  ReleasedEntry,
} from './models/release-special-processing.models';

@Component({
  selector: 'app-release-special-processing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './release-special-processing.component.html',
  styleUrls: ['./release-special-processing.component.scss'],
})
export class ReleaseSpecialProcessingComponent implements OnInit, OnDestroy {
  private readonly service = inject(ReleaseSpecialProcessingService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productSelect') productSelect!: MatSelect;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Release from Special Processing' },
    ],
  };

  processCodes: ProcessCodeDto[] = [];
  processCodeControl = new FormControl<string>('');
  processDescription = '-';
  isProcessCodeLoading = false;

  readonly processCodeSearchCtrl = new FormControl('');
  private readonly processCodeSearch = signal('');
  private readonly processCodesSignal = signal<ProcessCodeDto[]>([]);
  filteredProcessCodes = computed(() => {
    const search = this.processCodeSearch().toLowerCase();
    const items = this.processCodesSignal();
    if (!search) return items;
    return items.filter(
      (c) =>
        c.processCode?.toLowerCase().includes(search) ||
        c.processCodeDesc?.toLowerCase().includes(search),
    );
  });

  productValue = '';
  productDescription = '--';
  unitScannedWarning = '';
  isReleasing = false;

  eligibleProducts: ProductDto[] = [];
  readonly productSearchCtrl = new FormControl('');
  private readonly productSearch = signal('');
  private readonly productsSignal = signal<ProductDto[]>([]);
  filteredProducts = computed(() => {
    const search = this.productSearch().toLowerCase();
    const items = this.productsSignal();
    if (!search) return items;
    return items.filter(
      (p) =>
        p.productCode?.toLowerCase().includes(search) ||
        p.productDesc?.toLowerCase().includes(search),
    );
  });
  private collDate = '';

  releasedEntries: ReleasedEntry[] = [];
  savedCount = 0;

  tableConfig: DataTableConfig<ReleasedEntry> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        minWidth: '180px',
      },
      {
        key: 'product',
        header: 'Product',
        minWidth: '140px',
      },
      {
        key: 'productDesc',
        header: 'Product Description',
        minWidth: '260px',
      },
    ],
    sortConfig: {
      column: 'unitId',
      direction: 'D',
    },
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    showPagination: true,
    stickyHeader: true,
    enableRowHighlight: false,
  };

  get selectedProcessCode(): string {
    return this.processCodeControl.value || '';
  }

  get paginatedEntries(): ReleasedEntry[] {
    const page = this.tableConfig.pagination;
    if (!page) return this.releasedEntries;
    const start = page.pageIndex * page.pageSize;
    return this.releasedEntries.slice(start, start + page.pageSize);
  }

  ngOnInit(): void {
    this.loadProcessCodes();
    this.subscribeToChapterChanges();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onProcessCodeChange(): void {
    const selected = this.processCodeControl.value;
    if (selected) {
      const found = this.processCodes.find((pc) => pc.processCode === selected);
      this.processDescription = found?.processCodeDesc || '-';
    } else {
      this.processDescription = '-';
    }
    this.resetEntryRow();
    this.cdr.detectChanges();

    if (selected) {
      setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus());
    }
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    const chapterId = this.headerService.getCurrentChapterId() || '';

    this.service
      .validateUnit({ unitId, processCode: this.selectedProcessCode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.isValid || !response.collDate) {
            event.reject('Unit not found or not eligible.');
            return;
          }

          this.collDate = response.collDate;

          this.service
            .getProducts({
              unitId,
              collDate: response.collDate,
              chapterId,
              processCode: this.selectedProcessCode,
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (products) => {
                this.eligibleProducts = products;
                this.productsSignal.set(products);
                this.unitScannedWarning = this.releasedEntries.some(
                  (e) => e.unitId === unitId,
                )
                  ? 'This Unit ID has been scanned'
                  : '';

                if (products.length === 0) {
                  event.reject('No eligible products for this unit.');
                  return;
                }

                event.confirm();
                this.cdr.detectChanges();
              },
              error: (error) => {
                const message =
                  error?.error?.message || 'Failed to load products.';
                event.reject(message);
              },
            });
        },
        error: (error) => {
          const message =
            error?.error?.message || 'Unit not found or not eligible.';
          event.reject(message);
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    setTimeout(() => this.productSelect?.focus());
  }

  onUnitCleared(): void {
    this.productDescription = '--';
    this.unitScannedWarning = '';
    this.eligibleProducts = [];
    this.productsSignal.set([]);
    this.productValue = '';
    this.collDate = '';
  }

  onProductSelected(): void {
    if (!this.productValue || !this.unitIdField?.isValid) return;

    const selected = this.eligibleProducts.find(
      (p) => p.productCode === this.productValue,
    );
    this.productDescription = selected?.productDesc || '--';
    this.cdr.detectChanges();

    this.releaseEntry();
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination,
          pageIndex: event.pageIndex,
          pageSize: event.pageSize,
        },
      };
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction,
      },
      ...(this.tableConfig.pagination && {
        pagination: {
          ...this.tableConfig.pagination,
          pageIndex: 0,
        },
      }),
    };

    this.sortEntries(event.column, event.direction);
  }

  private loadProcessCodes(): void {
    this.isProcessCodeLoading = true;
    this.service
      .getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes = codes;
          this.processCodesSignal.set(codes);
          this.isProcessCodeLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isProcessCodeLoading = false;
          this.showError('Failed to load process codes.');
          this.cdr.detectChanges();
        },
      });
  }

  private releaseEntry(): void {
    if (this.isReleasing) return;

    const processCode = this.selectedProcessCode;
    const unitId = this.unitIdField?.parsedUnitId;
    const productCode = this.productValue.trim();
    const chapterId = this.headerService.getCurrentChapterId() || '';

    if (!processCode || !unitId || !productCode || !chapterId) return;
    if (!this.unitIdField.isValid) return;

    this.isReleasing = true;

    const selectedProduct = this.eligibleProducts.find(
      (p) => p.productCode === productCode,
    );
    const productDesc = selectedProduct?.productDesc || '';

    this.service
      .getAliquots({
        unitId,
        collDate: this.collDate,
        chapterId,
        processCode,
        productCode,
      })
      .pipe(
        takeUntil(this.destroy$),
        switchMap((aliquots) => {
          if (aliquots.length === 0) {
            this.isReleasing = false;
            this.showError('No aliquots available for this product.');
            this.cdr.detectChanges();
            return of(null);
          }

          const releaseRequests = aliquots.map((aliquot) =>
            this.service.releaseComponent({
              unitId,
              collDate: this.collDate,
              chapterId,
              processCode,
              productCode,
              componentPrefix: aliquot.componentPrefix,
            }),
          );

          return forkJoin(releaseRequests);
        }),
      )
      .subscribe({
        next: (responses) => {
          this.isReleasing = false;

          if (!responses) return;

          const entry: ReleasedEntry = {
            unitId,
            product: productCode,
            productDesc,
          };

          this.releasedEntries = [entry, ...this.releasedEntries];
          this.savedCount += responses.length;
          this.updateTableConfig();
          this.updateUnitIdColumnHeader();

          const warnings = responses
            .filter((r) => r.warningMessage)
            .map((r) => r.warningMessage!);

          this.showSuccess(`${this.savedCount} Entries saved`);

          if (warnings.length > 0) {
            warnings.forEach((w) => this.showError(w));
          }

          this.unitIdField.clear();
          this.productValue = '';
          this.productDescription = '--';
          this.cdr.detectChanges();
          setTimeout(
            () => this.unitIdField?.unitIdInput?.nativeElement?.focus(),
          );
        },
        error: (error) => {
          this.isReleasing = false;
          const message =
            error?.error?.message || 'Failed to release component.';
          this.showError(message);
          this.cdr.detectChanges();
        },
      });
  }

  private resetEntryRow(): void {
    this.unitIdField?.clear();
    this.productValue = '';
    this.productDescription = '--';
    this.unitScannedWarning = '';
    this.eligibleProducts = [];
    this.productsSignal.set([]);
    this.collDate = '';
  }

  private updateTableConfig(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination,
          totalRecords: this.releasedEntries.length,
        },
      };
    }
  }

  private updateUnitIdColumnHeader(): void {
    const count = this.releasedEntries.length;
    const columns = this.tableConfig.columns.map((col) =>
      col.key === 'unitId'
        ? { ...col, header: count > 0 ? `Unit ID (${count})` : 'Unit ID' }
        : col,
    );
    this.tableConfig = { ...this.tableConfig, columns };
  }

  private sortEntries(column: string, direction: string): void {
    const sorted = [...this.releasedEntries].sort((a, b) => {
      const valA = (a as unknown as Record<string, string>)[column] || '';
      const valB = (b as unknown as Record<string, string>)[column] || '';
      const cmp = valA.localeCompare(valB);
      return direction === 'A' ? cmp : -cmp;
    });
    this.releasedEntries = sorted;
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.processCodeControl.setValue('');
        this.processDescription = '-';
        this.resetEntryRow();
        this.releasedEntries = [];
        this.savedCount = 0;
        this.updateTableConfig();
        this.updateUnitIdColumnHeader();
        this.loadProcessCodes();
        this.cdr.detectChanges();
      });
  }

  private setupSearchSubscriptions(): void {
    this.processCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.processCodeSearch.set(v || ''));
    this.productSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.productSearch.set(v || ''));
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
