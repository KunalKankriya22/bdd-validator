import { Component, OnInit, inject, ChangeDetectionStrategy, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, ReplaySubject, forkJoin, of } from 'rxjs';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { PageHeaderService } from '@shared/services/page-header.service';
import { formatTableDateTime } from '@shared/utils/date-format.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { Time24hrDirective } from '@shared/directives/time-24hr.directive';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { ComponentAttributeApiService } from './services/component-attribute-api.service';
import {
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
  SaveComponentAttributeRequest,
} from './models/component-attribute.model';

/**
 * Enter Component Attributes Component
 * Route: /laboratory-functions/attributes-and-interdictions/enter-component-attributes
 * Mnemonic: COMPATT
 * FMB: CPIATTR
 */
@Component({
  selector: 'app-enter-component-attributes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
    Time24hrDirective,
  ],
  templateUrl: './enter-component-attributes.component.html',
  styleUrl: './enter-component-attributes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ComponentAttributeApiService,
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
})
export class EnterComponentAttributesComponent implements OnInit {
  // Services
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ComponentAttributeApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dateAdapter = inject(DateAdapter);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  // Component state
  private readonly destroy$ = new Subject<void>();

  // ViewChild reference to unit-id-field component
  @ViewChild(UnitIdFieldComponent) unitIdFieldComponent!: UnitIdFieldComponent;

  // ViewChild reference to process date input
  @ViewChild('processDateInput') processDateInput!: ElementRef<HTMLInputElement>;

  // ViewChild reference to process time input
  @ViewChild('processTimeInput') processTimeInput!: ElementRef<HTMLInputElement>;

  // Signals for reactive state
  readonly dataSource = signal<ComponentAttributeDto[]>([]);
  readonly isLoading = signal(false);
  readonly products = signal<ComponentProductDto[]>([]);
  readonly attributeGroups = signal<AttributeGroupDto[]>([]);
  readonly attributeCodes = signal<AttributeCodeDto[]>([]);
  readonly attributeDescription = signal('');
  readonly calculatedExpiryDate = signal<string>('');
  readonly hasError = signal(false);
  readonly tableConfig = signal<DataTableConfig<ComponentAttributeDto>>(this.getInitialTableConfig());

  // Search controls for dropdowns
  productSearchCtrl = new FormControl('');
  groupSearchCtrl = new FormControl('');
  codeSearchCtrl = new FormControl('');

  // Filtered observables for search
  filteredProducts$ = new ReplaySubject<ComponentProductDto[]>(1);
  filteredGroups$ = new ReplaySubject<AttributeGroupDto[]>(1);
  filteredCodes$ = new ReplaySubject<AttributeCodeDto[]>(1);

  // Form and UI state
  currentUnitId = '';
  currentCollDate = '';
  currentProductType = '';
  currentCodeScheme = '';
  currentCheckDigit: string | null = null;
  showResults = false;
  attributeForm!: FormGroup;

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    title: 'Enter Component Attributes',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Laboratory Functions', link: null },
      { label: 'Attributes and Interdictions', link: null },
      { label: 'Enter Component Attributes', link: null },
    ],
  };

  /**
   * Get initial table configuration
   */
  private getInitialTableConfig(): DataTableConfig<ComponentAttributeDto> {
    return {
      columns: this.getTableColumns(),
      rowActions: [],
      pagination: {
        pageSize: 10,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      sortConfig: {
        column: 'unitId',
        direction: 'default',
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Scan or enter a Unit ID to begin.',
      noDataIcon: 'search',
      loadingMessage: 'Loading data...',
      showPagination: true,
    };
  }

  /**
   * Setup automatic pagination sync when dataSource changes
   * This effect must be created in the constructor/field initializer context
   */
  private readonly paginationSyncEffect = effect(() => {
    const data = this.dataSource();
    const currentConfig = this.tableConfig();
    const currentTotal = currentConfig.pagination?.totalRecords || 0;
    const actualTotal = data.length;

    // Only update if totalRecords is out of sync with actual data length
    if (currentTotal !== actualTotal) {
      this.tableConfig.set({
        ...currentConfig,
        columns: this.getTableColumns(), // Update count in Unit ID column header
        pagination: {
          ...currentConfig.pagination!,
          totalRecords: actualTotal,
          pageIndex: 0 // Reset to first page when data changes
        }
      });
    }
  }, { allowSignalWrites: true });

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormListeners();
    this.setupSearchFilters();
    this.updatePageHeader();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.attributeForm = this.fb.group({
      productCode: ['', Validators.required],
      attribGroup: ['', Validators.required],
      attribCode: ['', Validators.required],
      procDate: [null, [dateFormatValidator(), this.processDateValidator.bind(this)]],
      procTime: [''], // Validation added dynamically when procDate has value
    });

    // Add dynamic validation and enable/disable for procTime based on procDate
    this.attributeForm.get('procDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(procDate => {
        const procTimeControl = this.attributeForm.get('procTime');
        if (procDate) {
          // If process date is filled, enable time field and make it required
          procTimeControl?.enable({ emitEvent: false });
          procTimeControl?.setValidators([Validators.required]);
        } else {
          // If process date is empty, disable time field and clear validators
          procTimeControl?.disable({ emitEvent: false });
          procTimeControl?.clearValidators();
          procTimeControl?.setValue('', { emitEvent: false });
        }
        // Update validity but keep the field as untouched so error doesn't show immediately
        procTimeControl?.updateValueAndValidity({ emitEvent: false });
        // Only mark as touched if it was already touched
        if (!procTimeControl?.touched) {
          procTimeControl?.markAsUntouched();
        }
        // Re-validate time against chapter time when date changes
        this.validateProcessTime();
      });

    // Initially disable the time field
    this.attributeForm.get('procTime')?.disable({ emitEvent: false });
  }

  /**
   * Custom validator for process date
   * FMB validations:
   * - Error 8030: Process date cannot be in the future (using chapter local date)
   * - Error 8060: Process date cannot be earlier than collection date
   */
  private processDateValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null; // Allow empty dates
    }

    const processDate = moment.isMoment(control.value) ? control.value : moment(control.value);
    if (!processDate.isValid()) {
      return null;
    }

    // Use chapter local date (today) via dateAdapter — returns the chapter's
    // local date from ChapterTimezoneService, which may be ahead of browser date.
    // Compare using Moment at day granularity to avoid timezone conversion issues
    // that occur when converting Moment → JS Date via new Date().
    const chapterToday = this.dateAdapter.today();

    if (processDate.isAfter(chapterToday, 'day')) {
      return { futureDate: true };
    }

    // Check if process date is before collection date
    if (this.currentCollDate) {
      const collDate = moment(this.currentCollDate);
      if (processDate.isBefore(collDate, 'day')) {
        return { beforeCollectionDate: true };
      }
    }

    return null;
  }

  /**
   * Validate that process time is not in the future relative to chapter time.
   * Sets or clears the 'futureTime' error on the procTime control.
   * Returns true if valid, false if future time detected.
   */
  private validateProcessTime(): boolean {
    const procDateControl = this.attributeForm.get('procDate');
    const procTimeControl = this.attributeForm.get('procTime');
    const procDate = procDateControl?.value;
    const procTime = procTimeControl?.value;

    if (!procDate || !procTime) {
      // Clear futureTime error if fields are empty
      if (procTimeControl?.hasError('futureTime')) {
        const errors = { ...procTimeControl.errors };
        delete errors['futureTime'];
        procTimeControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      return true;
    }

    const processDate = moment.isMoment(procDate) ? procDate : moment(procDate);
    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();

    if (processDate.isSame(chapterNow, 'day')) {
      const [hours, minutes] = procTime.split(':').map(Number);
      const chapterHours = chapterNow.hours();
      const chapterMinutes = chapterNow.minutes();

      if (hours > chapterHours || (hours === chapterHours && minutes > chapterMinutes)) {
        procTimeControl?.setErrors({ ...procTimeControl?.errors, futureTime: true });
        return false;
      }
    }

    // Clear futureTime error if valid
    if (procTimeControl?.hasError('futureTime')) {
      const errors = { ...procTimeControl.errors };
      delete errors['futureTime'];
      procTimeControl.setErrors(Object.keys(errors).length ? errors : null);
    }
    return true;
  }

  /**
   * Setup form value change listeners
   */
  private setupFormListeners(): void {
    // Listen to product code changes to load attribute groups
    this.attributeForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        if (productCode) {
          // Extract product type and code scheme from selected product
          const selectedProduct = this.products().find((p) => p.productCode === productCode);
          if (selectedProduct) {
            // BUG 3 FIX: Validate component status must be 'L' (Lab)
            if (selectedProduct.componentStatus !== 'L') {
              this.snackbarService.showError('Error 0210: Component must be in Lab status to add attributes', 'DISMISS');
              this.attributeForm.patchValue({ productCode: '' }, { emitEvent: false });
              this.calculatedExpiryDate.set('');
              return;
            }

            // BUG 4 FIX: Validate not a pool product
            if (selectedProduct.poolProductFlag === 'Y') {
              this.snackbarService.showError('Error 0231: Cannot add attributes to pool products', 'DISMISS');
              this.attributeForm.patchValue({ productCode: '' }, { emitEvent: false });
              this.calculatedExpiryDate.set('');
              return;
            }

            this.currentProductType = selectedProduct.productType;
            // Derive code scheme: 'I' for 8-char ISBT codes, 'C' for Codabar (5-char or other)
            this.currentCodeScheme = selectedProduct.codeScheme || (productCode.length === 8 ? 'I' : 'C');

            // Set expiry date from product (auto-populate from API response)
            if (selectedProduct.expiryDate) {
              const expiryDateStr = selectedProduct.expiryDate instanceof Date
                ? selectedProduct.expiryDate.toISOString()
                : selectedProduct.expiryDate;
              this.calculatedExpiryDate.set(formatTableDateTime(expiryDateStr));
            } else {
              this.calculatedExpiryDate.set('');
            }

            // Pass productCode and codeScheme to loadAttributeGroups
            this.loadAttributeGroups(selectedProduct.productType, productCode, this.currentCodeScheme);
          }
        } else {
          this.attributeGroups.set([]);
          this.attributeCodes.set([]);
          this.attributeDescription.set('');
          this.calculatedExpiryDate.set('');
          this.currentProductType = '';
          this.currentCodeScheme = '';
          this.dataSource.set([]);
          this.showResults = false;
          // Update table columns to reset count to 0
          this.tableConfig.set({
            ...this.tableConfig(),
            columns: this.getTableColumns()
          });
        }
        // Reset dependent fields
        this.attributeForm.patchValue({
          attribGroup: '',
          attribCode: '',
        }, { emitEvent: false });

        // Mark dependent fields as untouched to prevent premature error display
        this.attributeForm.get('attribGroup')?.markAsUntouched();
        this.attributeForm.get('attribCode')?.markAsUntouched();
      });

    // Listen to attribute group changes to load attribute codes
    this.attributeForm.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((attribGroup) => {
        const productCode = this.attributeForm.get('productCode')?.value;

        if (attribGroup && productCode && this.currentUnitId && this.currentProductType) {
          // All required parameters for attribute-codes API
          this.loadAttributeCodes(
            this.currentProductType, // Required by Laboratory module endpoint
            attribGroup,
            this.currentUnitId,
            this.currentCollDate,
            productCode
          );
        } else {
          this.attributeCodes.set([]);
          this.attributeDescription.set('');
        }
        // Reset dependent field
        this.attributeForm.patchValue({
          attribCode: '',
        }, { emitEvent: false });

        // Mark dependent field as untouched to prevent premature error display
        this.attributeForm.get('attribCode')?.markAsUntouched();
      });

    // Listen to attribute code changes to update description
    this.attributeForm.get('attribCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((attribCode) => {
        if (attribCode) {
          const selectedCode = this.attributeCodes().find((c) => c.attribCode === attribCode);

          // FMB ATTRIB_CODE VALIDATE_FIELD: attrib_type must be 'A'
          if (selectedCode && selectedCode.attribType && selectedCode.attribType !== 'A') {
            this.snackbarService.showError('Error 9759: Only attributes (type A) can be selected, not interdictions', 'DISMISS');
            this.attributeForm.patchValue({ attribCode: '' }, { emitEvent: false });
            this.attributeDescription.set('');
            return;
          }

          // FMB PROC_DATE VALIDATE_FIELD: if life_span is defined, proc_date is required (nullchk)
          const procDateControl = this.attributeForm.get('procDate');
          const hasLifeSpan = selectedCode?.lifeSpan != null && selectedCode?.lifeSpanInd != null;
          if (hasLifeSpan) {
            procDateControl?.setValidators([dateFormatValidator(), this.processDateValidator.bind(this), Validators.required]);
          } else {
            procDateControl?.setValidators([dateFormatValidator(), this.processDateValidator.bind(this)]);
          }
          procDateControl?.updateValueAndValidity({ emitEvent: false });

          const description = selectedCode?.attribDesc || '';
          this.attributeDescription.set(description);

          // BUG FIX: Auto-focus Process Date field after attribute code selection
          setTimeout(() => {
            if (this.processDateInput?.nativeElement) {
              this.processDateInput.nativeElement.focus();
            }
          }, 100);
        } else {
          this.attributeDescription.set('');
          // Clear life-span required validator when code is deselected
          const procDateControl = this.attributeForm.get('procDate');
          procDateControl?.setValidators([dateFormatValidator(), this.processDateValidator.bind(this)]);
          procDateControl?.updateValueAndValidity({ emitEvent: false });
        }
      });

    // Listen to process time changes to validate against chapter time
    this.attributeForm.get('procTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateProcessTime();
      });
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Product search filter
    this.productSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProducts();
      });

    // Group search filter
    this.groupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterGroups();
      });

    // Code search filter
    this.codeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterCodes();
      });
  }

  /**
   * Filter products based on search term
   */
  private filterProducts(): void {
    const search = this.productSearchCtrl.value?.toLowerCase() || '';
    const filtered = this.products().filter(product =>
      product.productCode.toLowerCase().includes(search)
    );
    this.filteredProducts$.next(filtered);
  }

  /**
   * Filter groups based on search term
   */
  private filterGroups(): void {
    const search = this.groupSearchCtrl.value?.toLowerCase() || '';
    const filtered = this.attributeGroups().filter(group =>
      group.code.toLowerCase().includes(search)
    );
    this.filteredGroups$.next(filtered);
  }

  /**
   * Filter codes based on search term
   */
  private filterCodes(): void {
    const search = this.codeSearchCtrl.value?.toLowerCase() || '';
    const filtered = this.attributeCodes().filter(code =>
      code.attribCode.toLowerCase().includes(search)
    );
    this.filteredCodes$.next(filtered);
  }

  /**
   * Update page header with dynamic breadcrumbs from menu
   */
  private updatePageHeader(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    if (menuItem?.label) {
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: menuItem.label, link: null },
        ],
      };
    }
  }

  /**
   * Get table column definitions
   */
  private getTableColumns(): TableColumn<ComponentAttributeDto>[] {
    const count = this.dataSource().length;
    return [
      {
        key: 'unitId',
        header: `Unit ID (${count})`,
        sortable: false,
        width: '150px',
        valueFormatter: (value: string) => {
          if (!value) return '-';
          const checkDigit = UnitIdFormatUtility.calculateISBTCheckDigit(value);
          return UnitIdFormatUtility.formatCode128(value + checkDigit);
        },
      },
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: false,
        width: '150px',
      },
      {
        key: 'attribGroup',
        header: 'Attribute Group',
        sortable: false,
        width: '150px',
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        sortable: false,
        width: '150px',
      },
      {
        key: 'attribDesc',
        header: 'Description',
        sortable: false,
        width: '200px',
        valueFormatter: (value: string | null) => value || '-',
      },
      {
        key: 'procDate',
        header: 'Process Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: any) => formatTableDateTime(value),
      },
      {
        key: 'expiryDate',
        header: 'Expiration Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => formatTableDateTime(value),
      },
    ];
  }

  /**
   * Handler for unit ID validation
   */
  onUnitValidated(event: UnitValidationResponse): void {
    if (!event.parsedUnitId) {
      this.hasError.set(false);
      return;
    }

    if (!event.collectionDate) {
      this.snackbarService.showError(
        'Error 1230: This unit does not exist in the database. Please use a valid unit ID that has been registered in the system.',
        'DISMISS'
      );
      this.hasError.set(false);
      return;
    }

    // Clear any previous errors
    this.hasError.set(false);

    this.currentUnitId = event.parsedUnitId;
    this.currentCollDate = event.collectionDate;
    this.currentCheckDigit = event.checkDigit ?? null;

    // Load products with collDate
    this.loadProductsForUnit(event.parsedUnitId, event.collectionDate);

    // Don't load attributes yet - wait for product selection
  }

  /**
   * Handler for unit ID cleared
   */
  onUnitCleared(): void {
    this.currentUnitId = '';
    this.currentCollDate = '';
    this.currentProductType = '';
    this.currentCheckDigit = null;
    this.showResults = false;
    this.dataSource.set([]);
    this.products.set([]);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.attributeDescription.set('');
    this.calculatedExpiryDate.set('');
    this.attributeForm.reset();
    // Update table columns to reset count to 0
    this.tableConfig.set({
      ...this.tableConfig(),
      columns: this.getTableColumns()
    });
  }

  /**
   * Load component attributes for a unit/product from the backend
   * GET /api/v1/component-attribute/{unitId}/{collDate}/{productCode}
   */
  private loadDataForUnit(
    unitId: string, collDate: string, productCode: string,
    productType?: string, codeScheme?: string,
    savedRow?: { attribGroup: string; attribCode: string; procDate: any }
  ): void {
    this.isLoading.set(true);

    this.apiService
      .getComponentAttributes(unitId, collDate, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Enrich rows missing descriptions by fetching attribute codes for each unique group
          const pType = productType || this.currentProductType;
          const cScheme = codeScheme || this.currentCodeScheme;
          if (pType) {
            this.enrichDescriptions(data, productCode, unitId, collDate, pType, cScheme);
          }

          if (savedRow) {
            const match = data.find(r =>
              r.attribGroup === savedRow.attribGroup && r.attribCode === savedRow.attribCode
            );
            if (match && savedRow.procDate) {
              match.procDate = savedRow.procDate;
            }
          }

          this.dataSource.set(data);
          this.showResults = true;
          this.isLoading.set(false);

          // Update table config - create completely new config object to trigger change detection
          // Update columns to reflect new count
          const updatedColumns = this.getTableColumns();

          // Get current config to preserve settings
          const currentConfig = this.tableConfig();

          // Create new pagination config with updated total records
          const updatedPagination = {
            pageSize: currentConfig.pagination?.pageSize || 10,
            pageIndex: 0,
            totalRecords: data.length,
            pageSizeOptions: currentConfig.pagination?.pageSizeOptions || [10, 25, 50, 100],
            showFirstLastButtons: true,
          };

          // Update table config signal with completely new object
          this.tableConfig.set({
            ...this.tableConfig(),
            columns: updatedColumns,
            pagination: updatedPagination
          });

        },
        error: (error) => {
          this.isLoading.set(false);
          // Don't show error for 404 - just means no attributes exist yet
          if (error.status !== 404) {
            const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Unknown error');
            this.snackbarService.showError(`Error 9001: Failed to load attributes - ${errorMessage}`, 'DISMISS');
          } else {
            this.dataSource.set([]);
            this.showResults = true;

            // Reset pagination for empty state
            this.tableConfig.set({
              ...this.tableConfig(),
              columns: this.getTableColumns(),
              pagination: {
                pageSize: 10,
                pageIndex: 0,
                totalRecords: 0,
                pageSizeOptions: [10, 25, 50, 100],
                showFirstLastButtons: true,
              }
            });
          }
        },
      });
  }

  /**
   * Enrich grid data rows that are missing attribDesc by fetching attribute codes
   */
  private enrichDescriptions(data: ComponentAttributeDto[], productCode: string, unitId: string, collDate: string, productType: string, codeScheme: string): void {
    const needsEnrichment = data.some(row => !row.attribDesc);
    if (!needsEnrichment) return;

    const uniqueGroups = [...new Set(data.filter(row => !row.attribDesc).map(row => row.attribGroup))];
    if (uniqueGroups.length === 0) return;

    const requests = uniqueGroups.map(group =>
      this.apiService.lookupAttributeCodes(productType, group)
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const descMap = new Map<string, string>();
          results.flat().forEach(code => {
            if (code.attribDesc) {
              descMap.set(code.attribCode, code.attribDesc);
            }
          });

          let updated = false;
          data.forEach(row => {
            if (!row.attribDesc && descMap.has(row.attribCode)) {
              row.attribDesc = descMap.get(row.attribCode)!;
              updated = true;
            }
          });

          if (updated) {
            this.dataSource.set([...data]);
          }
        },
      });
  }

  /**
   * Load products for a validated unit
   */
  private loadProductsForUnit(unitId: string, collDate: string): void {
    this.apiService
      .getProductsForUnit(unitId, collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.filteredProducts$.next(products);
          this.productSearchCtrl.setValue('');
        },
        error: (error) => {
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Unknown error');
          this.snackbarService.showError(`Error 9002: Failed to load products - ${errorMessage}`, 'DISMISS');
        },
      });
  }

  /**
   * Load attribute groups for selected product code and scheme
   * Backend uses productCode and codeScheme to fetch correct attribute groups
   */
  private loadAttributeGroups(productType: string, productCode: string, codeScheme: string): void {
    this.apiService
      .getAttributeGroups(productType, productCode, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroups.set(groups);
          this.filteredGroups$.next(groups);
          this.groupSearchCtrl.setValue('');
        },
        error: (error) => {
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Unknown error');
          this.snackbarService.showError(`Error 9003: Failed to load attribute groups - ${errorMessage}`, 'DISMISS');
        },
      });
  }

  /**
   * Load attribute codes for selected group (excludes duplicates)
   */
  private loadAttributeCodes(
    productType: string,
    attribGroup: string,
    unitId: string,
    collDate: string,
    productCode: string
  ): void {
    this.apiService
      .getAttributeCodes(productType, attribGroup, unitId, collDate, productCode, this.currentCodeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodes.set(codes);
          this.filteredCodes$.next(codes);
          this.codeSearchCtrl.setValue('');
        },
        error: (error) => {
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Unknown error');
          this.snackbarService.showError(`Error 9004: Failed to load attribute codes - ${errorMessage}`, 'DISMISS');
        },
      });
  }

  /**
   * Submit the form to save component attribute
   */
  onSubmit(): void {
    // Mark all fields as touched to trigger validation display
    Object.keys(this.attributeForm.controls).forEach(key => {
      this.attributeForm.get(key)?.markAsTouched();
    });

    if (!this.canSubmit) {
      return;
    }

    const formValue = this.attributeForm.value;

    // Validate process time is not in the future when process date is today
    if (formValue.procDate && formValue.procTime) {
      const processDate = moment.isMoment(formValue.procDate) ? formValue.procDate : moment(formValue.procDate);
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
      if (processDate.isSame(chapterNow, 'day')) {
        const [hours, minutes] = formValue.procTime.split(':').map(Number);
        const chapterHours = chapterNow.hours();
        const chapterMinutes = chapterNow.minutes();
        if (hours > chapterHours || (hours === chapterHours && minutes > chapterMinutes)) {
          this.attributeForm.get('procTime')?.setErrors({ futureTime: true });
          this.attributeForm.get('procTime')?.markAsTouched();
          this.snackbarService.showError('Process time cannot be in the future');
          return;
        }
      }
    }

    // Combine process date and time if both are provided
    // Send as ISO datetime string in local timezone (no UTC conversion)
    let processDateTime: Date | string | undefined = formValue.procDate;
    if (formValue.procDate && formValue.procTime) {
      // Get the date from the form (MatDatepicker returns a Date object in local time)
      const date = formValue.procDate instanceof Date ? formValue.procDate : new Date(formValue.procDate);

      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Combine date and time (time is already in HH:mm format)
      // Send as "YYYY-MM-DDTHH:mm:00" (local time, no Z suffix for UTC)
      processDateTime = `${dateStr}T${formValue.procTime}:00`;
    }

    const request: SaveComponentAttributeRequest = {
      unitId: this.currentUnitId,
      collDate: this.currentCollDate,
      productCode: formValue.productCode,
      attribGroup: formValue.attribGroup,
      attribCode: formValue.attribCode,
      procDate: processDateTime || undefined,
    };

    this.apiService
      .saveComponentAttribute(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess('Component attribute saved successfully');

          // Display calculated expiry date
          if (response?.newExpiryDate) {
            const expiryDateStr = response.newExpiryDate instanceof Date
              ? response.newExpiryDate.toISOString()
              : response.newExpiryDate;
            this.calculatedExpiryDate.set(formatTableDateTime(expiryDateStr));
          }

          // BUG FIX: Reset entire form after successful save per FMB requirements
          // Store values before reset for table refresh
          const savedUnitId = this.currentUnitId;
          const savedCollDate = this.currentCollDate;
          const savedProductCode = formValue.productCode;
          const savedProductType = this.currentProductType;
          const savedCodeScheme = this.currentCodeScheme;

          // Clear all state including unit ID first
          this.currentUnitId = '';
          this.currentCollDate = '';
          this.currentProductType = '';
          this.currentCodeScheme = '';

          // Clear Unit ID field component - this handles its own validation state
          if (this.unitIdFieldComponent) {
            this.unitIdFieldComponent.clear();
          }

          // Clear form completely - set to null values to avoid validation
          this.attributeForm.reset({
            productCode: null,
            attribGroup: null,
            attribCode: null,
            procDate: null,
            procTime: null
          }, { emitEvent: false });

          // Mark all fields as untouched and pristine to reset validation state
          Object.keys(this.attributeForm.controls).forEach(key => {
            const control = this.attributeForm.get(key);
            control?.markAsUntouched();
            control?.markAsPristine();
            // Don't call setErrors(null) - it can break validators
          });

          // Clear all dropdown data and description
          this.attributeDescription.set('');
          this.calculatedExpiryDate.set('');
          this.products.set([]);
          this.attributeGroups.set([]);
          this.attributeCodes.set([]);
          this.filteredProducts$.next([]);
          this.filteredGroups$.next([]);
          this.filteredCodes$.next([]);

          // Clear search controls
          this.productSearchCtrl.setValue('', { emitEvent: false });
          this.groupSearchCtrl.setValue('', { emitEvent: false });
          this.codeSearchCtrl.setValue('', { emitEvent: false });

          // Refresh table data from backend to show the newly saved record
          // Pass the user-entered process date so the grid shows what the user selected, not the API value
          this.loadDataForUnit(savedUnitId, savedCollDate, savedProductCode, savedProductType, savedCodeScheme,
            { attribGroup: formValue.attribGroup, attribCode: formValue.attribCode, procDate: processDateTime || null }
          );
        },
        error: (error) => {
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save attribute');
          this.snackbarService.showError(`Error 9005: Failed to save attribute - ${errorMessage}`, 'DISMISS');
        },
      });
  }

  /**
   * Clear all form fields and unit ID
   */
  onClearAll(): void {
    // Clear the unit ID field component
    if (this.unitIdFieldComponent) {
      this.unitIdFieldComponent.clear();
    }

    // Clear form and state
    this.attributeForm.reset();
    this.currentUnitId = '';
    this.currentCollDate = '';
    this.currentProductType = '';
    this.currentCheckDigit = null;
    this.products.set([]);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.attributeDescription.set('');
    this.calculatedExpiryDate.set('');
    this.dataSource.set([]);
    this.showResults = false;
    // Update table columns to reset count to 0
    this.tableConfig.set({
      ...this.tableConfig(),
      columns: this.getTableColumns()
    });
  }

  /**
   * Max selectable date for the process date datepicker — chapter's local "today".
   * Prevents the calendar from allowing selection of dates after the chapter date.
   */
  get maxProcessDate(): any {
    return this.dateAdapter.today();
  }

  /**
   * Check if form can be submitted
   */
  get canSubmit(): boolean {
    return !!this.currentUnitId && this.attributeForm.valid;
  }

  /**
   * Check if any form data exists (for CLEAR ALL button state)
   */
  get hasFormData(): boolean {
    return (
      !!this.currentUnitId ||
      !!this.attributeForm.get('productCode')?.value ||
      !!this.attributeForm.get('attribGroup')?.value ||
      !!this.attributeForm.get('attribCode')?.value ||
      !!this.attributeForm.get('procDate')?.value ||
      !!this.attributeForm.get('procTime')?.value
    );
  }

  /**
   * Table pagination handler
   */
  onPageChange(event: TablePageEvent): void {
    const currentConfig = this.tableConfig();
    if (currentConfig.pagination) {
      // Update signal with new pagination object to trigger change detection
      this.tableConfig.set({
        ...currentConfig,
        pagination: {
          ...currentConfig.pagination,
          pageIndex: event.pageIndex,
          pageSize: event.pageSize
        }
      });
    }
  }

  /**
   * Table sort handler
   */
  onSortChange(event: TableSortEvent): void {
    const currentConfig = this.tableConfig();
    if (currentConfig.sortConfig) {
      this.tableConfig.set({
        ...currentConfig,
        sortConfig: {
          column: event.column,
          direction: event.direction
        }
      });
    }
  }

  /**
   * Handle manual date input for Process Date field
   * This triggers validation when user types invalid text
   */
  onProcessDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.attributeForm.get('procDate'),
      false
    );
  }

  /**
   * Handle Process Date field blur
   * - Auto-focus time field if date is entered
   * - Auto-save if both date and time are filled and form is valid
   */
  onProcessDateBlur(): void {
    const procDate = this.attributeForm.get('procDate')?.value;
    const procTime = this.attributeForm.get('procTime')?.value;

    if (procDate) {
      // Mark procDate as touched to show validation errors if invalid
      this.attributeForm.get('procDate')?.markAsTouched();

      // If date is entered but time is not, auto-focus time field
      if (!procTime) {
        setTimeout(() => {
          if (this.processTimeInput?.nativeElement) {
            this.processTimeInput.nativeElement.focus();
          }
        }, 100);
      } else {
        // If both date and time are filled and form is valid, auto-save
        if (this.canSubmit) {
          this.onSubmit();
        }
      }
    }
  }

  /**
   * Handle Process Time field blur
   * - Auto-save if both date and time are filled and form is valid
   */
  onProcessTimeBlur(): void {
    const procDate = this.attributeForm.get('procDate')?.value;
    const procTime = this.attributeForm.get('procTime')?.value;

    // Mark procTime as touched to show validation errors if invalid
    this.attributeForm.get('procTime')?.markAsTouched();

    // Validate time against chapter time
    if (!this.validateProcessTime()) {
      return;
    }

    // Only auto-save if both date and time are filled and form is valid
    if (procDate && procTime && this.canSubmit) {
      this.onSubmit();
    }
  }

  /**
   * Handle Enter key on Process Date field
   * - If form is incomplete, show validation errors
   * - If form is complete, submit
   */
  onProcessDateEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();

      // Mark all fields as touched to show validation errors
      Object.keys(this.attributeForm.controls).forEach(key => {
        this.attributeForm.get(key)?.markAsTouched();
      });

      const procDate = this.attributeForm.get('procDate')?.value;
      const procTime = this.attributeForm.get('procTime')?.value;

      // If date is filled but time is not, focus time field
      if (procDate && !procTime) {
        setTimeout(() => {
          if (this.processTimeInput?.nativeElement) {
            this.processTimeInput.nativeElement.focus();
          }
        }, 100);
      } else if (this.canSubmit) {
        // If form is valid, submit
        this.onSubmit();
      }
    }
  }
}
