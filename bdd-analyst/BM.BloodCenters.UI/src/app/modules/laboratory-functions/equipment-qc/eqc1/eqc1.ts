import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Moment } from 'moment';
import moment from 'moment';

import { Eqc1ApiService } from './services/eqc1-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '@core/utils/date-adapter.util';

import type {
  EquipmentType,
  EquipmentLookup,
  QcType,
  QcResult,
  QcProcedure,
  QcDetailHeader,
  CreateQcRequest,
  QcEvent,
  SystemUser
} from './models/eqc1.model';

function timeFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const value = control.value.toString().trim();
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value) ? null : { invalidTimeFormat: true };
}

@Component({
  selector: 'app-eqc1',
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
    DataTable,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './eqc1.html',
  styleUrl: './eqc1.scss'
})
export class Eqc1Component implements OnInit, OnDestroy {
  @ViewChild('valueCellTpl', { static: true }) valueCellTpl!: TemplateRef<unknown>;

  private static nextId = 0;
  protected readonly componentId = `eqc1-${Eqc1Component.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(Eqc1ApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();
  private readonly cancelLoadHeader$ = new Subject<void>();

  protected readonly equipmentTypes = signal<EquipmentType[]>([]);
  protected readonly equipmentIds = signal<EquipmentLookup[]>([]);
  protected readonly equipmentRefs = signal<EquipmentLookup[]>([]);
  protected readonly qcTypes = signal<QcType[]>([]);
  protected readonly qcResults = signal<QcResult[]>([]);
  protected readonly qcProcedures = signal<QcProcedure[]>([]);
  protected readonly reviewCode = signal<string>('');
  protected readonly users = signal<SystemUser[]>([]);
  protected readonly qcEvents = signal<QcEvent[]>([]);
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly existingQcReference = signal<string>('');

  protected readonly loading = signal<boolean>(false);
  protected readonly loadingLookups = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly formDirty = signal<boolean>(false);
  protected readonly hasProgrammaticData = signal<boolean>(false);

  protected readonly equipmentTypeDescription = signal<string>('-');
  protected readonly qcHeader = signal<QcDetailHeader>({
    qcRefNo: '-',
    qcTypeCode: '',
    qcTypeDescription: '-',
    qcTech1: '-',
    qcResultCode: '',
    qcResultDescription: '-',
    qcStatus: '',
    qcStatusDescription: '-'
  });

  protected readonly showQcDetails = signal<boolean>(false);
  protected readonly showQcTable = signal<boolean>(false);

  protected readonly maxQcDate = computed(() =>
    this.chapterTimezoneService.chapterLocalDate()?.clone().endOf('day')
  );

  readonly qcDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getQcDateError()
  );

  protected readonly hasData = computed(() => this.qcProcedures().length > 0);
  protected readonly hasQcEvents = computed(() => this.qcEvents().length > 0);

  equipmentTypeSearchCtrl = new FormControl('');
  deviceIdSearchCtrl = new FormControl('');
  equipmentRefSearchCtrl = new FormControl('');
  qcResultSearchCtrl = new FormControl('');
  qcTypeSearchCtrl = new FormControl('');
  barcodeCtrl = new FormControl('');
  qcTech1SearchCtrl = new FormControl('');

  private equipmentTypeSearchTerm = signal('');
  private deviceIdSearchTerm = signal('');
  private equipmentRefSearchTerm = signal('');
  private qcResultSearchTerm = signal('');
  private qcTypeSearchTerm = signal('');
  private qcTech1SearchTerm = signal('');

  protected filteredEquipmentTypes = computed(() => {
    const term = this.equipmentTypeSearchTerm().toLowerCase();
    const list = this.equipmentTypes();
    if (!term) return list;
    return list.filter(t => t.code.toLowerCase().includes(term) || t.description.toLowerCase().includes(term));
  });

  protected filteredDevices = computed(() => {
    const term = this.deviceIdSearchTerm().toLowerCase();
    const list = this.equipmentIds();
    if (!term) return list;
    return list.filter(d => d.equipId.toLowerCase().includes(term));
  });

  protected filteredEquipmentRefs = computed(() => {
    const term = this.equipmentRefSearchTerm().toLowerCase();
    const list = this.equipmentRefs();
    if (!term) return list;
    return list.filter(r => r.equipReference.toLowerCase().includes(term));
  });

  protected filteredQcResults = computed(() => {
    const term = this.qcResultSearchTerm().toLowerCase();
    const list = this.qcResults();
    if (!term) return list;
    return list.filter(r => r.code.toLowerCase().includes(term) || r.description.toLowerCase().includes(term));
  });

  protected filteredQcTypes = computed(() => {
    const term = this.qcTypeSearchTerm().toLowerCase();
    const list = this.qcTypes();
    if (!term) return list;
    return list.filter(t => t.qcType.toLowerCase().includes(term) || t.description.toLowerCase().includes(term));
  });

  protected filteredUsers = computed(() => {
    const term = this.qcTech1SearchTerm().toLowerCase();
    const list = this.users();
    if (!term) return list;
    return list.filter(u => u.userName.toLowerCase().includes(term));
  });

  protected tableConfig!: DataTableConfig<QcProcedure>;
  protected qcEventsTableConfig!: DataTableConfig<QcEvent>;

  form!: FormGroup;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
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

    effect(() => {
      const chapterDateTime = this.chapterTimezoneService.chapterLocalDateTime();
      if (chapterDateTime && this.form) {
        const dateCtrl = this.form.get('qcDate');
        const timeCtrl = this.form.get('qcTime');
        if (dateCtrl && !dateCtrl.dirty) {
          dateCtrl.setValue(chapterDateTime.clone(), { emitEvent: false });
        }
        if (timeCtrl && !timeCtrl.dirty) {
          timeCtrl.setValue(chapterDateTime.format('HH:mm'), { emitEvent: false });
        }
      }
    });
  }

  ngOnInit(): void {
    this.initTableConfig();
    this.initForm();
    this.loadEquipmentTypes();
    this.loadQcResults();
    this.loadUsers();
    this.setupFormListeners();
    this.setupSearchSignals();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadEquipmentTypes();
      });
  }

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'qcItem', header: 'QC Procedure', minWidth: '150px' },
        { key: 'targetValue', header: 'Target', minWidth: '80px' },
        { key: 'qcUnits', header: 'Data', minWidth: '70px' },
        { key: 'minAccept', header: 'Min', minWidth: '70px' },
        { key: 'maxAccept', header: 'Max', minWidth: '70px' },
        { key: 'actualValue', header: 'Value', minWidth: '120px', cellTemplate: this.valueCellTpl },
        { key: 'interpretation', header: 'Obtained', minWidth: '100px', valueFormatter: (value: string | null) => value === 'A' ? 'Acceptable' : value === 'N' ? 'Unacceptable' : (value ?? '') }
      ],
      showPagination: false,
      stickyHeader: true,
      emptyMessage: 'No data available',
      showTableOnEmpty: true,
      enableRowHighlight: false
    };

    this.qcEventsTableConfig = {
      columns: [
        { key: 'qcReference', header: 'QC Ref No.', minWidth: '120px' },
        { key: 'qcType', header: 'QC Type', minWidth: '100px' },
        { key: 'qcDate', header: 'QC Date', minWidth: '120px', valueFormatter: (value: string) => {
          if (!value) return '-';
          const m = moment.utc(value);
          if (!m.isValid()) return value;
          const local = this.chapterTimezoneService.convertGmtToLocal(m);
          return local.format('DD-MMM-YYYY HH:mm');
        }},
        { key: 'qcStatus', header: 'Status', minWidth: '80px' }
      ],
      showPagination: false,
      stickyHeader: true,
      emptyMessage: 'No QC history available',
      showTableOnEmpty: false,
      enableRowHighlight: false
    };
  }

  ngOnDestroy(): void {
    this.cancelLoadHeader$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createQcDateTimeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const date = group.get('qcDate')?.value;
      const time = group.get('qcTime')?.value;

      if ((date && !time) || (!date && time)) {
        return { qcDateTimeRequired: true };
      }

      if (date && time && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        const chapterNow = this.chapterTimezoneService.chapterLocalDateTime();
        if (chapterNow) {
          const [hours, minutes] = (time as string).split(':').map(Number);
          const combined = (date as Moment).clone().hour(hours).minute(minutes).second(0);
          if (combined.isAfter(chapterNow)) {
            return { qcFutureTime: true };
          }
        }
      }

      return null;
    };
  }

  private initForm(): void {
    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    const loggedInUser = this.loginService.getStoredUsername() || '';
    this.form = this.fb.group({
      equipmentType: ['', [Validators.required]],
      deviceId: ['', [Validators.required]],
      equipmentRefNo: ['', [Validators.required]],
      qcType: ['', [Validators.required]],
      qcTech1: [loggedInUser, [Validators.required]],
      qcResult: ['', [Validators.required]],
      qcDate: [chapterNow, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]],
      qcTime: [chapterNow.format('HH:mm'), [Validators.required, timeFormatValidator]]
    }, { validators: this.createQcDateTimeValidator() });
  }

  private setupFormListeners(): void {
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formDirty.set(this.form.dirty);
      });

    this.form.get('qcTech1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tech1 => {
        this.qcHeader.update(h => ({ ...h, qcTech1: tech1 || '-' }));
      });

    this.form.get('equipmentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(equipmentType => {
        if (equipmentType) {
          this.onEquipmentTypeChange(equipmentType);
        } else {
          this.equipmentIds.set([]);
          this.equipmentRefs.set([]);
          this.qcTypes.set([]);
          this.showQcDetails.set(false);
          this.showQcTable.set(false);
          this.form.patchValue({
            deviceId: '',
            equipmentRefNo: '',
            qcType: ''
          }, { emitEvent: false });
        }
      });

    this.form.get('deviceId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(deviceId => {
        if (deviceId && this.form.get('equipmentType')?.value) {
          this.onDeviceIdChange(deviceId);
        } else {
          this.equipmentRefs.set([]);
          this.showQcDetails.set(false);
          this.showQcTable.set(false);
          this.qcEvents.set([]);
          this.form.patchValue({ equipmentRefNo: '' }, { emitEvent: false });
        }
      });

    this.form.get('equipmentRefNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(equipmentRefNo => {
        if (equipmentRefNo && this.form.get('equipmentType')?.value && this.form.get('deviceId')?.value) {
          this.showQcDetails.set(true);
          this.qcHeader.update(h => ({
            ...h,
            qcRefNo: equipmentRefNo,
            qcTech1: this.form.get('qcTech1')?.value || '-',
            qcTypeCode: '',
            qcTypeDescription: '-',
            qcResultCode: '',
            qcResultDescription: '-',
            qcStatus: '',
            qcStatusDescription: '-'
          }));
          this.form.patchValue({ qcType: '', qcResult: '' }, { emitEvent: false });
          this.showQcTable.set(false);
          this.qcProcedures.set([]);
          this.isEditMode.set(false);
          this.existingQcReference.set('');
          this.cancelLoadHeader$.next();
          this.loadQcHeader(equipmentRefNo);
          this.loadQcEventsForRef(equipmentRefNo);
        } else {
          this.showQcDetails.set(false);
          this.showQcTable.set(false);
          this.qcProcedures.set([]);
          this.qcEvents.set([]);
          this.isEditMode.set(false);
          this.existingQcReference.set('');
        }
      });

    this.form.get('qcType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(qcType => {
        if (qcType) {
          const selectedType = this.qcTypes().find(t => t.qcType === qcType);
          this.qcHeader.update(h => ({
            ...h,
            qcTypeCode: qcType,
            qcTypeDescription: selectedType?.description || '-',
            qcTech1: this.form.get('qcTech1')?.value || '-'
          }));
          this.loadQcControlDetails();
          this.loadReviewCode();
        } else {
          this.qcHeader.update(h => ({
            ...h,
            qcTypeCode: '',
            qcTypeDescription: '-'
          }));
          this.showQcTable.set(false);
          this.qcProcedures.set([]);
        }
      });

    this.form.get('qcResult')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(resultCode => {
        if (resultCode) {
          const selectedResult = this.qcResults().find(r => r.code === resultCode);
          const review = this.reviewCode();
          let qcStatus = '';
          let qcStatusDescription = '';

          if (review === '1') {
            qcStatus = resultCode === 'A' ? 'A' : resultCode === 'U' ? 'U' : resultCode;
            qcStatusDescription = resultCode === 'A' ? 'Acceptable' : resultCode === 'U' ? 'Unacceptable' : (selectedResult?.description || '-');
          } else if (review === '2' || review === '2D') {
            qcStatus = 'I';
            qcStatusDescription = 'Incomplete - needs 2nd tech';
          } else {
            qcStatus = resultCode;
            qcStatusDescription = selectedResult?.description || '-';
          }

          this.qcHeader.update(h => ({
            ...h,
            qcResultCode: resultCode,
            qcResultDescription: selectedResult?.description || '-',
            qcStatus,
            qcStatusDescription
          }));
        } else {
          this.qcHeader.update(h => ({
            ...h,
            qcResultCode: '',
            qcResultDescription: '-',
            qcStatus: '',
            qcStatusDescription: '-'
          }));
        }
      });
  }

  private setupSearchSignals(): void {
    this.equipmentTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.equipmentTypeSearchTerm.set(v ?? ''));

    this.deviceIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.deviceIdSearchTerm.set(v ?? ''));

    this.equipmentRefSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.equipmentRefSearchTerm.set(v ?? ''));

    this.qcResultSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.qcResultSearchTerm.set(v ?? ''));

    this.qcTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.qcTypeSearchTerm.set(v ?? ''));

    this.qcTech1SearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.qcTech1SearchTerm.set(v ?? ''));
  }

  private loadEquipmentTypes(): void {
    this.loadingLookups.set(true);
    this.apiService.getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.equipmentTypes.set(types);
          this.loadingLookups.set(false);
        },
        error: () => {
          this.loadingLookups.set(false);
        }
      });
  }

  private loadQcResults(): void {
    this.apiService.getQcResults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => this.qcResults.set(results),
        error: () => {}
      });
  }

  private loadUsers(): void {
    this.apiService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => {}
      });
  }

  private loadQcHeader(equipmentRefNo: string): void {
    this.apiService.getQcHeader(equipmentRefNo)
      .pipe(takeUntil(this.cancelLoadHeader$), takeUntil(this.destroy$))
      .subscribe({
        next: (headers) => {
          const header = headers?.[0];
          if (header) {
            this.isEditMode.set(true);
            this.existingQcReference.set(header.qcReference);

            let qcDate = this.chapterTimezoneService.getChapterLocalDateTime();
            let qcTime = qcDate.format('HH:mm');
            if (header.qcDate) {
              const utc = moment.utc(header.qcDate);
              if (utc.isValid()) {
                const local = this.chapterTimezoneService.convertGmtToLocal(utc);
                qcDate = local;
                qcTime = local.format('HH:mm');
              }
            }

            this.form.patchValue({
              qcType: header.qcType,
              qcTech1: header.qcTech1,
              qcResult: header.qcResult1,
              qcDate,
              qcTime
            }, { emitEvent: true });

            // Override any status that qcResult.valueChanges computed with a stale
            // reviewCode — the API response carries the authoritative persisted values.
            this.qcHeader.update(h => ({
              ...h,
              qcRefNo: header.qcReference,
              qcStatus: header.qcStatus || '',
              qcStatusDescription: header.qcStatusDescription || '-'
            }));
          }
        },
        error: () => {}
      });
  }

  private loadQcEventsForRef(equipmentRefNo: string): void {
    this.apiService.getQcEvents(equipmentRefNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => this.qcEvents.set(events ?? []),
        error: () => this.qcEvents.set([])
      });
  }

  private onEquipmentTypeChange(equipmentType: string): void {
    const selectedType = this.equipmentTypes().find(t => t.code === equipmentType);
    this.equipmentTypeDescription.set(selectedType?.description || '-');

    this.loadingLookups.set(true);
    this.apiService.getEquipmentIds(equipmentType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.equipmentIds.set(ids);
          this.loadingLookups.set(false);
        },
        error: () => {
          this.loadingLookups.set(false);
        }
      });

    this.apiService.getQcTypes(equipmentType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.qcTypes.set(types),
        error: () => {}
      });
  }

  private onDeviceIdChange(deviceId: string): void {
    const equipmentType = this.form.get('equipmentType')?.value;

    this.loadingLookups.set(true);
    this.apiService.getEquipmentReferences(equipmentType, deviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (refs) => {
          this.equipmentRefs.set(refs);
          if (refs.length === 1) {
            this.form.patchValue({ equipmentRefNo: refs[0].equipReference });
            this.hasProgrammaticData.set(true);
          }
          this.loadingLookups.set(false);
        },
        error: () => {
          this.loadingLookups.set(false);
        }
      });
  }

  private loadQcControlDetails(): void {
    const equipmentType = this.form.get('equipmentType')?.value;
    const qcType = this.form.get('qcType')?.value;
    if (!equipmentType || !qcType) return;

    this.loading.set(true);
    this.error.set(null);

    this.apiService.getQcControlDetails(equipmentType, qcType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (details?.length) {
            const procedures: QcProcedure[] = details.map(d => ({
              qcId: d.qcId,
              refNumber: d.refNumber,
              arrangeBy: d.arrangeBy,
              qcItem: d.qcItem,
              qcUnits: d.qcUnits,
              targetValue: d.targetValue,
              minAccept: d.minAccept,
              maxAccept: d.maxAccept,
              actualValue: '',
              interpretation: null,
              interpretation2: null
            }));
            this.qcProcedures.set(procedures);
            if (this.isEditMode() && this.existingQcReference()) {
              this.mergeQcDetails(procedures);
            }
          } else {
            this.qcProcedures.set([]);
          }
          this.showQcTable.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.qcProcedures.set([]);
          this.showQcTable.set(true);
          this.error.set(err?.error?.message || 'Failed to load QC procedures');
          this.loading.set(false);
        }
      });
  }

  private mergeQcDetails(baseProcedures: QcProcedure[]): void {
    const qcRef = this.existingQcReference();
    this.apiService.getQcDetails(qcRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (details?.length) {
            const merged = baseProcedures.map(p => {
              const existing = details.find(d => d.qcId === p.qcId && d.arrangeBy === p.arrangeBy);
              return existing
                ? { ...p, actualValue: existing.actualValue || '', interpretation: existing.interpretation || null, interpretation2: existing.interpretation2 || null }
                : p;
            });
            this.qcProcedures.set(merged);
          }
        },
        error: () => {}
      });
  }

  private loadReviewCode(): void {
    const equipmentType = this.form.get('equipmentType')?.value;
    const qcType = this.form.get('qcType')?.value;
    if (!equipmentType || !qcType) return;

    this.apiService.getReviewCode(equipmentType, qcType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => this.reviewCode.set(result?.reviewCode || '1'),
        error: () => this.reviewCode.set('1')
      });
  }

  protected loadQcDetails(): void {
    this.loadQcControlDetails();
  }

  onProcedureValueChange(procedure: QcProcedure, newValue: string): void {
    const procedures = this.qcProcedures();
    const index = procedures.findIndex(p => p.qcId === procedure.qcId && p.arrangeBy === procedure.arrangeBy);
    if (index !== -1) {
      const units = procedure.qcUnits?.toUpperCase();
      const upperValue = (units !== 'CHAR') ? newValue.toUpperCase() : newValue;
      let interpretation: string | null = null;

      if (units === 'FREE') {
        interpretation = upperValue ? 'A' : null;
      } else if (units === 'CHAR') {
        interpretation = (upperValue === 'Yes') ? 'A' : (upperValue === 'No') ? 'N' : null;
      } else if (procedure.minAccept && procedure.maxAccept) {
        const val = parseFloat(upperValue);
        if (isNaN(val)) {
          interpretation = 'N';
        } else {
          const min = parseFloat(procedure.minAccept);
          const max = parseFloat(procedure.maxAccept);
          interpretation = (val >= min && val <= max) ? 'A' : 'N';
        }
      } else if (procedure.targetValue) {
        interpretation = (upperValue === procedure.targetValue) ? 'A' : 'N';
      } else if (upperValue) {
        interpretation = 'A';
      }

      procedures[index] = { ...procedure, actualValue: upperValue, interpretation };
      this.qcProcedures.set([...procedures]);
    }
  }

  onClearAll(): void {
    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    const loggedInUser = this.loginService.getStoredUsername() || '';
    this.form.reset();
    this.form.patchValue({
      qcDate: chapterNow,
      qcTime: chapterNow.format('HH:mm'),
      qcTech1: loggedInUser
    }, { emitEvent: false });
    this.barcodeCtrl.reset();
    this.equipmentTypeSearchCtrl.reset();
    this.deviceIdSearchCtrl.reset();
    this.equipmentRefSearchCtrl.reset();
    this.qcResultSearchCtrl.reset();
    this.qcTypeSearchCtrl.reset();
    this.qcTech1SearchCtrl.reset();
    this.cancelLoadHeader$.next();
    this.hasProgrammaticData.set(false);
    this.showQcDetails.set(false);
    this.showQcTable.set(false);
    this.equipmentIds.set([]);
    this.equipmentRefs.set([]);
    this.qcTypes.set([]);
    this.qcProcedures.set([]);
    this.qcEvents.set([]);
    this.reviewCode.set('');
    this.equipmentTypeDescription.set('-');
    this.isEditMode.set(false);
    this.existingQcReference.set('');
    this.qcHeader.set({
      qcRefNo: '-',
      qcTypeCode: '',
      qcTypeDescription: '-',
      qcTech1: loggedInUser || '-',
      qcResultCode: '',
      qcResultDescription: '-',
      qcStatus: '',
      qcStatusDescription: '-'
    });
    this.submitted.set(false);
    this.formDirty.set(false);
    this.error.set(null);
  }

  protected onBarcodeSubmit(event: Event | null): void {
    if (event) {
      event.preventDefault();
    }
    const barcode = this.barcodeCtrl.value?.trim();
    if (!barcode) return;

    this.loadingLookups.set(true);
    this.apiService.parseBarcode(barcode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.isValid) {
            this.form.patchValue({
              equipmentType: result.equipmentType,
              deviceId: result.equipmentId,
              equipmentRefNo: result.equipmentReference
            });
            this.hasProgrammaticData.set(true);
            this.barcodeCtrl.reset();
            this.equipmentTypeSearchCtrl.reset();
            this.deviceIdSearchCtrl.reset();
            this.equipmentRefSearchCtrl.reset();
          } else {
            this.snackbarService.showError('Invalid barcode. No matching equipment found.');
          }
          this.loadingLookups.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to parse barcode. Please try again or select manually.');
          this.loadingLookups.set(false);
        }
      });
  }

  private getStatusDescription(statusCode: string): string {
    switch (statusCode) {
      case 'A': return 'Acceptable';
      case 'U': return 'Unacceptable';
      case 'I': return 'Incomplete - needs 2nd tech';
      default: return statusCode;
    }
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

    const formValue = this.form.value;
    const procedures = this.qcProcedures();

    const missingValues = procedures.some(p => !p.actualValue?.trim());
    if (missingValues) {
      this.snackbarService.showError('All observed values are required before saving.');
      return;
    }

    const resultCode = formValue.qcResult;
    if (resultCode === 'A' && procedures.some(p => p.interpretation === 'N')) {
      this.snackbarService.showError('QC Result cannot be Acceptable when one or more observed values are Unacceptable.');
      return;
    }

    const equipmentRefNo = formValue.equipmentRefNo;
    const equipmentType = formValue.equipmentType;

    const dateVal: Moment = formValue.qcDate;
    const timeVal: string = formValue.qcTime || '00:00';
    let qcDateStr = '';
    if (dateVal && dateVal.isValid()) {
      const [hours, minutes] = timeVal.split(':').map(Number);
      const combined = dateVal.clone().hour(hours).minute(minutes).second(0);
      const gmtCombined = this.chapterTimezoneService.convertLocalToGmt(combined);
      qcDateStr = gmtCombined.format('YYYY-MM-DDTHH:mm:ss');
    }

    const detailItems = procedures.map(p => ({
      qcId: p.qcId,
      refNumber: p.refNumber || null,
      arrangeBy: p.arrangeBy,
      actualValue: p.actualValue,
      interpretation: p.interpretation,
      interpretation2: p.interpretation2
    }));

    this.loading.set(true);

    if (this.isEditMode() && this.existingQcReference()) {
      const qcRef = this.existingQcReference();
      this.apiService.updateQcHeader(qcRef, {
        qcType: formValue.qcType,
        qcDate: qcDateStr,
        qcTech1: formValue.qcTech1,
        qcResult1: resultCode
      }).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.apiService.updateQcDetails(qcRef, { details: detailItems })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    const savedStatus = response.data?.qcStatus || this.qcHeader().qcStatus;
                    this.snackbarService.showSuccess('QC event updated successfully');
                    this.qcHeader.update(h => ({
                      ...h,
                      qcRefNo: qcRef,
                      qcStatus: savedStatus,
                      qcStatusDescription: this.getStatusDescription(savedStatus)
                    }));
                    this.loadQcEventsForRef(this.form.get('equipmentRefNo')?.value ?? '');
                    this.loading.set(false);
                  },
                  error: (err) => {
                    this.snackbarService.showError(err?.error?.message || 'Failed to update QC details.');
                    this.loading.set(false);
                  }
                });
            } else {
              this.snackbarService.showError(response.message || 'Failed to update QC record.');
              this.loading.set(false);
            }
          },
          error: (err) => {
            this.snackbarService.showError(err?.error?.message || 'An error occurred while updating.');
            this.loading.set(false);
          }
        });
    } else {
      const request: CreateQcRequest = {
        equipmentReference: equipmentRefNo,
        equipmentType,
        qcType: formValue.qcType,
        qcTech1: formValue.qcTech1,
        qcDate: qcDateStr,
        qcResult1: resultCode,
        details: detailItems
      };

      this.apiService.createQcHeader(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              const savedStatus = response.item.qcStatus;
              this.snackbarService.showSuccess(response.message || 'QC event created successfully');
              this.isEditMode.set(true);
              this.existingQcReference.set(response.item.qcReference);
              this.qcHeader.update(h => ({
                ...h,
                qcRefNo: response.item.qcReference,
                qcStatus: savedStatus,
                qcStatusDescription: this.getStatusDescription(savedStatus)
              }));
              this.loadQcEventsForRef(this.form.get('equipmentRefNo')?.value ?? '');
            } else {
              this.snackbarService.showError(response.message || 'Failed to save QC record.');
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.snackbarService.showError(err?.error?.message || 'An error occurred while saving.');
            this.loading.set(false);
          }
        });
    }
  }

  onCancel(): void {
    this.onClearAll();
  }

  get f() {
    return this.form.controls;
  }

  protected onQcDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('qcDate')
    );
  }

  protected onTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '');
    const formatted = digits.length <= 2 ? digits : digits.substring(0, 2) + ':' + digits.substring(2, 4);
    const ctrl = this.form.get('qcTime');
    ctrl?.setValue(formatted, { emitEvent: false });
    ctrl?.markAsTouched();
    this.form.updateValueAndValidity();
    input.value = formatted;
    setTimeout(() => {
      if (document.activeElement === input) {
        input.setSelectionRange(formatted.length, formatted.length);
      }
    }, 0);
  }

  protected onTimeBlur(): void {
    this.form.get('qcTime')?.markAsTouched();
    this.form.updateValueAndValidity();
  }

  protected getQcDateError(): string {
    const ctrl = this.form.get('qcDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';

    if (ctrl.hasError('required')) {
      return 'QC date is required.';
    }

    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDateFormat') || ctrl.hasError('invalidDate')) {
      return 'QC date is invalid.';
    }

    if (ctrl.hasError('matDatepickerMax')) {
      return 'QC date cannot be a future date.';
    }

    const timeTouched = !!(this.form.get('qcTime')?.touched);
    if (this.form.hasError('qcDateTimeRequired') && (ctrl.touched || timeTouched)) {
      return 'Date and Time are mandatory.';
    }

    if (this.form.hasError('qcFutureTime') && (ctrl.touched || timeTouched)) {
      return 'QC date and time cannot be in the future.';
    }

    return '';
  }
}
