import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';
import moment from 'moment';
import { Router } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent } from '@shared/components/scan-select-field/scan-select-field.component';
import { ScanSelectOption } from '@shared/components/scan-select-field/scan-select-field.model';
import { ScanPattern, SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { ModifyCryoDetailsService } from './services/modify-cryo-details.service';
import {
  UpdateCryoDetailsRequestDto,
  CryoModifyDetailsDto,
  ThawMethodDto,
  CentrifugeDto,
  CatalogNumberDto
} from './models/modify-cryo-details.model';

// Configure moment to use uppercase month abbreviations
moment.updateLocale('en', {
  monthsShort: [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ],
});

/**
 * Custom validator for Freeze Date/Time format: DD-MON-YYYY HH:MI
 * Matches ISBT Start Date validation from chapters screen
 */
export const freezeDateTimeFormatValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null; // handled by required validator
  }

  // DD-MON-YYYY HH:MI (e.g., "02-FEB-2025 05:30")
  const regex =
    /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}\s([01]\d|2[0-3]):[0-5]\d$/i;

  return regex.test(value) ? null : { invalidFreezeDateTimeFormat: true };
};

/**
 * Modify CRYO Details Component (MODCRYO)
 *
 * Purpose: Modify existing CRYO separation/freeze details for units
 *
 * Features:
 * - Search and load existing CRYO records by Unit ID
 * - Modify thaw method, temperature, centrifuge ID, separation date/time
 * - Modify freeze time and CRYO acceptable flag
 * - Display read-only fields (Destined, Catalog No, Product Code)
 */
@Component({
  selector: 'app-modify-cryo-details',
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
    MatMomentDateModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
    ScanSelectFieldComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './modify-cryo-details.component.html',
  styleUrl: './modify-cryo-details.component.scss',
})
export class ModifyCryoDetailsComponent implements OnInit, OnDestroy {
  // ViewChild for Unit ID field
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly cryoService = inject(ModifyCryoDetailsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly labelScanService = inject(DonorLibLabelScanService);

  // Cleanup subject
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  // Unit ID label
  unitIdLabel = 'Unit ID';

  // Form
  updateForm!: FormGroup;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly searching = signal<boolean>(false);
  readonly unitFound = signal<boolean>(false);
  readonly unitData = signal<CryoModifyDetailsDto | null>(null);
  readonly submitted = signal<boolean>(false);
  readonly inputRestrictionMessage = signal<string>('');

  // LOV data signals
  readonly thawMethods = signal<ThawMethodDto[]>([]);
  readonly centrifuges = signal<CentrifugeDto[]>([]);
  readonly catalogNumbers = signal<CatalogNumberDto[]>([]);

  // Search controls for dropdowns
  thawMethodSearchControl = new FormControl('');

  // Filtered data for searchable dropdowns
  filteredThawMethods: ThawMethodDto[] = [];

  // Scan-select-field options for centrifuge and catalog number
  centrifugeSelectOptions: ScanSelectOption[] = [];
  catalogNumberSelectOptions: ScanSelectOption[] = [];
  centrifugeScanPatterns: ScanPattern[] = SCAN_PATTERNS.CENTRIFUGE;

  // ViewChild for scan-select-fields
  @ViewChild('centrifugeScanField') centrifugeScanField!: ScanSelectFieldComponent;
  @ViewChild('catalogScanField') catalogScanField!: ScanSelectFieldComponent;

  // Form state signals
  readonly formDirty = signal<boolean>(false);
  readonly formValid = signal<boolean>(false);

  // Computed
  // Use getter instead of computed to properly react to form.dirty changes
  get canSave(): boolean {
    // Must have loaded a unit
    if (!this.unitFound() || this.loading()) {
      return false;
    }

    // In edit mode (after loading unit), require form to be dirty (changed)
    // This matches Product Codes pattern and prevents saving without changes
    if (!this.updateForm.dirty) {
      return false;
    }

    // Form must be valid (all required fields filled, no validation errors)
    return this.updateForm.valid;
  }

  readonly canClearAll = computed(() =>
    this.unitFound() // Enable CLEAR ALL whenever unit data is loaded
  );

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.canDeactivate()) {
      event.preventDefault();
    }
  }

  canDeactivate(): boolean {
    return !this.unitFound() || !this.updateForm.dirty;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadLovData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes and reload LOV data when chapter changes
   * (follows institution screen pattern)
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload all LOV data for the new chapter
        this.loadLovData();

        // Clear form and reset to initial state when chapter changes
        this.onClearAll();
      });
  }

  /**
   * Initialize form
   */
  private initForm(): void {
    this.updateForm = this.fb.group({
      thawMethod: ['', Validators.required],
      thawTemperature: [null, [
        Validators.required,
        Validators.pattern('^[0-9]{1,3}(\.[0-9]{1})?$'),
        Validators.min(0),
        Validators.max(999.9)
      ]],
      centrifugeId: ['', Validators.required],
      catalogNumber: ['', Validators.required],
      freezeDateTime: ['', [Validators.required, freezeDateTimeFormatValidator, this.notFutureDateTimeValidator(), this.freezeTimeAfterSepTimeValidator()]],
      cryoOkFlag: ['', Validators.required]
    });

    // Track form state changes
    this.updateForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formValid.set(this.updateForm.valid);
      });

    this.updateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formDirty.set(this.updateForm.dirty);
        this.formValid.set(this.updateForm.valid);
      });
  }

  /**
   * Load LOV data (thaw methods and centrifuges) on component init
   */
  private loadLovData(): void {
    // Load Thaw Methods
    this.cryoService.getThawMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.thawMethods.set(data);
          this.filteredThawMethods = data;
          this.setupThawMethodSearch();
        },
        error: (err) => {
          this.showError(err, 'Failed to load thaw methods');
        }
      });

    // Load Centrifuges
    this.cryoService.getCentrifuges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.centrifuges.set(data);
          this.centrifugeSelectOptions = data.map(c => ({
            code: c.centrifugeId,
            description: c.manufacturer || ''
          }));
        },
        error: (err) => {
          this.showError(err, 'Failed to load centrifuges');
        }
      });
  }

  /**
   * Setup search filtering for thaw methods dropdown
   */
  private setupThawMethodSearch(): void {
    this.thawMethodSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.filterThawMethods(searchTerm || '');
      });
  }

  /**
   * Filter thaw methods based on search term
   */
  private filterThawMethods(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredThawMethods = this.thawMethods();
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredThawMethods = this.thawMethods().filter(method =>
      method.thawMethod.toLowerCase().includes(search) ||
      method.methodDesc.toLowerCase().includes(search)
    );
  }

  /**
   * Parse centrifuge barcode scan (C####C format)
   * Validates format, extracts centrifuge ID, looks up in loaded options
   */
  parseCentrifugeScan = (rawValue: string): Observable<ScanSelectOption | null> => {
    const value = rawValue.toUpperCase();
    if (value.length !== 6 || value[0] !== 'C' || value[5] !== 'C') {
      return of(null);
    }
    const centrifugeId = value.substring(1, 5);
    const match = this.centrifugeSelectOptions.find(
      o => o.code.toLowerCase() === centrifugeId.toLowerCase()
    );
    return of(match ?? null);
  };

  onCentrifugeSelected(option: ScanSelectOption | null): void {
    this.updateForm.get('centrifugeId')?.setValue(option?.code ?? '');
    this.updateForm.get('centrifugeId')?.markAsDirty();
  }

  onCentrifugeCleared(): void {
    this.updateForm.get('centrifugeId')?.setValue('');
  }

  /**
   * Load catalog numbers for the selected unit
   */
  private loadCatalogNumbers(unitId: string): void {
    this.cryoService.getCatalogNumbers(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.catalogNumbers.set(data);
          this.catalogNumberSelectOptions = data.map(c => ({
            code: c.catalogNumber,
            description: ''
          }));

          // Force change detection so catalog scan-select-field ViewChild is available
          this.cdr.detectChanges();

          const currentCatalog = this.unitData()?.catalogNumber;
          if (currentCatalog) {
            this.catalogScanField?.setValue(currentCatalog, currentCatalog);
          } else if (data.length === 1) {
            const only = data[0];
            this.catalogScanField?.setValue(only.catalogNumber, only.catalogNumber);
            this.updateForm.get('catalogNumber')?.setValue(only.catalogNumber);
            this.updateForm.get('catalogNumber')?.markAsDirty();
          } else if (data.length > 1) {
            setTimeout(() => this.catalogScanField?.togglePanel());
          }
        },
        error: (err) => {
          this.showError(err, 'Failed to load catalog numbers');
        }
      });
  }

  /**
   * Parse catalog number barcode scan (ISBT format starting with '=)', length 12)
   * Calls DonorLibLabelScanService to validate and extract catalog number
   */
  parseCatalogScan = (rawValue: string): Observable<ScanSelectOption | null> => {
    if (!rawValue.startsWith('=)') || rawValue.length !== 12) {
      return of(null);
    }
    return this.labelScanService.validateCatalogScan(rawValue, 'CPIMCRYO').pipe(
      map(response => {
        if (response?.item?.catalogNumber) {
          const catalogNum = response.item.catalogNumber;
          const match = this.catalogNumberSelectOptions.find(
            o => o.code.toLowerCase() === catalogNum.toLowerCase()
          );
          return match ?? { code: catalogNum, description: catalogNum };
        }
        return null;
      })
    );
  };

  onCatalogSelected(option: ScanSelectOption | null): void {
    this.updateForm.get('catalogNumber')?.setValue(option?.code ?? '');
    this.updateForm.get('catalogNumber')?.markAsDirty();
  }

  onCatalogCleared(): void {
    this.updateForm.get('catalogNumber')?.setValue('');
  }

  get updateF() {
    return this.updateForm.controls;
  }

  /**
   * Handle unit validation from shared component
   * Automatically triggers search when unit is validated
   */
  onUnitValidated(_data: UnitValidationResponse): void {
    // Unit validated - trigger search automatically
    this.onSearch();
  }

  /**
   * Handle unit cleared event from shared component
   */
  onUnitCleared(): void {
    this.unitFound.set(false);
    this.unitData.set(null);
    this.catalogNumbers.set([]);
    this.catalogNumberSelectOptions = [];
    this.centrifugeScanField?.clear();
    this.catalogScanField?.clear();
    this.updateForm.reset();
  }

  /**
   * Handle Freeze Date/Time input - auto-convert to uppercase
   * Matches ISBT Start Date behavior from chapters screen
   */
  onFreezeDateTimeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const upperValue = currentValue.toUpperCase();
    const control = this.updateForm.get('freezeDateTime');

    if (currentValue !== upperValue) {
      control?.setValue(upperValue, { emitEvent: false });
      input.value = upperValue;
    }

    // Run validation to update errors based on current value
    control?.updateValueAndValidity();
  }

  /**
   * Convert DD-MON-YYYY HH:MI format to ISO string (chapter local time)
   * Matches FMB: User enters in chapter local, backend converts using GetConvertedGmtDateAsync
   * Send as ISO WITHOUT timezone (no Z) so backend treats it as chapter local
   */
  private convertFreezeDateTimeToIso(value: string | null): string | null {
    if (!value) return null;

    const [datePart, timePart] = value.split(' ');
    const [day, mon, year] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };

    const monthIndex = monthMap[mon.toUpperCase()];
    if (monthIndex === undefined) {
      throw new Error(`Invalid month: ${mon}`);
    }

    // Format as ISO WITHOUT Z suffix (chapter local time)
    const paddedMonth = String(monthIndex + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const paddedHour = String(hour).padStart(2, '0');
    const paddedMinute = String(minute).padStart(2, '0');

    return `${year}-${paddedMonth}-${paddedDay}T${paddedHour}:${paddedMinute}:00`;
  }

  /**
   * Convert ISO string to DD-MON-YYYY HH:MI format
   * Backend returns freeze time in chapter local timezone (already converted from UTC)
   */
  private convertIsoToFreezeDateTime(isoDate: string | null): string {
    if (!isoDate) return '';

    // Parse as local time (backend already converted UTC -> chapter timezone)
    const date = moment(isoDate);
    return date.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  /**
   * Search for CRYO unit by Unit ID
   * Called when user enters Unit ID in shared component
   */
  onSearch(): void {
    if (!this.unitIdField?.isValid) {
      return;
    }

    const unitId = this.unitIdField.parsedUnitId;
    if (!unitId) {
      return;
    }

    this.searching.set(true);
    this.unitFound.set(false);
    this.unitData.set(null);
    this.catalogNumbers.set([]);
    this.updateForm.reset();

    this.cryoService.getCryoRecord(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unitData.set(response);
          this.unitFound.set(true);

          // Populate form with existing data
          // Convert ISO datetime to DD-MON-YYYY HH:MI format
          const freezeDateTimeValue = this.convertIsoToFreezeDateTime(response.freezeTime);

          this.updateForm.patchValue({
            thawMethod: response.thawMethod || '',
            thawTemperature: response.thawTemperature || null,
            centrifugeId: response.centrifugeId || '',
            catalogNumber: response.catalogNumber || '',
            freezeDateTime: freezeDateTimeValue,
            cryoOkFlag: response.cryoOkFlag || ''
          });

          // Mark form as pristine after loading data
          this.updateForm.markAsPristine();
          this.formDirty.set(false);
          this.formValid.set(this.updateForm.valid);

          // Load catalog numbers for this unit
          this.loadCatalogNumbers(unitId);

          this.searching.set(false);

          // Force Angular to render the @if block so ViewChild resolves
          this.cdr.detectChanges();

          // Now set scan-select-field values
          if (response.centrifugeId) {
            const centDesc = this.centrifugeSelectOptions.find(c => c.code === response.centrifugeId)?.description || '';
            this.centrifugeScanField?.setValue(response.centrifugeId, centDesc);
          }
        },
        error: (err) => {
          this.searching.set(false);
          this.showError(err, 'Unit not found. Please verify the Unit ID.');
        }
      });
  }

  /**
   * Get formatted Unit ID for display
   */
  getFormattedUnitId(): string {
    const parsedData = this.unitIdField?.parsedUnitData;
    if (parsedData?.manualUnitId) {
      return parsedData.manualUnitId;
    }
    return this.unitData()?.unitId || '';
  }

  /**
   * Format date for display (DD-MON-YYYY uppercase)
   */
  formatDateUppercase(dateString: string | null | undefined): string {
    if (!dateString) return '';
    return moment(dateString).format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Get thaw method description
   */
  getThawMethodDescription(code: string): string {
    const method = this.thawMethods().find(m => m.thawMethod === code);
    return method?.methodDesc || '';
  }

  /**
   * Save CRYO details
   */
  onSave(): void {
    this.submitted.set(true);

    if (this.updateForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const unit = this.unitData();
    if (!unit) return;

    this.loading.set(true);

    // Convert DD-MON-YYYY HH:MI to ISO string
    const freezeDateTimeValue = this.updateF['freezeDateTime'].value;
    const freezeTimeString = freezeDateTimeValue ? this.convertFreezeDateTimeToIso(freezeDateTimeValue) : null;

    const request: UpdateCryoDetailsRequestDto = {
      unitId: unit.unitId,
      collDate: unit.collDate,
      thawMethod: this.updateF['thawMethod'].value,
      thawTemperature: this.updateF['thawTemperature'].value,
      centrifugeId: this.updateF['centrifugeId'].value,
      catalogNumber: this.updateF['catalogNumber'].value,
      freezeTime: freezeTimeString,
      sepTime: unit.sepTime,
      cryoOkFlag: this.updateF['cryoOkFlag'].value,
      newProductCode: unit.newProductCode,
      sepInd: unit.sepInd,
      sepWeight: unit.sepWeight
    };

    this.cryoService.updateCryoRecord(unit.unitId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess(`CRYO details for Unit ID ${this.getFormattedUnitId()} have been modified.`);
          this.loading.set(false);
          this.resetForm();
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err, 'Failed to update CRYO details');
        }
      });
  }

  /**
   * Clear button - reset form only (unit stays loaded)
   */
  onClear(): void {
    const unit = this.unitData();
    if (unit) {
      // Convert ISO datetime to DD-MON-YYYY HH:MI format
      const freezeDateTimeValue = this.convertIsoToFreezeDateTime(unit.freezeTime);

      // Reset to original values
      this.updateForm.patchValue({
        thawMethod: unit.thawMethod || '',
        thawTemperature: unit.thawTemperature || null,
        centrifugeId: unit.centrifugeId || '',
        catalogNumber: unit.catalogNumber || '',
        freezeDateTime: freezeDateTimeValue,
        cryoOkFlag: unit.cryoOkFlag || ''
      });

      // Reset scan-select-fields to original values
      if (unit.centrifugeId) {
        const centDesc = this.centrifugeSelectOptions.find(c => c.code === unit.centrifugeId)?.description || '';
        this.centrifugeScanField?.setValue(unit.centrifugeId, centDesc);
      } else {
        this.centrifugeScanField?.clear();
      }
      if (unit.catalogNumber) {
        this.catalogScanField?.setValue(unit.catalogNumber, unit.catalogNumber);
      } else {
        this.catalogScanField?.clear();
      }

      // Mark form as pristine
      this.updateForm.markAsPristine();
      this.formDirty.set(false);
      this.formValid.set(this.updateForm.valid);
    }
    this.submitted.set(false);
  }

  /**
   * Clear All button - reset form to original loaded values (follows institution EDIT mode pattern)
   * In edit institution, reset() reverts to the values that were patchValue'd from the API.
   * Similarly here, if unit is loaded, reset to original unit data. If not loaded, clear everything.
   */
  onClearAll(): void {
    if (this.unitFound() && this.unitData()) {
      // Unit is loaded - reset form to original values (like institution EDIT mode)
      this.updateForm.reset();

      // Reset form validation state
      Object.keys(this.updateForm.controls).forEach(key => {
        this.updateForm.get(key)?.setErrors(null);
        this.updateForm.get(key)?.markAsUntouched();
        this.updateForm.get(key)?.markAsPristine();
      });

      // Clear scan-select-fields
      this.centrifugeScanField?.clear();
      this.catalogScanField?.clear();

      // Reset submitted state
      this.submitted.set(false);
      this.formDirty.set(false);
    } else {
      // No unit loaded - clear everything (like institution CREATE mode)
      this.unitIdField?.clear();
      this.updateForm.reset();

      // Reset form validation state
      Object.keys(this.updateForm.controls).forEach(key => {
        this.updateForm.get(key)?.setErrors(null);
        this.updateForm.get(key)?.markAsUntouched();
        this.updateForm.get(key)?.markAsPristine();
      });

      // Clear scan-select-fields
      this.centrifugeScanField?.clear();
      this.catalogScanField?.clear();

      // Reset submitted state
      this.submitted.set(false);

      // Reset all state signals
      this.unitFound.set(false);
      this.unitData.set(null);
      this.catalogNumbers.set([]);
      this.catalogNumberSelectOptions = [];
      this.searching.set(false);
      this.formDirty.set(false);
      this.formValid.set(false);
    }
  }

  /**
   * Cancel - reset page to default/initial state (empty state, no unit loaded)
   */
  onCancel(): void {
    // Clear the Unit ID field
    this.unitIdField?.clear();

    // Reset the form completely
    this.updateForm.reset();

    // Reset form validation state
    Object.keys(this.updateForm.controls).forEach(key => {
      this.updateForm.get(key)?.setErrors(null);
      this.updateForm.get(key)?.markAsUntouched();
      this.updateForm.get(key)?.markAsPristine();
    });

    // Clear scan-select-fields
    this.centrifugeScanField?.clear();
    this.catalogScanField?.clear();

    // Reset submitted state
    this.submitted.set(false);

    // Reset all state signals to default/initial state
    this.unitFound.set(false);
    this.unitData.set(null);
    this.catalogNumbers.set([]);
    this.catalogNumberSelectOptions = [];
    this.searching.set(false);
    this.formDirty.set(false);
    this.formValid.set(false);
  }

  /**
   * Reset all forms and state (internal use)
   * After successful save, reset to default state (blank page, no unit loaded)
   */
  private resetForm(): void {
    this.onCancel();
  }

  /**
   * Show success message in top right corner
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message in top right corner
   */
  private showError(error: any, defaultMessage: string = 'An error occurred'): void {
    const errorMessage = this.extractErrorMessage(error, defaultMessage);
    this.snackBar.open(errorMessage, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Extract error message from error response
   */
  private extractErrorMessage(error: any, defaultMessage: string): string {
    if (error?.error?.error?.errorCode && error?.error?.error?.errorDescription) {
      return `Error: ${error.error.error.errorCode} : ${error.error.error.errorDescription}`;
    }
    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      return `Error: ${error.error.errorResponse.errorCode} : ${error.error.errorResponse.error}`;
    }
    if (error?.error?.errorCode && error?.error?.message) {
      return `Error: ${error.error.errorCode} : ${error.error.message}`;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return defaultMessage;
  }

  /**
   * Limit number input to max digits
   * For thawTemperature: max 3 digits before decimal, 1 digit after (e.g., 999.9)
   * Total max 5 characters including decimal point
   */
  onMaxDigitsInput(event: Event, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    const controlName = input.getAttribute('formControlName');
    let value = input.value;
    const originalValue = value;

    // For thawTemperature: enforce max 5 total characters (e.g., 999.9)
    // Only allow positive numbers (0-999.9)
    if (controlName === 'thawTemperature') {
      // Remove anything that's not a digit or decimal point (blocks minus sign)
      value = value.replace(/[^\d.]/g, '');

      // Only allow one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }

      // Split again after cleanup
      const cleanParts = value.split('.');

      // Limit to 3 digits before decimal
      if (cleanParts[0] && cleanParts[0].length > 3) {
        cleanParts[0] = cleanParts[0].slice(0, 3);
      }

      // Limit to 1 digit after decimal
      if (cleanParts.length > 1 && cleanParts[1] && cleanParts[1].length > 1) {
        cleanParts[1] = cleanParts[1].slice(0, 1);
      }

      // Reconstruct value - preserve trailing decimal point
      if (value.endsWith('.') && cleanParts.length === 1) {
        value = cleanParts[0] + '.';
      } else {
        value = cleanParts.length > 1 ? cleanParts[0] + '.' + cleanParts[1] : cleanParts[0];
      }

      // Enforce total max 5 characters (including decimal point)
      if (value.length > maxDigits) {
        value = value.slice(0, maxDigits);
      }

      input.value = value;

      if (value !== originalValue) {
        this.inputRestrictionMessage.set('');
        setTimeout(() => this.inputRestrictionMessage.set('Only numbers 0 to 999.9 allowed'), 50);
      }

      // Only set form value if it's a complete number (not ending with decimal point)
      if (controlName) {
        const control = this.updateForm.get(controlName);
        if (value && !value.endsWith('.')) {
          control?.setValue(+value, { emitEvent: false });
        } else if (!value) {
          control?.setValue(null, { emitEvent: false });
        }
        // Don't update form value if it ends with '.' - let user finish typing
      }
    } else {
      // Default behavior for other number fields
      if (input.value.length > maxDigits) {
        input.value = input.value.slice(0, maxDigits);
        if (controlName) {
          const control = this.updateForm.get(controlName);
          control?.setValue(input.value ? +input.value : null, { emitEvent: false });
        }
      }
    }
  }

  private parseFreezeDateTime(value: string): moment.Moment | null {
    if (!value) return null;
    const regex = /^(\d{2})-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4})\s(\d{2}):(\d{2})$/i;
    if (!regex.test(value)) return null;
    const parsed = moment(value, 'DD-MMM-YYYY HH:mm');
    return parsed.isValid() ? parsed : null;
  }

  private notFutureDateTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const parsed = this.parseFreezeDateTime(control.value);
      if (!parsed) return null;
      const chapterNow = this.chapterTimezoneService.isChapterLocalDateAvailable()
        ? this.chapterTimezoneService.getChapterLocalDateTime()
        : moment();
      if (parsed.isAfter(chapterNow)) {
        return { futureDateTime: true };
      }
      return null;
    };
  }

  private freezeTimeAfterSepTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const sepTime = this.unitData()?.sepTime;
      if (!sepTime) return null;

      const parsed = this.parseFreezeDateTime(control.value);
      if (!parsed) return null;

      const sepLocal = this.chapterTimezoneService.convertGmtToLocal(moment.utc(sepTime));
      if (!sepLocal.isValid()) return null;
      const sepMoment = moment(sepLocal.format('YYYY-MM-DD HH:mm'), 'YYYY-MM-DD HH:mm');

      if (parsed.isSameOrBefore(sepMoment)) {
        return { freezeBeforeSep: true };
      }
      return null;
    };
  }
}
