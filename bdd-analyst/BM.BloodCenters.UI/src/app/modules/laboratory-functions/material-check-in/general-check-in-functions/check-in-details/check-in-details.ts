import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, switchMap, EMPTY, firstValueFrom } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import moment from 'moment';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from '@core/utils/date-adapter.util';
import { A11yModule } from '@angular/cdk/a11y';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { convertUTCToTimezone, getDateInTimezone } from '@shared/date/timezone.util';
import { CheckInDetailsService } from './services/check-in-details.service';
import {
  DriveOption,
  AttributeRow,
  DropdownOption,
  AttributeCodeOption,
  MachineOption,
} from './models/check-in-details.model';


// Old MCISRCEN had no row limit on the UNIT_ATTRIBUTES multi-record block.

/**
 * Check-In Details Component
 * Mnemonic: DSCE
 * FMB: MCISRCEN
 */
@Component({
  selector: 'app-check-in-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    MatTableModule,
    A11yModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT },
    { provide: DateAdapter, useClass: CustomDateAdapter },
  ],
  templateUrl: './check-in-details.html',
  styleUrls: ['./check-in-details.scss'],
})
export class CheckInDetailsComponent implements OnInit, OnDestroy {

  private readonly fb                     = inject(FormBuilder);
  private readonly snackbarService        = inject(SnackbarService);
  private readonly dialog                 = inject(MatDialog);
  private readonly service                = inject(CheckInDetailsService);
  private readonly headerService          = inject(HeaderService);
  private readonly pageHeaderService      = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly route                  = inject(ActivatedRoute);

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private readonly destroy$ = new Subject<void>();

  // Populated from menu API via PageHeaderService
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title, link: null }],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });

    // When the chapter local date arrives from the API, correct the collection date
    // if the user hasn't manually changed it and no data has been loaded yet.
    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid() && !this.hasData()) {
        const ctrl = this.filterForm?.get('collectionDate');
        if (ctrl && !ctrl.dirty) {
          ctrl.setValue(chapterDate.toDate(), { emitEvent: false });
        }
      }
    });
  }

  // ── UI state ──────────────────────────────────────────────────────────────
  readonly driveDescription = signal<string>('');
  readonly groupSiteId      = signal<string>('');
  readonly isLoading        = signal<boolean>(false);
  readonly hasData          = signal<boolean>(false);

  // ── Display-only fields ───────────────────────────────────────────────────
  readonly donorInfo       = signal<string>('');
  readonly unitDescription = signal<string>('');
  readonly bagConfig       = signal<string>('');
  readonly configuration   = signal<string>('');
  private  _savedBagCode   = '';

  // ── ABO dropdown ──────────────────────────────────────────────────────────
  readonly aboOptions = signal<DropdownOption[]>([]);


  // ── Attributes ────────────────────────────────────────────────────────────
  readonly attributeRows         = signal<AttributeRow[]>([]);
  readonly attributeGroupOptions = signal<DropdownOption[]>([]);
  private deletedAttributes: { attribGroup: string; attribCode: string }[] = [];

  readonly showMachine = computed(() =>
    this.attributeRows().some(r => r.requiresEquipment)
  );

  readonly canAddAttribute = computed(() => true);

  // ── Bleed time validation ─────────────────────────────────────────────────
  readonly maxBleedTimeMinutes  = signal<number>(0);
  readonly slowBleedTimeMinutes = signal<number>(0);
  readonly isPheresisDonation   = signal<boolean>(false);
  readonly bleedStartDateError  = signal<string>('');
  readonly bleedStartFutureError = signal<boolean>(false);
  readonly bleedEndFutureError   = signal<boolean>(false);

  // ── Chapter config ────────────────────────────────────────────────────────
  readonly cueScanFlag      = signal<string>('Y');
  readonly timeLimitDays    = signal<number>(3);
  // True when accessed via DSCE2 (extended day limit — no date restriction for supervisors).
  // Matches FMB PRE-FORM: default_value('3','GLOBAL.TIME_LIMIT') is skipped when DSCE2 pre-sets TIME_LIMIT.
  readonly extendedDayLimit = signal<boolean>(false);

  // ── Unit state ────────────────────────────────────────────────────────────
  readonly donorDecisionCode      = signal<string>('Y');
  readonly bleedFieldsLocked      = signal<boolean>(false);
  // S-3: assertive live region for screen reader error announcements
  readonly a11yErrorMessage       = signal<string>('');
  // M-4: polite live region for attribute row add/delete announcements
  readonly attrStatusMessage      = signal<string>('');
  readonly firstSeparationTime    = signal<string | null>(null);
  readonly bleedEndBeforeStartError   = signal<boolean>(false);
  readonly bleedSepTimeError          = signal<string>('');
  readonly bleedStartTimeError = signal<string>('');
  readonly bleedEndTimeError   = signal<string>('');

  readonly bleedStartDateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!this.bleedStartDateError() || !!(this.unitForm?.get('bleedStartDate')?.invalid && this.unitForm?.get('bleedStartDate')?.touched),
  };
  readonly bleedStartTimeMatcher: ErrorStateMatcher = {
    isErrorState: () => {
      const ctrl = this.unitForm?.get('bleedStartTime');
      return this.bleedStartFutureError() || !!this.bleedStartTimeError()
        || !!(ctrl?.hasError('required') && ctrl?.touched);
    },
  };
  readonly bleedEndDateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!(this.unitForm?.get('bleedEndDate')?.invalid && this.unitForm?.get('bleedEndDate')?.touched),
  };
  readonly bleedEndTimeMatcher: ErrorStateMatcher = {
    isErrorState: () => {
      const ctrl = this.unitForm?.get('bleedEndTime');
      return this.bleedEndFutureError() || this.bleedEndBeforeStartError()
        || !!this.bleedEndTimeError() || !!this.bleedSepTimeError()
        || !!(ctrl?.hasError('required') && ctrl?.touched);
    },
  };



  // ── Collection date bounds (MCISRCEN: GLOBAL.time_limit) ─────────────────
  // When extendedDayLimit is true (DSCE2), no min-date restriction — matches FMB behaviour where
  // DSCE2 pre-sets GLOBAL.TIME_LIMIT to a large value so the 0033 check never fires.
  get minCollDate(): Date {
    if (this.extendedDayLimit()) return new Date(1900, 0, 1);
    let d: Date;
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      d = chapterDate.toDate();
    } else {
      const tz = this.chapterOffset;
      const { year, month, day } = getDateInTimezone(tz);
      d = new Date(year, month, day);
    }
    d.setDate(d.getDate() - this.timeLimitDays());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  get maxCollDate(): Date {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.toDate();
    }
    const tz = this.chapterOffset;
    const { year, month, day } = getDateInTimezone(tz);
    return new Date(year, month, day);
  }

  get collectionDateForPicker(): Date | null {
    const v = this.filterForm?.get('collectionDate')?.value;
    return v instanceof Date ? v : null;
  }

  // ── Drive dropdown ────────────────────────────────────────────────────────
  readonly driveOptions   = signal<DriveOption[]>([]);
  readonly filteredDrives = signal<DriveOption[]>([]);
  readonly drivesLoading  = signal<boolean>(false);

  readonly driveSearchCtrl = new FormControl('');

  // ── Machine ───────────────────────────────────────────────────────────────
  readonly donorCue      = signal<string>('');
  readonly serialNumber  = signal<string>('');
  readonly machineOptions = signal<MachineOption[]>([]);

  // ── Forms ─────────────────────────────────────────────────────────────────
  filterForm!: FormGroup;
  unitForm!: FormGroup;

  private _nextRowId = 1;

  readonly machineSearchCtrl = new FormControl('');
  readonly filteredMachines  = signal<MachineOption[]>([]);

  // ─────────────────────────────────────── Lifecycle ────────────────────────

  ngOnInit(): void {
    this.extendedDayLimit.set(this.route.snapshot.data['extendedDayLimit'] === true);
    this.initForms();
    this.loadAttributeGroups();
    this.loadChapterConfig();
    this.setupMachineSearch();
    this.setupDriveSearch();
    this.loadInitialDrives();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────── Form init ────────────────────────

  private initForms(): void {
    // FMB WHEN-NEW-FORM-INSTANCE: coll_date = lifetrack_timezone_convert.get_local_time(chapter_id, sysdate).
    // Initialize with null and let the ChapterTimezoneService effect set the correct server date.
    // Avoids brief wrong date when browser TZ differs from chapter TZ.
    this.filterForm = this.fb.group({
      collectionDate: [null, [Validators.required]],
      driveId:        ['',         [Validators.required]],
    });

    // unitId removed — handled by app-unit-id-field shared component
    this.unitForm = this.fb.group({
      bleedStartDate: [null, [Validators.required]],
      bleedStartTime: ['',   [Validators.required]],
      bleedEndDate:   [null, [Validators.required]],
      bleedEndTime:   ['',   [Validators.required]],
      donorFormAbo:   [null],
      bagCode:        [null],
      machine:        [null],
    });

    this.filterForm.get('driveId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (!val || !val.trim()) this.driveDescription.set('');
      });

    this.unitForm.get('donorFormAbo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        if (!code) { this.donorInfo.set(''); return; }
        const opt = this.aboOptions().find(o => o.value === code);
        this.donorInfo.set(opt ? opt.label : code);
      });

    this.unitForm.get('bleedStartDate')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(0))
      .subscribe(() => this.validateBleedStart());

    this.unitForm.get('bleedStartTime')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(0))
      .subscribe(() => this.validateBleedStart());

    this.unitForm.get('bleedEndDate')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(0))
      .subscribe(() => this.validateBleedEnd());

    this.unitForm.get('bleedEndTime')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(0))
      .subscribe(() => this.validateBleedEnd());

    this.filterForm.get('collectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.unitForm.get('bleedStartDate')?.value) this.validateBleedStart();
      });

    this.filterForm.get('collectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(val => {
        this.filterForm.get('driveId')?.setValue(null, { emitEvent: false });
        this.driveDescription.set('');
        this.groupSiteId.set('');
        this.driveSearchCtrl.setValue('', { emitEvent: false });
        if (val && this.filterForm.get('collectionDate')?.valid) {
          this.loadDrives(val);
        } else {
          this.driveOptions.set([]);
          this.filteredDrives.set([]);
        }
      });
  }

  // ─────────────────────────────────────── Machine search ───────────────────

  private setupMachineSearch(): void {
    this.machineSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.machineOptions();
        this.filteredMachines.set(
          t ? all.filter(m => m.label.toLowerCase().includes(t)) : all
        );
      });
  }

  private setupDriveSearch(): void {
    this.driveSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.driveOptions();
        this.filteredDrives.set(
          t ? all.filter(d => d.label.toLowerCase().includes(t)) : [...all]
        );
      });
  }

  private loadInitialDrives(): void {
    const collDate = this.filterForm.get('collectionDate')?.value;
    if (collDate && this.filterForm.get('collectionDate')?.valid) {
      this.loadDrives(collDate);
    }
  }

  private loadDrives(collDate: Date): void {
    const collDateStr = moment(collDate).format('DD-MMM-YYYY').toUpperCase();
    this.drivesLoading.set(true);
    this.service.getDrives(collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: drives => {
          this.drivesLoading.set(false);
          this.driveOptions.set(drives);
          this.filteredDrives.set([...drives]);
        },
        error: () => {
          this.drivesLoading.set(false);
          this.driveOptions.set([]);
          this.filteredDrives.set([]);
        },
      });
  }

  // ─────────────────────────────────────── API loads ────────────────────────

  private loadAttributeGroups(): void {
    this.service.getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: groups => this.attributeGroupOptions.set(groups),
        error: ()    => this.showError('Failed to load attribute groups.'),
      });
  }

  private loadAboValues(): void {
    this.service.getAboValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: opts => this.aboOptions.set(opts),
        error: ()  => this.showError('Failed to load ABO values.'),
      });
  }


  // Accepts HHMM (e.g. "0830") or HH:MM (e.g. "08:30") → returns "HH:MM" or null if invalid
  private parseTimeInput(raw: string): string | null {
    const s = raw.trim();
    let h: number, m: number;
    if (/^\d{4}$/.test(s)) {
      h = parseInt(s.slice(0, 2), 10);
      m = parseInt(s.slice(2, 4), 10);
    } else if (/^\d{1,2}:\d{2}$/.test(s)) {
      [h, m] = s.split(':').map(Number);
    } else {
      return null;
    }
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private combineDateTime(dateVal: Date | null, timeVal: string): Date | null {
    if (!dateVal || !timeVal) return null;
    const normalized = this.parseTimeInput(timeVal);
    if (!normalized) return null;
    const [h, m] = normalized.split(':').map(Number);
    const dt = new Date(dateVal);
    dt.setHours(h, m, 0, 0);
    return dt;
  }

  validateBleedStart(): void {
    this.bleedStartDateError.set('');
    this.bleedStartFutureError.set(false);
    this.bleedStartTimeError.set('');

    const dateVal = this.unitForm.get('bleedStartDate')?.value as Date | null;
    const timeVal = (this.unitForm.get('bleedStartTime')?.value ?? '') as string;

    if (!dateVal && !timeVal) return;

    if (dateVal) {
      const collDate = this.filterForm.get('collectionDate')?.value as Date | null;
      if (collDate) {
        const dStr = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;
        const cStr = `${collDate.getFullYear()}-${String(collDate.getMonth() + 1).padStart(2, '0')}-${String(collDate.getDate()).padStart(2, '0')}`;
        if (dStr !== cStr) {
          this.bleedStartDateError.set('Bleed start date must match the collection date.');
          return;
        }
      }
    }

    if (!timeVal) return;

    const combined = this.combineDateTime(dateVal, timeVal);
    if (combined && combined > this.getChapterNow()) {
      this.bleedStartFutureError.set(true);
      return;
    }

    const sepTime = this.firstSeparationTime();
    if (combined && sepTime) {
      const sepDate = moment(sepTime).toDate();
      if (combined >= sepDate) {
        this.bleedStartDateError.set('Bleed start time must be before first separation time.');
        return;
      }
    }
  }

  validateBleedEnd(): void {
    this.bleedEndFutureError.set(false);
    this.bleedEndBeforeStartError.set(false);
    this.bleedSepTimeError.set('');
    this.bleedEndTimeError.set('');

    const dateVal = this.unitForm.get('bleedEndDate')?.value as Date | null;
    const timeVal = (this.unitForm.get('bleedEndTime')?.value ?? '') as string;

    if (!dateVal && !timeVal) return;

    const combined = this.combineDateTime(dateVal, timeVal);

    if (combined && combined > this.getChapterNow()) {
      this.bleedEndFutureError.set(true);
      return;
    }

    const startDate = this.unitForm.get('bleedStartDate')?.value as Date | null;
    const startTime = (this.unitForm.get('bleedStartTime')?.value ?? '') as string;
    const startCombined = this.combineDateTime(startDate, startTime);

    if (startCombined && combined && combined <= startCombined) {
      // FMB UNITS.BLEED_END_TIME KEY-NEXT-ITEM: show_error('0037') then clear the field.
      this.bleedEndBeforeStartError.set(true);
      this.unitForm.get('bleedEndTime')?.setValue('', { emitEvent: false });
      return;
    }

    const sepTime = this.firstSeparationTime();
    if (combined && sepTime) {
      const sepDate = moment(sepTime).toDate();
      if (combined >= sepDate) {
        this.bleedSepTimeError.set('Bleed end time must be before first separation time.');
        return;
      }
    }
  }

  onBleedStartTimeBlur(): void {
    const raw = (this.unitForm.get('bleedStartTime')?.value ?? '') as string;
    if (!raw.trim()) { this.bleedStartTimeError.set(''); return; }
    const normalized = this.parseTimeInput(raw);
    if (!normalized) {
      this.bleedStartTimeError.set('Invalid time format — enter as HHMM, e.g. 0830.');
      this.bleedStartFutureError.set(false);
      return;
    }
    this.unitForm.get('bleedStartTime')?.setValue(normalized, { emitEvent: false });
    this.bleedStartTimeError.set('');
    this.validateBleedStart();
  }

  onBleedEndTimeBlur(): void {
    const raw = (this.unitForm.get('bleedEndTime')?.value ?? '') as string;
    if (!raw.trim()) { this.bleedEndTimeError.set(''); return; }
    const normalized = this.parseTimeInput(raw);
    if (!normalized) {
      this.bleedEndTimeError.set('Invalid time format — enter as HHMM, e.g. 1430.');
      this.bleedEndFutureError.set(false);
      this.bleedEndBeforeStartError.set(false);
      this.bleedSepTimeError.set('');
      return;
    }
    this.unitForm.get('bleedEndTime')?.setValue(normalized, { emitEvent: false });
    this.bleedEndTimeError.set('');
    this.validateBleedEnd();
  }

  private loadChapterConfig(): void {
    this.service.getChapterConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: cfg => {
          this.maxBleedTimeMinutes.set(cfg.maxBleedTime ?? 0);
          this.slowBleedTimeMinutes.set(cfg.slowBleedTime ?? 0);
          this.cueScanFlag.set(cfg.cueScanFlag ?? 'Y');
          this.timeLimitDays.set(cfg.timeLimitDays ?? 3);
        },
        error: ()  => { /* non-critical */ },
      });
  }

  // ─────────────────────────────────────── Filter actions ───────────────────

  onDriveChange(driveId: string): void {
    const found = this.driveOptions().find(d => d.value === driveId);
    this.driveDescription.set(found?.siteName ?? '');
    this.groupSiteId.set(found?.groupSiteId ?? '');
  }

  onCollDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const ctrl  = this.filterForm.get('collectionDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    if (input.value?.trim() && !ctrl.value) this.validateCollDate(input.value.trim(), ctrl);
  }

  onCollDateBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const ctrl  = this.filterForm.get('collectionDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    if (input.value?.trim() && !ctrl.value) this.validateCollDate(input.value.trim(), ctrl);
  }

  private validateCollDate(inputValue: string, ctrl: import('@angular/forms').AbstractControl): void {
    const parsed = moment(inputValue.toUpperCase(), ['DD-MMM-YYYY', 'DD/MMM/YYYY', 'DD-MM-YYYY', 'DD/MM/YYYY'], true);
    if (!parsed.isValid()) {
      ctrl.setErrors({ ...ctrl.errors, invalidDateFormat: true });
    } else if (ctrl.hasError('invalidDateFormat')) {
      const errs = { ...ctrl.errors };
      delete errs['invalidDateFormat'];
      ctrl.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  onRetrieve(): void {
    const driveId  = this.filterForm.get('driveId')?.value as string | null;
    const collDate = this.filterForm.get('collectionDate')?.value;

    if (!driveId || !collDate) {
      this.showError('Please select a Drive and Collection Date.');
      return;
    }

    this.hasData.set(true);
    this.resetUnitFields();
    this.loadAboValues();

    if (collDate instanceof Date) {
      this.unitForm.patchValue({
        bleedStartDate: collDate,
        bleedEndDate:   collDate,
      }, { emitEvent: false });
    }
  }

  // ─────────────────────────────────────── Unit ID — shared component events ─

  // Step 1: barcode validation passed → run secondary check (already checked in)
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    // Block unit entry if collection date is out of range (mirrors MCISRCEN S_COLL_DATE.VALIDATE_FIELD)
    if (this.filterForm.get('collectionDate')?.invalid) {
      event.reject('');
      return;
    }

    const parsedUnitId = event.data.parsedUnitId;
    const collDate     = this.filterForm.get('collectionDate')?.value;
    const driveId      = (this.filterForm.get('driveId')?.value ?? '').trim();
    const collDateStr  = collDate ? moment(collDate).format('DD-MMM-YYYY').toUpperCase() : '';

    this.isLoading.set(true);
    this.resetUnitDisplayFields();

    this.service.validateUnit(parsedUnitId, collDateStr, driveId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          // Old MCISRCEN behavior: entering an already-checked-in unit loads existing data
          // for viewing/editing — it never blocked re-entry. Only block hard errors.
          if (validation.collDateAfterTestResult) {
            this.isLoading.set(false);
            this.showError('Unit collection date is after its first test result date. (Error 0094)');
            event.reject('');
            return;
          }

          if (validation.collDate) {
            const parsed = moment(validation.collDate, ['YYYY-MM-DD', 'DD-MMM-YYYY', 'MM/DD/YYYY'], true);
            if (parsed.isValid()) {
              this.filterForm.get('collectionDate')?.setValue(parsed.toDate(), { emitEvent: false });
            }
          }

          event.confirm();
        },
        error: () => {
          this.isLoading.set(false);
          this.showError('Unit not found or not valid for check-in.');
          event.reject('');
        },
      });
  }

  // Step 2: secondary check passed → load unit details
  onUnitValidated(data: UnitValidationResponse): void {
    const parsedUnitId = data.parsedUnitId;
    const collDate     = this.filterForm.get('collectionDate')?.value;
    const collDateStr  = collDate ? moment(collDate).format('DD-MMM-YYYY').toUpperCase() : '';

    this.service.getUnitDetails(parsedUnitId, collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: detail => {
          this.isLoading.set(false);
          if (!detail) return;

          const startMoment = detail.bleedStartTime ? moment(detail.bleedStartTime) : null;
          const endMoment   = detail.bleedEndTime   ? moment(detail.bleedEndTime)   : null;
          const collDate    = this.filterForm.get('collectionDate')?.value as Date | null;

          this.unitForm.patchValue({
            bleedStartDate: startMoment ? startMoment.toDate() : (collDate ?? null),
            bleedStartTime: startMoment ? startMoment.format('HH:mm') : '',
            bleedEndDate:   endMoment   ? endMoment.toDate()   : (collDate ?? null),
            bleedEndTime:   endMoment   ? endMoment.format('HH:mm')   : '',
            donorFormAbo: detail.donorFormAbo ?? null,
          }, { emitEvent: false });

          // Manually update donorInfo label — patchValue with emitEvent:false skips valueChanges
          if (detail.donorFormAbo) {
            const aboOpt = this.aboOptions().find(o => o.value === detail.donorFormAbo);
            this.donorInfo.set(aboOpt ? aboOpt.label : detail.donorFormAbo);
          }

          this.isPheresisDonation.set(detail.isPheresis ?? false);
          this.configuration.set(detail.isPheresis ? 'Pheresis' : 'Whole Blood');
          this.bleedFieldsLocked.set(detail.hasComponents ?? false);
          this.donorDecisionCode.set(detail.donorDecisionCode ?? 'Y');
          this._savedBagCode = detail.bagCode ?? '';
          this.bagConfig.set(detail.bagCode ?? '');
          this.unitForm.get('bagCode')?.setValue(detail.bagCode ?? null, { emitEvent: false });
          this.unitDescription.set(detail.bagDescription ?? '');

          this.service.getFirstSeparationTime(parsedUnitId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: t => this.firstSeparationTime.set(t), error: () => {} });

          if (detail.attributes?.length) {
            const allGroups = this.attributeGroupOptions();
            // Deduplicate by group+code — prevent duplicate rows if API or state returns duplicates
            const uniqueAttributes = detail.attributes.filter(
              (a, idx, arr) => arr.findIndex(x => x.attribGroup === a.attribGroup && x.attribCode === a.attribCode) === idx
            );
            const rows: AttributeRow[] = uniqueAttributes.map((a, i) => ({
              id:                i + 1,
              group:             a.attribGroup,
              groupDesc:         a.groupDesc ?? '',
              code:              a.attribCode,
              codeDesc:          a.codeDesc ?? '',
              requiresEquipment: a.requiresEquipment,
              parmCode:          a.parmCode ?? '',
              groupSearchCtrl:   new FormControl(''),
              codeSearchCtrl:    new FormControl(''),
              filteredGroups:    signal([...allGroups]),
              filteredCodes:     signal<AttributeCodeOption[]>([]),
            }));
            uniqueAttributes.forEach((a, i) => {
              this.service.getAttributeCodes(a.attribGroup, this.headerService.chapterId())
                .pipe(takeUntil(this.destroy$))
                .subscribe(codes => rows[i].filteredCodes.set(codes));
            });
            this.attributeRows.set(rows);

            const equipAttr = uniqueAttributes.find(a => a.requiresEquipment && a.parmCode);
            if (equipAttr) {
              if (detail.equipment?.equipReference) {
                // Primary: use equipment from COMPONENT_CGMP (already linked)
                this.loadMachinesAndPreSelect(equipAttr.attribGroup, equipAttr.attribCode, detail.equipment);
              } else if (detail.equipReference) {
                // Fallback (GAP 10): use DONATIONS.EQUIP_REFERENCE pre-linked during donor registration
                // Load machines and try to pre-select by equip_reference from DONATIONS
                this.service.getMachines(equipAttr.attribGroup, equipAttr.attribCode)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(machines => {
                    this.machineOptions.set(machines);
                    const match = machines.find(m => m.value === detail.equipReference);
                    if (match) {
                      this.unitForm.get('machine')?.setValue(match.value, { emitEvent: false });
                      this.serialNumber.set(match.serialNumber ?? '');
                    }
                  });
              }
            }
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.showError('Unit not found or not valid for check-in.');
          this.resetUnitDisplayFields();
        },
      });
  }

  onUnitCleared(): void {
    this.resetUnitFields();
  }

  private resetUnitDisplayFields(): void {
    const collDate = this.filterForm.get('collectionDate')?.value as Date | null;
    this.unitForm.patchValue({
      bleedStartDate: collDate ?? null,
      bleedStartTime: '',
      bleedEndDate:   collDate ?? null,
      bleedEndTime:   '',
      donorFormAbo:   null,
      bagCode:        null,
      machine:        null,
    }, { emitEvent: false });
    this.isPheresisDonation.set(false);
    this.donorDecisionCode.set('Y');
    this.bleedFieldsLocked.set(false);
    this.firstSeparationTime.set(null);
    this.bleedStartDateError.set('');
    this.bleedStartFutureError.set(false);
    this.bleedStartTimeError.set('');
    this.bleedEndFutureError.set(false);
    this.bleedEndBeforeStartError.set(false);
    this.bleedSepTimeError.set('');
    this.bleedEndTimeError.set('');
    this.donorInfo.set('');
    this.unitDescription.set('');
    this.bagConfig.set('');
    this.configuration.set('');
    this._savedBagCode = '';
    this.attributeRows.set([]);
    this.deletedAttributes = [];
    this.donorCue.set('');
    this.serialNumber.set('');
    this.machineOptions.set([]);
  }

  private _resettingUnit = false;
  private resetUnitFields(): void {
    if (this._resettingUnit) return;
    this._resettingUnit = true;
    try {
      this.unitIdField?.clear();
    } finally {
      this._resettingUnit = false;
    }
    const collDate = this.filterForm.get('collectionDate')?.value as Date | null;
    this.unitForm.reset({ bleedStartDate: collDate ?? null, bleedStartTime: '', bleedEndDate: collDate ?? null, bleedEndTime: '', donorFormAbo: null, bagCode: null, machine: null });
    this.donorInfo.set('');
    this.unitDescription.set('');
    this.bagConfig.set('');
    this.configuration.set('');
    this._savedBagCode = '';
    this.donorDecisionCode.set('Y');
    this.bleedFieldsLocked.set(false);
    this.firstSeparationTime.set(null);
    this.bleedStartDateError.set('');
    this.bleedStartFutureError.set(false);
    this.bleedStartTimeError.set('');
    this.bleedEndFutureError.set(false);
    this.bleedEndBeforeStartError.set(false);
    this.bleedSepTimeError.set('');
    this.bleedEndTimeError.set('');
    this.attributeRows.set([]);
    this.deletedAttributes = [];
    this.donorCue.set('');
    this.serialNumber.set('');
    this.machineOptions.set([]);
    this.filteredMachines.set([]);
    this.machineSearchCtrl.setValue('', { emitEvent: false });
  }

  // ─────────────────────────────────────── Attribute rows ───────────────────

  onAddAttribute(): void {

    const groupSearchCtrl = new FormControl('');
    const codeSearchCtrl  = new FormControl('');
    const allGroups       = this.attributeGroupOptions();
    const filteredGroups  = signal<DropdownOption[]>([...allGroups]);
    const filteredCodes   = signal<AttributeCodeOption[]>([]);

    const newRow: AttributeRow = {
      id: this._nextRowId++,
      group: '', groupDesc: '', code: '', codeDesc: '',
      requiresEquipment: false,
      parmCode: '',
      groupSearchCtrl, codeSearchCtrl, filteredGroups, filteredCodes,
    };

    groupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        filteredGroups.set(
          t ? allGroups.filter(g => g.label.toLowerCase().includes(t)) : [...allGroups]
        );
      });

    this.attributeRows.update(rows => [...rows, newRow]);
    // M-4: announce add to screen readers via polite live region
    const total = this.attributeRows().length;
    this.attrStatusMessage.set(`Attribute row added. ${total} row${total !== 1 ? 's' : ''} total.`);
    setTimeout(() => this.attrStatusMessage.set(''), 3000);
  }

  onDeleteAttribute(id: number): void {
    const row = this.attributeRows().find(r => r.id === id);
    if (row?.group && row?.code) {
      this.deletedAttributes.push({ attribGroup: row.group, attribCode: row.code });
    }
    this.attributeRows.update(rows => rows.filter(r => r.id !== id));
    // M-4: announce delete to screen readers via polite live region
    const remaining = this.attributeRows().length;
    this.attrStatusMessage.set(`Attribute row deleted. ${remaining} row${remaining !== 1 ? 's' : ''} remaining.`);
    setTimeout(() => this.attrStatusMessage.set(''), 3000);
    this.refreshMachineSection();
  }

  onGroupChange(row: AttributeRow, groupValue: string): void {
    const groupUpper = groupValue.toUpperCase();
    if (groupUpper === 'PHER' || groupUpper === 'DON') {
      const isDuplicate = this.attributeRows().some(
        r => r.id !== row.id && r.group.toUpperCase() === groupUpper
      );
      if (isDuplicate) {
        // Error 0030 (PHER) / 0036 (DON) — duplicate attribute group: HARD BLOCK (matches old MCISRCEN show_error)
        const errorCode = groupUpper === 'PHER' ? '0030' : '0036';
        const label = groupUpper === 'DON' ? 'Donation (DON)' : 'Apheresis (PHER)';
        this.showError(`Error ${errorCode}: ${label} attribute group cannot be entered more than once.`);
        this.updateRow({ ...row, group: '', groupDesc: '', code: '', codeDesc: '', requiresEquipment: false, parmCode: '' });
        row.filteredCodes.set([]);
        return;
      }
    }

    const groupOption = this.attributeGroupOptions().find(g => g.value === groupValue);
    const updatedRow: AttributeRow = {
      ...row,
      group:             groupValue,
      groupDesc:         groupOption?.label.split(' — ')[1] ?? groupOption?.label ?? '',
      code:              '',
      codeDesc:          '',
      requiresEquipment: false,
      parmCode:          '',
    };
    row.filteredCodes.set([]);
    this.updateRow(updatedRow);

    this.service.getAttributeCodes(groupValue, this.headerService.chapterId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => {
          row.filteredCodes.set([...codes]);
          this.updateRow({ ...updatedRow });
          row.codeSearchCtrl.setValue('', { emitEvent: false });
          row.codeSearchCtrl.valueChanges
            .pipe(takeUntil(row.groupSearchCtrl.valueChanges), takeUntil(this.destroy$))
            .subscribe(term => {
              const t = (term ?? '').toLowerCase();
              row.filteredCodes.set(
                t ? codes.filter(c => c.label.toLowerCase().includes(t)) : [...codes]
              );
            });
        },
        error: () => this.showError(`Failed to load codes for group ${groupValue}.`),
      });
  }

  onCodeChange(row: AttributeRow, codeValue: string): void {
    const isDuplicate = this.attributeRows().some(
      r => r.id !== row.id && r.group === row.group && r.code === codeValue
    );
    if (isDuplicate) {
      this.showError('This attribute group and code combination has already been entered.');
      return;
    }

    const codeOption = row.filteredCodes().find(c => c.value === codeValue);
    const updatedRow: AttributeRow = {
      ...row,
      code:              codeValue,
      codeDesc:          codeOption?.label.split(' — ')[1] ?? codeOption?.label ?? '',
      requiresEquipment: codeOption?.requiresEquipment ?? false,
      parmCode:          codeOption?.parmCode ?? '',
    };
    this.updateRow(updatedRow);
    this.refreshMachineSection();

    if (updatedRow.requiresEquipment) {
      this.loadMachines(row.group, codeValue);
    }
  }

  private updateRow(updatedRow: AttributeRow): void {
    this.attributeRows.update(rows =>
      rows.map(r => r.id === updatedRow.id ? updatedRow : r)
    );
  }

  private refreshMachineSection(): void {
    const needsMachine = this.attributeRows().some(r => r.requiresEquipment);
    if (!needsMachine) {
      this.unitForm.get('machine')?.setValue(null, { emitEvent: false });
      this.donorCue.set('');
      this.serialNumber.set('');
      this.machineOptions.set([]);
      this.filteredMachines.set([]);
      this.machineSearchCtrl.setValue('', { emitEvent: false });
    }
  }

  private loadMachines(group: string, code: string): void {
    this.service.getMachines(group, code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: machines => {
          this.machineOptions.set(machines);
          this.filteredMachines.set([...machines]);
        },
        error: () => this.showError('Failed to load machine options.'),
      });
  }

  private loadMachinesAndPreSelect(
    group: string,
    code: string,
    saved: { equipReference: string; description: string; serialNumber: string }
  ): void {
    this.service.getMachines(group, code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: machines => {
          this.machineOptions.set(machines);
          this.filteredMachines.set([...machines]);
          const match = machines.find(m => m.value === saved.equipReference);
          if (match) {
            this.unitForm.get('machine')?.setValue(match.value, { emitEvent: false });
            this.donorCue.set(match.donorCue);
            this.serialNumber.set(match.serialNumber);
          } else {
            this.donorCue.set(saved.description);
            this.serialNumber.set(saved.serialNumber);
          }
        },
        error: () => this.showError('Failed to load machine options.'),
      });
  }

  // ─────────────────────────────────────── Machine selection ────────────────

  onMachineChange(machineValue: string): void {
    const found = this.machineOptions().find(m => m.value === machineValue);
    this.donorCue.set(found?.donorCue ?? '');
    this.serialNumber.set(found?.serialNumber ?? '');
  }

  // ─────────────────────────────────────── Save / Cancel ────────────────────

  async onSave(): Promise<void> {
    this.unitForm.markAllAsTouched();

    const unitId = this.unitIdField?.parsedUnitId ?? '';
    if (!unitId || !this.unitIdField?.isValid) {
      this.showError('Unit ID is required.');
      return;
    }

    // Error 0010 — bleed start and end are required (matches Oracle VALIDATE_RECORD check)
    const bleedStartDateVal = this.unitForm.get('bleedStartDate')?.value as Date | null;
    const bleedStartTimeVal = (this.unitForm.get('bleedStartTime')?.value ?? '') as string;
    const bleedEndDateVal   = this.unitForm.get('bleedEndDate')?.value as Date | null;
    const bleedEndTimeVal   = (this.unitForm.get('bleedEndTime')?.value ?? '') as string;

    if (!bleedStartDateVal || !bleedStartTimeVal.trim() || !bleedEndDateVal || !bleedEndTimeVal.trim()) {
      this.showError('All mandatory fields must be entered. (Error 0010)');
      return;
    }

    this.validateBleedStart();
    this.validateBleedEnd();

    if (this.bleedStartDateError() || this.bleedStartFutureError() || this.bleedStartTimeError()
        || this.bleedEndFutureError() || this.bleedEndBeforeStartError()
        || this.bleedSepTimeError()   || this.bleedEndTimeError()) {
      const bleedMsg =
        this.bleedStartDateError()
        || (this.bleedStartFutureError()    ? 'Bleed start time cannot be in the future.' : '')
        || this.bleedStartTimeError()
        || (this.bleedEndFutureError()      ? 'Bleed end time cannot be in the future.'   : '')
        || (this.bleedEndBeforeStartError() ? 'Bleed end time must be after bleed start time.' : '')
        || this.bleedSepTimeError()
        || this.bleedEndTimeError();
      this.showError(bleedMsg);
      return;
    }

    if (this.showMachine() && !this.unitForm.get('machine')?.value) {
      this.showError('Machine is required when equipment is needed.');
      return;
    }

    const incompleteAttr = this.attributeRows().some(r => r.group && !r.code);
    if (incompleteAttr) {
      this.showError('All attribute rows with a group selected must also have a code selected.');
      return;
    }

    this.doSave();
  }

  // Builds and submits the save payload.
  // bleedAnomaly is set when user confirms the 9001 dialog — triggers BLFA interdiction in BE.
  private doSave(bleedAnomaly?: string, bleedEndOverride = false): void {
    const collDate    = this.filterForm.get('collectionDate')?.value;
    const driveId     = (this.filterForm.get('driveId')?.value ?? '').trim();
    const collDateStr = collDate ? moment(collDate).format('DD-MMM-YYYY').toUpperCase() : '';

    const bleedStartDateVal = this.unitForm.get('bleedStartDate')?.value as Date | null;
    const bleedStartTimeVal = (this.unitForm.get('bleedStartTime')?.value ?? '') as string;
    const bleedEndDateVal   = this.unitForm.get('bleedEndDate')?.value as Date | null;
    const bleedEndTimeVal   = (this.unitForm.get('bleedEndTime')?.value ?? '') as string;
    const donorFormAbo      = this.unitForm.get('donorFormAbo')?.value as string | null;
    const bagCodeValue      = ((this.unitForm.get('bagCode')?.value as string | null) ?? this._savedBagCode) || undefined;

    // Build local datetime strings — GMT conversion handled by BE.
    const bleedStartRaw = bleedStartDateVal && bleedStartTimeVal
      ? `${moment(bleedStartDateVal).format('YYYY-MM-DD')}T${bleedStartTimeVal}` : '';
    const bleedEndRaw   = bleedEndDateVal && bleedEndTimeVal
      ? `${moment(bleedEndDateVal).format('YYYY-MM-DD')}T${bleedEndTimeVal}`     : '';

    const [bleedStartDate, bleedStartTime] = bleedStartRaw ? bleedStartRaw.split('T') : ['', ''];
    const [bleedEndDate,   bleedEndTime]   = bleedEndRaw   ? bleedEndRaw.split('T')   : ['', ''];

    const machineValue  = this.unitForm.get('machine')?.value as string | null;
    const machineOption = machineValue ? this.machineOptions().find(m => m.value === machineValue) : null;
    const equipRow      = this.attributeRows().find(r => r.requiresEquipment && r.parmCode);

    this.isLoading.set(true);

    this.service.save({
      unitId:            this.unitIdField?.parsedUnitId ?? '',
      collDate:          collDateStr,
      driveId,
      groupSiteId:       this.groupSiteId(),
      donorDecisionCode: this.donorDecisionCode(),
      bleedStartDate:    bleedStartDate || undefined,
      bleedStartTime:    bleedStartTime || undefined,
      bleedEndDate:      bleedEndDate   || undefined,
      bleedEndTime:      bleedEndTime   || undefined,
      donorFormAbo:      donorFormAbo   ?? undefined,
      bagCode:           bagCodeValue,
      attributes: this.attributeRows()
        .filter(r => r.group && r.code)
        .map(r => ({ attribGroup: r.group, attribCode: r.code })),
      deletedAttributes: [...this.deletedAttributes],
      equipment: (machineOption && equipRow?.parmCode) ? {
        equipType:      machineOption.equipType,
        serialNumber:   machineOption.serialNumber,
        equipReference: machineOption.value,
        parmCode:       equipRow.parmCode,
      } : undefined,
      bleedAnomaly,
      extendedDayLimit: this.extendedDayLimit(),
      cueScanFlag: this.cueScanFlag(),
      bleedEndOverride,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.isLoading.set(false);
          if (result.success) {
            this.showSuccess(result.message ?? 'Unit checked in successfully.');
            // FMB error 0259: CUE discrepancy — unit saved with CUED hold, show warning.
            if (result.warningCode === '0259') {
              this.showError('CUE Discrepancy — HOLD has been placed on this unit. (Error 0259)');
            }
            this.resetUnitFields();
          } else {
            // All other BE validation errors (9211, 0044, 0037, etc.) — hard block snackbar
            this.showError(result.message ?? 'Failed to save check-in details.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          // BE returns HTTP 400 for business validation failures (9001, 9211, etc.)
          // Check error code from response body to decide snackbar vs dialog.
          const errorCode = err?.error?.error as string | undefined;
          const msg       = err?.error?.message as string | undefined;
          if (errorCode === '9001') {
            // Error 9001 — bleed duration exceeds max.
            // FMB: pop_error('9001') — Y/N dialog; YES → commit with BLFA interdiction.
            const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
              width: '420px',
              disableClose: true,
              data: {
                title:       'Bleed Time Warning',
                message:     msg ?? 'Bleed time exceeds maximum allowed time.',
                detail:      'Do you want to proceed with this bleed time?',
                confirmText: 'YES — Proceed',
                cancelText:  'NO — Return',
              } as ConfirmActionDialogData,
            });
            dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
              if (confirmed) {
                this.doSave('BLFA');
              }
            });
          } else if (errorCode === '0044') {
            // Error 0044 — bleed end ≤ start at commit.
            // FMB: pop_error('0044') — same Y/N dialog mechanism as 9001.
            const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
              width: '420px',
              disableClose: true,
              data: {
                title:       'Illogical Bleed Time',
                message:     msg ?? 'Bleed end time is before or equal to start time.',
                detail:      'Do you want to proceed with this bleed time?',
                confirmText: 'YES — Proceed',
                cancelText:  'NO — Return',
              } as ConfirmActionDialogData,
            });
            dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
              if (confirmed) {
                this.doSave(undefined, true);
              }
            });
          } else if (errorCode === '0230') {
            // Error 0230 — commit failed (transaction rolled back).
            // FMB: clear_form(full_rollback) + execute_trigger('key-clrfrm') + show_error('0230').
            this.showError(msg || 'Transaction failed — changes have been rolled back. (Error 0230)');
            this.resetUnitFields();
          } else {
            this.showError(msg || 'Failed to save check-in details.');
          }
        },
      });
  }

  onCancel(): void {
    this.resetUnitFields();
  }

  // ─────────────────────────────────────── Template helpers ─────────────────

  get filterDriveId(): string {
    return ((this.filterForm.get('driveId')?.value as string | null) ?? '').trim();
  }

  trackById(_index: number, row: AttributeRow): number {
    return row.id;
  }

  // ─────────────────────────────────────── Chapter-time helper ──────────────

  /**
   * Returns the current moment in the chapter's IANA timezone as a Date.
   * Uses convertUTCToTimezone (Intl-based, IANA-safe) so it is not
   * affected by the browser's local timezone.
   */
  private getChapterNow(): Date {
    const tz = this.chapterOffset;
    return convertUTCToTimezone(new Date(), tz);
  }

  // ─────────────────────────────────────── Snackbar helpers ─────────────────

  private showError(message: string): void {
    this.snackbarService.showError(message);
    // S-3: update assertive live region so screen readers announce error immediately
    this.a11yErrorMessage.set(message);
    setTimeout(() => this.a11yErrorMessage.set(''), 5000);
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }
}
