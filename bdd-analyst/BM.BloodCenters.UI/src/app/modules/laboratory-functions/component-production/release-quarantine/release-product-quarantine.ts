import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
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
  ReactiveFormsModule,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { ReleaseQuarantineApiService } from './services/release-quarantine-api.service';
import {
  QuarantineTypeDto,
  QuarantineProductInfoDto,
  QuarantineTableItem,
  ProductCodeLovItem,
  ReleaseType,
  RejectCode,
  UnitReason,
  SaveReleaseResponse,
} from './models/release-quarantine.model';
import { ReleaseQuarantineSidePanelComponent } from './release-quarantine-side-panel/release-quarantine-side-panel';

/**
 * Release Product Quarantine Component
 * Allows users to release products from quarantine or process returned products
 * Mnemonic: RQU
 */
@Component({
  selector: 'app-release-product-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
    NgxMatSelectSearchModule,
    ReleaseQuarantineSidePanelComponent,
  ],
  templateUrl: './release-product-quarantine.html',
  styleUrl: './release-product-quarantine.scss',
})
export class ReleaseProductQuarantineComponent implements OnInit, OnDestroy, AfterViewInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `release-quarantine-${ReleaseProductQuarantineComponent.nextId++}`;

  protected readonly elementId = (name: string) =>
    `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) =>
    `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) =>
    `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ReleaseQuarantineApiService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Template references
  @ViewChild('statusCellTemplate', { static: false }) statusCellTemplate!: TemplateRef<any>;
  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField?: ScanSelectFieldComponent;

  // Adaptive dropdown sentinel constants
  readonly selectPanelLoadingValue = '__PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__PANEL_EMPTY__';

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly quarantineTypes = signal<QuarantineTypeDto[]>([]);
  protected readonly selectedType = signal<string>('');
  protected readonly tableData = signal<QuarantineTableItem[]>([]);
  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly selectedProduct = signal<QuarantineProductInfoDto | null>(null);
  protected readonly selectedGridRow = signal<QuarantineTableItem | null>(null);

  // Adaptive dropdown for Quarantine Release Type
  protected readonly isLoadingReleaseTypes = signal(false);
  readonly releaseTypeSearchControl = new FormControl('');
  readonly releaseTypeSearch = signal('');
  readonly filteredReleaseTypes = computed(() => {
    const search = this.releaseTypeSearch().toLowerCase();
    const options = this.quarantineTypes();
    if (!search) return options;
    return options.filter(o =>
      o.code?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  // Product code LOV
  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;
  protected readonly productCodes = signal<ProductCodeLovItem[]>([]);
  protected readonly productCodeOptions = computed<ScanSelectOption[]>(() =>
    this.productCodes().map(p => ({ code: p.productCode, description: p.productDesc })),
  );
  protected readonly productCodeDisabled = computed(() =>
    !this.hasUnitIdValue() || !this.selectedType(),
  );
  codeScheme: string = 'I';

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateProductScan(value, this.codeScheme).pipe(
      map((res) => {
        if (res.success && res.item) {
          return { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid product code');
      }),
    );
  };

  // Track last processed unit to prevent duplicate API calls
  private lastProcessedUnit = '';
  private lastValidatedUnitId = '';

  // Sort state
  private currentSortDirection: 'A' | 'D' | 'default' = 'A';

  // Computed
  protected readonly fieldsDisabled = computed(() => !this.selectedType());
  protected readonly tableCount = computed(() => this.tableData().length);
  protected readonly unitIdHeader = computed(() => {
    const count = this.tableCount();
    return count > 0 ? `Unit ID (${count})` : 'Unit ID';
  });

  // Signal-based Clear All button state (avoids NG0100 from reading child state in getter)
  protected readonly hasUnitIdValue = signal(false);
  protected readonly isClearDisabled = computed(() => {
    const hasType = !!this.selectedType();
    const hasUnit = this.hasUnitIdValue();
    const hasProduct = this.productCodeHasValue();
    return !hasType && !hasUnit && !hasProduct;
  });
  private readonly productCodeHasValue = signal(false);

  // Form
  searchForm!: FormGroup;

  // Pre-loaded data
  rejectCodes: RejectCode[] = [];

  // Page header configuration — populated dynamically from menu API
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
  };

  // Data table configuration
  dataTableConfig: DataTableConfig<QuarantineTableItem> = {
    columns: [
      { key: 'displayUnitId', header: 'Unit ID', sortable: true, width: '150px' },
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: false,
        width: '130px',
      },
      { key: 'aboRh', header: 'ABORh', sortable: false, width: '100px' },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value: string) => this.formatExpirationDate(value),
      },
      { key: 'locationId', header: 'Location ID', sortable: false, width: '130px' },
      { key: 'status', header: 'Status', sortable: false, width: '120px' },
    ],
    sortConfig: {
      column: 'unitId',
      direction: 'A',
    },
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    loadingMessage: 'Loading quarantined products...',
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.ReleaseProductQuarantine]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;
        if (menuItem) {
          this.pageHeaderConfig = {
            ...this.pageHeaderConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null },
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || '',
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.releaseTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.releaseTypeSearch.set(v || ''));

    this.initForm();
    this.loadReleaseTypes();
    this.preloadRejectCodes();
    this.setupFormValueChanges();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    // Recreate table config with status cell template
    this.updateTableConfig();
    this.cdr.detectChanges();
  }

  private updateTableConfig(): void {
    this.dataTableConfig = {
      columns: [
        { key: 'displayUnitId', header: this.unitIdHeader(), sortable: true, width: '150px' },
        {
          key: 'productCode',
          header: 'Product Code',
          sortable: false,
          width: '130px',
        },
        { key: 'aboRh', header: 'ABORh', sortable: false, width: '100px' },
        {
          key: 'expirationDate',
          header: 'Expiration Date',
          sortable: false,
          width: '160px',
          valueFormatter: (value: string) => this.formatExpirationDate(value),
        },
        { key: 'locationId', header: 'Location ID', sortable: false, width: '130px' },
        {
          key: 'status',
          header: 'Status',
          sortable: false,
          width: '120px',
          type: 'custom',
          cellTemplate: this.statusCellTemplate
        },
      ],
      sortConfig: {
        column: 'displayUnitId',
        direction: this.currentSortDirection,
      },
      stickyHeader: true,
      showPagination: false,
      enableRowHighlight: false,
      loadingMessage: 'Loading quarantined products...',
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Track whether unit ID field is enabled (quarantine type selected)
  protected readonly unitIdDisabled = signal(true);

  private initForm(): void {
    this.searchForm = this.fb.group({
      quarantineType: [''],
    });
  }

  private setupFormValueChanges(): void {
    // Watch quarantine type selection
    this.searchForm
      .get('quarantineType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.selectedType.set(value);
        if (value) {
          this.unitIdDisabled.set(false);
          this.loadUnits(value);
        } else {
          this.unitIdDisabled.set(true);
          this.clearProductCode();
          this.tableData.set([]);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clear();
        this.loadReleaseTypes();
      });
  }

  private loadReleaseTypes(): void {
    this.isLoadingReleaseTypes.set(true);

    this.apiService
      .getReleaseTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.quarantineTypes.set(types);
          this.isLoadingReleaseTypes.set(false);
        },
        error: (err) => {
          this.isLoadingReleaseTypes.set(false);
        },
      });
  }

  private preloadRejectCodes(): void {
    this.apiService
      .getRejectCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.rejectCodes = codes;
        },
        error: (err) => {
          console.error('Failed to pre-load reject codes:', err);
          // Don't show error to user - codes will be loaded when needed
        },
      });
  }

  private loadUnits(releaseType: string): void {
    if (!releaseType) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .getUnits(releaseType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tableData.set(response.data);
          this.loading.set(false);
          // Update table config to reflect new count
          this.updateTableConfig();
        },
        error: (err) => {
          this.loading.set(false);
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.hasUnitIdValue.set(true);
    this.codeScheme = data.codeScheme || 'I';
    const newUnitId = data.parsedUnitId || this.unitIdField?.parsedUnitId || '';

    if (this.lastValidatedUnitId && this.lastValidatedUnitId !== newUnitId) {
      this.clearProductCode();
      this.lastProcessedUnit = '';
      this.closeSidePanel();
    }
    this.lastValidatedUnitId = newUnitId;

    this.loadProductCodes(newUnitId);
    setTimeout(() => {
      this.cdr.markForCheck();
      setTimeout(() => this.productCodeField?.focus());
    });
  }

  onUnitCleared(): void {
    this.hasUnitIdValue.set(false);
    this.lastProcessedUnit = '';
    this.lastValidatedUnitId = '';
    this.clearProductCode();
    this.closeSidePanel();
  }

  private clearProductCode(): void {
    this.productCodes.set([]);
    this.productCodeHasValue.set(false);
    this.productCodeField?.clear();
  }

  private loadProductCodes(unitId: string): void {
    const releaseType = this.selectedType();
    if (!releaseType) return;

    this.apiService
      .getProductCodes(unitId, releaseType, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodes.set(codes);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.snackbarService.showError('Failed to load product codes');
        },
      });
  }

  onProductCodeChanged(option: ScanSelectOption | null): void {
    if (!option) {
      this.productCodeHasValue.set(false);
      return;
    }
    this.productCodeHasValue.set(true);
    this.checkAndOpenSidePanelForProduct(option.code);
  }

  private checkAndOpenSidePanelForProduct(productCode: string): void {
    const unitId = this.unitIdField?.parsedUnitId;
    if (!unitId || !productCode || !this.selectedType() || this.tableData().length === 0) return;
    if (!this.unitIdField?.isValid) return;

    const currentUnit = `${unitId}_${productCode}`;
    if (this.lastProcessedUnit === currentUnit && this.sidePanelOpen()) return;

    const matchingUnits = this.tableData().filter(
      (unit) =>
        unit.unitId.toLowerCase() === unitId.toLowerCase() &&
        unit.productCode.toLowerCase() === productCode.toLowerCase()
    );

    if (matchingUnits.length === 1) {
      const unit = matchingUnits[0];
      if (unit.status) {
        this.snackbarService.showError('This unit has already been processed.');
        return;
      }
      this.lastProcessedUnit = currentUnit;
      this.openSidePanelForUnit(unit);
    } else if (matchingUnits.length > 1) {
      const unprocessed = matchingUnits.filter(u => !u.status);
      if (unprocessed.length === 0) {
        this.snackbarService.showError('All matching units have already been processed.');
        return;
      }
      if (unprocessed.length === 1) {
        this.lastProcessedUnit = currentUnit;
        this.openSidePanelForUnit(unprocessed[0]);
      } else {
        this.snackbarService.showInfo(
          `Multiple aliquots found for this unit. Please select the desired row from the grid.`
        );
        this.selectedGridRow.set(unprocessed[0]);
      }
    } else {
      const errorMsg = this.selectedType() === 'RT'
        ? `No return items found for Unit ${unitId} with Product Code ${productCode}.`
        : `No quarantine products found for Unit ${unitId} with Product Code ${productCode}.`;
      this.snackbarService.showError(errorMsg);
    }
  }

  onRowClick(row: QuarantineTableItem): void {
    if (row.status) {
      this.snackbarService.showError('This unit has already been processed.');
      return;
    }
    this.lastProcessedUnit = `${row.unitId}_${row.productCode}`;
    this.openSidePanelForUnit(row);
  }

  private openSidePanelForUnit(unit: QuarantineTableItem): void {
    const releaseType = this.selectedType();
    if (!releaseType) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Fetch detailed reasons for this unit
    this.apiService
      .getUnitReasons(releaseType, unit.unitId, unit.productCode, unit.aliquot)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.loading.set(false);

          if (!reasons || reasons.length === 0) {
            this.snackbarService.showInfo('Unit has already been released.');
            return;
          }

          const productInfo: QuarantineProductInfoDto = {
            unitId: unit.unitId,
            productCode: unit.productCode,
            aliquot: unit.aliquot,
            aboRh: unit.aboRh,
            expirationDate: unit.expirationDate,
            locationId: unit.locationId,
            status: unit.status,
            isExpired: unit.isExpired === 'Y',
            reasons: reasons,
          };

          this.selectedProduct.set(productInfo);
          this.selectedGridRow.set(unit);
          this.sidePanelOpen.set(true);
        },
        error: (err) => {
          this.loading.set(false);
        },
      });
  }

  onClear(): void {
    this.hasUnitIdValue.set(false);
    this.productCodeHasValue.set(false);
    this.searchForm.reset();
    this.unitIdField?.clear();
    this.unitIdDisabled.set(true);
    this.clearProductCode();
    this.selectedType.set('');
    this.tableData.set([]);
    this.error.set(null);
    this.lastProcessedUnit = '';
    this.lastValidatedUnitId = '';
    this.closeSidePanel();
  }

  onProductReleased(response: SaveReleaseResponse): void {
    // Update the status and locationId of the saved row in the table
    if (response.status === 'OK' && response.unitStatus && this.selectedProduct()) {
      const currentData = this.tableData();
      const updatedData = currentData.map(row => {
        if (
          row.unitId === this.selectedProduct()?.unitId &&
          row.productCode === this.selectedProduct()?.productCode
        ) {
          return {
            ...row,
            status: response.unitStatus!,
            locationId: response.locationId || row.locationId,
          };
        }
        return row;
      });
      this.tableData.set(updatedData);
      this.updateTableConfig();
    }

    this.closeSidePanel();
    this.clearProductCode();
    this.unitIdField?.clear();
    this.lastProcessedUnit = '';
  }

  closeSidePanel(): void {
    this.sidePanelOpen.set(false);
    this.selectedProduct.set(null);
    this.selectedGridRow.set(null);
    this.lastProcessedUnit = '';
  }

  clear(): void {
    this.hasUnitIdValue.set(false);
    this.productCodeHasValue.set(false);
    this.searchForm.reset();
    this.unitIdField?.clear();
    this.unitIdDisabled.set(true);
    this.clearProductCode();
    this.selectedType.set('');
    this.tableData.set([]);
    this.error.set(null);
    this.lastProcessedUnit = '';
    this.lastValidatedUnitId = '';
    this.closeSidePanel();
  }

  private static readonly MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  formatExpirationDate(value: string): string {
    if (!value) return '';
    try {
      const timezone = this.headerService.chapterTimeZone();
      const d = convertUTCToTimezone(new Date(value), timezone);
      if (isNaN(d.getTime())) return value;
      const dd = String(d.getDate()).padStart(2, '0');
      const mon = ReleaseProductQuarantineComponent.MONTHS[d.getMonth()];
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${dd}-${mon}-${yyyy} ${hh}:${mm}`;
    } catch {
      return value;
    }
  }

  get f() {
    return this.searchForm.controls;
  }

  onSortChange(event: TableSortEvent): void {
    if (event.column === 'displayUnitId') {
      this.currentSortDirection = event.direction || 'A';
      this.updateTableConfig();
      this.sortDataLocally();
    }
  }

  private sortDataLocally(): void {
    const sorted = [...this.tableData()].sort((a, b) => {
      const aVal = (a.displayUnitId || '').toLowerCase();
      const bVal = (b.displayUnitId || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return this.currentSortDirection === 'D' ? -cmp : cmp;
    });
    this.tableData.set(sorted);
  }
}
