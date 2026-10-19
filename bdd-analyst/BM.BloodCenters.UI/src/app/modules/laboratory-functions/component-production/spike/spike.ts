import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, startWith, finalize, catchError, switchMap, debounceTime } from 'rxjs/operators';
import moment from 'moment';

import { SpikeApiService } from './services/spike-api.service';
import {
  CreateComponentSpikingDto,
  ProcessCodeDto,
  SpikingTypeDto,
  ProductDto,
  LotNumberDto,
  SpikingTableRow,
} from './models/spike.model';

function getCustomPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-spike',
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
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MatPaginatorIntl, useValue: getCustomPaginatorIntl() },
  ],
  templateUrl: './spike.html',
  styleUrls: ['./spike.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpikeComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `spike-${SpikeComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly spikeApiService = inject(SpikeApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingProducts = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly unitAlreadyScanned = signal<boolean>(false);

  // Dropdown data signals
  protected readonly processCodes = signal<ProcessCodeDto[]>([]);
  protected readonly spikingTypes = signal<SpikingTypeDto[]>([]);
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly bagLots = signal<LotNumberDto[]>([]);
  protected readonly filterLots = signal<LotNumberDto[]>([]);

  // Filtered dropdown lists for search
  protected filteredProcessCodes: ProcessCodeDto[] = [];
  protected filteredSpikingTypes: SpikingTypeDto[] = [];
  protected filteredProducts: ProductDto[] = [];
  protected filteredBagLots: LotNumberDto[] = [];
  protected filteredFilterLots: LotNumberDto[] = [];

  // Search controls for dropdowns
  processSearchControl = new FormControl('');
  spikingTypeSearchControl = new FormControl('');
  productSearchControl = new FormControl('');
  bagLotSearchControl = new FormControl('');
  filterLotSearchControl = new FormControl('');

  // Selected process code description
  protected readonly selectedProcessDescription = signal<string>('');

  // Unit ID validation data from shared component
  validatedUnitData: UnitValidationResponse | null = null;

  // Store the collection date from validate-unit API for use in product loading
  selectedCollDate: string = '';

  // Computed values
  protected readonly isFormReady = computed(() => !this.loading() && !this.submitting());
  protected readonly canSubmit = computed(() => this.isFormReady() && !!this.validatedUnitData && !this.unitAlreadyScanned());
  protected readonly showEmptyState = computed(() => this.tableData().length === 0 && !this.loading());

  // Table data for session records
  protected readonly tableData = signal<SpikingTableRow[]>([]);
  dataSource = new MatTableDataSource<SpikingTableRow>([]);
  displayedColumns: string[] = ['unitId', 'productCode', 'type', 'bagLotNumber', 'filterLotNumber', 'bags', 'numberOfComponent'];
  pageSize = 25;
  pageIndex = 0;

  // Form
  form!: FormGroup;
  submitted = false;

  private initialChapterId: string | null = null;

  constructor() {
    // Update header config from menu item
    this.updatePageHeader();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.updatePageHeader();
      }
    });

    // Update table data source when tableData changes
    effect(() => {
      this.dataSource.data = this.tableData();
    });

    // Listen for chapter changes and reload data
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId && this.initialChapterId !== null && chapterId !== this.initialChapterId) {
        this.resetForm();
        this.loadDropdownData();
      }
      if (chapterId) {
        this.initialChapterId = chapterId;
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
    this.setupFormListeners();
    this.subscribeToSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      processCode: ['', [Validators.required, Validators.maxLength(10)]],
      productCode: ['', [Validators.required, Validators.maxLength(10)]],
      componentPrefix: ['', Validators.maxLength(10)],
      spikingType: ['', [Validators.required, Validators.maxLength(10)]],
      bagLotNumber: ['', [Validators.required, Validators.maxLength(30)]],
      filterLotNumber: ['', Validators.maxLength(50)],
      bagsSpiked: [null, [Validators.required, Validators.min(0), Validators.max(99)]],
      bagsForComponents: [
        null,
        [Validators.required, Validators.min(0), Validators.max(99), this.bagsForComponentsValidator],
      ],
    });
  }

  private loadDropdownData(): void {
    this.loading.set(true);

    forkJoin({
      processCodes: this.spikeApiService.getProcessCodes().pipe(catchError(() => of([]))),
      spikingTypes: this.spikeApiService.getSpikingTypes().pipe(catchError(() => of([]))),
      bagLots: this.spikeApiService.getBagLots().pipe(catchError(() => of([]))),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (result) => {
          this.processCodes.set(result.processCodes);
          this.filteredProcessCodes = result.processCodes;
          this.spikingTypes.set(result.spikingTypes);
          this.filteredSpikingTypes = result.spikingTypes;
          this.bagLots.set(result.bagLots);
          this.filteredBagLots = result.bagLots;
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackbarService.showError('Failed to load dropdown data');
        },
      });
  }

  private setupFormListeners(): void {
    // Listen for process code changes to update description and reload products
    this.form
      .get('processCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((processCode) => {
        this.updateProcessDescription(processCode);
        this.onProcessCodeChange();
      });

    // Listen for product code changes to auto-populate component prefix
    this.form
      .get('productCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        this.onProductChange(productCode);
      });

    // Auto-fill bagsForComponents with bagsSpiked value (always sync)
    this.form
      .get('bagsSpiked')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const bagsForComponentsControl = this.form.get('bagsForComponents');
        if (value !== null) {
          bagsForComponentsControl?.setValue(value, { emitEvent: false });
        }
        // Re-validate bagsForComponents when bagsSpiked changes
        bagsForComponentsControl?.updateValueAndValidity();
      });
  }

  private subscribeToSearchControls(): void {
    // Process code search
    this.processSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProcessCodes = this.filterProcessCodes(search || '');
        this.cdr.markForCheck();
      });

    // Spiking type search
    this.spikingTypeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredSpikingTypes = this.filterSpikingTypes(search || '');
        this.cdr.markForCheck();
      });

    // Product code search
    this.productSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProducts = this.filterProducts(search || '');
        this.cdr.markForCheck();
      });

    // Bag lot search
    this.bagLotSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredBagLots = this.filterBagLots(search || '');
        this.cdr.markForCheck();
      });

    // Filter lot search
    this.filterLotSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredFilterLots = this.filterFilterLots(search || '');
        this.cdr.markForCheck();
      });
  }

  private filterProcessCodes(search: string): ProcessCodeDto[] {
    if (!search) return this.processCodes();
    const lowerSearch = search.toLowerCase();
    return this.processCodes().filter(
      (p) =>
        p.processCode.toLowerCase().includes(lowerSearch) ||
        p.processCodeDesc.toLowerCase().includes(lowerSearch)
    );
  }

  private filterSpikingTypes(search: string): SpikingTypeDto[] {
    if (!search) return this.spikingTypes();
    const lowerSearch = search.toLowerCase();
    return this.spikingTypes().filter(
      (t) =>
        t.spikingType.toLowerCase().includes(lowerSearch) ||
        (t.spikingTypeDesc?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }

  private filterProducts(search: string): ProductDto[] {
    if (!search) return this.products();
    const lowerSearch = search.toLowerCase();
    return this.products().filter((p) => p.productCode.toLowerCase().includes(lowerSearch));
  }

  private filterBagLots(search: string): LotNumberDto[] {
    if (!search) return this.bagLots();
    const lowerSearch = search.toLowerCase();
    return this.bagLots().filter((lot) => lot.lotNumber.toLowerCase().includes(lowerSearch));
  }

  private filterFilterLots(search: string): LotNumberDto[] {
    if (!search) return this.filterLots();
    const lowerSearch = search.toLowerCase();
    return this.filterLots().filter((lot) => lot.lotNumber.toLowerCase().includes(lowerSearch));
  }

  /**
   * Reset search control when dropdown is opened
   * Ensures search field is cleared when reopening
   */
  onSelectOpenedChange(searchControl: FormControl, isOpen: boolean): void {
    if (isOpen) {
      searchControl.setValue('');
    }
  }

  private updateProcessDescription(processCode: string): void {
    if (!processCode) {
      this.selectedProcessDescription.set('');
      return;
    }
    const selectedProcess = this.processCodes().find(p => p.processCode === processCode);
    this.selectedProcessDescription.set(selectedProcess?.processCodeDesc || '');
  }

  /**
   * Custom validator: bagsForComponents must not exceed bagsSpiked.
   * Legacy FRISPIKE behavior from VALIDATE_FIELD trigger.
   */
  private bagsForComponentsValidator = (control: AbstractControl): ValidationErrors | null => {
    const bagsSpiked = this.form?.get('bagsSpiked')?.value;
    if (bagsSpiked !== null && control.value !== null && control.value > bagsSpiked) {
      return { exceedsBagsSpiked: true };
    }
    return null;
  };

  // Called when unit ID is validated by the shared UnitIdFieldComponent
  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;

    // Check if unit was already scanned in this session
    const alreadyScanned = this.tableData().some((row) => row.unitId === unitId);
    if (alreadyScanned) {
      this.unitAlreadyScanned.set(true);
      this.cdr.markForCheck();
      return;
    }

    this.validatedUnitData = data;
    this.unitAlreadyScanned.set(false);
    this.form.patchValue({ productCode: '', componentPrefix: '' });
    this.products.set([]);
    this.filteredProducts = [];
    this.loadProductCodes();
    this.cdr.markForCheck();
  }

  // Called when unit ID is cleared
  onUnitCleared(): void {
    this.validatedUnitData = null;
    this.selectedCollDate = '';
    this.unitAlreadyScanned.set(false);
    this.form.patchValue({ productCode: '', componentPrefix: '' });
    this.products.set([]);
    this.filteredProducts = [];
    this.filterLots.set([]);
    this.filteredFilterLots = [];
    this.cdr.markForCheck();
  }

  private onProcessCodeChange(): void {
    // Clear product and component prefix when process code changes
    this.form.patchValue({ productCode: '', componentPrefix: '' });
    this.products.set([]);
    this.filteredProducts = [];
    this.validatedUnitData = null;
    this.selectedCollDate = '';
    this.unitIdField?.clear();
    this.cdr.markForCheck();
  }

  private loadProductCodes(): void {
    const processCode = this.form.get('processCode')?.value;
    const unitId = this.validatedUnitData?.parsedUnitId;

    if (!unitId || !processCode) {
      return;
    }

    this.loadingProducts.set(true);
    this.selectedCollDate = '';
    this.cdr.markForCheck();

    const chapterId = this.headerService.getCurrentChapterId() || '';

    // First get collection dates for the unit from UNITS table, then load products
    this.spikeApiService
      .getUnitCollectionDates(unitId, chapterId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((dates) => {
          if (dates && dates.length > 0) {
            const collDate = dates[0].collDate;
            this.selectedCollDate = collDate;
            return this.spikeApiService.getProducts(unitId, collDate, processCode, chapterId);
          }
          this.products.set([]);
          this.selectedCollDate = '';
          return of([]);
        }),
        catchError(() => {
          this.products.set([]);
          this.selectedCollDate = '';
          return of([]);
        }),
        finalize(() => {
          this.loadingProducts.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.filteredProducts = products;
          // Auto-select if only one product
          if (products.length === 1) {
            this.form.patchValue({ productCode: products[0].productCode });
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.products.set([]);
          this.filteredProducts = [];
          this.cdr.markForCheck();
        },
      });
  }

  private onProductChange(productCode: string): void {
    if (!productCode) {
      this.form.patchValue({ componentPrefix: '' });
      this.filterLots.set([]);
      this.filteredFilterLots = [];
      return;
    }

    // Find the selected product
    const selectedProduct = this.products().find((p) => p.productCode === productCode);
    if (selectedProduct) {
      // Auto-populate component prefix from product data (hidden field, passed in payload)
      this.form.patchValue({ componentPrefix: selectedProduct.componentPrefix || '' });

      // Load filter lots filtered by product type (per FRISPIKE FMB LOV)
      // Only call API if productType is available
      const productType = selectedProduct.productType || '';
      if (productType) {
        this.spikeApiService
          .getFilterLots(productType)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (data) => {
              this.filterLots.set(data);
              this.filteredFilterLots = data;
              this.cdr.markForCheck();
            },
            error: () => {
              this.filterLots.set([]);
              this.filteredFilterLots = [];
              this.cdr.markForCheck();
            },
          });
      } else {
        // No product type, clear filter lots
        this.filterLots.set([]);
        this.filteredFilterLots = [];
        this.cdr.markForCheck();
      }
    }
  }

  onlyNumbersMaxTwo(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Only allow digits 0-9
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    // Prevent typing if already 2 digits
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 2 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbersMaxTwo(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 2);
    const input = event.target as HTMLInputElement;
    input.value = numericOnly;
    input.dispatchEvent(new Event('input'));
  }

  enforceMaxTwo(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '').substring(0, 2);
    const numValue = value ? parseInt(value, 10) : null;
    this.form.get(controlName)?.setValue(numValue, { emitEvent: true });
  }

  onSubmit(): void {
    this.submitted = true;

    if (!this.validatedUnitData || !this.unitIdField?.isValid) {
      this.snackbarService.showError('Please validate the unit ID before submitting');
      return;
    }

    if (!this.selectedCollDate) {
      this.snackbarService.showError('No collection date found for this unit');
      return;
    }

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.submitting.set(true);

    const formValue = this.form.getRawValue();

    const dto: CreateComponentSpikingDto = {
      unitId: this.validatedUnitData.parsedUnitId,
      collDate: this.selectedCollDate,
      productCode: formValue.productCode,
      componentPrefix: formValue.componentPrefix,
      processCode: formValue.processCode,
      spikingType: formValue.spikingType,
      bagLotNumber: formValue.bagLotNumber,
      filterLotNumber: formValue.filterLotNumber || null,
      bagsSpiked: formValue.bagsSpiked,
      bagsForComponents: formValue.bagsForComponents,
    };

    this.spikeApiService
      .createComponentSpiking(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Add to table data
          const newRow: SpikingTableRow = {
            unitId: dto.unitId,
            productCode: dto.productCode,
            type: dto.spikingType,
            bagLotNumber: dto.bagLotNumber,
            filterLotNumber: dto.filterLotNumber || '-',
            bags: dto.bagsSpiked,
            numberOfComponent: dto.bagsForComponents,
          };
          this.tableData.update(data => [...data, newRow]);

          const totalSaved = this.tableData().length;
          this.snackbarService.showSuccess(`${totalSaved} ${totalSaved === 1 ? 'Entry' : 'Entries'} saved`);
          this.resetInlineForm();
          this.submitting.set(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode || '';
          const errorMsg = error?.error?.message || error?.error?.error || 'Failed to create component spiking record';
          const errorMessage = errorCode ? `[${errorCode}] ${errorMsg}` : errorMsg;
          this.snackbarService.showError(errorMessage);
          this.submitting.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Reset only the inline form fields while keeping process code filter
   */
  private resetInlineForm(): void {
    const processCode = this.form.get('processCode')?.value;

    this.form.patchValue({
      productCode: '',
      componentPrefix: '',
      spikingType: '',
      bagLotNumber: '',
      filterLotNumber: '',
      bagsSpiked: null,
      bagsForComponents: null,
    });

    this.submitted = false;
    this.validatedUnitData = null;
    this.selectedCollDate = '';
    this.unitAlreadyScanned.set(false);
    this.products.set([]);
    this.filteredProducts = [];
    this.filterLots.set([]);
    this.filteredFilterLots = [];
    this.unitIdField?.clear();

    // Keep process code and its description
    if (processCode) {
      this.form.get('processCode')?.setValue(processCode);
    }

    Object.keys(this.form.controls).forEach((key) => {
      if (key !== 'processCode') {
        this.form.get(key)?.markAsUntouched();
        this.form.get(key)?.markAsPristine();
        this.form.get(key)?.setErrors(null);
      }
    });

    this.cdr.markForCheck();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  onClear(): void {
    this.resetForm();
  }

  private updatePageHeader(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Spike a Component';
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null },
      ],
    };
  }

  private resetForm(): void {
    this.form.reset({
      processCode: '',
      productCode: '',
      componentPrefix: '',
      spikingType: '',
      bagLotNumber: '',
      filterLotNumber: '',
      bagsSpiked: null,
      bagsForComponents: null,
    });

    this.submitted = false;
    this.validatedUnitData = null;
    this.selectedCollDate = '';
    this.unitAlreadyScanned.set(false);
    this.products.set([]);
    this.filteredProducts = [];
    this.filterLots.set([]);
    this.filteredFilterLots = [];
    this.selectedProcessDescription.set('');
    this.tableData.set([]);
    this.unitIdField?.clear();

    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsUntouched();
      this.form.get(key)?.markAsPristine();
      this.form.get(key)?.setErrors(null);
    });

    this.cdr.markForCheck();
  }

  private formatDate(dateString: string): string {
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  private serializeDateForApi(date: string | null): string {
    if (!date) return '';
    // Convert DD-MMM-YYYY to ISO format for API
    const m = moment(date, 'DD-MMM-YYYY');
    return m.isValid() ? m.format('YYYY-MM-DD') : date;
  }

  get f() {
    return this.form.controls;
  }
}
