import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, TablePageEvent } from '@shared/interfaces/data-table.interface';

import { RejectUnitComponentService } from './services/reject-unit-component.service';
import {
  UnitValidationResponseDto,
  RejectReasonDto,
  RejectableProductDto,
  RejectComponentRequestDto,
  RejectedComponentDisplay,
  ReprintLabelRequestDto,
  CatalogNumberDto,
  AboLabelDto
} from './models/reject-unit-component.model';

@Component({
  selector: 'app-reject-unit-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable
  ],
  templateUrl: './reject-unit-component.html',
  styleUrl: './reject-unit-component.scss'
})
export class RejectUnitComponentComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `reject-unit-${RejectUnitComponentComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  private readonly rejectService = inject(RejectUnitComponentService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Store returnUrl for navigation back to Pathogen Reduction
  private returnUrl: string | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: 'Reject Unit/Component',
    subtitle: 'Record the time a unit is placed in the freezer during real-time separation.',
    actions: []
  };

  // === Row 1 Controls (MaximumLength from Oracle Forms FMB) ===
  readonly productCodeControl = new FormControl<string>({ value: '', disabled: true }, [Validators.required, Validators.maxLength(8)]);
  readonly rejectCodeControl = new FormControl<string>({ value: '', disabled: true }, [Validators.required, Validators.maxLength(5)]);
  readonly catalogNumberControl = new FormControl<string>({ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]);

  // === Search Controls for Dropdowns ===
  readonly productCodeSearchControl = new FormControl('');
  readonly rejectCodeSearchControl = new FormControl('');
  readonly catalogNumberSearchControl = new FormControl('');
  readonly filteredProductCodes = signal<RejectableProductDto[]>([]);
  readonly filteredRejectReasons = signal<RejectReasonDto[]>([]);
  readonly filteredCatalogNumbers = signal<CatalogNumberDto[]>([]);

  // === Row 2 Controls (MaximumLength from Oracle Forms FMB) ===
  readonly verifyProductControl = new FormControl<string>({ value: '', disabled: true }, [Validators.maxLength(8)]);
  readonly verifyUnitLabelControl = new FormControl<string>({ value: '', disabled: true }, [Validators.maxLength(25)]);
  readonly verifyUnitIdControl = new FormControl<string>({ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]);
  readonly labelControl = new FormControl<string>({ value: '', disabled: true }, [Validators.required, Validators.maxLength(2)]);

  // === State Signals ===
  readonly rejectReasons = signal<RejectReasonDto[]>([]);
  readonly productCodes = signal<RejectableProductDto[]>([]);
  readonly catalogNumbers = signal<CatalogNumberDto[]>([]);
  readonly aboLabels = signal<AboLabelDto[]>([]);
  readonly rejectedComponents = signal<RejectedComponentDisplay[]>([]);
  readonly unitValidated = signal(false);
  readonly unitError = signal<string | null>(null);
  readonly labelUnitAs = signal<string>('-');
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly isNewProduct = signal(false);
  readonly isNoneProduct = signal(false);
  readonly resolvedProductType = signal('');
  private unitData = signal<UnitValidationResponseDto | null>(null);
  private manualUnitId = signal<string>('');
  private barcodeType = signal<'CODE128' | 'CODABAR'>('CODE128');


  // === Pagination ===
  private readonly currentPageIndex = signal(0);
  private readonly currentPageSize = signal(25);

  readonly paginatedData = computed(() => {
    const all = this.rejectedComponents();
    const start = this.currentPageIndex() * this.currentPageSize();
    return all.slice(start, start + this.currentPageSize());
  });

  // === Table ===
  tableConfig: DataTableConfig<RejectedComponentDisplay> = {
    columns: this.getTableColumns(),
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    noDataIcon: 'search',
    showPagination: true,
    enableRowHighlight: false
  };

  ngOnInit(): void {
    // Check if navigated from Pathogen Reduction
    this.checkNavigationState();

    this.loadPageHeader();
    this.loadRejectionReasons();
    this.setupRejectCodeSubscription();
    this.setupProductCodeSubscription();
    this.setupProductCodeSearch();
    this.setupRejectCodeSearch();
    this.setupCatalogNumberSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if navigated from Pathogen Reduction and update breadcrumbs accordingly
   * Uses query params pattern (similar to verify-control-values)
   */
  private checkNavigationState(): void {
    // Check for returnUrl query param (indicates navigation from another screen)
    const queryParams = this.route.snapshot.queryParams;
    const state = history.state;

    if (queryParams['returnUrl']) {
      this.returnUrl = queryParams['returnUrl'];
      this.updateBreadcrumbsWithPathogenReduction();
    } else if (state?.fromPathogenReduction) {
      // Fallback to state-based detection
      this.updateBreadcrumbsWithPathogenReduction();
    }
  }

  /**
   * Update breadcrumbs to include Pathogen Reduction
   */
  private updateBreadcrumbsWithPathogenReduction(): void {
    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        {
          label: 'Pathogen Reduction Manager',
          link: '/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager'
        },
        { label: 'Reject Unit/Component', link: null },
      ],
      subtitle: 'Record the time a unit is placed in the freezer during real-time separation.',
      showBackButton: true,
      onBackClick: () => this.navigateToPathogenReduction()
    };
  }

  /**
   * Navigate back to Pathogen Reduction Manager with state
   * Uses returnUrl pattern (similar to verify-control-values)
   */
  navigateToPathogenReduction(): void {
    if (this.returnUrl) {
      // Navigate to the returnUrl which includes query params for state restoration
      this.router.navigateByUrl(this.returnUrl);
    } else {
      // Fallback to base path
      this.router.navigate(['/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager']);
    }
  }

  private loadPageHeader(): void {
    const pageData = this.pageHeaderService.pageHeaderData();

    // Preserve breadcrumbs and back button if navigated from Pathogen Reduction
    const shouldPreserveBreadcrumbs = this.returnUrl || history.state?.fromPathogenReduction;

    if (pageData?.title) {
      this.headerConfig = { ...this.headerConfig, title: pageData.title };
    }
    if (pageData?.subtitle && !shouldPreserveBreadcrumbs) {
      // Only override subtitle if not from Pathogen Reduction
      this.headerConfig = { ...this.headerConfig, subtitle: pageData.subtitle };
    }

    // Set default breadcrumbs if not from Pathogen Reduction
    if (!shouldPreserveBreadcrumbs && this.headerConfig.breadcrumbs.length === 0) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'Reject Unit/Component', link: null }
        ]
      };
    }
  }

  /**
   * Oracle Forms: REJECT_REASON_CODE.VALIDATE_FIELD calls CALL_PRINT_ROUTINES
   * → CHECK_BIO → DISPLAY_LABEL which sets "Label this Unit as" to BIO/NFT/DISC.
   * This populates when the reject code is selected, not before.
   */
  private setupRejectCodeSubscription(): void {
    this.rejectCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(rejectCode => {
        if (rejectCode && this.unitData()) {
          const unit = this.unitData()!;
          const codeScheme = unit.codeScheme || 'C';
          if (unit.isBioHazard) {
            this.labelUnitAs.set('BIO');
            const autoLabel = codeScheme === 'I' ? 'Mb' : '58';
            this.labelControl.setValue(autoLabel, { emitEvent: false });
          } else {
            this.labelUnitAs.set(codeScheme === 'C' ? 'NFT' : 'DISC');
            const autoLabel = codeScheme === 'I' ? 'Md' : '47';
            this.labelControl.setValue(autoLabel, { emitEvent: false });
          }

          if (this.isNoneProduct() && this.catalogNumberControl.value) {
            this.onSubmitRejection();
          }
        } else {
          this.labelUnitAs.set('-');
        }
      });
  }

  /**
   * Oracle Forms: CATALOG_NUMBER LOV (CTRL_BLK_1_CATALOG_LOV) is populated
   * based on the selected product code. When product code changes, reload catalogs.
   */
  private setupProductCodeSubscription(): void {
    this.productCodeControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(productCode => {
        if (productCode && productCode.length >= 4 && this.unitData()) {
          const unit = this.unitData()!;
          const selectedProduct = this.productCodes().find(p =>
            p.productCode === productCode || p.productCode?.toUpperCase() === productCode?.toUpperCase()
          );
          const productType = selectedProduct?.productType || '';
          const isNone = productCode.toUpperCase() === 'NONE';
          const isNew = !selectedProduct && !isNone;

          this.isNoneProduct.set(isNone);
          this.isNewProduct.set(isNew);

          // For manually entered products, validate against VALID_PRODUCTS
          // Oracle Forms: PRODUCT_CODE.VALIDATE_FIELD checks pheresis flag (4305/4306) and CRYO (4319)
          if (isNew && !isNone) {
            this.rejectService.validateProductCode(unit.unitId, productCode)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (validProduct) => {
                  this.resolvedProductType.set(validProduct.productType);
                  this.loadCatalogNumbers(unit.unitId, validProduct.productType, productCode);
                },
                error: (err) => {
                  const errorCode = err?.error?.errorResponse?.errorCode || err?.error?.errorCode || '';
                  const errorMsg = err?.error?.errorResponse?.error || err?.error?.message || '';
                  this.snackbarService.showError(errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg);
                  this.productCodeControl.setValue('', { emitEvent: false });
                  this.resolvedProductType.set('');
                }
              });
          } else {
            this.resolvedProductType.set(productType);
          }

          // Oracle Forms: catalog is always resolved from the backend per unit+product.
          // For existing products the backend returns bag_id from COMPONENTS;
          // for new/NONE products it returns from VALID_CATALOG_DETAILS.
          this.catalogNumberControl.reset('', { emitEvent: false });
          this.catalogNumberControl.markAsUntouched();
          this.catalogNumberControl.markAsPristine();
          this.catalogNumberControl.enable();
          this.loadCatalogNumbers(unit.unitId, isNone ? 'NONE' : productType, productCode);

          if (isNone) {
            // For NONE: disable all row 2 fields — commit happens after catalog
            this.verifyProductControl.reset('', { emitEvent: false }); this.verifyProductControl.disable();
            this.verifyUnitLabelControl.reset('', { emitEvent: false }); this.verifyUnitLabelControl.disable();
            this.verifyUnitIdControl.reset('', { emitEvent: false }); this.verifyUnitIdControl.disable();
            this.labelControl.reset('', { emitEvent: false }); this.labelControl.disable();
          } else {
            // Oracle Forms: verify product only enabled+required for new products (ISBT code_scheme='I')
            if (isNew) {
              this.verifyProductControl.enable();
              this.verifyProductControl.setValidators([Validators.required, Validators.maxLength(8)]);
            } else {
              this.verifyProductControl.reset('', { emitEvent: false });
              this.verifyProductControl.disable();
              this.verifyProductControl.setValidators([Validators.maxLength(8)]);
            }
            this.verifyProductControl.updateValueAndValidity();
            this.verifyUnitLabelControl.enable();
            this.verifyUnitIdControl.enable();
            this.labelControl.enable();
          }
        } else if (!productCode) {
          this.isNoneProduct.set(false);
          this.isNewProduct.set(false);
          this.catalogNumbers.set([]);
          this.filteredCatalogNumbers.set([]);
          this.catalogNumberControl.reset('', { emitEvent: false });
          this.catalogNumberControl.markAsUntouched();
          this.catalogNumberControl.markAsPristine();
        }
      });
  }

  private loadRejectionReasons(): void {
    this.rejectService.getRejectionReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.rejectReasons.set(reasons);
          this.filteredRejectReasons.set(reasons);
        },
        error: () => this.snackbarService.showError('Failed to load rejection reasons')
      });
  }

  // === Actions ===

  onUnitValidated(event: UnitValidationResponse): void {
    const unitId = event.parsedUnitId;
    this.unitError.set(null);
    this.unitValidated.set(true);
    this.manualUnitId.set(event.manualUnitId || unitId);
    this.barcodeType.set(event.barcodeType || 'CODE128');

    this.rejectService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.unitData.set(data);

          // Reset all product-dependent fields before enabling for the new unit
          this.productCodeControl.reset('', { emitEvent: false });
          this.rejectCodeControl.reset('', { emitEvent: false });
          this.catalogNumberControl.reset('', { emitEvent: false });
          this.verifyProductControl.reset('', { emitEvent: false });
          this.verifyUnitLabelControl.reset('', { emitEvent: false });
          this.verifyUnitIdControl.reset('', { emitEvent: false });
          this.labelControl.reset('', { emitEvent: false });
          this.productCodes.set([]);
          this.filteredProductCodes.set([]);
          this.catalogNumbers.set([]);
          this.filteredCatalogNumbers.set([]);
          this.isNewProduct.set(false);
          this.isNoneProduct.set(false);
          this.resolvedProductType.set('');
          this.labelUnitAs.set('-');
          this.submitted.set(false);

          this.productCodeControl.enable();
          this.rejectCodeControl.enable();
          this.catalogNumberControl.disable();
          this.verifyProductControl.disable();
          this.verifyUnitLabelControl.disable();
          this.verifyUnitIdControl.disable();
          this.labelControl.disable();
          this.loadProductCodes(unitId);
          this.loadAboLabels(data.codeScheme || 'C');
        },
        error: (err) => {
          const errorCode = err?.error?.errorResponse?.errorCode || err?.error?.errorCode || '';
          const errorMsg = err?.error?.errorResponse?.error || err?.error?.message || '';
          const display = errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg;
          this.snackbarService.showError(display);
          this.unitValidated.set(false);
        }
      });
  }

  private loadProductCodes(unitId: string): void {
    this.rejectService.getProductCodes(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.productCodes.set(products);
          this.filteredProductCodes.set(products);
          this.productCodeSearchControl.setValue('');
        },
        error: () => this.snackbarService.showError('Failed to load product codes')
      });
  }

  private loadAboLabels(codeScheme: string): void {
    this.rejectService.getAboLabels(codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labels) => this.aboLabels.set(labels),
        error: () => this.aboLabels.set([])
      });
  }

  private loadCatalogNumbers(unitId: string, productType: string, productCode?: string): void {
    this.rejectService.getCatalogNumbers(unitId, productType, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          this.catalogNumbers.set(catalogs);
          this.filteredCatalogNumbers.set(catalogs);
          this.catalogNumberSearchControl.setValue('');
          if (catalogs.length === 1) {
            setTimeout(() => this.catalogNumberControl.setValue(catalogs[0].catalogNumber));
          }
        },
        error: () => {
          this.catalogNumbers.set([]);
          this.filteredCatalogNumbers.set([]);
        }
      });
  }

  /**
   * User Guide: "If rejecting an empty bag, the system will commit at this point [Catalog No]."
   * For NONE products, auto-commit when catalog number is selected.
   */
  /**
   * User Guide - Vrfy Unit ID and Lbl:
   * "Perform concatenate (one) scan of unit ID and SLD label together."
   * "To perform individual verification, press M and press ENTER."
   * "NOTE: If concatenate verification is performed, the line commits after the concatenated scan."
   *
   * If value is 'M' → manual mode, skip to Verify Unit ID field (no commit)
   * If value is a concatenated scan containing unit ID → auto-commit the line
   * If empty → standard submit attempt
   */
  onVerifyUnitLabelEnter(): void {
    const value = this.verifyUnitLabelControl.value?.trim();
    if (!value) return;

    // If 'M' → manual mode, user will fill Verify Unit ID and Label separately
    if (value.toUpperCase() === 'M') {
      return;
    }

    const unit = this.unitData();
    if (!unit) return;

    // Parse concatenated scan: format is =<unitId>=%<label>
    // Example: =W63332511190100=%Md
    // The scan contains unit ID and SLD label concatenated
    const unitId = unit.unitId;

    // Extract unit ID part and label part from the scan
    let parsedUnitId = '';
    let parsedLabel = '';

    if (value.includes('=%')) {
      // Concatenated format: everything before =%  is unit part, after =% is label
      const parts = value.split('=%');
      parsedUnitId = parts[0].replace(/^=/, '');
      parsedLabel = parts[1] || '';
    } else if (value.toUpperCase().includes(unitId.toUpperCase())) {
      const idx = value.toUpperCase().indexOf(unitId.toUpperCase());
      parsedUnitId = unitId;
      parsedLabel = value.substring(idx + unitId.length).replace(/^[=%]+/, '');
    } else {
      // Can't parse — treat entire value as unit ID attempt, strip = prefix
      parsedUnitId = value.replace(/^=/, '');
    }

    // Normalize both sides for comparison (strip =, spaces, dashes)
    const normalizedParsed = this.normalizeUnitId(parsedUnitId);
    const normalizedUnitId = this.normalizeUnitId(unitId);

    if (normalizedParsed && !normalizedParsed.includes(normalizedUnitId)) {
      this.showOracleError('1508');
      this.verifyUnitLabelControl.setValue('', { emitEvent: false });
      return;
    }

    // Format display values in check digit format (using manualUnitId which includes the check digit)
    const formattedUnitId = this.getFormattedUnitId();
    this.verifyUnitIdControl.setValue(formattedUnitId, { emitEvent: false });

    // Update verify unit label control to show formatted value
    if (parsedLabel) {
      this.verifyUnitLabelControl.setValue(`${formattedUnitId}=%${parsedLabel}`, { emitEvent: false });
    } else {
      this.verifyUnitLabelControl.setValue(formattedUnitId, { emitEvent: false });
    }

    if (parsedLabel && ['Md', 'Mb', '47', '58'].includes(parsedLabel)) {
      this.labelControl.setValue(parsedLabel, { emitEvent: false });
      // User Guide: "If concatenate verification is performed, the line commits"
      this.onSubmitRejection();
    }
  }

  onCatalogSelected(): void {
    if (this.isNoneProduct() && this.catalogNumberControl.value && this.rejectCodeControl.value) {
      this.onSubmitRejection();
    }
  }

  /**
   * Oracle Forms SUNIT_ID.VALIDATE_FIELD:
   * Validates on blur that verify unit ID matches the original unit ID.
   * if :unit_id != :sunit_id then show_error('1508')
   */
  onVerifyUnitIdBlur(): void {
    const rawValue = this.verifyUnitIdControl.value?.trim();
    const unit = this.unitData();
    if (!rawValue || !unit) return;

    const normalizedValue = this.normalizeUnitId(rawValue);
    const normalizedUnitId = this.normalizeUnitId(unit.unitId);

    if (!normalizedValue.includes(normalizedUnitId) && !normalizedUnitId.includes(normalizedValue)) {
      this.showOracleError('1508');
      this.verifyUnitIdControl.setValue('', { emitEvent: false });
    } else {
      const formatted = this.getFormattedUnitId();
      this.verifyUnitIdControl.setValue(formatted, { emitEvent: false });
    }
  }

  onUnitCleared(): void {
    this.clearAll();
  }

  /**
   * Oracle Forms KEY-MENU: REPRINT is allowed only when:
   * - Unit is validated
   * - Product code is selected and is NOT 'NONE'
   * - Verify product fields are empty (s_verify_prod_code and verify_prod_code must be null)
   */
  canReprint(): boolean {
    const productCode = this.productCodeControl.value;
    const rejectCode = this.rejectCodeControl.value;
    const catalogNumber = this.catalogNumberControl.value;
    const hasVerifyProduct = !!this.verifyProductControl.value;
    return this.unitValidated() && !!productCode && productCode !== 'NONE'
      && !!rejectCode && !!catalogNumber && !hasVerifyProduct;
  }

  /**
   * Oracle Forms KEY-MENU trigger → CALL_PRINT_ROUTINES:
   * 1. Check verify fields are empty (error 5308 if not)
   * 2. check_bio → determine BIO/NFT
   * 3. CALC_EXP_DATE → get expiration date
   * 4. ISBT: PRINT_LABEL_DIGI_ISBT('PFF', unit_id, product_code, label, exp_date, ...)
   *    Codabar: PRINT_LABEL_DIGI('PCA', unit_id, product_code, label, exp_date, NULL)
   */
  onReprint(): void {
    const unit = this.unitData();
    const productCode = this.productCodeControl.value;

    // Oracle Forms KEY-MENU: if s_verify_prod_code or verify_prod_code is not null → show_error('5308')
    if (this.verifyProductControl.value) {
      this.showOracleError('5308');
      return;
    }

    // Oracle Forms CALL_PRINT_ROUTINES: product_code must not be 'NONE'
    if (!unit || !productCode || productCode === 'NONE') {
      this.showOracleError('9741');
      return;
    }

    const codeScheme = unit.codeScheme || 'C';
    const isBio = this.labelUnitAs() === 'BIO';
    const aboLabel = codeScheme === 'I' ? (isBio ? 'Mb' : 'Md') : (isBio ? '58' : '47');

    const request: ReprintLabelRequestDto = {
      unitId: unit.unitId,
      productCode: productCode,
      productType: this.resolvedProductType(),
      collDate: unit.collDate
    };

    this.rejectService.reprintLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labelData) => {
          if (labelData.timeLimitWarning) {
            this.snackbarService.showError(labelData.timeLimitWarning);
          } else {
            // Auto-set the Label and ABO fields after successful print
            // Oracle Forms: CALL_PRINT_ROUTINES sets these via CHECK_BIO + DISPLAY_LABEL
            this.labelControl.setValue(aboLabel, { emitEvent: false });
            this.snackbarService.showSuccess('Label printed successfully');
          }
        },
        error: (err) => {
          const errorCode = err?.error?.errorResponse?.errorCode || err?.error?.errorCode || '';
          const errorMsg = err?.error?.errorResponse?.error || err?.error?.message || '';
          this.snackbarService.showError(errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg);
        }
      });
  }

  private isClearing = false;

  clearAll(): void {
    if (this.isClearing) return;
    this.isClearing = true;

    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    const controls = [
      this.productCodeControl, this.rejectCodeControl, this.catalogNumberControl,
      this.verifyProductControl, this.verifyUnitLabelControl, this.verifyUnitIdControl,
      this.labelControl
    ];
    controls.forEach(c => {
      c.reset('', { emitEvent: false });
      c.markAsUntouched();
      c.markAsPristine();
      c.disable();
    });
    this.productCodeSearchControl.setValue('', { emitEvent: false });
    this.rejectCodeSearchControl.setValue('', { emitEvent: false });
    this.catalogNumberSearchControl.setValue('', { emitEvent: false });
    this.unitValidated.set(false);
    this.unitError.set(null);
    this.unitData.set(null);
    this.manualUnitId.set('');
    this.barcodeType.set('CODE128');
    this.productCodes.set([]);
    this.catalogNumbers.set([]);
    this.aboLabels.set([]);
    this.filteredProductCodes.set([]);
    this.filteredCatalogNumbers.set([]);
    this.filteredRejectReasons.set(this.rejectReasons());
    this.labelUnitAs.set('-');
    this.submitted.set(false);
    this.isNewProduct.set(false);
    this.isNoneProduct.set(false);
    this.resolvedProductType.set('');

    this.isClearing = false;
  }

  /**
   * Submit rejection — matches Oracle Forms ABO KEY-NEXT-ITEM trigger behavior.
   * Triggered by pressing Enter on the ABO field (last input field).
   * Validates all required fields, then calls POST /reject-component/reject.
   */
  onSubmitRejection(): void {
    if (this.isSubmitting()) return;

    this.submitted.set(true);
    this.productCodeControl.markAsTouched();
    this.rejectCodeControl.markAsTouched();
    this.catalogNumberControl.markAsTouched();
    this.verifyUnitIdControl.markAsTouched();
    this.labelControl.markAsTouched();

    const unit = this.unitData();
    const productCode = this.productCodeControl.value;
    const rejectCode = this.rejectCodeControl.value;
    const catalogNumber = this.catalogNumberControl.value;

    // Oracle Forms: nullchk - show_error('0063')
    if (!unit) { this.showOracleError('0063'); return; }
    // Oracle Forms: nullchk - show_error('1205')
    if (!productCode) { this.showOracleError('1205'); return; }
    // Oracle Forms: nullchk - show_error('1202')
    if (!rejectCode) { this.showOracleError('1202'); return; }
    // Oracle Forms: nullchk - show_error('9719')
    if (!catalogNumber) { this.showOracleError('9719'); return; }
    const isNone = productCode.toUpperCase() === 'NONE';
    const isNew = this.isNewProduct();
    const selectedProduct = this.productCodes().find(p =>
      p.productCode === productCode || p.productCode?.toUpperCase() === productCode?.toUpperCase()
    );
    const isManualProduct = !selectedProduct;

    // For NONE: only Unit ID, Product Code, Reject Code, and Catalog Number are required
    // Skip all row 2 validations — commit directly
    if (!isNone) {

      // Oracle Forms: Verify Product REQUIRED for new/manual products
      const verifyProduct = this.verifyProductControl.value?.trim();
      if ((isNew || isManualProduct) && !verifyProduct) { this.showOracleError('9728'); return; }
      if (verifyProduct && verifyProduct !== productCode) { this.showOracleError('9728'); return; }

      const verifyUnitLabel = this.verifyUnitLabelControl.value?.trim();
      const verifyUnitIdRaw = this.normalizeUnitId(this.verifyUnitIdControl.value || '');

      // Verify Unit ID is required for non-NONE
      if (!verifyUnitIdRaw) { this.showOracleError('1508'); return; }

      if (verifyUnitLabel && verifyUnitLabel.toUpperCase() !== 'M' &&
          !this.normalizeUnitId(verifyUnitLabel).includes(this.normalizeUnitId(unit.unitId))) {
        this.showOracleError('1508'); return;
      }

      if (verifyUnitIdRaw && !verifyUnitIdRaw.includes(this.normalizeUnitId(unit.unitId)) && !this.normalizeUnitId(unit.unitId).includes(verifyUnitIdRaw)) { this.showOracleError('1508'); return; }

      // Oracle Forms: Label REQUIRED for non-NONE
      const labelValue = this.labelControl.value?.trim();
      if (!labelValue) { this.showOracleError('9731'); return; }
    }

    const request: RejectComponentRequestDto = {
      unitId: unit.unitId,
      collDate: unit.collDate,
      chapterId: unit.chapterId,
      productCode: productCode,
      componentPrefix: selectedProduct?.componentPrefix || '01',
      rejectReasonCode: rejectCode,
      catalogNumber: catalogNumber,
      warehouseId: unit.warehouseId || '',
      isNewProduct: this.isNewProduct(),
      systemLabelDecision: null
    };

    this.isSubmitting.set(true);

    this.rejectService.rejectComponent(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showOracleSuccess('8010');

          const newRow: RejectedComponentDisplay = {
            unitId: unit.unitId,
            productCode: productCode,
            rejectReasonCode: rejectCode,
            catalogNumber: catalogNumber,
            verifyProduct: this.verifyProductControl.value || '',
            verifyUnitId: this.verifyUnitIdControl.value || '',
            label: this.labelControl.value || ''
          };
          this.rejectedComponents.set([newRow, ...this.rejectedComponents()]);
          this.updateTableConfig();

          this.clearAll();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          const errorCode = err?.error?.errorResponse?.errorCode || err?.error?.errorCode || '';
          const errorMsg = err?.error?.errorResponse?.error || err?.error?.message || '';
          const display = errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg;
          this.snackbarService.showError(display);
          this.isSubmitting.set(false);
        }
      });
  }

  private getTableColumns(): TableColumn<RejectedComponentDisplay>[] {
    return [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'productCode', header: 'Product Code', sortable: false },
      { key: 'rejectReasonCode', header: 'Reject Code', sortable: false },
      { key: 'catalogNumber', header: 'Catalog Number', sortable: false, valueFormatter: (v) => v || '-' },
      { key: 'verifyProduct', header: 'Verify Product', sortable: false, valueFormatter: (v) => v || '-' },
      { key: 'verifyUnitId', header: 'Verify Unit ID', sortable: false, valueFormatter: (v) => v || '-' },
      { key: 'label', header: 'Label', sortable: false, valueFormatter: (v) => v || '-' }
    ];
  }

  private updateTableConfig(): void {
    const count = this.rejectedComponents().length;
    this.currentPageIndex.set(0);
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.getTableColumns(),
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
        totalRecords: count
      }
    };
  }

  onTablePageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
        totalRecords: this.rejectedComponents().length
      }
    };
  }

  private setupProductCodeSearch(): void {
    this.productCodeControl.valueChanges
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        const search = (value || '').toLowerCase().trim();
        if (!search) {
          this.filteredProductCodes.set(this.productCodes());
        } else {
          const filtered = this.productCodes().filter(p =>
            p.productCode?.toLowerCase().includes(search)
          );
          // Always show all options if no match found (user is typing a new product code)
          this.filteredProductCodes.set(filtered.length > 0 ? filtered : this.productCodes());
        }
      });
  }

  private setupRejectCodeSearch(): void {
    this.rejectCodeSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const search = (this.rejectCodeSearchControl.value || '').toLowerCase().trim();
        if (!search) {
          this.filteredRejectReasons.set(this.rejectReasons());
        } else {
          this.filteredRejectReasons.set(
            this.rejectReasons().filter(r =>
              r.code?.toLowerCase().includes(search) ||
              r.description?.toLowerCase().includes(search)
            )
          );
        }
      });
  }

  private setupCatalogNumberSearch(): void {
    this.catalogNumberSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const search = (this.catalogNumberSearchControl.value || '').toLowerCase().trim();
        if (!search) {
          this.filteredCatalogNumbers.set(this.catalogNumbers());
        } else {
          this.filteredCatalogNumbers.set(
            this.catalogNumbers().filter(c =>
              c.catalogNumber?.toLowerCase().includes(search)
            )
          );
        }
      });
  }

  private getFormattedUnitId(): string {
    const raw = this.manualUnitId();
    return this.barcodeType() === 'CODE128'
      ? UnitIdFormatUtility.formatCode128(raw)
      : raw;
  }

  private normalizeUnitId(value: string): string {
    return value.replace(/^=/, '').replace(/[-\s]/g, '').toUpperCase();
  }

  // CPIREJ Oracle Forms FMB error codes and messages (from cpirej-oracle-forms-analysis.md Section 12)
  private readonly oracleErrors: Record<string, string> = {
    '0005': 'Component(s) have been rejected',
    '0039': 'Primary bag for this unit has not been checked in',
    '0063': 'Collection date not present - initial check-in not done',
    '0065': 'Component cannot be defined until bleed start time is entered',
    '0135': 'No more components can be produced from this unit and bag ID',
    '0137': 'Illogical combination based on previous components produced',
    '0151': 'This component does not exist',
    '0155': 'A component of the same product type has already been made',
    '0177': 'Unit completely rejected',
    '0230': 'Unsuccessful commit... transaction not saved',
    '0239': 'Chapter is already assigned to the user',
    '0241': 'Unit/Component not located in the current warehouse',
    '0357': 'Invalid life span',
    '1125': 'Invalid bag ID',
    '1180': 'Invalid function',
    '1202': 'Invalid reject code',
    '1205': 'Invalid product code',
    '1508': 'This is not a valid recruiter ID',
    '4305': 'Consignee ID is different',
    '4306': 'Invalid Product code for a non-pheresis unit',
    '4318': 'This product cannot be defined',
    '4319': 'CRYO cannot be defined and rejected in this screen',
    '5265': 'NONE product code cannot be rejected more than once',
    '5308': 'Invalid Quantity, Must be zero or greater',
    '8010': 'TRANSACTION COMMITTED',
    '9032': 'Invalid Printer or Printer not selected',
    '9719': 'Invalid catalog number',
    '9727': 'Error in selecting default product code / product formula',
    '9728': 'Product verification failed, mismatch in product codes',
    '9731': 'Error in selecting component label for the specified product',
    '9741': 'Insufficient information,label cannot be printed',
    '9812': 'Invalid Scan format for Catalog Number',
    '9935': 'Invalid intended use code.'
  };

  private showOracleError(code: string): void {
    const msg = this.oracleErrors[code] || 'An error occurred';
    this.snackbarService.showError(`Error ${code}: ${msg}`);
  }

  private showOracleSuccess(code: string): void {
    const msg = this.oracleErrors[code] || 'Operation completed successfully';
    this.snackbarService.showSuccess(`${code}: ${msg}`);
  }
}
