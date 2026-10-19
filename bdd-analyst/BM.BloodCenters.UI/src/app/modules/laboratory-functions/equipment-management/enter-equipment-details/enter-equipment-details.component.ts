import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';

/** Validates that a date is not after the chapter's local date (no future dates). */
function noFutureDateValidatorFactory(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const selectedDate = moment(value).startOf('day');
    const chapterDate = chapterTimezoneService.chapterLocalDate();
    const today = chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
    return selectedDate.isAfter(today, 'day') ? { futureDate: true } : null;
  };
}

function noPastDateValidatorFactory(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const selectedDate = moment(value).startOf('day');
    const chapterDate = chapterTimezoneService.chapterLocalDate();
    const today = chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
    return selectedDate.isBefore(today, 'day') ? { pastDate: true } : null;
  };
}

import { EquipmentApiService } from './services/equipment-api.service';
import {
  EquipmentDto,
  CreateEquipmentRequestDto,
  UpdateEquipmentRequestDto,
  DropdownOption,
  ConfigurableEquipmentDetail,
  EquipmentFormValue
} from './models/equipment.models';

@Component({
  selector: 'app-enter-equipment-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './enter-equipment-details.component.html',
  styleUrl: './enter-equipment-details.component.scss'
})
export class EnterEquipmentDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-equipment-details-${EnterEquipmentDetailsComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId  = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId  = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('equipIdInput', { read: MatAutocompleteTrigger }) equipIdAutoTrigger!: MatAutocompleteTrigger;
  @ViewChild('equipIdInput') equipIdInputEl!: ElementRef<HTMLInputElement>;

  private readonly fb                       = inject(FormBuilder);
  private readonly equipmentApiService      = inject(EquipmentApiService);
  private readonly snackbarService          = inject(SnackbarService);
  private readonly headerService            = inject(HeaderService);
  private readonly menuService              = inject(MenuService);
  private readonly cdr                      = inject(ChangeDetectorRef);
  private readonly chapterTimezoneService   = inject(ChapterTimezoneService);

  // ── State ─────────────────────────────────────────────────────────────────
  protected readonly equipmentData      = signal<EquipmentDto | null>(null);
  protected readonly loading            = signal<boolean>(false);
  protected readonly showEmptyState     = signal<boolean>(true);
  protected readonly equipmentTypes     = signal<DropdownOption[]>([]);
  protected readonly equipmentIds       = signal<DropdownOption[]>([]);
  protected readonly locations          = signal<DropdownOption[]>([]);
  protected readonly statuses           = signal<DropdownOption[]>([]);
  protected readonly configurableDetails = signal<ConfigurableEquipmentDetail[]>([]);
  protected readonly isEditMode         = signal<boolean>(false);
  private readonly showAllEquipIds      = signal<boolean>(false);

  // Max date for datepickers — chapter's local today (no future dates).
  readonly maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });

  // Error state matchers — show mat-form-field error state whenever the getter returns a message.
  inServiceDateErrorMatcher    = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getInServiceDateError());
  outServiceDateErrorMatcher   = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getOutServiceDateError());
  firstProdDateErrorMatcher    = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getFirstProdDateError());
  lastProdDateErrorMatcher     = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getLastProdDateError());
  serviceStartDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getServiceStartDateError());
  serviceEndDateErrorMatcher   = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getServiceEndDateError());

  // Reactive mirrors of form control values used in computed display signals.
  // Direct form.get().value reads are NOT tracked by Angular's signal graph,
  // so changes to these controls would not update computed() outputs.
  protected readonly equipTypeValue    = signal<string | null>(null);
  protected readonly equipIdInputValue = signal<string | null>(null);
  protected readonly locationValue     = signal<string | null>(null);
  protected readonly statusValue       = signal<string | null>(null);

  // ── Search controls for searchable dropdowns ───────────────────────────────
  readonly equipTypeSearchCtrl = new FormControl('');
  readonly locationSearchCtrl  = new FormControl('');

  private readonly equipTypeSearch = toSignal(this.equipTypeSearchCtrl.valueChanges, { initialValue: '' });
  private readonly locationSearch  = toSignal(this.locationSearchCtrl.valueChanges,  { initialValue: '' });

  protected readonly filteredEquipmentTypes = computed(() => {
    const q = (this.equipTypeSearch() ?? '').toLowerCase().trim();
    if (!q) return this.equipmentTypes();
    return this.equipmentTypes().filter(o =>
      o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q)
    );
  });

  protected readonly filteredEquipmentIds = computed(() => {
    if (this.showAllEquipIds()) return this.equipmentIds();
    const q = (this.equipIdInputValue() ?? '').toLowerCase().trim();
    if (!q) return this.equipmentIds();
    return this.equipmentIds().filter(o =>
      o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  });

  protected readonly filteredLocations = computed(() => {
    const q = (this.locationSearch() ?? '').toLowerCase().trim();
    if (!q) return this.locations();
    return this.locations().filter(o =>
      o.label.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q)
    );
  });

  // ── Computed display values ────────────────────────────────────────────────

  protected readonly equipmentTypeName = computed(() => {
    const type = this.equipTypeValue();
    if (!type) return '';
    const found = this.equipmentTypes().find(o => o.value === type);
    return found?.description ?? found?.label ?? '';
  });

  protected readonly locationDescription = computed(() => {
    const loc = this.locationValue();
    if (!loc) return '';
    return this.locations().find(o => o.value === loc)?.description ?? '';
  });

  protected readonly statusDescription = computed(() => {
    const status = this.statusValue();
    if (!status) return '';
    return this.statuses().find(o => o.value === status)?.description ?? '';
  });

  protected readonly description = computed(() => {
    const type = this.equipmentData()?.equipType;
    if (!type) return '';
    const found = this.equipmentTypes().find(o => o.value === type);
    return found?.description ?? found?.label ?? '';
  });

  protected readonly equipmentReference = computed(() =>
    this.equipmentData()?.equipReference ?? ''
  );

  // Institution name is not returned by the API (Bug 8 in API integration doc).
  // Kept as a placeholder so the HTML binding compiles; will show '-' until the API adds the field.
  protected readonly instName = computed(() => '');

  // ── Form ──────────────────────────────────────────────────────────────────
  form!: FormGroup;
  submitted = signal<boolean>(false);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  configurableDetailsColumns: string[] = ['sequence', 'detail', 'value'];

  /** Export flag — FMB validates Y or N only (error 5162 for any other value). */
  readonly exportFlagOptions: DropdownOption[] = [
    { value: 'Y', label: 'Y' },
    { value: 'N', label: 'N' },
  ];

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EnterEquipmentDetails]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || 'Manage equipment records'
          };
        } else {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: 'Enter Equipment Details', link: null }
            ],
            title: 'Enter Equipment Details',
            subtitle: 'Manage equipment records'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
    this.setupFormListeners();
    this.setupDateValidationListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Selection card (GAP-10: equipRef added for targeted record lookup)
      equipType:    [null, [Validators.required, Validators.maxLength(5)]],
      equipId:      [null, [Validators.required, Validators.maxLength(4)]],
      equipRef:     [null, [Validators.maxLength(9)]],
      // Details — institution ID (FMB: INST_ID, optional)
      instId:              [null, [Validators.maxLength(4)]],
      // Details — status now editable (GAP-02)
      status:              [null, [Validators.required]],
      // GAP-06: maxLength 12 (was 20)
      serialNumber:        [null, [Validators.maxLength(12)]],
      // GAP-08: maxLength 4 (was 15)
      location:            [null, [Validators.maxLength(4)]],
      // GAP-01: date fields added
      inServiceDate:       [null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]],
      outServiceDate:      [null],
      firstProductionDate: [null, [Validators.required, noPastDateValidatorFactory(this.chapterTimezoneService)]],
      lastProductionDate:  [null, [noPastDateValidatorFactory(this.chapterTimezoneService)]],
      // GAP-07: maxLength 50 (was 30)
      manufacturer:        [null, [Validators.maxLength(50)]],
      exportFlag:          [null, [Validators.maxLength(1)]],
      serviceContact:      [null, [Validators.maxLength(50)]],
      servicePhone:        [null, [Validators.maxLength(20)]],
      serviceStartDate:    [null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]],
      serviceEndDate:      [null],
    });
  }

  private setupFormListeners(): void {
    // Equipment Type → update reactive mirror, reload IDs, reset details
    this.form.get('equipType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(equipType => {
        this.equipTypeValue.set(equipType ?? null);
        this.locationValue.set(null);
        if (equipType) {
          this.loadEquipmentIds(equipType);
          this.form.get('equipId')?.setValue(null, { emitEvent: false });
          this.equipIdInputValue.set(null);
        } else {
          this.equipmentIds.set([]);
          this.equipIdInputValue.set(null);
        }
        this.resetFormDetails();
      });

    // Equipment ID change → enforce uppercase, update filter signal
    this.form.get('equipId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(equipId => {
        this.showAllEquipIds.set(false);
        if (!equipId) {
          this.equipIdInputValue.set(null);
          this.resetFormDetails();
        } else {
          const upper = equipId.toUpperCase();
          if (upper !== equipId) {
            this.form.get('equipId')?.setValue(upper, { emitEvent: false });
          }
          this.equipIdInputValue.set(upper);
        }
      });

    // Location → update reactive mirror so locationDescription() stays in sync
    this.form.get('location')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(loc => this.locationValue.set(loc ?? null));

    // Status → update reactive mirror so statusDescription() stays in sync
    this.form.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => this.statusValue.set(status ?? null));

    // GAP-15: Out-of-service date auto-sets STATUS=OUT when today falls in [in, out] range
    this.form.get('outServiceDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(outDate => {
        if (!outDate) return;
        const inDate = this.form.get('inServiceDate')?.value;
        if (!inDate) return;
        const today     = this.chapterTimezoneService.chapterLocalDate()?.clone().startOf('day') ?? moment().startOf('day');
        const inMoment  = moment(inDate).startOf('day');
        const outMoment = moment(outDate).startOf('day');
        if (today.isSameOrAfter(inMoment) && today.isSameOrBefore(outMoment)) {
          if (this.form.get('status')?.value !== 'OUT') {
            this.form.get('status')?.setValue('OUT', { emitEvent: false });
          }
        }
      });
  }

  private loadDropdownData(): void {
    this.loading.set(true);

    forkJoin({
      types:    this.equipmentApiService.getEquipmentTypes(),
      locations: this.equipmentApiService.getLocations(),
      statuses:  this.equipmentApiService.getStatuses(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ types, locations, statuses }) => {
          this.equipmentTypes.set(types);
          this.locations.set(locations);
          this.statuses.set(statuses);
        },
        error: err => this.handleError('Failed to load dropdown data', err),
        complete: () => this.loading.set(false)
      });
  }

  private loadEquipmentIds(equipType: string): void {
    this.equipmentApiService.getEquipmentIds(equipType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ids => this.equipmentIds.set(ids),
        error: err => this.handleError('Failed to load equipment IDs', err)
      });
  }

  private resetFormDetails(): void {
    this.showEmptyState.set(true);
    this.equipmentData.set(null);
    this.isEditMode.set(false);
    this.form.patchValue({
      equipRef:            null,
      instId:              null,
      status:              null,
      serialNumber:        null,
      location:            null,
      inServiceDate:       null,
      outServiceDate:      null,
      firstProductionDate: null,
      lastProductionDate:  null,
      manufacturer:        null,
      exportFlag:          null,
      serviceContact:      null,
      servicePhone:        null,
      serviceStartDate:    null,
      serviceEndDate:      null,
    }, { emitEvent: false });
    this.configurableDetails.set([]);

    const fpd = this.form.get('firstProductionDate');
    fpd?.clearValidators();
    fpd?.setValidators([Validators.required, noPastDateValidatorFactory(this.chapterTimezoneService)]);
    fpd?.updateValueAndValidity({ emitEvent: false });
  }

  get f() { return this.form.controls; }

  onBarcodeScan(): void {
    this.snackbarService.showError('Barcode scanning not yet implemented. Please select Equipment Type manually.');
  }

  onEquipIdFocus(): void {
    this.showAllEquipIds.set(true);
    this.equipIdAutoTrigger.openPanel();
  }

  toggleEquipIdPanel(): void {
    if (this.equipIdAutoTrigger.panelOpen) {
      this.showAllEquipIds.set(false);
      this.equipIdAutoTrigger.closePanel();
    } else {
      this.showAllEquipIds.set(true);
      this.equipIdInputEl.nativeElement.focus();
      this.equipIdAutoTrigger.openPanel();
    }
  }

  onRetrieve(): void {
    const equipType = this.form.get('equipType')?.value as string | null;
    const equipId   = this.form.get('equipId')?.value as string | null;
    const equipRef  = (this.form.get('equipRef')?.value as string | null)?.trim() || null;

    if (!equipType || !equipId) {
      this.snackbarService.showError('Please select Equipment Type and ID before retrieving.');
      return;
    }

    this.loading.set(true);

    if (equipRef) {
      // GAP-10: use getByKey when reference is provided (direct record lookup)
      this.equipmentApiService.getByKey(equipType, equipId, equipRef)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: response => {
            const equipment = (response.data as EquipmentDto | null) ?? null;
            this.patchEquipmentData(equipment);
            this.loading.set(false);
          },
          error: err => {
            this.handleError('Failed to retrieve equipment details', err);
            this.loading.set(false);
          }
        });
    } else {
      // GAP-11: include chapterId in getAll query for chapter-scoped results
      const chapterId = this.headerService.chapterId() || undefined;
      this.equipmentApiService.getAll(1, 0, { equipType, equipId, chapterId })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: response => {
            const equipment = response.data?.[0] ?? null;
            this.patchEquipmentData(equipment);
            this.loading.set(false);
          },
          error: err => {
            this.handleError('Failed to retrieve equipment details', err);
            this.loading.set(false);
          }
        });
    }
  }

  /** Patches the form and state after a retrieve response. */
  private patchEquipmentData(equipment: EquipmentDto | null): void {
    this.equipmentData.set(equipment);
    this.isEditMode.set(!!equipment);

    if (equipment) {
      const parseMoment = (s: string | null) => (s ? moment(s) : null);
      this.form.patchValue({
        equipRef:            equipment.equipReference,
        instId:              equipment.instId,
        status:              equipment.status,
        serialNumber:        equipment.serialNumber,
        location:            equipment.location,
        manufacturer:        equipment.manufacturer,
        exportFlag:          equipment.osokFlag,
        serviceContact:      equipment.serviceContact,
        servicePhone:        equipment.servicePhone,
        inServiceDate:       parseMoment(equipment.inServiceDate),
        outServiceDate:      parseMoment(equipment.outServiceDate),
        firstProductionDate: parseMoment(equipment.firstProductionDate),
        lastProductionDate:  parseMoment(equipment.lastProductionDate),
        serviceStartDate:    parseMoment(equipment.serviceStartDate),
        serviceEndDate:      parseMoment(equipment.serviceEndDate),
      }, { emitEvent: false });
      // Patch used emitEvent:false so valueChanges didn't fire — update mirrors directly
      this.locationValue.set(equipment.location);
      this.statusValue.set(equipment.status);

      const fpd = this.form.get('firstProductionDate');
      fpd?.clearValidators();
      fpd?.setValidators([Validators.required]);
      fpd?.updateValueAndValidity({ emitEvent: false });

      // Ensure the retrieved status appears in the dropdown.
      // Active-codes endpoint may omit expired/legacy codes (e.g. "DOWN") that still
      // exist on older equipment records — inject a fallback option so mat-select can
      // display and let the user re-select it.
      if (equipment.status && !this.statuses().some(s => s.value === equipment.status)) {
        this.statuses.update(list => [
          ...list,
          { value: equipment.status!, label: equipment.status!, description: '' }
        ]);
      }

      // Same safety net for location.
      if (equipment.location && !this.locations().some(l => l.value === equipment.location)) {
        this.locations.update(list => [
          ...list,
          { value: equipment.location!, label: equipment.location!, description: '' }
        ]);
      }
    }

    this.configurableDetails.set(equipment ? [
      { sequence: 1, detail: 'Chapter',            value: equipment.chapterId },
      { sequence: 2, detail: 'Last Modified Date', value: equipment.lastModifiedDate },
      { sequence: 3, detail: 'Modified By',        value: equipment.modifiedBy },
      { sequence: 4, detail: 'Audit Key',          value: equipment.auditKey?.toString() ?? null },
      { sequence: 5, detail: 'Program ID',         value: equipment.programId },
    ] : []);
    this.showEmptyState.set(false);
  }

  onClearAll(): void {
    this.form.reset();
    this.submitted.set(false);
    this.showEmptyState.set(true);
    this.equipmentData.set(null);
    this.isEditMode.set(false);
    this.equipmentIds.set([]);
    this.configurableDetails.set([]);
    this.equipTypeValue.set(null);
    this.equipIdInputValue.set(null);
    this.locationValue.set(null);
    this.statusValue.set(null);
  }

  onClearDetails(): void {
    this.submitted.set(false);
    this.equipmentData.set(null);
    this.isEditMode.set(false);
    this.form.patchValue({
      equipRef: null, instId: null, status: null, serialNumber: null,
      location: null, inServiceDate: null, outServiceDate: null,
      firstProductionDate: null, lastProductionDate: null, manufacturer: null,
      exportFlag: null, serviceContact: null, servicePhone: null,
      serviceStartDate: null, serviceEndDate: null,
    });
    this.configurableDetails.set([]);
    this.locationValue.set(null);
    this.statusValue.set(null);
  }

  onCancel(): void {
    this.onClearAll();
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      (firstInvalid as HTMLElement | null)?.focus();
      this.snackbarService.showError('Please correct the errors in the form.');
      return;
    }

    const formValue = this.form.value as EquipmentFormValue;
    const toDateStr = (v: any): string | null =>
      v ? moment(v).format('YYYY-MM-DD') : null;

    const request: CreateEquipmentRequestDto = {
      equipType:           formValue.equipType!,
      equipId:             formValue.equipId!,
      instId:              formValue.instId?.trim() || null,
      serialNumber:        formValue.serialNumber,
      location:            formValue.location,
      status:              formValue.status ?? 'IN',
      manufacturer:        formValue.manufacturer,
      osokFlag:            formValue.exportFlag,
      inServiceDate:       toDateStr(formValue.inServiceDate),
      outServiceDate:      toDateStr(formValue.outServiceDate),
      firstProductionDate: toDateStr(formValue.firstProductionDate)!,
      lastProductionDate:  toDateStr(formValue.lastProductionDate),
      serviceContact:      formValue.serviceContact,
      servicePhone:        formValue.servicePhone,
      serviceStartDate:    toDateStr(formValue.serviceStartDate),
      serviceEndDate:      toDateStr(formValue.serviceEndDate),
    };

    this.loading.set(true);

    if (this.isEditMode()) {
      const equipRef = this.equipmentData()!.equipReference;
      this.equipmentApiService
        .update(request.equipType, request.equipId, equipRef, request as UpdateEquipmentRequestDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess(`Equipment ${equipRef} updated successfully.`);
            this.loading.set(false);
          },
          error: err => {
            this.handleError('Failed to update equipment', err);
            this.loading.set(false);
          }
        });
    } else {
      this.equipmentApiService.create(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: result => {
            const equipRef = result.item?.equipReference ?? result.data?.equipReference ?? '';
            this.snackbarService.showSuccess(`Equipment ${equipRef} created successfully.`);
            this.onClearAll();
            this.loading.set(false);
          },
          error: err => {
            this.handleError('Failed to create equipment', err);
            this.loading.set(false);
          }
        });
    }
  }

  // ── Date validation (mirrors document-library pattern) ─────────────────────

  private setupDateValidationListeners(): void {
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());
  }

  onDatePickerClosed(): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  // Input handlers — clears or flags invalid date when user types manually.
  onInServiceDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('inServiceDate'), this.isEditMode()
    );
  }
  onOutServiceDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('outServiceDate'), this.isEditMode()
    );
  }
  onFirstProdDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('firstProductionDate')
    );
  }
  onLastProdDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('lastProductionDate'), this.isEditMode()
    );
  }
  onServiceStartDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('serviceStartDate'), this.isEditMode()
    );
  }
  onServiceEndDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('serviceEndDate'), this.isEditMode()
    );
  }

  // Change handlers — mark touched/dirty so validators and error state run.
  onInServiceDateChange(): void {
    this.form.get('inServiceDate')?.markAsTouched();
    this.form.get('inServiceDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
  onOutServiceDateChange(): void {
    this.form.get('outServiceDate')?.markAsTouched();
    this.form.get('outServiceDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
  onFirstProdDateChange(): void {
    this.form.get('firstProductionDate')?.markAsTouched();
    this.form.get('firstProductionDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
  onLastProdDateChange(): void {
    this.form.get('lastProductionDate')?.markAsTouched();
    this.form.get('lastProductionDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
  onServiceStartDateChange(): void {
    this.form.get('serviceStartDate')?.markAsTouched();
    this.form.get('serviceStartDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
  onServiceEndDateChange(): void {
    this.form.get('serviceEndDate')?.markAsTouched();
    this.form.get('serviceEndDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  // Error message getters — consumed by error state matchers and mat-error content.
  getInServiceDateError(): string {
    const ctrl = this.form.get('inServiceDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDate')) return 'In Service Date is invalid';
    if (ctrl.hasError('futureDate')) return 'In Service Date cannot be a future date';
    return '';
  }
  getOutServiceDateError(): string {
    const ctrl = this.form.get('outServiceDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDate')) return 'Out of Service Date is invalid';
    if (ctrl.hasError('matDatepickerMin')) return 'Out of Service Date must be on or after In Service Date';
    return '';
  }
  getFirstProdDateError(): string {
    const ctrl = this.form.get('firstProductionDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDate')) return 'First Prod Date is invalid';
    if (ctrl.hasError('required')) return 'First Prod Date is required';
    if (ctrl.hasError('pastDate')) return 'First Prod Date cannot be a past date';
    if (ctrl.hasError('matDatepickerMin')) return 'First Prod Date must be today or later';
    return '';
  }
  getLastProdDateError(): string {
    const ctrl = this.form.get('lastProductionDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDate')) return 'Last Prod Date is invalid';
    if (ctrl.hasError('pastDate')) return 'Last Prod Date cannot be a past date';
    if (ctrl.hasError('matDatepickerMin')) return 'Last Prod Date must be on or after First Prod Date';
    return '';
  }
  getServiceStartDateError(): string {
    const ctrl = this.form.get('serviceStartDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDate')) return 'Service Contract Start Date is invalid';
    if (ctrl.hasError('futureDate')) return 'Service Contract Start Date cannot be a future date';
    return '';
  }
  getServiceEndDateError(): string {
    const ctrl = this.form.get('serviceEndDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDate')) return 'Service Contract End Date is invalid';
    if (ctrl.hasError('matDatepickerMin')) return 'Service Contract End Date must be on or after Service Contract Start Date';
    return '';
  }

  // GAP-18: uppercase serial number on input
  onSerialNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart;
    this.form.get('serialNumber')?.setValue(input.value.toUpperCase(), { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const code = event.which ?? event.keyCode;
    if (code < 48 || code > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    const msg = error?.error?.errorResponse?.error || error?.error?.message || error?.message || message;
    this.snackbarService.showError(msg);
  }
}
