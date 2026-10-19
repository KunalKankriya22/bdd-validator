import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormControl,
  ValidatorFn,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, Observable, of, firstValueFrom, interval } from 'rxjs';
import { takeUntil, debounceTime, map, catchError, switchMap } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '../../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '../../../../../shared/components/data-table/data-table';
import { DataTableConfig } from '../../../../../shared/interfaces/data-table.interface';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { MenuService } from '../../../../../shared/services/menu.service';
import { LoginService } from '../../../../../shared/services/login.service';
import { ChapterTimezoneService } from '../../../../../shared/services/chapter-timezone.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '../../../../../shared/date/date-formats';
import { UnitIdFieldComponent, UnitValidationResponse } from '../../../../../shared/components/unit-id-field';
import { MessageDialog } from '../../../../../shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '../../../../../shared/interfaces/auth.interface';
import { CryoProductionService } from './services/cryo-production.service';
import {
  CreateCryoProductionDto,
  UpdateCryoProductionDto,
  ThawMethodDto,
  CentrifugeLookupDto,
  ProductCodeOption,
  UnitValidationRequestDto,
  UnitValidationResultDto,
  AutoSelectProductRequestDto,
  CryoFreezeTimeRangeDto,
  OldProductLovDto
} from './models/cryo-production.model';

/**
 * Entry and Offline CRYO Separation/Freeze Details Component (CRYO2)
 *
 * Purpose: Add details to CRYO destined units previously scanned for CRYO processing for ISBT units
 *
 * Features:
 * - Dual workflow: Separation and Freeze details entry
 * - Unit ID scanning with barcode support
 * - Auto-population of destined, catalog no, and product codes
 * - Temperature validation (-99 to 99°C)
 * - Real-time table display of entered units
 * - Reprint label functionality
 * - Define plasma action
 *
 * Workflows:
 * 1. Separation: Thaw Method + Temperature → Scan Unit → Verify Product Code
 * 2. Freeze: Scan Unit (already separated) → Freeze Time + CRYO Acceptable
 */
@Component({
  selector: 'app-entry-offline-cryo-details',
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
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './entry-offline-cryo-details.html',
  styleUrl: './entry-offline-cryo-details.scss',
})
export class EntryOfflineCryoDetailsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `entry-offline-cryo-details-${EntryOfflineCryoDetailsComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // ViewChild for Unit ID field
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly loginService = inject(LoginService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly cryoProductionService = inject(CryoProductionService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Cleanup subject
  private readonly destroy$ = new Subject<void>();

  // Subject to control separation time auto-update
  private readonly separationTimeUpdate$ = new Subject<boolean>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EntryOfflineCryoDetails].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  // Filter form (top section)
  filterForm!: FormGroup;

  // Unit entry form (middle section)
  unitForm!: FormGroup;

  // Workflow state signals
  workflowMode = signal<'separation' | 'freeze' | 'none'>('none'); // Start in none mode
  isLoading = signal<boolean>(false);
  isUnitValidated = signal<boolean>(false);
  isFormDirty = signal<boolean>(false); // Track if any form field has been touched
  validationResult = signal<UnitValidationResultDto | null>(null);
  validationWarnings = signal<{ errorCode: string; message: string }[]>([]);

  // Display-only fields for freeze mode (loaded from existing separation data)
  displaySeparationData = signal<{
    thawMethod?: string;
    thawMethodDesc?: string;
    temperature?: number;
    centrifugeId?: string;
    separationDateTime?: string;
  } | null>(null);

  // Table data signals
  tableData = signal<CryoUnitEntry[]>([]);
  tableConfig!: DataTableConfig<CryoUnitEntry>;

  // Table pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(25);
  pageSizeOptions = [10, 25, 50, 100];

  // LOV data for dropdowns - loaded from API
  thawMethodOptions = signal<ThawMethodDto[]>([]);
  centrifugeOptions = signal<CentrifugeLookupDto[]>([]);

  // Temperature range for selected thaw method (extracted from thawMethodOptions)
  currentTempRange = signal<{ minTemp: number; maxTemp: number } | null>(null);

  // FMB: Freeze time ranges from valid_cryo_methods (for CRWS/CRSE client-side feedback)
  currentFreezeTimeRanges = signal<CryoFreezeTimeRangeDto | null>(null);

  // FMB: Intended use display (CALCULATE_INTENTED_USE)
  currentIntendedUse = signal<string | null>(null);
  currentIntendedUseDesc = signal<string | null>(null);

  // FMB: Old products LOV (DUFFP components for this unit)
  oldProductOptions = signal<OldProductLovDto[]>([]);

  // Static dropdowns (not in API)
  cryoAcceptableOptions = signal<YesNoOption[]>([
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' },
  ]);

  productCodeOptions = signal<ProductCodeOption[]>([]);

  ngOnInit(): void {
    this.initializeForms();
    this.initializeTableConfig();
    this.setupFormListeners();
    this.setupSeparationTimeAutoUpdate();
    this.loadThawMethods();
    this.loadCentrifuges();
    // ✅ CRITICAL #3 - Chapter timezone is available via getChapterLocalDate() synchronously
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.separationTimeUpdate$.complete();
  }

  private showSuccessSnackbar(message: string): void {
    this.snackBar.dismiss();
    const ref = this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 8000,
      panelClass: ['success-snackbar', 'cryo-details-snackbar'],
    });
    ref.onAction().subscribe(() => ref.dismiss());
  }

  /**
   * Initialize filter and unit entry forms
   */
  private initializeForms(): void {
    // Filter form (top section)
    this.filterForm = this.fb.group({
      thawMethod: [null],
      temperature: [{ value: null, disabled: true }, [this.requiredValidator(), this.temperatureRangeValidator()]],
      centrifugeId: [{ value: null, disabled: true }],
      separationDateTime: [{ value: null, disabled: true }, [this.dateTimeFormatValidator(), this.sepDateTimeVsCollDateValidator()]],
    });

    // Unit entry form (middle section)
    // Note: Unit ID is now handled by UnitIdFieldComponent, not in the form
    // Initially start in freeze mode with Freeze Time and CRYO Acceptable required
    this.unitForm = this.fb.group({
      destined: [{ value: '', disabled: true }],
      catalogNo: [{ value: '', disabled: true }],
      cryoProductCode: [{ value: '', disabled: true }],
      verifyProductCode: new FormControl(null, { validators: [this.productCodeVerificationValidator()], updateOn: 'blur' }),
      freezeTime: [null, [this.dateTimeFormatValidator(), this.freezeTimeVsSepTimeValidator()]],
      cryoAcceptable: [null, [this.requiredValidator(), this.cryoOkFlagValidator()]],
    }, {
      validators: [this.conditionalFreezeTimeValidator()]
    });
  }

  /**
   * Initialize data table configuration
   */
  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [],
      showPagination: true,
      stickyHeader: true,
      showTableOnEmpty: true,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Enter details to begin.',
      noDataIcon: 'search',
      pagination: {
        pageSize: this.pageSize(),
        pageIndex: this.currentPage(),
        totalRecords: 0,
        pageSizeOptions: this.pageSizeOptions,
        showFirstLastButtons: true,
      },
    };

    // Update columns dynamically based on data count
    this.updateTableColumns();
  }

  private updateTableColumns(): void {
    const mode = this.workflowMode();

    const columns = [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
      },
      {
        key: 'destined',
        header: 'Destined',
      },
      {
        key: 'catalogNo',
        header: 'Catalog No',
      },
      {
        key: 'cryoProductCode',
        header: 'Cryo Product Code',
      },
    ];

    // Add workflow-specific columns based on current mode
    // If mode is 'none', check if table has data and determine from data
    if (mode === 'separation') {
      columns.push({
        key: 'verifyProductCode',
        header: 'Verify Product Code',
      });
    } else if (mode === 'freeze') {
      columns.push({
        key: 'freezeTime',
        header: 'Freeze Time',
      });
      columns.push({
        key: 'cryoAcceptable',
        header: 'CRYO Acceptable?',
      });
    } else if (mode === 'none' && this.tableData().length > 0) {
      // If mode is 'none' but table has data, determine columns from first row
      const firstRow = this.tableData()[0];
      if (firstRow.verifyProductCode) {
        columns.push({
          key: 'verifyProductCode',
          header: 'Verify Product Code',
        });
      }
      if (firstRow.freezeTime || firstRow.cryoAcceptable) {
        columns.push({
          key: 'freezeTime',
          header: 'Freeze Time',
        });
        columns.push({
          key: 'cryoAcceptable',
          header: 'CRYO Acceptable?',
        });
      }
    }

    this.tableConfig = {
      ...this.tableConfig,
      columns,
      showPagination: true,
      pagination: {
        pageSize: this.pageSize(),
        pageIndex: this.currentPage(),
        totalRecords: this.tableData().length || this.pageSize(),
        pageSizeOptions: this.pageSizeOptions,
        showFirstLastButtons: true,
      },
    };
  }

  /**
   * Get current chapter time using header's timezone calculation
   * Reuses the timezone offset from HeaderService (same as header display)
   * @returns Current chapter local date/time as Moment object
   */
  private getCurrentChapterTime(): moment.Moment {
    const timeZone = this.headerService.getCurrentChapterTimezone();
    if (!timeZone) {
      return moment(); // Fallback to system time
    }

    const now = new Date();
    const sign = timeZone[0] === '+' ? 1 : -1;
    const [hh, mm] = timeZone.slice(1).split(':').map(Number);
    const chapterLocalTime = new Date(now.getTime() + sign * (hh * 60 + mm) * 60000);

    // Convert to moment using UTC to preserve the calculated time
    return moment.utc(chapterLocalTime);
  }

  /**
   * Setup automatic separation time update using RxJS interval
   * Updates the separation time field every second when enabled
   */
  private setupSeparationTimeAutoUpdate(): void {
    this.separationTimeUpdate$
      .pipe(
        switchMap(isEnabled => {
          if (isEnabled) {
            // Emit every second when enabled
            return interval(1000);
          } else {
            // Stop emitting when disabled
            return of();
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Update separation time to current chapter time
        if (this.workflowMode() === 'separation' && this.filterForm.get('centrifugeId')?.value) {
          // Use header's timezone calculation for current chapter time
          const chapterLocalDateTime = this.getCurrentChapterTime();
          const formattedDate = chapterLocalDateTime.format('DD-MMM-YYYY HH:mm'); // Don't use toUpperCase() - moment strict parsing expects title case

          const currentValue = this.filterForm.get('separationDateTime')?.value;
          if (currentValue !== formattedDate) {
            this.filterForm.patchValue({
              separationDateTime: formattedDate
            }, { emitEvent: false });
          }
        }
      });
  }

  /**
   * Setup form value change listeners to determine workflow mode
   */
  private setupFormListeners(): void {
    // Listen to filter form changes to determine workflow
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.determineWorkflowMode(values);
        // Mark form as dirty when user enters any value
        this.isFormDirty.set(true);
      });

    // Listen to thaw method changes to load temperature and freeze time ranges from API
    this.filterForm.get('thawMethod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedThawMethod) => {
        const tempControl = this.filterForm.get('temperature');
        const centrifugeControl = this.filterForm.get('centrifugeId');
        const sepDateTimeControl = this.filterForm.get('separationDateTime');

        if (selectedThawMethod) {
          tempControl?.enable({ emitEvent: false });
          centrifugeControl?.enable({ emitEvent: false });
          sepDateTimeControl?.enable({ emitEvent: false });

          // Load temperature ranges from dedicated API
          this.loadTemperatureRanges(selectedThawMethod);

          // Load freeze time ranges from dedicated API
          this.loadFreezeTimeRanges(selectedThawMethod);

          // Also extract from already-loaded data as fallback
          const method = this.thawMethodOptions().find(m => m.thawMethod === selectedThawMethod);

          if (method) {
            // Fallback: Extract min/max temps from the thaw method data
            if (!this.currentTempRange()) {
              this.currentTempRange.set({
                minTemp: method.minTemp,
                maxTemp: method.maxTemp
              });
            }

            // Re-validate temperature with new ranges
            tempControl?.updateValueAndValidity();
          }
        } else {
          tempControl?.disable({ emitEvent: false });
          centrifugeControl?.disable({ emitEvent: false });
          sepDateTimeControl?.disable({ emitEvent: false });
          tempControl?.reset(null, { emitEvent: false });
          centrifugeControl?.reset(null, { emitEvent: false });
          sepDateTimeControl?.reset(null, { emitEvent: false });
          this.currentTempRange.set(null);
        }
      });

    // FMB: CENTRIFUGE_ID KEY-NEXT-ITEM — auto-populate sep_date_time with chapter local time
    // after centrifuge is selected (not when thaw method is selected)
    this.filterForm.get('centrifugeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((centrifugeId) => {
        if (centrifugeId && this.workflowMode() === 'separation') {
          // Start auto-updating separation time
          this.separationTimeUpdate$.next(true);
        } else {
          // Stop auto-updating when centrifuge is cleared
          this.separationTimeUpdate$.next(false);
        }
      });

    // Listen to catalog number changes
    this.unitForm.get('catalogNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((catalogNo) => {
        if (catalogNo && this.workflowMode() === 'separation') {
          // Reload product variants when catalog changes
          this.loadProductVariantsForDropdown(catalogNo);
        }
      });

    // Listen to verify product code changes
    this.unitForm.get('verifyProductCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        const unitId = this.unitIdField?.parsedUnitId;
        if (productCode && unitId && this.workflowMode() === 'separation') {
          // Reload intended use when product code changes
          this.loadIntendedUse(unitId, productCode);
        }
      });

    // Also listen to unit form changes to track dirty state
    this.unitForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isFormDirty.set(true);
      });

    // Listen to CRYO Acceptable changes to trigger auto-save in freeze mode
    this.unitForm.get('cryoAcceptable')?.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        // Trigger auto-save when Y or N is selected in freeze mode
        if ((value === 'Y' || value === 'N') && this.workflowMode() === 'freeze' && !this.isLoading()) {
          this.autoSave();
        }
      });

    this.unitForm.statusChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.canCommit() && this.isFormDirty()) {
          this.autoSave();
        }
      });
  }

  /**
   * Determine workflow mode based on filter inputs
   * FMB Logic:
   * - Flow 1 (Separation): User selects THAW_METHOD first → separation mode
   * - Flow 2 (Freeze): User enters UNIT_ID without thaw method → freeze mode
   */
  private determineWorkflowMode(filterValues: any): void {
    const hasThawMethod = !!filterValues.thawMethod;

    // Only switch to separation mode if thaw method is explicitly selected by user
    // Don't switch if thaw method is loaded from existing data in freeze mode
    if (hasThawMethod && this.workflowMode() !== 'freeze') {
      this.workflowMode.set('separation');
      this.enableSeparationFields();
      // Clear any display separation data from freeze mode
      this.displaySeparationData.set(null);
      // FMB: Sep date/time is NOT set here — it's set after centrifuge selection
    } else if (!hasThawMethod && this.workflowMode() !== 'freeze') {
      // No workflow selected yet - remain in 'none' mode
      // Freeze mode is only triggered by unit validation (see onUnitValidated)
      this.workflowMode.set('none');
    }

    // Update table columns when mode changes
    this.updateTableColumns();
  }

  /**
   * Enable fields for separation workflow
   */
  private enableSeparationFields(): void {
    const verifyProductCodeControl = this.unitForm.get('verifyProductCode');
    const freezeTimeControl = this.unitForm.get('freezeTime');
    const cryoAcceptableControl = this.unitForm.get('cryoAcceptable');

    // Enable and require Verify Product Code
    verifyProductCodeControl?.enable();
    verifyProductCodeControl?.setValidators([this.requiredValidator()]);
    verifyProductCodeControl?.updateValueAndValidity();

    // DISABLE Freeze fields in separation mode (as per Figma)
    freezeTimeControl?.disable();
    freezeTimeControl?.clearValidators();
    freezeTimeControl?.updateValueAndValidity();

    cryoAcceptableControl?.disable();
    cryoAcceptableControl?.clearValidators();
    cryoAcceptableControl?.updateValueAndValidity();
  }

  /**
   * Enable fields for freeze workflow
   */
  private enableFreezeFields(): void {
    const verifyProductCodeControl = this.unitForm.get('verifyProductCode');
    const freezeTimeControl = this.unitForm.get('freezeTime');
    const cryoAcceptableControl = this.unitForm.get('cryoAcceptable');

    // Disable Verify Product Code in freeze mode (remains as input field, just disabled)
    verifyProductCodeControl?.disable();
    verifyProductCodeControl?.clearValidators();
    verifyProductCodeControl?.updateValueAndValidity();

    // ENABLE and require Freeze fields (mandatory in freeze mode)
    freezeTimeControl?.enable();
    freezeTimeControl?.setValidators([this.dateTimeFormatValidator(), this.freezeTimeVsSepTimeValidator()]);
    freezeTimeControl?.updateValueAndValidity();

    cryoAcceptableControl?.enable();
    cryoAcceptableControl?.setValidators([this.requiredValidator(), this.cryoOkFlagValidator()]);
    cryoAcceptableControl?.updateValueAndValidity();
  }

  /**
   * Required field validator
   */
  private requiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value === '') {
        return { required: true };
      }
      return null;
    };
  }

  /**
   * Load active thaw methods from API
   */
  private loadThawMethods(): void {
    this.cryoProductionService
      .getActiveThawMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (methods) => {
          this.thawMethodOptions.set(methods);
        },
        error: (error) => {

          this.snackbarService.showError('Failed to load thaw methods');
        },
      });
  }

  /**
   * Load active centrifuges from API
   */
  private loadCentrifuges(): void {
    this.cryoProductionService
      .getActiveCentrifuges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (centrifuges) => {
          this.centrifugeOptions.set(centrifuges);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load centrifuges');
        },
      });
  }

  /**
   * Load temperature ranges for selected thaw method
   */
  private loadTemperatureRanges(thawMethod: string): void {
    this.cryoProductionService
      .getTemperatureRanges(thawMethod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ranges) => {
          this.currentTempRange.set({
            minTemp: ranges.minTemp,
            maxTemp: ranges.maxTemp
          });
          // Re-validate temperature field with new ranges
          this.filterForm.get('temperature')?.updateValueAndValidity();
        },
        error: (error) => {
          // Don't show error to user - fallback to ranges from thawMethodOptions
        },
      });
  }

  /**
   * Load freeze time ranges for selected thaw method
   */
  private loadFreezeTimeRanges(thawMethod: string): void {
    this.cryoProductionService
      .getFreezeTimeRanges(thawMethod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ranges) => {
          this.currentFreezeTimeRanges.set(ranges);
          // Re-validate freeze time field with new ranges
          this.unitForm.get('freezeTime')?.updateValueAndValidity();
        },
        error: (error) => {
          // Don't show error to user - validation will use basic checks
        },
      });
  }

  /**
   * Handle unit ID validation success from shared component
   * FMB Logic:
   * - If THAW_METHOD already selected → Separation workflow (user selected thaw first)
   * - If NO THAW_METHOD selected → Determine based on unit status
   *   - If unit already separated (has sepTime) → Freeze workflow
   *   - If unit not separated → Separation workflow
   */
  onUnitValidated(data: UnitValidationResponse): void {
    // Determine workflow mode based on current state
    const currentMode = this.workflowMode();
    const hasThawMethodSelected = !!this.filterForm.get('thawMethod')?.value;

    // Now perform CRYO-specific validation via API
    const validationRequest: UnitValidationRequestDto = {
      unitId: data.parsedUnitId,
      workflowMode: currentMode !== 'none' ? currentMode : undefined
    };

    this.isLoading.set(true);

    this.cryoProductionService
      .validateUnit(validationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validationResult) => {
          if (!validationResult.isValid) {
            // Show validation errors under the Unit ID field
            const errors = validationResult.validationErrors || [];

            if (errors.length > 0) {
              // Get the first error (or combine if multiple)
              const firstError = errors[0];
              const errorMessage = firstError.message;

              // Set error on Unit ID field component
              this.unitIdField.setError(errorMessage);

              // Disable verify product code field on validation error
              this.unitForm.get('verifyProductCode')?.disable();
            }

            this.isLoading.set(false);
            return;
          }

          this.validationResult.set(validationResult);
          this.validationWarnings.set(validationResult.validationWarnings || []);
          this.isUnitValidated.set(true);

          // Determine workflow mode based on FMB logic
          let workflowMode: 'separation' | 'freeze';

          if (hasThawMethodSelected) {
            // FLOW 1: User selected THAW_METHOD first → Separation workflow
            workflowMode = 'separation';
          } else if (validationResult.sepTime || validationResult.hasFreeze) {
            // FLOW 2: Unit already separated → Freeze workflow
            workflowMode = 'freeze';
          } else {
            // Unit not separated and no thaw method → Default to separation workflow
            workflowMode = 'separation';
          }

          // Set the determined workflow mode
          this.workflowMode.set(workflowMode);

          // ✅ Load catalog numbers for all workflows
          this.loadCatalogNumbers(data.parsedUnitId, 'CRYO').subscribe();

          if (workflowMode === 'freeze') {
            // FREEZE WORKFLOW: Load existing separation data as display-only
            this.handleFreezeWorkflow(validationResult);
          } else {
            // SEPARATION WORKFLOW: Load unit details and auto-populate fields
            this.handleSeparationWorkflow(data.parsedUnitId, validationResult);

            // Load old products for dropdown in separation mode
            this.loadOldProducts(data.parsedUnitId);

            // Re-enable verify product code field on successful validation in separation mode
            const verifyProductCodeControl = this.unitForm.get('verifyProductCode');
            verifyProductCodeControl?.enable();
            verifyProductCodeControl?.updateValueAndValidity();
          }
        },
        error: (error) => {
          // Extract validation errors from API response
          let errorMessage = 'Unit validation failed';

          if (error.error?.data?.validationErrors && error.error.data.validationErrors.length > 0) {
            // Get the first validation error to display under the field
            const firstError = error.error.data.validationErrors[0];
            errorMessage = firstError.message;

            // Set error on Unit ID field component
            this.unitIdField.setError(errorMessage);

            // Disable verify product code field on validation error
            this.unitForm.get('verifyProductCode')?.disable();
          } else if (error.error?.message) {
            // Fallback to main error message - show in snackbar for non-validation errors
            errorMessage = error.error.message;
            this.snackbarService.showError(errorMessage);
          } else {
            this.snackbarService.showError(errorMessage);
          }

          this.isLoading.set(false);
        },
      });
  }

  /**
   * Handle freeze workflow validation and data loading
   * FMB Logic: Load existing separation data as READ-ONLY display (not in form fields)
   */
  private handleFreezeWorkflow(validationResult: any): void {
    // Check if unit has been separated (has sepTime or separationType)
    const hasSeparation = validationResult.sepTime || validationResult.separationType;

    if (!hasSeparation) {
      this.snackbarService.showError('Please complete separation first before freezing this unit');
      this.isLoading.set(false);
      this.onUnitCleared();
      return;
    }

    // Enable freeze fields
    this.enableFreezeFields();

    // Auto-populate unit form fields
    // FMB Rule: freeze_time must be < current time (strictly less, not equal)
    // Subtract 1 minute to ensure freeze time is always in the past
    const freezeTime = this.getCurrentChapterTime().subtract(1, 'minute').format('DD-MMM-YYYY HH:mm');

    this.unitForm.patchValue({
      destined: validationResult.oldProductCode,
      catalogNo: validationResult.catalogNumber || '',
      cryoProductCode: validationResult.newProductCode,
      verifyProductCode: validationResult.newProductCode, // ✅ Pre-fill and disable in freeze mode
      freezeTime: freezeTime, // Auto-populate with current time minus 1 minute (FMB requires < current time)
      cryoAcceptable: null,
    });

    // Disable verify product code in freeze mode (pre-filled, not editable)
    this.unitForm.get('verifyProductCode')?.disable();

    // Store separation data for READ-ONLY display (not in filter form)
    if (validationResult.thawMethod) {
      this.displaySeparationData.set({
        thawMethod: validationResult.thawMethod,
        thawMethodDesc: validationResult.thawMethodDesc,
        temperature: validationResult.thawTemperature,
        centrifugeId: validationResult.centrifugeId || '-',
        separationDateTime: validationResult.sepTime
          ? this.chapterTimezoneService.convertGmtToLocal(moment.utc(validationResult.sepTime)).format('DD-MMM-YYYY HH:mm').toUpperCase()
          : undefined,
      });
    }

    // Keep filter form EMPTY and DISABLED in freeze mode
    // Do NOT populate filter form - it should remain empty
    this.filterForm.disable({ emitEvent: false });

    this.isLoading.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Handle separation workflow validation and data loading
   */
  private handleSeparationWorkflow(unitId: string, validationResult: any): void {
    // Populate unit information from validation result
    // Backend now derives cryo product code via catalog → anticoagulant → formula chain
    this.unitForm.patchValue({
      destined: validationResult.oldProductCode,
      catalogNo: validationResult.catalogNumber || '',
      cryoProductCode: validationResult.newProductCode || '',
    });

    // If backend already derived the product code, we're done
    if (validationResult.newProductCode) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    // Fallback: try auto-select product API if backend didn't derive it
    const catalogFromValidation = validationResult.catalogNumber;

    if (catalogFromValidation) {
      this.proceedWithAutoSelect(unitId, validationResult, catalogFromValidation);
    } else {
      this.loadCatalogNumbers(unitId, 'CRYO').subscribe((loadedCatalog) => {
        const finalCatalogNo = loadedCatalog || this.unitForm.get('catalogNo')?.value;
        if (finalCatalogNo) {
          this.proceedWithAutoSelect(unitId, validationResult, finalCatalogNo);
        } else {
          this.isLoading.set(false);
        }
      });
    }
  }

  private proceedWithAutoSelect(unitId: string, validationResult: any, catalogNumber: string): void {
    if (!validationResult.oldProductCode || !catalogNumber) {
      if (catalogNumber) {
        this.loadProductVariantsForDropdown(catalogNumber);
      }
      this.isLoading.set(false);
      return;
    }

    this.callAutoSelectProduct(unitId, validationResult, catalogNumber);
  }

  private callAutoSelectProduct(unitId: string, validationResult: any, catalogNumber: string): void {

    const autoSelectRequest: AutoSelectProductRequestDto = {
      unitId: unitId,
      collDate: validationResult.collDate!, // ✅ Required field
      oldProductCode: validationResult.oldProductCode!,
      catalogNumber: catalogNumber, // ✅ Use catalogNumber from form field
      antiCode: validationResult.anticoagulant, // ✅ Optional - from validation
      volumeModified: validationResult.volume, // ✅ Optional - from validation
      calculateIntendedUse: true // ✅ NEW - Enable intended use calculation
    };

    this.cryoProductionService
      .autoSelectProduct(autoSelectRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productSelection) => {
          // ✅ NEW - Check for error codes in response (9732, 9935)
          if (productSelection.errorCode) {
            const errorMessage = productSelection.errorMessage || 'Auto-select product failed';

            switch (productSelection.errorCode) {
              case '9732':
                // No core conditions found for product/catalog combination
                this.snackbarService.showError(`Error ${productSelection.errorCode}: ${errorMessage}`);
                // Show product selection dialog for manual selection
                this.loadProductVariantsForDropdown(catalogNumber);
                break;

              case '9935':
                // Invalid intended use code for selected product
                this.snackbarService.showError(`Error ${productSelection.errorCode}: ${errorMessage}`);
                // User needs to select different product
                this.loadProductVariantsForDropdown(catalogNumber);
                break;

              default:
                // Unknown error code
                this.snackbarService.showError(`Error ${productSelection.errorCode}: ${errorMessage}`);
                this.loadProductVariantsForDropdown(catalogNumber);
            }

            this.isLoading.set(false);
            this.cdr.markForCheck();
            return;
          }

          // Populate auto-selected product
          // Use newProductCode (new field) or fall back to selectedProductCode (legacy)
          const selectedProduct = productSelection.newProductCode || productSelection.selectedProductCode;

          this.unitForm.patchValue({
            cryoProductCode: selectedProduct,
            verifyProductCode: null, // FMB: Must start blank — user scans printed label to verify (Error 9728)
          });

          // Step 4: Load product variants for the Verify Product Code dropdown
          this.loadProductVariantsForDropdown(catalogNumber);

          // Step 5: Load intended use for auto-selected product
          if (selectedProduct) {
            this.loadIntendedUse(unitId, selectedProduct);
          }

          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (error) => {

          // ✅ NEW - Extract error code from API error response
          let errorMessage = 'Failed to auto-select product';
          let errorCode: string | undefined;

          if (error.error?.errorCode) {
            errorCode = error.error.errorCode;
            errorMessage = error.error.message || errorMessage;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          // Display error with code if available
          if (errorCode) {
            this.snackbarService.showError(`Error ${errorCode}: ${errorMessage}`);
          } else {
            this.snackbarService.showError(errorMessage);
          }

          // Continue even if auto-select fails - user can manually select
          this.loadProductVariantsForDropdown(catalogNumber);
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Load product variants for Verify Product Code dropdown
   */
  private loadProductVariantsForDropdown(catalogNumber: string): void {
    if (!catalogNumber) return;

    this.cryoProductionService
      .getProductVariants(catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (variants) => {
          const options: ProductCodeOption[] = variants.map(v => ({
            code: v.productCode,
            description: v.productDesc
          }));
          this.productCodeOptions.set(options);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load product codes');
        },
      });
  }

  /**
   * Load old products (DUFFP) for the unit
   */
  private loadOldProducts(unitId: string): void {
    if (!unitId) return;

    this.cryoProductionService
      .getOldProducts(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.oldProductOptions.set(products);
          // FMB: Auto-populate destined field if exactly one DUFFP product
          if (products.length === 1) {
            this.unitForm.patchValue({ destined: products[0].productCode }, { emitEvent: false });
          }
        },
        error: (error) => {
          // Don't show error to user - this is optional data
        },
      });
  }

  /**
   * Load catalog numbers for the unit and product type
   */
  private loadCatalogNumbers(unitId: string, productType: string): Observable<string | null> {
    if (!unitId || !productType) {
      return of(null);
    }

    return this.cryoProductionService
      .getCatalogNumbers(unitId, productType)
      .pipe(
        takeUntil(this.destroy$),
        map((catalogs: any[]) => {

          // ✅ Map first catalog number to Catalog No field
          if (catalogs && catalogs.length > 0) {
            const firstCatalog = catalogs[0].catalogNumber;

            // Update form field with first catalog number
            this.unitForm.patchValue({
              catalogNo: firstCatalog
            }, { emitEvent: false });

            return firstCatalog;
          }
          return null;
        }),
        catchError((error: any) => {
          return of(null);
        })
      );
  }

  /**
   * Load intended use for selected product
   */
  private loadIntendedUse(unitId: string, productCode: string): void {
    if (!unitId || !productCode) return;

    this.cryoProductionService
      .getIntendedUse(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentIntendedUse.set(response.intendedUse);
          this.currentIntendedUseDesc.set(response.intendedUseDesc);
        },
        error: (error) => {
          // Don't show error to user - this is informational data
        },
      });
  }

  /**
   * Handle unit ID field cleared
   */
  onUnitCleared(): void {
    // Mark unit as not validated to grey out readonly fields
    this.isUnitValidated.set(false);

    this.validationResult.set(null);
    this.validationWarnings.set([]);
    this.currentIntendedUse.set(null);
    this.currentIntendedUseDesc.set(null);
    this.oldProductOptions.set([]);
    this.displaySeparationData.set(null);

    // Clear auto-populated fields when unit ID is cleared
    this.unitForm.patchValue({
      destined: '',
      catalogNo: '',
      cryoProductCode: '',
      verifyProductCode: null,
      freezeTime: null,
      cryoAcceptable: null,
    });

    // Re-enable filter form if it was disabled in freeze mode
    if (this.workflowMode() === 'freeze') {
      this.filterForm.enable({ emitEvent: false });
      this.filterForm.get('temperature')?.disable({ emitEvent: false });
      this.filterForm.get('centrifugeId')?.disable({ emitEvent: false });
      this.filterForm.get('separationDateTime')?.disable({ emitEvent: false });
    }

    // Reset workflow mode if no thaw method selected
    if (!this.filterForm.get('thawMethod')?.value) {
      this.workflowMode.set('none');
    }
  }

  /**
   * Clear all filter inputs
   */
  onClearAllFilters(): void {
    this.filterForm.reset();
    this.filterForm.enable({ emitEvent: false });
    this.filterForm.get('temperature')?.disable({ emitEvent: false });
    this.filterForm.get('centrifugeId')?.disable({ emitEvent: false });
    this.filterForm.get('separationDateTime')?.disable({ emitEvent: false });
    this.workflowMode.set('none'); // Reset to none mode (no workflow selected)
    this.displaySeparationData.set(null); // Clear display data
    // Stop auto-updating separation time when filters are cleared
    this.separationTimeUpdate$.next(false);
    // Clear unit form if no unit is validated
    if (!this.isUnitValidated()) {
      this.onClearAllUnit();
    }
    // Don't reset isFormDirty - keep it true if unit form still has values
  }

  /**
   * Check if filter form has any values (for CLEAR ALL button state)
   */
  hasFilterValues(): boolean {
    const values = this.filterForm.value;
    return Object.values(values).some(v => v !== null && v !== undefined && v !== '');
  }

  /**
   * Check if unit form has any values (for CLEAR ALL button state)
   */
  hasUnitValues(): boolean {
    // Check if unit ID field has value or any form field has value
    const hasUnitId = !!this.unitIdField?.parsedUnitId;
    const formValues = this.unitForm.value;
    const hasFormValues = Object.values(formValues).some(v => v !== null && v !== undefined && v !== '');
    return hasUnitId || hasFormValues;
  }

  /**
   * Determine if table should be visible
   * Rules:
   * 1. If Thaw Method entered → Show separation table (even if empty)
   * 2. If Unit ID entered → Show freeze table (even if empty)
   * 3. If has data → Show table with data
   * 4. Otherwise → Show empty state
   */
  shouldShowTable(): boolean {
    // Show table if has data
    if (this.tableData().length > 0) {
      return true;
    }

    // Show separation table if Thaw Method is selected
    const hasThawMethod = !!this.filterForm.get('thawMethod')?.value;
    if (hasThawMethod) {
      return true;
    }

    // Show freeze table if Unit ID is entered
    const hasUnitId = !!this.unitIdField?.parsedUnitId;
    if (hasUnitId) {
      return true;
    }

    // Otherwise show empty state
    return false;
  }

  /**
   * Clear unit entry section
   */
  onClearAllUnit(): void {
    this.unitIdField.clear();  // Clear the shared Unit ID component
    this.isUnitValidated.set(false); // Reset validation state
    this.validationResult.set(null);
    this.validationWarnings.set([]);
    this.displaySeparationData.set(null);
    this.currentIntendedUse.set(null);
    this.currentIntendedUseDesc.set(null);
    this.oldProductOptions.set([]);

    this.unitForm.reset();
    this.unitForm.get('destined')?.disable();
    this.unitForm.get('catalogNo')?.disable();
    this.unitForm.get('cryoProductCode')?.disable();

    // Re-enable filter form if it was disabled in freeze mode
    if (this.workflowMode() === 'freeze') {
      this.filterForm.enable({ emitEvent: false });
      this.filterForm.get('temperature')?.disable({ emitEvent: false });
      this.filterForm.get('centrifugeId')?.disable({ emitEvent: false });
      this.filterForm.get('separationDateTime')?.disable({ emitEvent: false });

      // Reset workflow mode to none
      this.workflowMode.set('none');
    }

    // Reset isFormDirty only if filter form is also empty
    if (!this.hasFilterValues()) {
      this.isFormDirty.set(false);
    }
  }

  /**
   * Handle reprint label action
   */
  onReprintLabel(): void {
    const unitId = this.unitIdField.parsedUnitId;
    const productCode = this.unitForm.get('verifyProductCode')?.value;

    if (!unitId) {
      this.snackbarService.showError('No unit selected for reprinting');
      return;
    }

    if (!productCode) {
      this.snackbarService.showError('Please select a product code before reprinting');
      return;
    }

    const request = {
      unitId: unitId,
      productCode: productCode,
      copies: 1
    };

    this.isLoading.set(true);

    this.cryoProductionService
      .reprintLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.showSuccessSnackbar(message);
          this.isLoading.set(false);
        },
        error: (error) => {
          const message = error.error?.message || 'Failed to reprint label';
          this.snackbarService.showError(message);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Handle define plasma action
   * Navigates back to the original screen (Laboratory Functions menu)
   */
  onDefinePlasma(): void {
    // Show summary message
    const count = this.tableData().length;
    this.showSuccessSnackbar(`${count} entries have been successfully saved. Returning to Laboratory Functions.`);

    // Navigate back to Laboratory Functions menu
    // You can adjust this route based on your app structure
    this.router.navigate(['/laboratory-functions']);
  }

  private async autoSave(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    if (this.workflowMode() === 'freeze') {
      const warnings = this.validationWarnings();
      const warningLines = warnings.length > 0
        ? warnings.map(w => `Warn ${w.errorCode}: ${w.message}`).join('\n')
        : 'Warn 9789: Component has the following interdiction: CRYO..';

      const dialogRef = this.dialog.open(MessageDialog, {
        width: '450px',
        autoFocus: false,
        panelClass: 'cryo-warning-dialog',
        data: {
          title: 'WARNING',
          message: warningLines,
          icon: 'warning',
          primaryAction: { label: 'YES', action: 'yes' },
          secondaryAction: { label: 'NO', action: 'no' },
        } as MessageDialogData,
      });

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result !== 'yes') {
        this.onClearAllUnit();
        return;
      }
    }

    this.onCommit();
  }

  /**
   * Add entry to table (commit)
   */
  onCommit(): void {
    // Check if unit ID is valid
    if (!this.unitIdField.isValid) {
      this.snackbarService.showError('Please enter a valid Unit ID');
      return;
    }

    if (this.unitForm.invalid) {
      // Find which field is invalid and show specific error
      const invalidFields: string[] = [];
      const errorMessages: string[] = [];

      Object.keys(this.unitForm.controls).forEach(key => {
        const control = this.unitForm.get(key);
        if (control && control.invalid && control.enabled) {
          invalidFields.push(key);

          // Get specific error message for this field
          if (control.errors) {
            const firstErrorKey = Object.keys(control.errors)[0];
            const errorObj = control.errors[firstErrorKey];
            if (errorObj && errorObj.message) {
              errorMessages.push(`${key}: ${errorObj.message}`);
            }
          }
        }
      });

      // Check form-level errors
      if (this.unitForm.errors) {
        const formErrorKey = Object.keys(this.unitForm.errors)[0];
        const formErrorObj = this.unitForm.errors[formErrorKey];
        if (formErrorObj && formErrorObj.message) {
          errorMessages.push(formErrorObj.message);
        }
      }

      console.error('Invalid fields:', invalidFields);
      console.error('Error messages:', errorMessages);

      // Show the most specific error message
      const displayMessage = errorMessages.length > 0
        ? errorMessages[0]
        : `Please fill in all required fields: ${invalidFields.join(', ')}`;

      this.snackbarService.showError(displayMessage);
      return;
    }

    const mode = this.workflowMode();
    const formValue = this.unitForm.getRawValue();
    const filterValue = this.filterForm.getRawValue();
    const unitId = this.unitIdField.parsedUnitId!;

    this.isLoading.set(true);

    if (mode === 'separation') {
      // CREATE operation (Entry)
      // Get separationType from validation result
      const separationType = this.validationResult()?.separationType || 'SECOND';

      const dto: CreateCryoProductionDto = {
        unitId: unitId,
        workflowMode: 'separation', // ✅ Required workflow indicator
        separationType: separationType, // ✅ Required for separation (SECOND or THIRD)
        oldProductCode: formValue.destined,
        newProductCode: formValue.cryoProductCode,
        verifyProductCode: formValue.verifyProductCode, // ✅ NEW - Product code verification (error 9728)
        thawMethod: filterValue.thawMethod,
        thawTemperature: filterValue.temperature,
        centrifugeId: filterValue.centrifugeId,
        sepDateTime: filterValue.separationDateTime ? moment(filterValue.separationDateTime).toISOString() : undefined,
        catalogNo: formValue.catalogNo,
      };

      this.cryoProductionService
        .createCryoSeparation(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const previousCount = this.tableData().length;
            this.addEntryToTable(response);
            const newCount = this.tableData().length;
            const entriesAdded = newCount - previousCount;

            // Show batch notification (as per Figma)
            this.showSuccessSnackbar(`${entriesAdded} Entries added for separation details`);
            this.onClearAllUnit();
            this.isLoading.set(false);
          },
          error: (error) => {

            // ✅ NEW - Extract error code and message from response
            let errorMessage = 'Failed to commit CRYO separation';
            let errorCode: string | undefined;

            if (error.error?.errorResponse?.errorCode) {
              // Format: { errorResponse: { errorCode: "9812", error: "message" } }
              errorCode = error.error.errorResponse.errorCode;
              errorMessage = error.error.errorResponse.error || error.error.message || errorMessage;
            } else if (error.error?.errorCode) {
              // Format: { errorCode: "9728", message: "..." }
              errorCode = error.error.errorCode;
              errorMessage = error.error.message || errorMessage;
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            // Display error with code if available
            if (errorCode) {
              this.snackbarService.showError(`Error ${errorCode}: ${errorMessage}`);
            } else {
              this.snackbarService.showError(errorMessage);
            }

            this.isLoading.set(false);
          },
        });
    } else if (mode === 'freeze') {
      // UPDATE operation (Offline/Freeze)
      const dto: UpdateCryoProductionDto = {
        workflowMode: 'freeze', // ✅ NEW - Workflow indicator
        freezeTime: formValue.freezeTime ? moment(formValue.freezeTime).toISOString() : undefined,
        cryoOkFlag: formValue.cryoAcceptable,
      };

      this.cryoProductionService
        .updateCryoRecord(unitId, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const previousCount = this.tableData().length;

            // For freeze workflow, construct entry from form data since API might not return full object
            const freezeEntry = {
              unitId: unitId,
              oldProductCode: formValue.destined,
              catalogNo: formValue.catalogNo,
              newProductCode: formValue.cryoProductCode,
              verifyProductCode: formValue.verifyProductCode,
              freezeTime: formValue.freezeTime,
              cryoOkFlag: formValue.cryoAcceptable,
            };

            this.addEntryToTable(freezeEntry);
            const newCount = this.tableData().length;
            const entriesAdded = newCount - previousCount;

            // Show batch notification (as per Figma)
            this.showSuccessSnackbar(`${entriesAdded} Entries added for freeze details`);
            this.onClearAllUnit();
            this.isLoading.set(false);
          },
          error: (error) => {
            const message = error.error?.message || 'Failed to save freeze details';
            this.snackbarService.showError(message);
            this.isLoading.set(false);
          },
        });
    }
  }

  /**
   * Check if COMMIT button should be enabled
   */
  canCommit(): boolean {
    return this.unitIdField?.isValid && this.unitForm.valid && !this.isLoading();
  }

  /**
   * Add API response data to table
   * Handles both separation (CREATE) and freeze (UPDATE) responses
   */
  private addEntryToTable(response: any): void {
    const newEntry: CryoUnitEntry = {
      unitId: response.unitId,
      destined: response.oldProductCode,
      catalogNo: response.catalogNo || response.catalogNumber || '',
      cryoProductCode: response.newProductCode,
      verifyProductCode: response.verifyProductCode || '',
      // Handle both ISO string and formatted string for freezeTime
      freezeTime: response.freezeTime
        ? (moment.isMoment(response.freezeTime) || typeof response.freezeTime === 'string' && response.freezeTime.includes('-')
            ? moment(response.freezeTime).format('DD-MMM-YYYY HH:mm').toUpperCase()
            : response.freezeTime)
        : '',
      cryoAcceptable: response.cryoOkFlag || '',
    };

    this.tableData.update((data) => [...data, newEntry]);
    this.updateTableColumns();
  }

  /**
   * Temperature range validator
   * Uses dynamic ranges from API based on selected thaw method
   */
  private temperatureRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const temperature = control.value;

      // No validation if temperature is empty
      if (temperature === null || temperature === undefined || temperature === '') {
        return null;
      }

      // Get current temp range from signal
      const tempRange = this.currentTempRange();

      if (tempRange) {
        // Validate against thaw method-specific ranges
        if (temperature < tempRange.minTemp || temperature > tempRange.maxTemp) {
          return {
            temperatureOutOfRange: {
              message: `Temperature must be between ${tempRange.minTemp}°C and ${tempRange.maxTemp}°C for selected thaw method`
            }
          };
        }
      } else {
        // Fallback to basic range check if no specific range loaded
        if (temperature < -100 || temperature > 100) {
          return {
            temperatureOutOfRange: {
              message: 'Temperature must be between -100 and 100°C'
            }
          };
        }
      }

      return null;
    };
  }

  /**
   * ✅ CRITICAL #3 - Date/Time format validator with future date check
   * Validates DD-MMM-YYYY HH:mm format and ensures date is not in the future
   * Handles both uppercase (JUN) and title case (Jun) month abbreviations
   */
  private dateTimeFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      // Handle both Moment and string values
      let parsedMoment: moment.Moment;

      if (moment.isMoment(control.value)) {
        parsedMoment = control.value;
      } else if (control.value instanceof Date) {
        parsedMoment = moment(control.value);
      } else if (typeof control.value === 'string') {
        // Try parsing with title case first (strict mode)
        parsedMoment = moment(control.value, 'DD-MMM-YYYY HH:mm', true);

        // If strict parsing fails, try with uppercase month (convert to title case first)
        if (!parsedMoment.isValid()) {
          // Convert uppercase month to title case for parsing
          // e.g., "30-JUN-2026 01:03" -> "30-Jun-2026 01:03"
          const normalizedValue = control.value.replace(/([A-Z]{3})/g, (match: string) => {
            return match.charAt(0) + match.slice(1).toLowerCase();
          });
          parsedMoment = moment(normalizedValue, 'DD-MMM-YYYY HH:mm', true);
        }

        if (!parsedMoment.isValid()) {
          return {
            invalidFormat: {
              message: 'Invalid format. Use DD-MMM-YYYY HH:mm (e.g., 08-Jun-2026 14:30)'
            }
          };
        }
      } else {
        return null;
      }

      // Let the API handle date range validation
      return null;
    };
  }

  /**
   * CRYO_OK_FLAG validator
   * Must be 'Y' or 'N' exactly
   */
  private cryoOkFlagValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString().toUpperCase();
      if (value !== 'Y' && value !== 'N') {
        return {
          invalidValue: {
            message: 'CRYO Acceptable must be Y or N'
          }
        };
      }

      return null;
    };
  }

  /**
   * Conditional freeze time validator
   * Freeze time is required when CRYO_OK_FLAG = 'Y'
   * Backend handles time sequence validation
   */
  private conditionalFreezeTimeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (!(formGroup instanceof FormGroup)) {
        return null;
      }

      const cryoAcceptableControl = formGroup.get('cryoAcceptable');
      const freezeTimeControl = formGroup.get('freezeTime');

      // Check if freeze time is required for UX
      if (cryoAcceptableControl?.value === 'Y' && !freezeTimeControl?.value) {
        return {
          freezeTimeRequired: {
            message: 'Freeze time is required when CRYO is acceptable'
          }
        };
      }

      return null;
    };
  }

  /**
   * FMB: SEP_DATE_TIME VALIDATE_FIELD — Error 0305
   * Separation date/time cannot be before collection date
   * Handles both uppercase and title case month abbreviations
   */
  private sepDateTimeVsCollDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Let the API handle separation time vs collection date validation
      return null;
    };
  }

  /**
   * FMB: FREEZE_TIME VALIDATE_FIELD — Error 0058
   * Freeze time must be after separation time
   * Handles both uppercase and title case month abbreviations
   */
  private freezeTimeVsSepTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Let the API handle freeze time vs separation time validation
      return null;
    };
  }

  /**
   * FMB: Product Code Verification Validator (Error 9728)
   * Validates that scanned/entered product code matches the selected new product code
   */
  private productCodeVerificationValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const verifyCode = control.value;

      // No validation if empty (will be checked on submit)
      if (!verifyCode || verifyCode === '') {
        return null;
      }

      // Get new product code from readonly field (populated by auto-select)
      const newProductCode = this.unitForm?.get('cryoProductCode')?.value;

      if (!newProductCode) {
        // New product not selected yet, skip validation
        return null;
      }

      // Verify codes match (case-insensitive)
      if (verifyCode.toString().toUpperCase() !== newProductCode.toString().toUpperCase()) {
        return {
          productCodeMismatch: {
            message: 'Error 9728: Product verification failed, mismatch in product codes. Please scan the correct product code.'
          }
        };
      }

      return null;
    };
  }
}

// Interfaces for component data
interface YesNoOption {
  code: string;
  description: string;
}

interface CryoUnitEntry {
  unitId: string;
  destined: string;
  catalogNo: string;
  cryoProductCode: string;
  verifyProductCode: string;
  freezeTime: string;
  cryoAcceptable: string;
}
