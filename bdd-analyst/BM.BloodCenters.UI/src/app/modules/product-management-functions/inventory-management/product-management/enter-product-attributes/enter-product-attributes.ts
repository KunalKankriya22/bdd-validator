import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, Observable, of, throwError, takeUntil, startWith, map } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { SCAN_PATTERNS, matchesScanPattern, ScanPattern } from '@shared/utils/scan-pattern.util';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';

import { ComponentAttributeApiService } from './services/component-attribute-api.service';
import {
  ComponentAttributeDto,
  ProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
} from './models/component-attribute.model';

@Component({
  selector: 'app-enter-product-attributes',
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
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
    LoadingSpinnerComponent,
    ScanSelectFieldComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-product-attributes.html',
  styleUrls: ['./enter-product-attributes.scss'],
})
export class EnterProductAttributesComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('queryPanel', { read: ElementRef }) private queryPanelRef!: ElementRef;

  private readonly apiService = inject(ComponentAttributeApiService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly labelScanService = inject(DonorLibLabelScanService);

  readonly headerConfig = signal<PageHeaderConfig>({
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  });

  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;
  selectedProductCode = signal<string | null>(null);

  attributeForm = new FormGroup({
    attribGroup: new FormControl<string | null>(null),
    attribCode: new FormControl<string | null>({ value: null, disabled: true }),
    procDate: new FormControl<Moment | null>(null),
    procTime: new FormControl<string | null>(null),
  });

  isSaving = signal(false);
  isLoadingProducts = signal(false);
  isLoadingAttributes = signal(false);
  isLoadingGrid = signal(false);
  showEntryForm = signal(false);

  collectionDate = signal<string>('');
  unitCollDate = signal<string>('');

  products = signal<ProductDto[]>([]);
  attributeGroups = signal<AttributeGroupDto[]>([]);
  attributeCodes = signal<AttributeCodeDto[]>([]);
  selectedAttributeCode = signal<AttributeCodeDto | null>(null);

  readonly attribGroupSearch = new FormControl('');
  readonly attribCodeSearch = new FormControl('');

  private readonly _attribGroupSearchTerm = toSignal(
    this.attribGroupSearch.valueChanges.pipe(startWith('')), { initialValue: '' }
  );
  private readonly _attribCodeSearchTerm = toSignal(
    this.attribCodeSearch.valueChanges.pipe(startWith('')), { initialValue: '' }
  );

  productCodeOptions = computed<ScanSelectOption[]>(() =>
    this.products().map(p => ({ code: p.productCode, description: (p.productDescription || '').split('|')[0].trim() }))
  );

  filteredAttributeGroups = computed(() => {
    const s = (this._attribGroupSearchTerm() ?? '').toLowerCase();
    return s
      ? this.attributeGroups().filter(g =>
          g.code.toLowerCase().includes(s) ||
          g.description.toLowerCase().includes(s))
      : this.attributeGroups();
  });

  filteredAttributeCodes = computed(() => {
    const s = (this._attribCodeSearchTerm() ?? '').toLowerCase();
    return s
      ? this.attributeCodes().filter(c =>
          c.attribCode.toLowerCase().includes(s) ||
          c.attribDescription.toLowerCase().includes(s))
      : this.attributeCodes();
  });

  procDateRequired = computed(() => {
    const code = this.selectedAttributeCode();
    return code?.lifeSpan !== null && code?.lifeSpan !== undefined;
  });

  minProcDate = computed(() => {
    const collDate = this.unitCollDate();
    return collDate ? moment(collDate).startOf('day') : moment().startOf('day');
  });
  maxProcDate = computed(() => this.chapterTimezoneService.chapterLocalDate()?.clone().endOf('day') ?? moment().endOf('day'));

  gridData = signal<ComponentAttributeDto[]>([]);
  filteredData = signal<ComponentAttributeDto[]>([]);

  gridPageSize = signal<number>(25);
  gridPageIndex = signal<number>(0);
  gridTotalCount = computed(() => this.filteredData().length);

  pagedData = computed(() => {
    const start = this.gridPageIndex() * this.gridPageSize();
    return this.filteredData().slice(start, start + this.gridPageSize());
  });

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  tableConfig = computed<DataTableConfig<ComponentAttributeDto>>(() => ({
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, minWidth: '130px' },
      { key: 'productCode', header: 'Product Code', sortable: false, minWidth: '120px' },
      { key: 'attribGroup', header: 'Attribute Group', sortable: false, minWidth: '130px' },
      { key: 'attribCode', header: 'Attribute Code', sortable: false, minWidth: '130px' },
      { key: 'attribDescription', header: 'Description', sortable: false, minWidth: '200px' },
      {
        key: 'procDate', header: 'Process Date', sortable: false, minWidth: '140px',
        valueFormatter: (v) => this.formatDate(v),
      },
      {
        key: 'newExpDate', header: 'Expiration Date', sortable: false, minWidth: '140px',
        valueFormatter: (v) => this.formatDate(v),
      },
    ],
    sortConfig: {
      column: this.sortColumn(),
      direction: this.sortColumn() ? (this.sortDirection() === 'asc' ? 'A' : 'D') : 'default',
    },
    pagination: {
      pageSize: this.gridPageSize(),
      pageIndex: this.gridPageIndex(),
      totalRecords: this.gridTotalCount(),
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    emptyMessage: 'No attributes found for this unit.',
  }));

  private destroy$ = new Subject<void>();
  private isValidatingUnit = false;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig.set({
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        });
      }
    });
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
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
      });
  }

  private setupFormSubscriptions(): void {
    this.attributeForm
      .get('attribGroup')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((group) => {
        this.attributeCodes.set([]);
        this.selectedAttributeCode.set(null);
        const attribCodeCtrl = this.attributeForm.get('attribCode');
        attribCodeCtrl?.setValue(null, { emitEvent: false });
        this.attribCodeSearch.setValue('', { emitEvent: false });
        if (group) {
          attribCodeCtrl?.enable({ emitEvent: false });
          const unitId = this.unitIdField?.parsedUnitId ?? '';
          const productCode = this.selectedProductCode() ?? '';
          this.loadAttributeCodes(group, unitId, productCode);
        } else {
          attribCodeCtrl?.disable({ emitEvent: false });
        }
      });

    this.attributeForm
      .get('attribCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const found = this.attributeCodes().find((c) => c.attribCode === code);
        this.selectedAttributeCode.set(found || null);

        if (found?.lifeSpan !== null && found?.lifeSpan !== undefined) {
          const now = this.chapterTimezoneService.chapterLocalDate() ?? moment();
          this.attributeForm.patchValue(
            { procDate: now, procTime: now.format('HH:mm') },
            { emitEvent: false }
          );
          this.attributeForm.get('procDate')?.setValidators([Validators.required]);
        } else {
          this.attributeForm.patchValue({ procDate: null, procTime: null }, { emitEvent: false });
          this.attributeForm.get('procDate')?.clearValidators();
        }
        this.attributeForm.get('procDate')?.updateValueAndValidity();
      });
  }

  private loadAttributeGroups(productCode: string): void {
    // Derive code scheme from product code length: 8 chars = ISBT ('I'), else Codabar ('C')
    const codeScheme = productCode.length === 8 ? 'I' : 'C';
    this.apiService
      .getAttributeGroups(productCode, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => this.attributeGroups.set(groups),
        error: () => this.snackbarService.showError('Failed to load attribute groups.'),
      });
  }

  private loadAttributeCodes(attribGroup: string, unitId: string, productCode: string): void {
    this.isLoadingAttributes.set(true);
    const codeScheme = productCode.length === 8 ? 'I' : 'C';
    this.apiService
      .getAttributeCodes(attribGroup, unitId, productCode, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodes.set(codes);
          this.isLoadingAttributes.set(false);
        },
        error: () => {
          this.isLoadingAttributes.set(false);
          this.snackbarService.showError('Failed to load attribute codes.');
        },
      });
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    if (this.isValidatingUnit) return;
    this.isValidatingUnit = true;

    this.apiService
      .validateUnit({ unitId: event.data.parsedUnitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isValidatingUnit = false;
          if (!res.success || !res.data) {
            event.reject(res.message ?? 'Unit ID not found.');
            return;
          }
          const unit = res.data;
          if (!unit.isValid || !unit.hasActiveComponents) {
            event.reject('Unit has no active components in stock.');
            return;
          }

          this.unitCollDate.set(unit.collDate);
          this.collectionDate.set(
            moment(unit.collDate).isValid()
              ? moment(unit.collDate).format('DD-MMM-YYYY').toUpperCase()
              : unit.collDate
          );

          this.loadProductsForUnit(event.data.parsedUnitId, unit.collDate);
          this.loadAttributesForUnit(event.data.parsedUnitId);
          this.showEntryForm.set(true);
          event.confirm();
        },
        error: () => {
          this.isValidatingUnit = false;
          event.reject('Failed to validate unit. Please try again.');
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);

    if (this.hasScanPrefix(trimmed, SCAN_PATTERNS.PRODUCT) && !matchesScanPattern(trimmed, SCAN_PATTERNS.PRODUCT)) {
      return throwError(() => new Error('Invalid scan length'));
    }

    let stripped = trimmed;
    for (const p of SCAN_PATTERNS.PRODUCT) {
      if (trimmed.startsWith(p.prefix.toUpperCase())) {
        stripped = trimmed.substring(p.prefix.length);
        break;
      }
    }

    const match = this.productCodeOptions().find(
      (o) => o.code.toUpperCase() === stripped || o.code.toUpperCase() === trimmed,
    );
    if (match) return of(match);

    const codeScheme = stripped.length === 8 ? 'I' : 'C';
    return this.labelScanService.validateProductScan(value, codeScheme).pipe(
      map((res) => {
        if (res.success && res.item) {
          const optMatch = this.productCodeOptions().find(
            (o) => o.code.toUpperCase() === (res.item!.productCode || '').toUpperCase(),
          );
          return optMatch ?? { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid product code');
      }),
    );
  };

  private hasScanPrefix(value: string, patterns: ScanPattern[]): boolean {
    return patterns.some(p => value.startsWith(p.prefix.toUpperCase()));
  }

  onProductCodeChanged(option: ScanSelectOption | null): void {
    const code = option?.code ?? null;
    this.selectedProductCode.set(code);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.selectedAttributeCode.set(null);
    this.attributeForm.get('attribGroup')?.setValue(null, { emitEvent: false });
    this.attributeForm.get('attribCode')?.setValue(null, { emitEvent: false });
    this.attributeForm.get('attribCode')?.disable({ emitEvent: false });
    this.attribGroupSearch.setValue('', { emitEvent: false });
    this.attribCodeSearch.setValue('', { emitEvent: false });
    if (code) {
      this.loadAttributeGroups(code);
    }
  }

  onProductCodeCleared(): void {
    this.selectedProductCode.set(null);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.selectedAttributeCode.set(null);
    this.attributeForm.get('attribGroup')?.setValue(null, { emitEvent: false });
    this.attributeForm.get('attribCode')?.setValue(null, { emitEvent: false });
    this.attributeForm.get('attribCode')?.disable({ emitEvent: false });
    this.attribGroupSearch.setValue('', { emitEvent: false });
    this.attribCodeSearch.setValue('', { emitEvent: false });
  }

  onUnitCleared(): void {
    this.isValidatingUnit = false;
    this.collectionDate.set('');
    this.unitCollDate.set('');
    this.products.set([]);
    this.selectedProductCode.set(null);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.selectedAttributeCode.set(null);
    this.gridData.set([]);
    this.filteredData.set([]);
    this.showEntryForm.set(false);
    this.attributeForm.reset();
    this.attributeForm.get('attribCode')?.disable({ emitEvent: false });
    this.productCodeField?.clear();
    this.attribGroupSearch.setValue('', { emitEvent: false });
    this.attribCodeSearch.setValue('', { emitEvent: false });
    this.gridPageIndex.set(0);
  }

  private loadProductsForUnit(unitId: string, collDate: string): void {
    this.isLoadingProducts.set(true);
    this.apiService
      .getProductsForUnit(unitId, collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.isLoadingProducts.set(false);
          if (products.length > 0) {
            const desc = (products[0].productDescription || '').split('|')[0].trim();
            this.productCodeField?.setValue(products[0].productCode, desc);
            this.onProductCodeChanged({ code: products[0].productCode, description: desc });
          }
        },
        error: () => {
          this.isLoadingProducts.set(false);
          this.snackbarService.showError('Failed to load products for this unit.');
        },
      });
  }

  // Maps frontend column keys to backend sort column names expected by the SQL
  private readonly sortColumnMap: Record<string, string> = {
    unitId: 'UnitId',
  };

  private loadAttributesForUnit(unitId: string): void {
    this.isLoadingGrid.set(true);
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    this.apiService
      .getAll(1000, 0, {
        unitId,
        sortColumn: sortCol ? (this.sortColumnMap[sortCol] ?? null) : null,
        sortOrder: sortCol ? (sortDir === 'asc' ? 'ASC' : 'DESC') : null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingGrid.set(false);
          if (response.success && response.data) {
            this.gridData.set(response.data);
            this.filteredData.set(response.data);
          } else {
            this.gridData.set([]);
            this.filteredData.set([]);
          }
        },
        error: () => {
          this.isLoadingGrid.set(false);
          this.snackbarService.showError('Failed to load existing attributes.');
        },
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showEntryForm() || this.isSaving() || this.isValidatingUnit) return;
    if (this.queryPanelRef?.nativeElement.contains(event.target as Node)) return;

    // Ignore clicks inside CDK overlays (mat-select dropdown, datepicker, etc.)
    const overlayContainer = document.querySelector('.cdk-overlay-container');
    if (overlayContainer?.contains(event.target as Node)) return;

    this.tryAutoSave();
  }

  private tryAutoSave(): void {
    if (!this.unitIdField?.isValid) return;
    if (!this.selectedProductCode()) return;

    const attribGroup = this.attributeForm.get('attribGroup')?.value;
    const attribCode = this.attributeForm.get('attribCode')?.value;
    if (!attribGroup || !attribCode) return;

    if (this.procDateRequired()) {
      const procDate = this.attributeForm.get('procDate')?.value;
      const procTime = (this.attributeForm.get('procTime')?.value ?? '').trim();
      if (!procDate || !procTime) return;
    }

    this.onAdd();
  }

  onAttribCodeSelected(): void {}

  onProcDateBlur(): void {
    setTimeout(() => this.tryAutoSave());
  }

  onAdd(): void {
    if (this.attributeForm.invalid || !this.unitIdField?.isValid) {
      Object.keys(this.attributeForm.controls).forEach((key) => {
        this.attributeForm.get(key)?.markAsTouched();
      });
      return;
    }

    const unitId = this.unitIdField?.parsedUnitId ?? '';
    const collDate = this.unitCollDate();
    const productCode = this.selectedProductCode() ?? '';
    const attribGroup = this.attributeForm.get('attribGroup')?.value ?? '';
    const attribCode = this.attributeForm.get('attribCode')?.value ?? '';

    if (!productCode) {
      this.snackbarService.showError('Please select a Product Code.');
      return;
    }

    if (!attribGroup || !attribCode) {
      this.snackbarService.showError('Please select an Attribute Group and Attribute Code.');
      return;
    }

    let procDate: string | null = null;
    const procDateCtrl = this.attributeForm.get('procDate')?.value as Moment | null;
    const procTime = (this.attributeForm.get('procTime')?.value ?? '').trim();

    if (this.procDateRequired()) {
      if (!procDateCtrl || !procTime) {
        this.snackbarService.showError('Process date and time are required for this attribute.');
        return;
      }
      procDate = procDateCtrl.format('YYYY-MM-DD') + 'T' + procTime + ':00';
    }

    this.isSaving.set(true);
    this.apiService
      .create({ unitId, collDate, productCode, attribGroup, attribCode, procDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (!res.success) {
            this.snackbarService.showError(res.message ?? 'Failed to add attribute.');
            return;
          }
          this.snackbarService.showSuccess('Attribute added successfully.');
          this.loadAttributesForUnit(unitId);
          this.attributeForm.patchValue(
            { attribCode: null, procDate: null, procTime: null },
            { emitEvent: false }
          );
          this.attributeForm.get('procDate')?.clearValidators();
          this.attributeForm.get('procDate')?.updateValueAndValidity({ emitEvent: false });
          this.selectedAttributeCode.set(null);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.snackbarService.showError(err?.error?.message ?? 'Failed to add attribute.');
        },
      });
  }

  onRowAction(_event: TableRowActionEvent<ComponentAttributeDto>): void {}

  onSortChange(event: TableSortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction === 'A' ? 'asc' : 'desc');
    this.gridPageIndex.set(0);
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    if (unitId) {
      this.loadAttributesForUnit(unitId);
    }
  }

  onPageChange(event: TablePageEvent): void {
    this.gridPageSize.set(event.pageSize);
    this.gridPageIndex.set(event.pageIndex);
  }

  clearForm(): void {
    this.attributeForm.patchValue({
      attribGroup: null,
      procDate: null,
      procTime: null,
    });
    this.attributeForm.get('attribCode')?.setValue(null, { emitEvent: false });
    this.attributeForm.get('attribCode')?.disable({ emitEvent: false });
    this.selectedAttributeCode.set(null);
    if (this.products().length > 0) {
      const desc = (this.products()[0].productDescription || '').split('|')[0].trim();
      this.productCodeField?.setValue(this.products()[0].productCode, desc);
      this.selectedProductCode.set(this.products()[0].productCode);
    } else {
      this.productCodeField?.clear();
      this.selectedProductCode.set(null);
    }
  }

  clearAll(): void {
    this.unitIdField?.clear();
    this.onUnitCleared();
  }

  get f() {
    return this.attributeForm.controls;
  }

  get expDate(): string {
    const code = this.selectedAttributeCode();
    if (!code?.lifeSpan) return '--';
    const procDateValue = this.attributeForm.get('procDate')?.value as Moment | null;
    if (!procDateValue || !moment.isMoment(procDateValue)) return '--';
    const exp = procDateValue.clone();
    const lifeSpanInd = code.lifeSpanInd ?? 'D';
    switch (lifeSpanInd) {
      case 'H': exp.add(code.lifeSpan, 'hours'); break;
      case 'Y': exp.add(code.lifeSpan * 12, 'months'); break;
      default: exp.add(code.lifeSpan, 'days'); break;
    }
    return exp.format('DD-MMM-YYYY').toUpperCase();
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }
}
