import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  ViewChild,
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
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  UnitIdFieldComponent,
} from '@shared/components/unit-id-field';
import type { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';

import { UpdateNumberOfBagsService } from './services/update-number-of-bags.service';
import {
  ValidateUnitData,
  ProductCode,
  ComponentPrefixItem,
  BagUpdateEntry,
} from './models/update-number-of-bags.model';

@Component({
  selector: 'app-update-number-of-bags',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
  ],
  templateUrl: './update-number-of-bags.html',
  styleUrls: ['./update-number-of-bags.scss'],
})
export class UpdateNumberOfBagsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `update-number-of-bags-${UpdateNumberOfBagsComponent.nextId++}`;

  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UpdateNumberOfBagsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeSelect') productCodeSelect!: MatSelect;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  // State signals
  readonly isLoading = signal<boolean>(false);
  readonly loadingProducts = signal<boolean>(false);
  readonly loadingPrefixes = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly unitValidated = signal<boolean>(false);
  readonly unitAlreadyScanned = signal<boolean>(false);
  readonly validatedUnitData = signal<ValidateUnitData | null>(null);
  readonly productCodes = signal<ProductCode[]>([]);
  readonly componentPrefixes = signal<ComponentPrefixItem[]>([]);
  readonly selectedDescription = signal<string>('');
  readonly selectedCollectionDate = signal<string>('');
  readonly selectedProduct = signal<string>('');
  readonly tableData = signal<BagUpdateEntry[]>([]);

  // Code scheme determines prefix behavior
  readonly isISBT = computed(() => this.validatedUnitData()?.codeScheme === 'I');
  readonly isPrefixNavigable = computed(() => !this.isISBT());

  // Product code search
  productSearchControl = new FormControl('');
  filteredProducts: ProductCode[] = [];

  // Prefix search (Codabar only)
  prefixSearchControl = new FormControl('');
  filteredPrefixes: ComponentPrefixItem[] = [];

  // Data table config
  tableConfig: DataTableConfig<BagUpdateEntry> = {
    columns: [],
    showPagination: false,
    sortConfig: {
      column: 'unitId',
      direction: 'default',
    },
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
  };

  dataSource: BagUpdateEntry[] = [];
  private pendingProductFocus = false;

  form!: FormGroup;

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
          subtitle: pageData.subtitle || '',
        };
      }
    });

    effect(() => {
      this.dataSource = this.tableData();
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.totalRecords = this.dataSource.length;
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.initTableConfig();
    this.subscribeToChapterChanges();
    this.subscribeToProductSearch();
    this.subscribeToPrefixSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      productCode: ['', [Validators.required]],
      componentPrefix: ['', [Validators.required]],
      bagsUsed: [null, [Validators.min(1), Validators.max(9), Validators.pattern('^[1-9]$')]],
    });
  }

  private initTableConfig(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: [
        { key: 'unitId', header: 'Unit ID', sortable: true, width: '180px' },
        { key: 'productCode', header: 'Product Code', sortable: false, width: '140px' },
        { key: 'description', header: 'Description', sortable: false },
        { key: 'collectionDate', header: 'Collection Date', sortable: false, width: '150px' },
        { key: 'bags', header: 'Bags', sortable: false, width: '80px', type: 'number' },
      ],
    };
  }

  get f() {
    return this.form.controls;
  }

  private subscribeToProductSearch(): void {
    this.productSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProducts = this.filterProducts(search || '');
        this.cdr.markForCheck();
      });
  }

  private subscribeToPrefixSearch(): void {
    this.prefixSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredPrefixes = this.filterPrefixes(search || '');
        this.cdr.markForCheck();
      });
  }

  private filterProducts(search: string): ProductCode[] {
    const products = this.productCodes();
    if (!search) return products;
    const lower = search.toLowerCase();
    return products.filter(
      p => p.productCode.toLowerCase().includes(lower) || p.productDesc.toLowerCase().includes(lower)
    );
  }

  private filterPrefixes(search: string): ComponentPrefixItem[] {
    const prefixes = this.componentPrefixes();
    if (!search) return prefixes;
    const lower = search.toLowerCase();
    return prefixes.filter(p => p.componentPrefix.toLowerCase().includes(lower));
  }

  onUnitIdTab(event: Event): void {
    if (this.unitValidated()) return;
    const unitValue = this.unitIdField?.unitIdControl?.value?.trim();
    if (!unitValue) return;
    event.preventDefault();
    this.pendingProductFocus = true;
    this.unitIdField?.unitIdInput?.nativeElement?.blur();
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    const isManualEntry = event.data.entryMode === 'M';

    this.unitAlreadyScanned.set(false);
    this.isLoading.set(true);

    this.service.validateUnit({ unitId, processCode: '', isManualEntry })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.length) {
            const unitData = response.data[0];
            this.validatedUnitData.set(unitData);
            const collDateFormatted = unitData.collDate
              ? moment(unitData.collDate).format('DD-MMM-YYYY').toUpperCase()
              : '';
            this.selectedCollectionDate.set(collDateFormatted);
            this.loadProductCodes(unitData, event);
          } else {
            const message = response.errorCode
              ? `Error:${response.errorCode}: ${response.message || 'Unit validation failed.'}`
              : response.message || 'Unit validation failed.';
            event.reject(message);
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to validate unit.';
          event.reject(message);
          this.isLoading.set(false);
        },
      });
  }

  private loadProductCodes(unitData: ValidateUnitData, event: UnitIdPostValidateEvent): void {
    this.loadingProducts.set(true);

    this.service.getProductCodes(unitData.unitId, unitData.collDate, unitData.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          if (codes.length === 0) {
            event.reject('No product codes found for this unit.');
            this.isLoading.set(false);
            this.loadingProducts.set(false);
            return;
          }

          this.productCodes.set(codes);
          this.filteredProducts = codes;
          this.unitValidated.set(true);
          this.isLoading.set(false);
          this.loadingProducts.set(false);
          event.confirm();
          this.cdr.detectChanges();

          if (this.pendingProductFocus) {
            this.pendingProductFocus = false;
            setTimeout(() => this.productCodeSelect?.focus(), 100);
          }
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to load product codes.';
          event.reject(message);
          this.isLoading.set(false);
          this.loadingProducts.set(false);
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    this.cdr.detectChanges();
  }

  onUnitCleared(): void {
    this.resetFormFields();
  }

  onProductCodeChange(): void {
    const productCode = this.form.get('productCode')?.value;
    this.selectedProduct.set(productCode);
    this.form.patchValue({ componentPrefix: '', bagsUsed: null });
    this.componentPrefixes.set([]);
    this.filteredPrefixes = [];

    if (!productCode) {
      this.selectedDescription.set('');
      return;
    }

    const product = this.productCodes().find(p => p.productCode === productCode);
    this.selectedDescription.set(product?.productDesc || '');

    const unitData = this.validatedUnitData();
    if (!unitData) return;

    if (this.isISBT()) {
      const autoPrefix = productCode.length >= 8 ? productCode.substring(6, 8) : '';
      this.form.patchValue({ componentPrefix: autoPrefix });
      this.cdr.detectChanges();
    } else {
      this.loadComponentPrefixes(unitData, productCode);
    }
  }

  private loadComponentPrefixes(unitData: ValidateUnitData, productCode: string): void {
    this.loadingPrefixes.set(true);

    this.service.getComponentPrefixes(unitData.unitId, unitData.collDate, productCode, unitData.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prefixes) => {
          this.componentPrefixes.set(prefixes);
          this.filteredPrefixes = prefixes;
          this.loadingPrefixes.set(false);

          if (prefixes.length === 1) {
            this.form.patchValue({ componentPrefix: prefixes[0].componentPrefix });
          }

          this.cdr.detectChanges();
        },
        error: () => {
          this.componentPrefixes.set([]);
          this.filteredPrefixes = [];
          this.loadingPrefixes.set(false);
          this.snackbarService.showError('Failed to load component prefixes.');
          this.cdr.detectChanges();
        },
      });
  }

  onTabSubmit(event: Event): void {
    const bagsValue = this.form.get('bagsUsed')?.value;
    if (bagsValue && !this.form.invalid) {
      event.preventDefault();
      this.onBagsSubmit();
    }
  }

  onBagsSubmit(): void {
    const bagsValue = this.form.get('bagsUsed')?.value;
    if (!bagsValue || this.form.invalid) return;

    const unitData = this.validatedUnitData();
    if (!unitData) return;

    const productCode = this.form.get('productCode')?.value;
    const componentPrefix = this.form.get('componentPrefix')?.value;

    if (!productCode || !componentPrefix) return;

    this.submitEntry(unitData, productCode, componentPrefix, Number(bagsValue));
  }

  private submitEntry(unitData: ValidateUnitData, productCode: string, componentPrefix: string, bagsUsed: number): void {
    const existingEntry = this.tableData().find(e => e.unitId === unitData.unitId);
    if (existingEntry) {
      this.unitAlreadyScanned.set(true);
      this.cdr.detectChanges();
      return;
    }

    this.isSaving.set(true);

    const request = { unitId: unitData.unitId, productCode, componentPrefix, bagsUsed };

    this.service.updateBags(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);

          if (response.success) {
            const entry: BagUpdateEntry = {
              unitId: unitData.unitId,
              productCode,
              description: this.selectedDescription(),
              collectionDate: this.selectedCollectionDate(),
              bags: bagsUsed,
            };

            this.tableData.update(data => [...data, entry]);
            this.snackbarService.showSuccess(response.message || 'Record saved successfully.');
            this.resetFormFields();
            this.unitIdField?.clear();
            setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus(), 100);
          } else {
            const message = response.errorCode
              ? `Error:${response.errorCode}: ${response.message || 'Failed to update bags.'}`
              : response.message || 'Failed to update bags.';
            this.snackbarService.showError(message);
            this.resetFormFields();
            this.unitIdField?.clear();
            setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus(), 100);
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSaving.set(false);
          const errorCode = error?.error?.errorCode;
          const apiMessage = error?.error?.message || 'Failed to update bags.';
          const message = errorCode
            ? `Error:${errorCode}: ${apiMessage}`
            : apiMessage;

          this.snackbarService.showError(message);

          this.resetFormFields();
          this.unitIdField?.clear();
          setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus(), 100);
          this.cdr.detectChanges();
        },
      });
  }

  onlyDigits(event: KeyboardEvent): boolean {
    const char = String.fromCharCode(event.which || event.keyCode);
    if (!/^[1-9]$/.test(char)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteDigit(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digit = pasted.replace(/[^1-9]/g, '').charAt(0);
    if (digit) {
      this.form.get('bagsUsed')?.setValue(digit);
    }
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    const data = [...this.tableData()];

    if (event.direction === 'default') {
      this.dataSource = data;
      return;
    }

    data.sort((a, b) => {
      const valA = (a as any)[event.column] ?? '';
      const valB = (b as any)[event.column] ?? '';
      const comparison = String(valA).localeCompare(String(valB));
      return event.direction === 'A' ? comparison : -comparison;
    });

    this.dataSource = data;
  }

  private resetFormFields(): void {
    this.form.reset();
    this.pendingProductFocus = false;
    this.unitValidated.set(false);
    this.unitAlreadyScanned.set(false);
    this.productCodes.set([]);
    this.filteredProducts = [];
    this.componentPrefixes.set([]);
    this.filteredPrefixes = [];
    this.validatedUnitData.set(null);
    this.selectedProduct.set('');
    this.selectedDescription.set('');
    this.selectedCollectionDate.set('');
    this.productSearchControl.setValue('');
    this.prefixSearchControl.setValue('');
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetFormFields();
        this.tableData.set([]);
        this.unitIdField?.clear();
        this.cdr.detectChanges();
      });
  }
}
