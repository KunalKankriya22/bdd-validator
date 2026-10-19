import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared imports
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

// Module imports
import { EquipmentEventApiService } from './services/equipment-event-api.service';
import {
  EquipmentEventDto,
  CreateEquipmentEventRequestDto,
  UpdateEquipmentEventRequestDto,
  EquipmentEventFormValue,
  LookupItem,
  EquipmentItem
} from './models/equipment-event.model';
import {
  downtimeFlagValidator,
  dateTimeFormatValidator,
  parseDateTimeToISO,
  formatISOToDateTime
} from './validators/equipment-event.validators';

@Component({
  selector: 'app-enter-equipment-downtime',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './enter-equipment-downtime.html',
  styleUrl: './enter-equipment-downtime.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnterEquipmentDowntimeComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-equipment-downtime-${EnterEquipmentDowntimeComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(EquipmentEventApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly eventData = signal<EquipmentEventDto | null>(null);
  protected readonly isEditMode = signal<boolean>(false);

  // Loading states for dropdowns
  protected readonly loadingEquipmentTypes = signal<boolean>(false);
  protected readonly loadingEquipmentList = signal<boolean>(false);
  protected readonly loadingDowntimeCodes = signal<boolean>(false);
  protected readonly loadingServiceCodes = signal<boolean>(false);

  // Dropdown options
  protected readonly equipmentTypes = signal<LookupItem[]>([]);
  protected readonly equipmentList = signal<EquipmentItem[]>([]);
  protected readonly downtimeTypes = signal<LookupItem[]>([]);
  protected readonly serviceTypes = signal<LookupItem[]>([]);

  protected readonly scheduledOptions = signal<LookupItem[]>([
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ]);

  // Search controls for LOV dropdowns
  protected readonly equipmentTypeSearch = new FormControl('');
  protected readonly equipmentIdSearch = new FormControl('');
  protected readonly downtimeTypeSearch = new FormControl('');
  protected readonly serviceTypeSearch = new FormControl('');

  // Filtered LOV options
  protected readonly filteredEquipmentTypes = signal<LookupItem[]>([]);
  protected readonly filteredEquipmentList = signal<EquipmentItem[]>([]);
  protected readonly filteredDowntimeTypes = signal<LookupItem[]>([]);
  protected readonly filteredServiceTypes = signal<LookupItem[]>([]);

  // Auto-populated display values (updated via form subscriptions)
  protected readonly selectedEquipmentDescription = signal<string>('');
  protected readonly selectedEquipmentRef = signal<string>('');
  protected readonly selectedDowntimeDescription = signal<string>('');
  protected readonly selectedServiceDescription = signal<string>('');

  protected readonly displayEventId = computed(() => {
    return this.eventData()?.eventReference || '-';
  });

  // Form
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  form!: FormGroup;

  // Page header configuration — title & subtitle resolved from menu API via PageHeaderService
  protected pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadLookupData();
    this.checkEditMode();
    this.setupFormSubscriptions();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadLookupData();
      });
  }

  private loadLookupData(): void {
    this.loadingEquipmentTypes.set(true);
    this.apiService.getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.equipmentTypes.set(data);
          this.filteredEquipmentTypes.set(data);
          this.loadingEquipmentTypes.set(false);
        },
        error: (err) => {
          console.error('Failed to load equipment types:', err);
          this.loadingEquipmentTypes.set(false);
        }
      });

    this.loadingDowntimeCodes.set(true);
    this.apiService.getDowntimeCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.downtimeTypes.set(data);
          this.filteredDowntimeTypes.set(data);
          this.loadingDowntimeCodes.set(false);
        },
        error: (err) => {
          console.error('Failed to load downtime codes:', err);
          this.loadingDowntimeCodes.set(false);
        }
      });

    this.loadingServiceCodes.set(true);
    this.apiService.getServiceCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.serviceTypes.set(data);
          this.filteredServiceTypes.set(data);
          this.loadingServiceCodes.set(false);
        },
        error: (err) => {
          console.error('Failed to load service codes:', err);
          this.loadingServiceCodes.set(false);
        }
      });
  }

  private loadEquipmentList(equipmentType: string): void {
    if (!equipmentType) {
      this.equipmentList.set([]);
      this.filteredEquipmentList.set([]);
      return;
    }

    this.loadingEquipmentList.set(true);
    this.apiService.getEquipmentList(equipmentType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.equipmentList.set(data);
          this.filteredEquipmentList.set(data);
          this.equipmentIdSearch.setValue('');
          this.loadingEquipmentList.set(false);
        },
        error: (err) => {
          console.error('Failed to load equipment list:', err);
          this.equipmentList.set([]);
          this.filteredEquipmentList.set([]);
          this.loadingEquipmentList.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Equipment Selection
      equipmentType: [null, [Validators.required]],
      equipmentId: [null, [Validators.required]],
      equipReference: [{ value: null, disabled: true }],

      // Event Info
      scheduled: [null, [Validators.required, downtimeFlagValidator()]],

      // Downtime Details
      downtimeType: [null],
      downtimeStart: [null, [dateTimeFormatValidator()]],
      downtimeEnd: [null, [dateTimeFormatValidator()]],

      // Service Details
      serviceType: [null],
      servicePerson: [null, [Validators.maxLength(63)]],
      serviceCompany: [null, [Validators.maxLength(63)]],
      serviceStart: [null, [dateTimeFormatValidator()]],
      serviceEnd: [null, [dateTimeFormatValidator()]]
    });
  }

  private checkEditMode(): void {
    const eventReference = this.route.snapshot.paramMap.get('eventReference');
    if (eventReference) {
      this.isEditMode.set(true);
      this.loadEventData(eventReference);
    }
  }

  private loadEventData(eventReference: string): void {
    this.loading.set(true);
    this.apiService.getEventById(eventReference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.eventData.set(response.data);
            this.populateForm(response.data);
          } else {
            this.snackbarService.showError(this.formatErrorMessage(response.errorResponse?.errorCode, response.errorResponse?.error, response.message));
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(this.formatErrorMessage(err?.error?.errorResponse?.errorCode, err?.error?.errorResponse?.error, err?.error?.message));
          this.loading.set(false);
        }
      });
  }

  private populateForm(data: EquipmentEventDto): void {
    this.form.patchValue({
      scheduled: data.downtimeFlag,
      downtimeType: data.downtimeCode,
      downtimeStart: formatISOToDateTime(data.downtimeStart),
      downtimeEnd: formatISOToDateTime(data.downtimeEnd),
      serviceType: data.serviceCode,
      servicePerson: data.servicePerson,
      serviceCompany: data.serviceCompany,
      serviceStart: formatISOToDateTime(data.serviceStart),
      serviceEnd: formatISOToDateTime(data.serviceEnd)
    });

    const dtItem = this.downtimeTypes().find(d => d.code === data.downtimeCode);
    this.selectedDowntimeDescription.set(dtItem?.description || '');

    const svcItem = this.serviceTypes().find(s => s.code === data.serviceCode);
    this.selectedServiceDescription.set(svcItem?.description || '');
  }

  private setupFormSubscriptions(): void {
    this.form.get('equipmentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((equipmentType) => {
        this.form.patchValue({ equipmentId: null, equipReference: null });
        const type = this.equipmentTypes().find(t => t.code === equipmentType);
        this.selectedEquipmentDescription.set(type?.description || '');
        this.selectedEquipmentRef.set('');
        this.loadEquipmentList(equipmentType);
      });

    this.form.get('equipmentId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((equipmentId) => {
        const equipment = this.equipmentList().find(eq => eq.equipmentId === equipmentId);
        this.form.patchValue({ equipReference: equipment?.equipReference || null });
        this.selectedEquipmentRef.set(equipment?.equipReference || '');
      });

    this.form.get('downtimeType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const item = this.downtimeTypes().find(d => d.code === code);
        this.selectedDowntimeDescription.set(item?.description || '');
      });

    this.form.get('serviceType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const item = this.serviceTypes().find(s => s.code === code);
        this.selectedServiceDescription.set(item?.description || '');
      });
  }

  private setupSearchFilters(): void {
    this.equipmentTypeSearch.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredEquipmentTypes.set(
          this.equipmentTypes().filter(
            (t) => t.code.toLowerCase().includes(search) || t.description.toLowerCase().includes(search)
          )
        );
      });

    this.equipmentIdSearch.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredEquipmentList.set(
          this.equipmentList().filter(
            (e) => e.equipmentId.toLowerCase().includes(search) || e.equipReference.toLowerCase().includes(search)
          )
        );
      });

    this.downtimeTypeSearch.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredDowntimeTypes.set(
          this.downtimeTypes().filter(
            (d) => d.code.toLowerCase().includes(search) || d.description.toLowerCase().includes(search)
          )
        );
      });

    this.serviceTypeSearch.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredServiceTypes.set(
          this.serviceTypes().filter(
            (s) => s.code.toLowerCase().includes(search) || s.description.toLowerCase().includes(search)
          )
        );
      });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (this.isEditMode()) {
      this.updateEvent();
    } else {
      this.createEvent();
    }
  }

  private createEvent(): void {
    this.saving.set(true);

    const formValue: EquipmentEventFormValue = this.form.value;
    const equipment = this.equipmentList().find(eq => eq.equipmentId === formValue.equipmentId);

    if (!equipment) {
      this.snackbarService.showError('Equipment not found');
      this.saving.set(false);
      return;
    }

    const dto: CreateEquipmentEventRequestDto = {
      equipReference: equipment.equipReference,
      downtimeFlag: formValue.scheduled,
      downtimeCode: formValue.downtimeType,
      downtimeStart: parseDateTimeToISO(formValue.downtimeStart),
      downtimeEnd: parseDateTimeToISO(formValue.downtimeEnd),
      serviceCode: formValue.serviceType,
      servicePerson: formValue.servicePerson,
      serviceCompany: formValue.serviceCompany,
      serviceStart: parseDateTimeToISO(formValue.serviceStart),
      serviceEnd: parseDateTimeToISO(formValue.serviceEnd)
    };

    this.apiService.createEvent(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const data = response.data;
            const eventRef = Array.isArray(data)
              ? data[0]?.eventReference || data[0]?.EventReference
              : data?.eventReference;
            if (eventRef) {
              this.eventData.set({ eventReference: eventRef } as EquipmentEventDto);
            }
            this.snackbarService.showSuccess(response.message!);
          } else {
            this.snackbarService.showError(this.formatErrorMessage(response.errorResponse?.errorCode, response.errorResponse?.error, response.message));
          }
          this.saving.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(this.formatErrorMessage(err?.error?.errorResponse?.errorCode, err?.error?.errorResponse?.error, err?.error?.message));
          this.saving.set(false);
        }
      });
  }

  private updateEvent(): void {
    const eventReference = this.eventData()?.eventReference;
    if (!eventReference) {
      return;
    }

    this.saving.set(true);

    const formValue: EquipmentEventFormValue = this.form.value;

    const dto: UpdateEquipmentEventRequestDto = {
      downtimeFlag: formValue.scheduled,
      downtimeCode: formValue.downtimeType,
      downtimeStart: parseDateTimeToISO(formValue.downtimeStart),
      downtimeEnd: parseDateTimeToISO(formValue.downtimeEnd),
      serviceCode: formValue.serviceType,
      servicePerson: formValue.servicePerson,
      serviceCompany: formValue.serviceCompany,
      serviceStart: parseDateTimeToISO(formValue.serviceStart),
      serviceEnd: parseDateTimeToISO(formValue.serviceEnd)
    };

    this.apiService.updateEvent(eventReference, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess(response.message!);
            this.saving.set(false);
          } else {
            this.snackbarService.showError(this.formatErrorMessage(response.errorResponse?.errorCode, response.errorResponse?.error, response.message));
            this.saving.set(false);
          }
        },
        error: (err) => {
          this.snackbarService.showError(this.formatErrorMessage(err?.error?.errorResponse?.errorCode, err?.error?.errorResponse?.error, err?.error?.message));
          this.saving.set(false);
        }
      });
  }

  private formatErrorMessage(errorCode?: string, error?: string, fallback?: string): string {
    if (errorCode && error) {
      return `Error ${errorCode}: ${error}`;
    }
    return error || fallback || 'An unexpected error occurred';
  }

  onClearAll(): void {
    this.formDirective?.resetForm();
    this.submitted.set(false);
    this.eventData.set(null);
    this.selectedEquipmentDescription.set('');
    this.selectedEquipmentRef.set('');
    this.selectedDowntimeDescription.set('');
    this.selectedServiceDescription.set('');
    this.equipmentList.set([]);
    this.filteredEquipmentList.set([]);
  }
}
