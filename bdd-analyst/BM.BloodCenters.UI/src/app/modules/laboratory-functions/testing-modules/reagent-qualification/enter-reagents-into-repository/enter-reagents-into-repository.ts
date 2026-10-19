import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { LoginService } from '@shared/services/login.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

import { minMaxTempValidator } from './validators/min-max-temp.validator';
import { expiryAfterReceivedValidator } from './validators/expiry-after-received.validator';
import { EnterReagentsApiService } from './services/enter-reagents-into-repository-api.service';
import { ReagentQueryService } from '../reagent-query/services/reagent-query.service';
import {
  ReagentStoreDto,
  CreateReagentStoreRequestDto,
} from './models/enter-reagents-into-repository.model';
import {
  TestIdOption,
  ReagentCodeDetailOption,
  CodeDescOption,
  SupplierOption,
} from '../reagent-query/models/reagent-query.model';

const DATETIME_REGEX = /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4},?\s([01]\d|2[0-3]):[0-5]\d$/i;
const DATE_ONLY_REGEX = /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/;
const DATE_WITH_RAW_TIME_REGEX = /^((0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4})\s+(\d{1,4})$/;
const MONTH_YEAR_REGEX = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/i;

const dateTimeFormatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  if (typeof value !== 'string') return { invalidDateTimeFormat: true };
  return DATETIME_REGEX.test(value) ? null : { invalidDateTimeFormat: true };
};

const monthYearFormatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  if (typeof value !== 'string') return { invalidMonthYearFormat: true };
  return MONTH_YEAR_REGEX.test(value.trim()) ? null : { invalidMonthYearFormat: true };
};

const futureMonthYearValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value || typeof value !== 'string') return null;
  const parsed = moment(value.trim(), 'MMM-YYYY', true);
  if (!parsed.isValid()) return null;
  return parsed.isAfter(moment(), 'month') ? { futureMonthYear: true } : null;
};

@Component({
  selector: 'app-enter-reagents-into-repository',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-reagents-into-repository.html',
  styleUrls: ['./enter-reagents-into-repository.scss'],
})
export class EnterReagentsIntoRepositoryComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EnterReagentsApiService);
  private readonly reagentQueryService = inject(ReagentQueryService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly apiService = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  isSupervisor = false;

  headerConfig: PageHeaderConfig = { breadcrumbs: [] };

  // Search strip
  searchForm!: FormGroup;
  testSearchCtrl = new FormControl('');
  reagentIdSearchCtrl = new FormControl('');

  // Lookups
  testOptions: TestIdOption[] = [];
  filteredTestOptions: TestIdOption[] = [];
  reagentTypeOptions: CodeDescOption[] = [];
  filteredReagentTypeOptions: CodeDescOption[] = [];
  reagentCodeOptions: ReagentCodeDetailOption[] = [];
  filteredReagentCodeOptions: ReagentCodeDetailOption[] = [];
  supplierOptions: SupplierOption[] = [];
  filteredSupplierOptions: SupplierOption[] = [];
  containerOptions: CodeDescOption[] = [];
  filteredContainerOptions: CodeDescOption[] = [];
  storageLocationOptions: CodeDescOption[] = [];
  filteredStorageLocationOptions: CodeDescOption[] = [];
  controlIndicatorOptions: CodeDescOption[] = [];
  filteredControlIndicatorOptions: CodeDescOption[] = [];
  rejectReasonOptions: CodeDescOption[] = [];
  filteredRejectReasonOptions: CodeDescOption[] = [];
  reagentIdOptions: { value: string; label: string }[] = [];
  filteredReagentIdOptions: { value: string; label: string }[] = [];

  // State
  isLoading = false;
  isSaving = false;
  showForm = false;
  isNewMode = false;
  currentReagent: ReagentStoreDto | null = null;
  isSupplierRequired = false;
  isKitLotRequired = false;
  isFormReadOnly = false;
  originalNote = '';

  // Form
  reagentForm!: FormGroup;
  reagentCodeSearchCtrl = new FormControl('');
  reagentTypeSearchCtrl = new FormControl('');
  supplierSearchCtrl = new FormControl('');
  containerSearchCtrl = new FormControl('');
  storageLocationSearchCtrl = new FormControl('');
  controlIndicatorSearchCtrl = new FormControl('');
  rejectReasonSearchCtrl = new FormControl('');

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  get maxDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EnterReagentsIntoRepository]?.path;
        if (basePath) {
          const menuItem = this.menuService.findMenuItemByPath(basePath);
          if (menuItem) {
            this.headerConfig = {
              ...this.headerConfig,
              breadcrumbs: [
                { label: 'Home', link: '/home' },
                { label: menuItem.label, link: null },
              ],
              title: menuItem.label,
              subtitle: menuItem.remarks || menuItem.subtitle || 'Enter and manage reagent inventory in the repository.',
            };
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      testId: ['', Validators.required],
      description: [{ value: '', disabled: true }],
      reagentId: ['', Validators.required],
    });

    this.initReagentForm();
    this.loadUserLabCode();
    this.loadLookups();
    this.setupSearchSubscriptions();
    this.subscribeToChapterChanges();
  }

  private loadUserLabCode(): void {
    const userId = this.loginService.getStoredUsername();
    if (!userId) return;

    this.apiService.get<any>(API.SYSTEM_USERS.GET_USER(userId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const user = response?.item || response;
          const labCode = user?.labCode || user?.testinG_LAB_CODE || '';
          if (!labCode) {
            this.snackbarService.showError('No testing lab code assigned. Access denied.');
            this.searchForm.disable();
            return;
          }
          this.isSupervisor = labCode === '99';
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initReagentForm(): void {
    this.reagentForm = this.fb.group({
      reagentType: ['', Validators.required],
      reagentTypeDesc: [{ value: '', disabled: true }],
      reagentCode: ['', Validators.required],
      reagentCodeDesc: [{ value: '', disabled: true }],
      receivedDate: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      expiryDate: ['', [Validators.required, dateTimeFormatValidator]],
      supplierCode: ['', Validators.required],
      supplierDesc: [{ value: '', disabled: true }],
      kitLot: [''],
      reagentLot: ['', Validators.required],
      containerType: [''],
      containerTypeDesc: [{ value: '', disabled: true }],
      controlIndicator: [''],
      minTemp: [null, [Validators.required, Validators.min(-999), Validators.max(999)]],
      maxTemp: [null, [Validators.required, Validators.min(-999), Validators.max(999)]],
      storageLocation: ['', Validators.required],
      storageLocationDesc: [{ value: '', disabled: true }],
      noOfTests: [null, [Validators.required, Validators.min(0)]],
      visualQc: ['', Validators.required],
      rejectReason: [''],
      rejectReasonDesc: [{ value: '', disabled: true }],
      disposition: [''],
      licensedApproved: [''],
      packageInsertDate: ['', [Validators.required, monthYearFormatValidator, futureMonthYearValidator]],
      notes: ['', Validators.maxLength(240)],
    }, {
      validators: [minMaxTempValidator(), expiryAfterReceivedValidator()]
    });

    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    this.reagentForm.get('reagentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const opt = this.reagentTypeOptions.find(o => o.code === val);
        this.reagentForm.get('reagentTypeDesc')?.setValue(opt?.description || '', { emitEvent: false });

        const controlCtrl = this.reagentForm.get('controlIndicator');
        if (val === 'C') {
          controlCtrl?.setValidators(Validators.required);
        } else {
          controlCtrl?.clearValidators();
          controlCtrl?.setValue('');
        }
        controlCtrl?.updateValueAndValidity();

        this.reagentForm.get('reagentCode')?.setValue('', { emitEvent: false });
        this.reagentForm.get('reagentCodeDesc')?.setValue('', { emitEvent: false });
        const testId = this.searchForm.get('testId')?.value;
        if (testId) {
          this.loadReagentCodes(testId, val);
        }
      });

    this.reagentForm.get('reagentCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const opt = this.reagentCodeOptions.find(o => o.reagentCode === val);
        this.reagentForm.get('reagentCodeDesc')?.setValue(opt?.reagentName || '', { emitEvent: false });

        const kitLotCtrl = this.reagentForm.get('kitLot');
        this.isKitLotRequired = opt?.masterLotRequired === 'Y';
        if (this.isKitLotRequired) {
          kitLotCtrl?.setValidators(Validators.required);
        } else {
          kitLotCtrl?.clearValidators();
        }
        kitLotCtrl?.updateValueAndValidity();

        this.reagentForm.get('controlIndicator')?.setValue('', { emitEvent: false });
        this.loadControlIndicators(opt?.controlFlag);
      });

    this.reagentForm.get('supplierCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const opt = this.supplierOptions.find(o => o.supplierCode === val);
        this.reagentForm.get('supplierDesc')?.setValue(opt?.supplierName || '', { emitEvent: false });
      });

    this.reagentForm.get('containerType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const opt = this.containerOptions.find(o => o.code === val);
        this.reagentForm.get('containerTypeDesc')?.setValue(opt?.description || '', { emitEvent: false });
      });

    this.reagentForm.get('storageLocation')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const opt = this.storageLocationOptions.find(o => o.code === val);
        this.reagentForm.get('storageLocationDesc')?.setValue(opt?.description || '', { emitEvent: false });
      });

    this.reagentForm.get('visualQc')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const rejectCtrl = this.reagentForm.get('rejectReason');
        if (val === 'N') {
          rejectCtrl?.enable();
          rejectCtrl?.setValidators(Validators.required);
        } else {
          rejectCtrl?.clearValidators();
          rejectCtrl?.setValue('');
          rejectCtrl?.disable();
          this.reagentForm.get('rejectReasonDesc')?.setValue('', { emitEvent: false });
        }
        rejectCtrl?.updateValueAndValidity();
      });

    this.reagentForm.get('rejectReason')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const opt = this.rejectReasonOptions.find(o => o.code === val);
        this.reagentForm.get('rejectReasonDesc')?.setValue(opt?.description || '', { emitEvent: false });
      });

    this.reagentForm.get('notes')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (this.originalNote && val != null && !val.startsWith(this.originalNote)) {
          this.reagentForm.get('notes')?.setValue(this.originalNote, { emitEvent: false });
        }
      });
  }

  private setupSearchSubscriptions(): void {
    this.searchForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        const opt = this.testOptions.find(o => o.testId === testId);
        this.searchForm.get('description')?.setValue(opt?.testDesc || '', { emitEvent: false });
        this.searchForm.get('reagentId')?.setValue('', { emitEvent: false });
        this.showForm = false;
        this.currentReagent = null;

        if (testId) {
          this.loadReagentCodes(testId);
          this.loadReagentIds(testId);
        }
      });

    this.testSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredTestOptions = this.testOptions.filter(o =>
          o.testId.toLowerCase().includes(term) || o.testDesc.toLowerCase().includes(term)
        );
      });

    this.reagentCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredReagentCodeOptions = this.reagentCodeOptions.filter(o =>
          o.reagentCode.toLowerCase().includes(term) || o.reagentName.toLowerCase().includes(term)
        );
      });

    this.reagentIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredReagentIdOptions = this.reagentIdOptions.filter(o =>
          o.label.toLowerCase().includes(term)
        );
      });

    this.reagentTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredReagentTypeOptions = this.reagentTypeOptions.filter(o =>
          o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
        );
      });

    this.supplierSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredSupplierOptions = this.supplierOptions.filter(o =>
          o.supplierCode.toLowerCase().includes(term) || o.supplierName.toLowerCase().includes(term)
        );
      });

    this.containerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredContainerOptions = this.containerOptions.filter(o =>
          o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
        );
      });

    this.storageLocationSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredStorageLocationOptions = this.storageLocationOptions.filter(o =>
          o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
        );
      });

    this.controlIndicatorSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredControlIndicatorOptions = this.controlIndicatorOptions.filter(o =>
          o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
        );
      });

    this.rejectReasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredRejectReasonOptions = this.rejectReasonOptions.filter(o =>
          o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
        );
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadLookups();
      });
  }

  private loadLookups(): void {
    this.reagentQueryService.getTestsFromStore().pipe(takeUntil(this.destroy$)).subscribe({
      next: tests => {
        this.testOptions = tests;
        this.filteredTestOptions = [...this.testOptions];
      },
    });

    this.reagentQueryService.getReagentTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: types => {
        this.reagentTypeOptions = types;
        this.filteredReagentTypeOptions = [...types];
      },
    });

    this.reagentQueryService.getSuppliers().pipe(takeUntil(this.destroy$)).subscribe({
      next: suppliers => {
        this.supplierOptions = suppliers;
        this.filteredSupplierOptions = [...suppliers];
      },
    });

    this.reagentQueryService.getContainerTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: containers => {
        this.containerOptions = containers;
        this.filteredContainerOptions = [...containers];
      },
    });

    this.reagentQueryService.getStorageLocations().pipe(takeUntil(this.destroy$)).subscribe({
      next: locations => {
        this.storageLocationOptions = locations;
        this.filteredStorageLocationOptions = [...locations];
      },
    });

    this.reagentQueryService.getRejectReasons().pipe(takeUntil(this.destroy$)).subscribe({
      next: reasons => {
        this.rejectReasonOptions = reasons;
        this.filteredRejectReasonOptions = [...reasons];
      },
    });

    this.reagentQueryService.getControlIndicators().pipe(takeUntil(this.destroy$)).subscribe({
      next: indicators => {
        this.controlIndicatorOptions = indicators;
        this.filteredControlIndicatorOptions = [...indicators];
      },
    });
  }

  private loadReagentCodes(testId: string, reagentType?: string): void {
    this.reagentQueryService.getReagentCodeDetails(testId, reagentType).pipe(takeUntil(this.destroy$)).subscribe({
      next: codes => {
        this.reagentCodeOptions = codes;
        this.filteredReagentCodeOptions = [...this.reagentCodeOptions];
      },
    });
  }

  private loadReagentIds(testId: string): void {
    this.reagentQueryService.getReagentStoreIds(testId).pipe(takeUntil(this.destroy$)).subscribe({
      next: ids => {
        this.reagentIdOptions = ids.map(r => ({
          value: r.reagentId,
          label: r.reagentId
        }));
        this.filteredReagentIdOptions = [...this.reagentIdOptions];
      },
    });
  }

  private loadControlIndicators(controlFlag?: string): void {
    this.reagentQueryService.getControlIndicators(controlFlag).pipe(takeUntil(this.destroy$)).subscribe({
      next: indicators => {
        this.controlIndicatorOptions = indicators;
        this.filteredControlIndicatorOptions = [...indicators];
      },
    });
  }

  onRetrieve(): void {
    const reagentId = this.searchForm.get('reagentId')?.value;

    if (reagentId === 'NEW') {
      this.isNewMode = true;
      this.isFormReadOnly = false;
      this.currentReagent = null;
      this.originalNote = '';
      this.reagentForm.reset();
      this.reagentForm.enable();
      this.showForm = true;
      return;
    }

    if (!reagentId) {
      this.snackbarService.showError('Please select a Reagent ID');
      return;
    }

    this.isLoading = true;
    const testId = this.searchForm.get('testId')?.value;
    this.api.getById(reagentId, testId).pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.currentReagent = data;
        this.isNewMode = false;
        this.isFormReadOnly = !this.isSupervisor;
        this.populateForm(data);
        if (this.isFormReadOnly) {
          this.reagentForm.disable({ emitEvent: false });
        } else {
          this.reagentForm.enable({ emitEvent: false });
          if (data.visualQcFlag !== 'N') {
            this.reagentForm.get('rejectReason')?.disable({ emitEvent: false });
          }
        }
        this.showForm = true;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private populateForm(data: ReagentStoreDto): void {
    this.reagentForm.patchValue({
      reagentType: data.reagentType,
      reagentTypeDesc: data.reagentDesc || '',
      reagentCode: data.reagentCode,
      reagentCodeDesc: data.reagentName || '',
      receivedDate: data.receivedDate ? moment(data.receivedDate) : null,
      expiryDate: data.expiryDate ? this.formatDateTime(data.expiryDate) : '',
      supplierCode: data.supplierCode || '',
      supplierDesc: data.supplierName || '',
      kitLot: data.kitLotNumber || '',
      reagentLot: data.lotNumber || '',
      containerType: data.containerId || '',
      containerTypeDesc: data.containerName || '',
      controlIndicator: data.controlInd || '',
      minTemp: data.minStorageTemp,
      maxTemp: data.maxStorageTemp,
      storageLocation: data.storageLocation || '',
      storageLocationDesc: data.storageLocName || '',
      noOfTests: data.noOfTests,
      visualQc: data.visualQcFlag || '',
      rejectReason: data.rejectReasonCode || '',
      rejectReasonDesc: data.rejectReasonDesc || '',
      disposition: data.disposition || '',
      licensedApproved: data.licensedApproved || '',
      packageInsertDate: data.packageInsertDate ? this.formatMonthYear(data.packageInsertDate) : '',
      notes: data.note || '',
    });

    this.originalNote = data.note || '';

    // Re-set controlIndicator after patchValue because the reagentType
    // valueChanges subscription clears it when type !== 'C'
    this.reagentForm.get('controlIndicator')?.setValue(data.controlInd || '', { emitEvent: false });

    const reagentOpt = this.reagentCodeOptions.find(o => o.reagentCode === data.reagentCode);
    this.loadControlIndicators(reagentOpt?.controlFlag);

    if (data.visualQcFlag !== 'N') {
      this.reagentForm.get('rejectReason')?.disable();
    }
  }

  onSave(): void {
    if (this.isNewMode && this.isSupervisor) {
      this.snackbarService.showError('Supervisors cannot create new reagents');
      return;
    }
    if (!this.isNewMode && !this.isSupervisor) {
      this.snackbarService.showError('Only supervisors can update existing reagents');
      return;
    }

    this.reagentForm.markAllAsTouched();
    if (this.reagentForm.invalid) {
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    this.isSaving = true;
    const v = this.reagentForm.getRawValue();

    const dto: CreateReagentStoreRequestDto = {
      testId: this.searchForm.get('testId')?.value,
      reagentType: v.reagentType,
      reagentCode: v.reagentCode,
      receivedDate: v.receivedDate ? DateFieldValidationUtility.serializeDateForApi(v.receivedDate) || null : null,
      expiryDate: v.expiryDate ? this.serializeDateTime(v.expiryDate) : null,
      supplierCode: v.supplierCode || null,
      kitLotNumber: v.kitLot || null,
      lotNumber: v.reagentLot,
      containerId: v.containerType || null,
      controlInd: v.controlIndicator || null,
      minStorageTemp: v.minTemp != null ? Number(v.minTemp) : null,
      maxStorageTemp: v.maxTemp != null ? Number(v.maxTemp) : null,
      storageLocation: v.storageLocation || null,
      noOfTests: Number(v.noOfTests),
      visualQcFlag: v.visualQc,
      rejectReasonCode: v.rejectReason || null,
      status: v.disposition === 'HOLD' ? 'HOLD' : null,
      licensedApproved: v.licensedApproved || null,
      packageInsertDate: v.packageInsertDate ? this.serializeMonthYear(v.packageInsertDate) : null,
      note: v.notes || null,
    };

    if (this.isNewMode) {
      this.api.create(dto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.isSaving = false;
          const warnCode = response?.errorCode || response?.errorResponse?.errorCode;
          if (warnCode === '0224') {
            this.snackbarService.showInfo(response?.errorResponse?.error || 'Warning: Reagent expiry date has passed');
          }
          const responseData = response?.data as any;
          const newReagentId = Array.isArray(responseData) ? responseData[0]?.reagentId : responseData?.reagentId;
          const successMsg = newReagentId
            ? `Reagent ${newReagentId} created successfully`
            : 'Reagent created successfully';
          this.snackbarService.showSuccess(successMsg);
          this.reagentForm.reset();
          this.showForm = false;
          this.currentReagent = null;
          this.isNewMode = false;
          this.originalNote = '';
          this.searchForm.reset();
          this.reagentIdOptions = [];
        },
        error: () => {
          this.isSaving = false;
        },
      });
    } else if (this.currentReagent) {
      const updateTestId = this.searchForm.get('testId')?.value;
      this.api.update(this.currentReagent.reagentId, updateTestId, dto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.isSaving = false;
          const warnCode = response?.errorCode || response?.errorResponse?.errorCode;
          if (warnCode === '0224') {
            this.snackbarService.showInfo(response?.errorResponse?.error || 'Warning: Reagent expiry date has passed');
          }
          this.snackbarService.showSuccess('Reagent updated successfully');
        },
        error: () => {
          this.isSaving = false;
        },
      });
    }
  }

  onCancel(): void {
    this.showForm = false;
    this.currentReagent = null;
  }

  clearAll(): void {
    this.searchForm.reset();
    this.reagentForm.reset();
    this.showForm = false;
    this.currentReagent = null;
    this.isNewMode = false;
    this.originalNote = '';
    this.reagentIdOptions = [];
  }

  clearForm(): void {
    this.originalNote = '';
    this.reagentForm.reset();
  }

  onDateInput(event: Event, controlName: string): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.reagentForm.get(controlName)
    );
  }

  preventComma(event: KeyboardEvent): void {
    if (event.key === ',') {
      event.preventDefault();
    }
  }

  onDateTimeKeydown(event: KeyboardEvent, controlName: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onDateTimeBlur(controlName);
    }
  }

  onDateTimeBlur(controlName: string): void {
    const ctrl = this.reagentForm.get(controlName);
    if (!ctrl || !ctrl.value) return;

    const value = ctrl.value.trim().toUpperCase();

    if (DATE_ONLY_REGEX.test(value)) {
      ctrl.setValue(value + ' 00:00');
      ctrl.markAsDirty();
      return;
    }

    const match = value.match(DATE_WITH_RAW_TIME_REGEX);
    if (!match) return;

    const datePart = match[1];
    const timeDigits = match[4];
    let hours: string;
    let minutes: string;

    switch (timeDigits.length) {
      case 1:
        hours = timeDigits.padStart(2, '0');
        minutes = '00';
        break;
      case 2:
        hours = timeDigits;
        minutes = '00';
        break;
      case 3:
        hours = timeDigits.substring(0, 1).padStart(2, '0');
        minutes = timeDigits.substring(1);
        break;
      case 4:
        hours = timeDigits.substring(0, 2);
        minutes = timeDigits.substring(2);
        break;
      default:
        return;
    }

    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      ctrl.setValue(`${datePart} ${hours}:${minutes}`);
      ctrl.markAsDirty();
    }
  }

  onMonthYearBlur(controlName: string): void {
    const ctrl = this.reagentForm.get(controlName);
    if (!ctrl || !ctrl.value) return;
    ctrl.setValue(ctrl.value.trim().toUpperCase());
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  private formatDateTime(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  private formatMonthYear(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('MMM-YYYY').toUpperCase() : value;
  }

  private serializeDateTime(value: string): string | null {
    if (!value) return null;
    const parsed = moment(value.replace(',', ''), 'DD-MMM-YYYY HH:mm', true);
    return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm:ss') : null;
  }

  private serializeMonthYear(value: string): string | null {
    if (!value) return null;
    const parsed = moment(value, 'MMM-YYYY', true);
    return parsed.isValid() ? parsed.startOf('month').format('YYYY-MM-DD') : null;
  }

  onNoOfTestsKeydown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    const input = event.target as HTMLInputElement;
    const currentValue = input.value.replace(/[^0-9]/g, '');
    if (!/^[0-9]$/.test(event.key) || currentValue.length >= 10) {
      event.preventDefault();
    }
  }

  onNoOfTestsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    const numVal = digits ? Number(digits) : null;
    this.reagentForm.get('noOfTests')?.setValue(numVal, { emitEvent: false });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }
}
