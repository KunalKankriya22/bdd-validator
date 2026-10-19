import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { MoveOutdatesToOutdateLocationService } from './move-outdates-to-outdate-location.service';
import {
  PickSlipDto,
  PickSlipProductApiDto,
  ScannedProduct,
  OutdatedProductDto,
} from './move-outdates-to-outdate-location.model';
import {
  PickSlipProductsDialogComponent,
  PickSlipProductsDialogData,
} from './pick-slip-products-dialog';

function formatDateDisplay(raw: string | null | undefined): string {
  if (!raw) return '-';
  const m = moment(raw);
  return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : raw;
}

@Component({
  selector: 'app-move-outdates-to-outdate-location',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './move-outdates-to-outdate-location.html',
  styleUrls: ['./move-outdates-to-outdate-location.scss'],
})
export class MoveOutdatesToOutdateLocationComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `move-outdates-${MoveOutdatesToOutdateLocationComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  private currentManualUnitId: string | null = null;
  private currentParsedUnitId: string | null = null;
  private unitPickSlipProducts: PickSlipProductApiDto[] = [];

  // Dependency injection
  private readonly service = inject(MoveOutdatesToOutdateLocationService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    actions: [
      {
        label: 'VIEW ITEMS ON PICK SLIP',
        color: 'accent',
        matButton: 'raised',
        ariaLabel: 'View items on pick slip',
        disabled: false,
        onClick: () => this.onViewItemsOnPickSlip(),
      },
    ],
  };

  // Forms
  pickSlipForm = new FormGroup({
    pickSlipId: new FormControl<string | null>(null),
  });

  scanForm = new FormGroup({
    productCode: new FormControl<string>('', Validators.maxLength(8)),
    productType: new FormControl<string>({ value: '', disabled: true }),
    aboRh: new FormControl<string>({ value: '', disabled: true }),
    expirationDateTime: new FormControl<string>({ value: '', disabled: true }),
    checkDigit: new FormControl<string>({ value: '', disabled: true }),
  });

  // ─── Pick Slip search / display ──────────────────────────────────────────
  protected readonly pickSlipSearchControl = new FormControl('');
  private readonly pickSlipSearch = signal('');
  private readonly pickSlipValue = signal<string | null>(null);

  protected readonly filteredPickSlips = computed(() => {
    const search = this.pickSlipSearch().toLowerCase();
    const options = this.pickSlips();
    if (!search) return options;
    return options.filter((ps) =>
      (ps.pickSlipId || '').toLowerCase().includes(search)
    );
  });

  protected readonly selectedPickSlipDisplay = computed(() => {
    const selectedId = this.pickSlipValue();
    if (!selectedId) return '';
    return selectedId;
  });

  protected readonly hasPickSlipSelected = computed(() => !!this.pickSlipValue());

  protected isPickSlipTruncated = false;

  protected checkPickSlipTruncation(el: HTMLElement): void {
    this.isPickSlipTruncated = el.scrollWidth > el.clientWidth;
  }

  protected onDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.isPickSlipTruncated = false;
    }
  }

  // ─── Product search / display ────────────────────────────────────────────
  protected readonly productSearchControl = new FormControl('');
  private readonly productSearch = signal('');
  private readonly productValue = signal<string | null>(null);

  productOptions = signal<{ code: string; description: string; productType: string; aboRh: string; expirationDate: string }[]>([]);

  protected readonly filteredProducts = computed(() => {
    const search = this.productSearch().toLowerCase();
    const options = this.productOptions();
    if (!search) return options;
    return options.filter(
      (p) =>
        p.code.toLowerCase().includes(search) ||
        (p.description || '').toLowerCase().includes(search)
    );
  });

  protected readonly selectedProductDisplay = computed(() => {
    const selectedCode = this.productValue();
    if (!selectedCode) return '';
    const found = this.productOptions().find((p) => p.code === selectedCode);
    return found
      ? `${found.code}${found.description ? ' - ' + found.description : ''}`
      : selectedCode;
  });

  protected isProductTruncated = false;

  protected checkProductTruncation(el: HTMLElement): void {
    this.isProductTruncated = el.scrollWidth > el.clientWidth;
  }

  protected onProductDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.isProductTruncated = false;
    }
  }

  // ─── UI state ────────────────────────────────────────────────────────────
  isLoadingPickSlips = signal(false);
  isSavingProduct = signal(false);
  showPickSlipSection = signal(true);
  duplicateError = signal<string | null>(null);

  // ─── Display / read-only signals ─────────────────────────────────────────
  selectedPickSlipDateTime = signal<string>('--');
  selectedPickSlipTotalProducts = signal<number>(0);

  // ─── Session counter for saved entries ───────────────────────────────────
  private savedEntriesCount = signal<number>(0);

  // ─── Dropdown options from API ────────────────────────────────────────────
  pickSlips = signal<PickSlipDto[]>([]);

  // ─── Scanned Products Grid ────────────────────────────────────────────────
  scannedProducts = signal<ScannedProduct[]>([]);
  dataSource: ScannedProduct[] = [];
  isEmpty = computed(() => this.scannedProducts().length === 0);

  currentSortDirection: 'A' | 'D' | 'default' = 'D';

  tableConfig: DataTableConfig<ScannedProduct> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, type: 'text', minWidth: '200px', valueFormatter: (v: string) => v || '--' },
      { key: 'productCode', header: 'Product', sortable: false, type: 'text', minWidth: '180px', valueFormatter: (v: string) => v || '--' },
      { key: 'productType', header: 'Product Type', sortable: false, type: 'text', minWidth: '160px', valueFormatter: (v: string) => v || '--' },
      { key: 'aboRh', header: 'ABORh', sortable: false, type: 'text', minWidth: '120px', valueFormatter: (v: string) => v || '--' },
      { key: 'expirationDate', header: 'Expiration Date', sortable: false, type: 'text', minWidth: '200px', valueFormatter: (v: string) => v || '--' },
    ],
    stickyHeader: true,
    enableRowHighlight: false,
    sortConfig: { column: 'unitId', direction: 'D' },
    noDataIcon: 'search',
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin',
    showPagination: false,
  };

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadPickSlips();
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();

    this.pickSlipSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.pickSlipSearch.set(val ?? ''));

    this.pickSlipForm.get('pickSlipId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.pickSlipValue.set(val));

    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.productSearch.set(val ?? '');
        if (!val) return;
        const trimmed = val.trim().toUpperCase();
        const match = this.productOptions().find(
          (p) => p.code.toUpperCase() === trimmed
        );
        if (match) {
          this.scanForm.get('productCode')?.setValue(match.code);
          this.productSearchControl.setValue('', { emitEvent: false });
        }
      });

    this.scanForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.productValue.set(val);
        this.onProductSelected(val);
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadPickSlips();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Setup ───────────────────────────────────────────────────────────────

  private setupFormSubscriptions(): void {
    // Pick Slip change → update display fields + toggle button + load product dropdown
    this.pickSlipForm
      .get('pickSlipId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((pickSlipId) => {
        const selected = this.pickSlips().find((ps) => ps.pickSlipId === pickSlipId);
        if (selected) {
          this.selectedPickSlipDateTime.set(formatDateDisplay(selected.dateTime));
          this.selectedPickSlipTotalProducts.set(selected.totalProducts);
        } else {
          this.selectedPickSlipDateTime.set('--');
          this.selectedPickSlipTotalProducts.set(0);
        }
        this.updateHeaderActions(!pickSlipId);

        if (pickSlipId) {
          this.loadProductDropdown(pickSlipId);
        } else {
          this.productOptions.set([]);
        }
      });
  }

  private loadProductDropdown(pickSlipId: string): void {
    this.service
      .getProductDropdown(pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.productOptions.set(
            items.map((item) => ({
              code: item.productId,
              description: item.productType,
              productType: item.productType,
              aboRh: '',
              expirationDate: '',
            }))
          );
        },
        error: () => {
          this.productOptions.set([]);
        },
      });
  }

  private updateHeaderActions(disabled: boolean): void {
    this.headerConfig = {
      ...this.headerConfig,
      actions: this.headerConfig.actions?.map((a) => ({ ...a, disabled })),
    };
  }

  // ─── Load Pick Slips ──────────────────────────────────────────────────────

  private loadPickSlips(): void {
    this.isLoadingPickSlips.set(true);
    this.service
      .getPickSlips()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pickSlips.set(data);
          this.isLoadingPickSlips.set(false);
        },
        error: () => {
          this.pickSlips.set([]);
          this.isLoadingPickSlips.set(false);
          this.showError('Failed to load pick slips');
        },
      });
  }

  // ─── Unit ID Field Handlers (shared app-unit-id-field component) ───────────

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;
    const pickSlipId = this.pickSlipValue();

    if (!pickSlipId) {
      event.reject('Please select a pick slip first');
      return;
    }

    this.service
      .validateUnit(parsedUnitId, pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data?.length) {
            event.reject(res.message ?? 'Unit validation failed');
            return;
          }
          this.unitPickSlipProducts = res.data;
          this.currentManualUnitId = event.data.manualUnitId;
          this.currentParsedUnitId = parsedUnitId;
          event.confirm();
        },
        error: (err) => {
          event.reject(err?.error?.message ?? 'Failed to validate Unit ID');
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const parsedUnitId = this.currentParsedUnitId ?? data.parsedUnitId;
    const displayUnitId = this.currentManualUnitId ?? data.manualUnitId;

    const alreadyScanned = this.scannedProducts().some((p) => p.unitId === displayUnitId);
    if (alreadyScanned) {
      this.unitIdField?.clear();
      this.duplicateError.set('This Unit ID has been scanned');
      return;
    }
    this.duplicateError.set(null);
    this.scanForm.patchValue({ checkDigit: data.checkDigit ?? '' });

    const products = this.unitPickSlipProducts;
    if (!products.length) {
      this.showError('Product details not available');
      this.clearScanForm();
      return;
    }

    this.productOptions.set(
      products.map((p) => ({
        code: p.productId,
        description: p.productType ?? '',
        productType: p.productType ?? '',
        aboRh: p.aboRh ?? '',
        expirationDate: p.expirationDateTime ?? '',
      }))
    );

  }

  onUnitCleared(): void {
    this.currentManualUnitId = null;
    this.currentParsedUnitId = null;
    this.unitPickSlipProducts = [];
    this.duplicateError.set(null);
    this.clearScanForm();
  }

  private onProductSelected(productCode: string | null): void {
    if (!productCode || !this.unitPickSlipProducts.length) return;

    const parsedUnitId = this.currentParsedUnitId;
    if (!parsedUnitId) return;

    const selected = this.unitPickSlipProducts.find(
      (p) => p.productId === productCode
    );
    if (!selected) return;

    const displayUnitId = this.currentManualUnitId ?? parsedUnitId;
    this.unitPickSlipProducts = [];
    this.selectProductAndSave(selected, parsedUnitId, displayUnitId);
  }

  // ─── Product Selection → Build OutdatedProductDto and Save ─────────────────

  private selectProductAndSave(
    pickSlipProduct: PickSlipProductApiDto,
    parsedUnitId: string,
    displayUnitId?: string,
  ): void {
    const product: OutdatedProductDto = {
      productId: parsedUnitId,
      productCode: pickSlipProduct.productId,
      productType: pickSlipProduct.productType,
      expirationDate: pickSlipProduct.expirationDateTime,
      discardCode: 'OD',
      discardDescription: null,
      warehouseId: null,
      warehouseName: null,
      pickSlipId: null,
      moveDate: null,
      status: null,
      insertDate: '',
      insertUser: '',
      aboRh: pickSlipProduct.aboRh,
    };

    this.scanForm.patchValue({
      productCode: product.productCode,
      productType: product.productType ?? '',
      aboRh: product.aboRh ?? '',
      expirationDateTime: formatDateDisplay(product.expirationDate),
    });

    this.saveScannedProduct(product, displayUnitId);
  }

  // ─── Save Scanned Product ──────────────────────────────────────────────────

  private saveScannedProduct(product: OutdatedProductDto, displayUnitId?: string): void {
    const pickSlipId = this.pickSlipForm.get('pickSlipId')?.value;
    const warehouseId = this.headerService.getCurrentWarehouseId();
    if (!warehouseId) {
      this.showError('No warehouse selected. Please select a warehouse from the header.');
      this.clearScanForm();
      return;
    }

    const moveDate = this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD');

    this.isSavingProduct.set(true);
    this.service
      .moveProductToOutdate({
        productId: product.productId,
        productCode: product.productCode,
        productType: product.productType ?? undefined,
        pickSlipId: pickSlipId ?? undefined,
        discardCode: product.discardCode ?? 'OD',
        warehouseId: warehouseId,
        expirationDate: product.expirationDate ?? undefined,
        moveDate: moveDate,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSavingProduct.set(false);
          if (!res.success) {
            this.showError(res.message ?? 'Failed to move product');
            this.clearScanForm();
            return;
          }

          // Add to scanned products grid
          const scannedProduct: ScannedProduct = {
            unitId: displayUnitId ?? product.productId,
            productCode: product.productCode,
            productType: product.productType ?? '-',
            aboRh: product.aboRh ?? '-',
            expirationDate: formatDateDisplay(product.expirationDate),
            scannedAt: new Date(),
          };

          this.scannedProducts.update((products) => [scannedProduct, ...products]);
          this.dataSource = [...this.scannedProducts()];

          // Increment saved entries count
          this.savedEntriesCount.update((count) => count + 1);

          // Auto-close: pick slip closed when all OD products have been processed
          if (res.data?.pickSlipClosed) {
            this.showSuccess(`${this.savedEntriesCount()} Entries saved — Pick slip closed`);
            this.pickSlipForm.reset();
            this.selectedPickSlipDateTime.set('--');
            this.selectedPickSlipTotalProducts.set(0);
            this.loadPickSlips();
          } else {
            this.showSuccess(`${this.savedEntriesCount()} Entries saved`);
          }

          // Clear scan form and unit ID field for next entry
          this.unitIdField?.clear();
          this.clearScanForm();
        },
        error: (err) => {
          this.isSavingProduct.set(false);
          this.showError(err?.error?.message ?? 'Failed to save product');
          this.clearScanForm();
        },
      });
  }

  // ─── View Items on Pick Slip (Side Panel Dialog) ──────────────────────────

  onViewItemsOnPickSlip(): void {
    const pickSlipId = this.pickSlipForm.get('pickSlipId')?.value;
    if (!pickSlipId) {
      this.showError('Please select an Outdate Pickslip first');
      return;
    }

    const dialogData: PickSlipProductsDialogData = { pickSlipId };
    this.dialog.open(PickSlipProductsDialogComponent, {
      width: '450px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0', bottom: '0' },
      data: dialogData,
      panelClass: 'side-panel-dialog',
      disableClose: false,
      ariaLabelledBy: 'side-panel-title',
    });
  }

  // ─── Clear helpers ────────────────────────────────────────────────────────

  clearAll(): void {
    this.pickSlipForm.reset();
    this.unitIdField?.clear();
    this.clearScanForm();
    this.scannedProducts.set([]);
    this.dataSource = [];
    this.savedEntriesCount.set(0);
    this.selectedPickSlipDateTime.set('--');
    this.selectedPickSlipTotalProducts.set(0);
    this.duplicateError.set(null);
  }

  private clearScanForm(): void {
    this.scanForm.reset();
    this.scanForm.patchValue({
      productCode: '',
      productType: '',
      aboRh: '',
      expirationDateTime: '',
      checkDigit: '',
    });
    this.currentManualUnitId = null;
    this.currentParsedUnitId = null;
    this.unitPickSlipProducts = [];
    this.duplicateError.set(null);
  }

  // ─── Data Table Events ─────────────────────────────────────────────────────

  onSortChange(event: TableSortEvent): void {
    if (event.column === 'unitId') {
      this.currentSortDirection = event.direction || 'D';
      this.tableConfig = {
        ...this.tableConfig,
        sortConfig: { column: 'unitId', direction: this.currentSortDirection },
      };
      this.sortDataLocally();
    }
  }

  private sortDataLocally(): void {
    const sorted = [...this.scannedProducts()].sort((a, b) => {
      const aVal = (a.unitId || '').toLowerCase();
      const bVal = (b.unitId || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return this.currentSortDirection === 'D' ? -cmp : cmp;
    });
    this.dataSource = sorted;
  }


  // ─── Helpers ──────────────────────────────────────────────────────────────

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
      politeness: 'assertive',
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  // ─── Getters for form controls ────────────────────────────────────────────

  get pickSlipFormControls() {
    return this.pickSlipForm.controls;
  }

  get scanFormControls() {
    return this.scanForm.controls;
  }
}
