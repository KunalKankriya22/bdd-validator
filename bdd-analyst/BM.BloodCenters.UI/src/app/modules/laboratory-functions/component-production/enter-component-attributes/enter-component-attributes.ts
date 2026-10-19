import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import { ComponentAttributesApiService } from './services/component-attributes-api.service';
import {
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
  AddComponentAttributeRequestDto,
  getErrorMessage,
} from './models/component-attributes.model';

/**
 * Enter Component Attributes Component
 *
 * Purpose: Add attributes to blood components with automatic interdiction insertion
 * and expiry date recalculation
 *
 * Features:
 * - Unit ID lookup with Enter key or button
 * - Cascading dropdowns (Product → Attribute Group → Attribute Code)
 * - Conditional process date field (when attribute has life span)
 * - Real-time data table showing existing attributes
 * - Detailed success messages with interdiction/expiry info
 * - Comprehensive error handling
 */
@Component({
  selector: 'app-enter-component-attributes',
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
    MatDatepickerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-component-attributes.html',
  styleUrl: './enter-component-attributes.scss',
})
export class EnterComponentAttributesComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `enter-component-attributes-${EnterComponentAttributesComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ComponentAttributesApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly collectionDate = signal<string | null>(null);
  protected readonly products = signal<ComponentProductDto[]>([]);
  protected readonly attributeGroups = signal<AttributeGroupDto[]>([]);
  protected readonly attributeCodes = signal<AttributeCodeDto[]>([]);
  protected readonly existingAttributes = signal<ComponentAttributeDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly lookingUp = signal<boolean>(false);
  protected readonly selectedProduct = signal<ComponentProductDto | null>(null);
  protected readonly selectedAttributeCode = signal<AttributeCodeDto | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Computed values
  protected readonly processDateRequired = computed(() => {
    const attrCode = this.selectedAttributeCode();
    return attrCode?.lifeSpan != null && attrCode.lifeSpan > 0;
  });

  protected readonly canLookup = computed(() => {
    const unitId = this.form.get('unitId')?.value;
    return unitId && unitId.trim().length > 0 && !this.lookingUp();
  });

  protected readonly canSubmit = computed(() => {
    return this.form.valid && !this.submitting() && this.collectionDate() !== null;
  });

  // Form
  form!: FormGroup;

  // Data table configuration
  dataTableConfig: DataTableConfig<ComponentAttributeDto> = {
    columns: [
      { key: 'attribGroup', header: 'Group', sortable: true, width: '120px' },
      { key: 'attribCode', header: 'Code', sortable: true, width: '100px' },
      { key: 'attribDesc', header: 'Description', sortable: true, width: 'auto' },
      {
        key: 'procDate',
        header: 'Process Date',
        sortable: true,
        width: '180px',
        valueFormatter: (value: string) => value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
      },
      { key: 'interCode', header: 'Interdiction', sortable: true, width: '120px' },
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: true,
    },
    showPagination: true,
    emptyMessage: 'No attributes added',
    emptySubMessage: 'Add an attribute using the form above',
  };

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Laboratory Functions', link: '/laboratory-functions' },
      { label: 'Component Production', link: '/laboratory-functions/component-production' },
      { label: 'Enter Component Attributes', link: null },
    ],
    title: 'Enter Component Attributes',
  };

  // Min date for process date picker (collection date)
  protected minProcessDate: Moment | null = null;
  // Max date for process date picker (today)
  protected readonly maxProcessDate = moment();

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reactive form
   */
  private initForm(): void {
    this.form = this.fb.group({
      unitId: ['', [Validators.required, Validators.maxLength(15)]],
      collectionDate: [{ value: '', disabled: true }],
      product: [null, [Validators.required]],
      attributeGroup: [null, [Validators.required]],
      attributeCode: [null, [Validators.required]],
      processDate: [null],
    });

    // Subscribe to product changes
    this.form.get('product')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => this.onProductChange(productCode));

    // Subscribe to attribute group changes
    this.form.get('attributeGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((groupCode) => this.onAttributeGroupChange(groupCode));

    // Subscribe to attribute code changes
    this.form.get('attributeCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((attrCode) => this.onAttributeCodeChange(attrCode));
  }

  /**
   * Form control getters
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Handle Unit ID lookup (Enter key or button click)
   */
  onUnitIdLookup(): void {
    const unitId = this.form.get('unitId')?.value?.trim();
    if (!unitId || this.lookingUp()) {
      return;
    }

    // Clear downstream fields
    this.clearDownstreamFromUnitId();

    this.lookingUp.set(true);

    // For this implementation, we need to make an assumption about collection date
    // In a real scenario, the backend would return the collection date when looking up the unit
    // For now, we'll use today's date as collection date
    // TODO: If there's a separate unit lookup endpoint, use that instead
    const tempCollDate = moment().format('YYYY-MM-DDTHH:mm:ss');

    this.apiService
      .getProductsForUnit(unitId, tempCollDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          if (products.length === 0) {
            this.snackbarService.showError('No valid components found for this unit.');
            this.collectionDate.set(null);
          } else {
            this.products.set(products);
            this.collectionDate.set(tempCollDate);
            this.form.get('collectionDate')?.setValue(
              moment(tempCollDate).format('DD-MMM-YYYY').toUpperCase()
            );
            this.minProcessDate = moment(tempCollDate).startOf('day');
          }
          this.lookingUp.set(false);
        },
        error: (error) => {
          this.handleApiError(error);
          this.lookingUp.set(false);
        },
      });
  }

  /**
   * Handle Enter key press in Unit ID field
   */
  onUnitIdKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onUnitIdLookup();
    }
  }

  /**
   * Handle product selection change
   */
  private onProductChange(productCode: string | null): void {
    if (!productCode) {
      this.clearDownstreamFromProduct();
      return;
    }

    const product = this.products().find((p) => p.productCode === productCode);
    if (!product) {
      this.clearDownstreamFromProduct();
      return;
    }

    this.selectedProduct.set(product);

    // Clear downstream fields
    this.form.patchValue({
      attributeGroup: null,
      attributeCode: null,
      processDate: null,
    });
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);

    // Fetch attribute groups for this product type
    this.loading.set(true);
    this.apiService
      .getAttributeGroups(product.productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroups.set(groups);
          this.loading.set(false);

          // Load existing attributes for this product
          this.loadExistingAttributes();
        },
        error: (error) => {
          this.handleApiError(error);
          this.loading.set(false);
        },
      });
  }

  /**
   * Handle attribute group selection change
   */
  private onAttributeGroupChange(groupCode: string | null): void {
    if (!groupCode) {
      this.clearDownstreamFromAttributeGroup();
      return;
    }

    const product = this.selectedProduct();
    const unitId = this.form.get('unitId')?.value;
    const collDate = this.collectionDate();
    const productCode = this.form.get('product')?.value;

    if (!product || !unitId || !collDate || !productCode) {
      return;
    }

    // Clear downstream fields
    this.form.patchValue({
      attributeCode: null,
      processDate: null,
    });
    this.attributeCodes.set([]);

    // Fetch attribute codes for this group
    this.loading.set(true);
    this.apiService
      .getAttributeCodes(product.productType, groupCode, unitId, collDate, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodes.set(codes);
          this.loading.set(false);
        },
        error: (error) => {
          this.handleApiError(error);
          this.loading.set(false);
        },
      });
  }

  /**
   * Handle attribute code selection change
   */
  private onAttributeCodeChange(attrCode: string | null): void {
    if (!attrCode) {
      this.selectedAttributeCode.set(null);
      this.form.patchValue({ processDate: null });
      this.form.get('processDate')?.clearValidators();
      this.form.get('processDate')?.updateValueAndValidity();
      return;
    }

    const attribute = this.attributeCodes().find((a) => a.attribCode === attrCode);
    this.selectedAttributeCode.set(attribute ?? null);

    // Update process date validators based on whether it's required
    if (this.processDateRequired()) {
      this.form.get('processDate')?.setValidators([Validators.required]);
    } else {
      this.form.get('processDate')?.clearValidators();
    }
    this.form.get('processDate')?.updateValueAndValidity();
  }

  /**
   * Load existing attributes for the selected component
   */
  private loadExistingAttributes(): void {
    const unitId = this.form.get('unitId')?.value;
    const collDate = this.collectionDate();
    const productCode = this.form.get('product')?.value;

    if (!unitId || !collDate || !productCode) {
      this.existingAttributes.set([]);
      this.updateTablePagination();
      return;
    }

    this.apiService
      .getAttributesForComponent(unitId, collDate, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attributes) => {
          this.existingAttributes.set(attributes);
          this.updateTablePagination();
        },
        error: (error) => {
          console.error('Failed to load existing attributes:', error);
          this.existingAttributes.set([]);
          this.updateTablePagination();
        },
      });
  }

  /**
   * Submit the form to add component attribute
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (!this.form.valid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const unitId = this.form.get('unitId')?.value;
    const collDate = this.collectionDate();
    const productCode = this.form.get('product')?.value;
    const attribGroup = this.form.get('attributeGroup')?.value;
    const attribCode = this.form.get('attributeCode')?.value;
    const processDate = this.form.get('processDate')?.value;

    if (!collDate) {
      this.snackbarService.showError('Collection date is required. Please lookup the unit first.');
      return;
    }

    const request: AddComponentAttributeRequestDto = {
      unitId,
      collDate,
      productCode,
      attribGroup,
      attribCode,
    };

    // Add process date if provided
    if (processDate) {
      request.procDate = moment(processDate).toISOString();
    }

    this.submitting.set(true);

    this.apiService
      .addComponentAttribute(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.handleSuccess(result);
          this.submitting.set(false);
        },
        error: (error) => {
          this.handleApiError(error);
          this.submitting.set(false);
        },
      });
  }

  /**
   * Handle successful attribute addition
   */
  private handleSuccess(result: ComponentAttributeDto): void {
    // Build detailed success message
    let message = `Attribute ${result.attribCode} added successfully.`;

    // Add interdiction info if applicable
    if (result.interCode) {
      message += ` Interdiction ${result.interCode} also inserted.`;
    }

    // Add expiry date info if applicable
    if (result.expiryDate && result.newExpiryDate && result.expiryDate !== result.newExpiryDate) {
      const oldExpiry = moment(result.expiryDate).format('DD-MMM-YYYY').toUpperCase();
      const newExpiry = moment(result.newExpiryDate).format('DD-MMM-YYYY').toUpperCase();
      message += ` Expiry date updated from ${oldExpiry} to ${newExpiry}.`;
    }

    this.snackbarService.showSuccess(message);

    // Refresh the attributes table
    this.loadExistingAttributes();

    // Clear form fields except Unit ID (keep unit context)
    this.clearFormKeepingUnitContext();
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any): void {
    const errorCode = error?.error?.errorCode || error?.error?.error?.errorCode;
    let message = 'An unexpected error occurred. Please try again.';

    if (errorCode) {
      message = getErrorMessage(errorCode);
    } else if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    }

    this.snackbarService.showError(message);
  }

  /**
   * Clear form keeping Unit ID and collection date
   */
  private clearFormKeepingUnitContext(): void {
    this.form.patchValue({
      product: null,
      attributeGroup: null,
      attributeCode: null,
      processDate: null,
    });
    this.submitted.set(false);
    this.selectedProduct.set(null);
    this.selectedAttributeCode.set(null);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
  }

  /**
   * Clear all downstream fields from Unit ID
   */
  private clearDownstreamFromUnitId(): void {
    this.form.patchValue({
      collectionDate: '',
      product: null,
      attributeGroup: null,
      attributeCode: null,
      processDate: null,
    });
    this.collectionDate.set(null);
    this.products.set([]);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.existingAttributes.set([]);
    this.selectedProduct.set(null);
    this.selectedAttributeCode.set(null);
    this.minProcessDate = null;
  }

  /**
   * Clear all downstream fields from Product
   */
  private clearDownstreamFromProduct(): void {
    this.form.patchValue({
      attributeGroup: null,
      attributeCode: null,
      processDate: null,
    });
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);
    this.selectedProduct.set(null);
    this.selectedAttributeCode.set(null);
  }

  /**
   * Clear all downstream fields from Attribute Group
   */
  private clearDownstreamFromAttributeGroup(): void {
    this.form.patchValue({
      attributeCode: null,
      processDate: null,
    });
    this.attributeCodes.set([]);
    this.selectedAttributeCode.set(null);
  }

  /**
   * Clear button handler
   */
  onClear(): void {
    this.clearFormKeepingUnitContext();
  }

  /**
   * Validate process date is not before collection date
   */
  onProcessDateChange(): void {
    const processDate = this.form.get('processDate')?.value;
    const collDate = this.collectionDate();

    if (!processDate || !collDate) {
      return;
    }

    const procMoment = moment(processDate);
    const collMoment = moment(collDate);

    if (procMoment.isBefore(collMoment, 'day')) {
      this.form.get('processDate')?.setErrors({ beforeCollectionDate: true });
    }

    if (procMoment.isAfter(moment(), 'day')) {
      this.form.get('processDate')?.setErrors({ futureDate: true });
    }
  }

  /**
   * Update table pagination totalRecords
   */
  private updateTablePagination(): void {
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.totalRecords = this.existingAttributes().length;
    }
  }
}
