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
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { PlaceProductQuarantineApiService } from './services/place-product-quarantine-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  PlaceQuarantineRequestDto,
  UnitInfoDto,
  QuarantineReasonDto,
  QuarantineProductCodeDto,
  QuarantinedProductRow,
  ERROR_MESSAGES,
} from './models/place-product-quarantine.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
} from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';

@Component({
  selector: 'app-place-product-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
    LoadingSpinnerComponent,
  ],
  templateUrl: './place-product-quarantine.html',
  styleUrls: ['./place-product-quarantine.scss'],
})
export class PlaceProductQuarantineComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productSelect') productSelectRef!: MatSelect;
  @ViewChild('reasonSelect') reasonSelectRef!: MatSelect;

  private readonly apiService = inject(PlaceProductQuarantineApiService);
  private readonly dialog = inject(MatDialog);
  private readonly loggingService = inject(LoggingService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  quarantineForm = new FormGroup({
    productCode: new FormControl<string | null>(null, [Validators.required]),
    reasonCode: new FormControl<string | null>(null, [Validators.required]),
  });

  readonly productCodeSearch = new FormControl('');
  readonly reasonCodeSearch = new FormControl('');

  private readonly _productSearchTerm = toSignal(
    this.productCodeSearch.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );
  private readonly _reasonSearchTerm = toSignal(
    this.reasonCodeSearch.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  isPlacing = signal(false);
  isLoadingProducts = signal(false);
  isLoadingAliquots = signal(false);
  isLoadingUnitInfo = signal(false);
  showEntryForm = signal(false);

  products = signal<QuarantineProductCodeDto[]>([]);
  aliquots = signal<string[]>([]);
  quarantineReasons = signal<QuarantineReasonDto[]>([]);
  selectedAliquot = signal<string | null>(null);
  unitInfo = signal<UnitInfoDto | null>(null);
  parsedUnitId = signal<string>('');
  selectedReasonCode = signal<string | null>(null);
  codeScheme = signal<string>('I');

  filteredProducts = computed(() => {
    const s = (this._productSearchTerm() ?? '').toLowerCase();
    return s
      ? this.products().filter(
          (p) =>
            p.code.toLowerCase().includes(s) ||
            p.description.toLowerCase().includes(s)
        )
      : this.products();
  });

  filteredReasons = computed(() => {
    const s = (this._reasonSearchTerm() ?? '').toLowerCase();
    return s
      ? this.quarantineReasons().filter(
          (r) =>
            r.code.toLowerCase().includes(s) ||
            r.description.toLowerCase().includes(s)
        )
      : this.quarantineReasons();
  });

  selectedProductCode = signal<string | null>(null);

  selectedProductTooltip = computed(() => {
    const code = this.selectedProductCode();
    if (!code) return '';
    const product = this.products().find((p) => p.code === code);
    return product ? `${product.code} - ${product.description}` : code;
  });

  selectedReasonDescription = computed(() => {
    const code = this.selectedReasonCode();
    if (!code) return '-';
    const reason = this.quarantineReasons().find((r) => r.code === code);
    return reason?.description ?? '-';
  });

  showAliquotSelect = computed(() => this.aliquots().length > 1);

  gridData = signal<QuarantinedProductRow[]>([]);

  tableConfig = computed<DataTableConfig<QuarantinedProductRow>>(() => ({
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false, minWidth: '150px' },
      { key: 'productCode', header: 'Product Code', sortable: false, minWidth: '130px' },
      { key: 'productDescription', header: 'Product Description', sortable: false, minWidth: '180px' },
      { key: 'aliquot', header: 'Aliquot', sortable: false, minWidth: '80px' },
      { key: 'reasonCode', header: 'Quarantine Reason Code', sortable: false, minWidth: '180px' },
      { key: 'reasonDescription', header: 'Quarantine Reason Description', sortable: false, minWidth: '220px' },
      { key: 'aboRh', header: 'ABORh', sortable: false, minWidth: '100px' },
      { key: 'expirationDate', header: 'Expiration Date', sortable: false, minWidth: '160px' },
    ],
    stickyHeader: true,
    emptyMessage: 'No quarantined products.',
  }));

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
          subtitle:
            pageData.subtitle ||
            'Place products in quarantine for further investigation',
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadQuarantineReasons();
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.quarantineForm.controls;
  }

  // ── Unit ID Handling ──────────────────────────────────────────────────────────

  onUnitValidated(data: UnitValidationResponse): void {
    this.parsedUnitId.set(data.parsedUnitId);
    this.codeScheme.set(data.codeScheme);
    this.showEntryForm.set(true);
    this.loadProductCodes(data.parsedUnitId, data.codeScheme);
  }

  onUnitCleared(): void {
    this.parsedUnitId.set('');
    this.aliquots.set([]);
    this.selectedAliquot.set(null);
    this.unitInfo.set(null);
    this.selectedProductCode.set(null);
    this.selectedReasonCode.set(null);
    this.showEntryForm.set(false);
    this.gridData.set([]);
    this.quarantineForm.reset();
    this.productCodeSearch.setValue('', { emitEvent: false });
    this.reasonCodeSearch.setValue('', { emitEvent: false });
  }

  // ── Form Subscriptions ────────────────────────────────────────────────────────

  private setupFormSubscriptions(): void {
    this.quarantineForm
      .get('productCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        this.selectedProductCode.set(productCode);
        this.aliquots.set([]);
        this.selectedAliquot.set(null);
        this.unitInfo.set(null);
        this.quarantineForm
          .get('reasonCode')
          ?.setValue(null, { emitEvent: false });
        this.selectedReasonCode.set(null);
        this.reasonCodeSearch.setValue('', { emitEvent: false });

        if (productCode && this.parsedUnitId()) {
          this.loadAliquots(this.parsedUnitId(), productCode);
        }
      });

    this.quarantineForm
      .get('reasonCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((reasonCode) => {
        this.selectedReasonCode.set(reasonCode);
      });

    this.productCodeSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        if (!searchTerm) return;
        const trimmed = searchTerm.trim().toUpperCase();
        const match = this.products().find(
          (p) => p.code.toUpperCase() === trimmed
        );
        if (match) {
          this.quarantineForm.get('productCode')?.setValue(match.code);
          this.productCodeSearch.setValue('', { emitEvent: false });
          this.productSelectRef?.close();
        }
      });
  }

  // ── Data Loading ──────────────────────────────────────────────────────────────

  private loadProductCodes(unitId: string, codeScheme: string): void {
    this.isLoadingProducts.set(true);
    this.apiService
      .getProductCodes(unitId, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.isLoadingProducts.set(false);
          setTimeout(() => this.productSelectRef?.open());
        },
        error: (error) => {
          this.loggingService.error('Failed to load product codes', error);
          this.isLoadingProducts.set(false);
        },
      });
  }

  private loadQuarantineReasons(): void {
    this.apiService
      .getQuarantineReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => this.quarantineReasons.set(reasons),
        error: (error) => {
          this.loggingService.error('Failed to load quarantine reasons', error);
        },
      });
  }

  private loadAliquots(unitId: string, productCode: string): void {
    this.isLoadingAliquots.set(true);
    this.apiService
      .getAliquots(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aliquots) => {
          this.aliquots.set(aliquots);
          this.isLoadingAliquots.set(false);

          if (aliquots.length === 1) {
            this.selectedAliquot.set(aliquots[0]);
            this.loadUnitInfo(unitId, productCode, aliquots[0]);
          } else if (aliquots.length === 0) {
            this.showValidationAlert(
              'No aliquots available for this product.'
            );
          }
        },
        error: () => {
          this.isLoadingAliquots.set(false);
        },
      });
  }

  private loadUnitInfo(
    unitId: string,
    productCode: string,
    aliquot: string
  ): void {
    this.isLoadingUnitInfo.set(true);
    this.apiService
      .getUnitInfo(unitId, productCode, aliquot)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.unitInfo.set(info);
          this.isLoadingUnitInfo.set(false);
        },
        error: (error) => {
          this.unitInfo.set(null);
          this.isLoadingUnitInfo.set(false);
          const errorCode =
            error.error?.errorResponse?.errorCode || error.error?.errorCode;
          const message =
            error.error?.errorResponse?.error ||
            error.error?.error ||
            error.error?.message ||
            'Product is not available for quarantine.';
          this.showValidationAlert(message, errorCode);
        },
      });
  }

  // ── Reason Selection (explicit user selection only) ────────────────────────────

  onReasonSelected(reasonCode: string): void {
    if (reasonCode && this.canPlaceQuarantine()) {
      this.placeQuarantine();
    }
  }

  // ── Aliquot Selection (multi-aliquot case) ────────────────────────────────────

  onAliquotSelected(aliquot: string): void {
    this.selectedAliquot.set(aliquot);
    this.unitInfo.set(null);
    const unitId = this.parsedUnitId();
    const productCode = this.quarantineForm.get('productCode')?.value;
    if (unitId && productCode && aliquot) {
      this.loadUnitInfo(unitId, productCode, aliquot);
    }
  }

  // ── Quarantine Placement ──────────────────────────────────────────────────────

  private canPlaceQuarantine(): boolean {
    const unitId = this.parsedUnitId();
    const productCode = this.quarantineForm.get('productCode')?.value;
    const aliquot = this.selectedAliquot();
    const reasonCode = this.quarantineForm.get('reasonCode')?.value;
    const info = this.unitInfo();

    if (!unitId || !productCode || !aliquot || !reasonCode || !info || this.isPlacing()) {
      return false;
    }

    this.quarantineForm.markAllAsTouched();
    return this.quarantineForm.valid;
  }

  private placeQuarantine(): void {
    const unitId = this.parsedUnitId();
    const productCode = this.quarantineForm.get('productCode')?.value!;
    const aliquot = this.selectedAliquot()!;
    const reasonCode = this.quarantineForm.get('reasonCode')?.value!;

    const request: PlaceQuarantineRequestDto = {
      unitId,
      productCode,
      aliquot,
      quarantineReasonCode: reasonCode,
    };

    this.isPlacing.set(true);
    this.apiService
      .placeQuarantine(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const info = this.unitInfo();
            const reason = this.quarantineReasons().find(
              (r) => r.code === reasonCode
            );

            const row: QuarantinedProductRow = {
              unitId,
              productCode,
              productDescription: this.products().find(p => p.code === productCode)?.description ?? '',
              aliquot: this.selectedAliquot() ?? '',
              reasonCode,
              reasonDescription: reason?.description ?? '',
              aboRh: info?.aboDescription ?? '',
              expirationDate: this.formatDateTime(info?.expirationDate),
            };

            this.gridData.update((data) => [row, ...data]);
            this.snackbarService.showSuccess(
              'Product successfully placed in quarantine.'
            );

            this.quarantineForm.patchValue(
              { productCode: null, reasonCode: null },
              { emitEvent: false }
            );
            this.selectedProductCode.set(null);
            this.selectedReasonCode.set(null);
            this.aliquots.set([]);
            this.selectedAliquot.set(null);
            this.unitInfo.set(null);
            this.productCodeSearch.setValue('', { emitEvent: false });
            this.reasonCodeSearch.setValue('', { emitEvent: false });

            this.loadProductCodes(this.parsedUnitId(), this.codeScheme());

            setTimeout(() => this.productSelectRef?.open());
          } else {
            const errorCode =
              response.errorResponse?.errorCode || response.errorCode;
            const errorMessage =
              response.errorResponse?.error ||
              response.error ||
              response.message ||
              'Failed to place product in quarantine.';
            this.showValidationAlert(errorMessage, errorCode);
          }
          this.isPlacing.set(false);
        },
        error: (error) => {
          this.isPlacing.set(false);
          this.loggingService.error('Failed to place quarantine', error);
          const errorCode =
            error.error?.errorResponse?.errorCode || error.error?.errorCode;
          const errorMessage =
            error.error?.errorResponse?.error ||
            (errorCode && ERROR_MESSAGES[errorCode]) ||
            error.error?.error ||
            error.error?.message ||
            'Failed to place product in quarantine.';
          this.showValidationAlert(errorMessage, errorCode);
        },
      });
  }

  // ── Grid Events ───────────────────────────────────────────────────────────────

  onSortChange(_event: TableSortEvent): void {}

  onRowAction(_event: TableRowActionEvent<QuarantinedProductRow>): void {}

  // ── Clear ─────────────────────────────────────────────────────────────────────

  clearAll(): void {
    this.unitIdField?.clear();
    this.onUnitCleared();
  }

  // ── Chapter Changes ───────────────────────────────────────────────────────────

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadQuarantineReasons();
        const unitId = this.parsedUnitId();
        const scheme = this.codeScheme();
        if (unitId) {
          this.loadProductCodes(unitId, scheme);
        }
      });
  }

  // ── Validation Alerts ─────────────────────────────────────────────────────

  private showValidationAlert(message: string, errorCode?: string): void {
    const title = errorCode ? `${errorCode}: ${message}` : message;
    this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title,
        message: '',
        confirmText: 'OK',
      } as ConfirmActionDialogData,
      width: '400px',
      disableClose: true,
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────────

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const cleaned = typeof value === 'string' ? value.replace(/Z$/i, '') : value;
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
}
