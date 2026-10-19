import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, forkJoin, of, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ROUTES } from 'src/app/core/constants/route.constants';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { EnterHlaRbcRequestService } from './services/enter-hla-rbc-request.service';
import {
  AttribCodeMap,
  HlaEpitopesMap,
  LovOption,
  MatchType,
  PatientDetailDto,
  PatientSearchResultDto,
  RequestDetailDto,
  RequestListItemDto,
} from './models/enter-hla-rbc-request.model';
import {
  dobMaxAgeValidator,
  hlaAntibodyDuplicateValidator,
  rbcAntibodyDuplicateValidator,
  rbcAntigenDuplicateValidator,
  hlaPhenotypeDuplicateValidator,
} from './validators/enter-hla-rbc-request.validators';
import { soundexMatch } from '@shared/utils/soundex.util';

@Component({
  selector: 'app-enter-hla-rbc-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    ConfirmActionDialogComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-hla-rbc-request.html',
  styleUrls: ['./enter-hla-rbc-request.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterHlaRbcRequestComponent implements OnInit, OnDestroy {
  @ViewChild('dobInput') dobInput?: ElementRef<HTMLInputElement>;
  @ViewChild('requestDateInput') requestDateInput?: ElementRef<HTMLInputElement>;

  private readonly service = inject(EnterHlaRbcRequestService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly loginService = inject(LoginService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  // UI state
  isExpanded = signal(false);
  isCreateNew = signal(false);
  isNewRequest = signal(false);
  isSaving = signal(false);
  hasSaved = signal(false);
  hasSubmittedSearch = signal(false);
  isLoadingPatients = signal(false);
  isLoadingLovs = signal(false);

  isRecipientExpanded = signal(false);
  isMatchCriteriaExpanded = signal(false);
  isRequestDetailsExpanded = signal(false);

  // Patient list (loaded once on init)
  allPatients = signal<PatientSearchResultDto[]>([]);
  selectedPatientId = signal<string | null>(null);

  // ─── Patient search ───────────────────────────────────────────────────────
  readonly patientSearchFilterCtrl = new FormControl('');
  private readonly patientFilterTerm = toSignal(this.patientSearchFilterCtrl.valueChanges, { initialValue: '' });
  filteredPatients = computed(() => {
    const term = (this.patientFilterTerm() ?? '').toLowerCase();
    const patients = this.allPatients();
    if (!term) return patients;

    // Oracle Forms RG_PATIENTS: WHERE (pat_last_name LIKE '%term%' OR SOUNDEX(pat_last_name) = SOUNDEX(:term))
    // Implement same logic: LIKE match first, then SOUNDEX fallback
    return patients.filter(p => {
      const lastNameLower = p.patLastName.toLowerCase();
      const firstNameLower = (p.patFirstName ?? '').toLowerCase();

      // Primary: LIKE match (contains)
      if (lastNameLower.includes(term) || firstNameLower.includes(term)) {
        return true;
      }

      // Fallback: SOUNDEX match on last name for phonetic similarity
      // Only if term is >= 3 chars (SOUNDEX requires meaningful input)
      if (term.length >= 3) {
        return soundexMatch(p.patLastName, term);
      }

      return false;
    });
  });

  // ─── Dropdown search controls (API-driven, one per dropdown type) ─────────
  readonly aboSearchCtrl          = new FormControl('');
  readonly withAboSearchCtrl      = new FormControl('');
  readonly hospitalSearchCtrl     = new FormControl('');
  readonly physicianSearchCtrl    = new FormControl('');
  readonly productSearchCtrl      = new FormControl('');
  readonly prioritySearchCtrl     = new FormControl('');
  readonly requestIdSearchCtrl    = new FormControl('');
  readonly hlaASearchCtrl         = new FormControl('');
  readonly hlaBSearchCtrl         = new FormControl('');
  readonly hlaLocusSearchCtrl     = new FormControl('');
  readonly hlaEpitopeSearchCtrl   = new FormControl('');
  readonly rbcTestSearchCtrl      = new FormControl('');
  readonly attribGroupSearchCtrl  = new FormControl('');
  readonly attribCodeSearchCtrl   = new FormControl('');
  readonly unitsSearchCtrl        = new FormControl('');

  // ─── Reactive terms ───────────────────────────────────────────────────────
  private readonly aboTerm         = toSignal(this.aboSearchCtrl.valueChanges,         { initialValue: '' });
  private readonly withAboTerm     = toSignal(this.withAboSearchCtrl.valueChanges,     { initialValue: '' });
  private readonly hospitalTerm    = toSignal(this.hospitalSearchCtrl.valueChanges,    { initialValue: '' });
  private readonly physicianTerm   = toSignal(this.physicianSearchCtrl.valueChanges,   { initialValue: '' });
  private readonly productTerm     = toSignal(this.productSearchCtrl.valueChanges,     { initialValue: '' });
  private readonly priorityTerm    = toSignal(this.prioritySearchCtrl.valueChanges,    { initialValue: '' });
  private readonly requestIdTerm   = toSignal(this.requestIdSearchCtrl.valueChanges,   { initialValue: '' });
  private readonly hlaATerm        = toSignal(this.hlaASearchCtrl.valueChanges,        { initialValue: '' });
  private readonly hlaBTerm        = toSignal(this.hlaBSearchCtrl.valueChanges,        { initialValue: '' });
  private readonly hlaLocusTerm    = toSignal(this.hlaLocusSearchCtrl.valueChanges,    { initialValue: '' });
  private readonly hlaEpitopeTerm  = toSignal(this.hlaEpitopeSearchCtrl.valueChanges, { initialValue: '' });
  private readonly rbcTestTerm     = toSignal(this.rbcTestSearchCtrl.valueChanges,     { initialValue: '' });
  private readonly attribGroupTerm = toSignal(this.attribGroupSearchCtrl.valueChanges, { initialValue: '' });
  private readonly attribCodeTerm  = toSignal(this.attribCodeSearchCtrl.valueChanges,  { initialValue: '' });
  private readonly unitsTerm       = toSignal(this.unitsSearchCtrl.valueChanges,        { initialValue: '' });

  // ─── Filtered computed signals ────────────────────────────────────────────
  filteredAbo        = computed(() => this.lovFilter(this.aboCodeOptions(),     this.aboTerm()));
  filteredWithAbo    = computed(() => this.lovFilter(this.aboCodeOptions(),     this.withAboTerm()));
  filteredHospitals  = computed(() => this.lovFilter(this.hospitalOptions(),    this.hospitalTerm()));
  filteredPhysicians = computed(() => this.lovFilter(this.physicianOptions(),   this.physicianTerm()));
  filteredProducts   = computed(() => this.lovFilter(this.productTypeOptions(), this.productTerm()));
  filteredPriorities = computed(() => this.lovFilter(this.priorityOptions(),    this.priorityTerm()));
  filteredRequestIds = computed(() => {
    const term = (this.requestIdTerm() ?? '').toLowerCase();
    const reqs = this.patientRequests();
    return term ? reqs.filter(r => r.requestId.toLowerCase().includes(term)) : reqs;
  });
  filteredHlaA       = computed(() => this.lovFilter(this.hlaAOptions(),        this.hlaATerm()));
  filteredHlaB       = computed(() => this.lovFilter(this.hlaBOptions(),        this.hlaBTerm()));
  filteredHlaLocus   = computed(() => this.lovFilter(this.hlaLocusOptions(),    this.hlaLocusTerm()));
  filteredRbcTests   = computed(() => this.lovFilter(this.rbcTestOptions(),     this.rbcTestTerm()));
  filteredAttribGroups = computed(() => this.lovFilter(this.attribGroupOptions(), this.attribGroupTerm()));
  filteredUnits        = computed(() => this.lovFilter(this.unitOptions,           this.unitsTerm()));

  // Row-scoped filtered options (shared control, one panel open at a time)
  filteredEpitopeOptions(rowIndex: number): LovOption[] {
    return this.lovFilter(this.getEpitopeOptions(rowIndex), this.hlaEpitopeTerm());
  }
  filteredAttribCodeOptions(rowIndex: number): LovOption[] {
    return this.lovFilter(this.getAttribCodeOptions(rowIndex), this.attribCodeTerm());
  }

  private lovFilter(opts: LovOption[], term: string | null): LovOption[] {
    if (!term) return opts;
    const t = term.toLowerCase();
    return opts.filter(o => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t));
  }

  optionsWithSelected(filtered: LovOption[], allOpts: LovOption[], selectedValue: string | null): LovOption[] {
    if (!selectedValue || filtered.some(o => o.value === selectedValue)) return filtered;
    const selected = allOpts.find(o => o.value === selectedValue);
    return selected ? [selected, ...filtered] : filtered;
  }

  // Request list for selected patient
  patientRequests = signal<RequestListItemDto[]>([]);

  // Request detail (loaded when selecting existing request)
  currentRequestDetail = signal<RequestDetailDto | null>(null);

  // Match type display - computed from radio selection
  matchTypeDisplay = computed(() => {
    const type = this.requestForm?.get('matchCriteriaType')?.value;
    if (!type) return '';
    return type === 'HP' ? 'HLA PHENO'
         : type === 'HA' ? 'HLA ANTI'
         : type === 'RA' ? 'RBC ANTI'
         : type === 'RP' ? 'RBC PHENO'
         : '';
  });

  readonly dobDateControl = new FormControl<Moment | null>(null, [dobMaxAgeValidator()]);
  readonly maxDate = computed<Moment>(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate ? chapterDate.clone().startOf('day') : moment().startOf('day');
  });
  get minTargetDate(): Moment { return this.chapterTimezoneService.getChapterLocalDate().startOf('day'); }
  readonly dobErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getDobError()
  );

  readonly requestDateControl = new FormControl<Moment | null>(null, [Validators.required]);
  readonly requestDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getRequestDateError()
  );

  // LOV options — all loaded from API
  aboCodeOptions = signal<LovOption[]>([]);
  hospitalOptions = signal<LovOption[]>([]);
  physicianOptions = signal<LovOption[]>([]);
  productTypeOptions = signal<LovOption[]>([]);
  priorityOptions = signal<LovOption[]>([]);
  hlaLocusOptions = signal<LovOption[]>([]);
  hlaAOptions = signal<LovOption[]>([]);
  hlaBOptions = signal<LovOption[]>([]);
  rbcTestOptions = signal<LovOption[]>([]);
  attribGroupOptions = signal<LovOption[]>([]);
  attribCodeOptionsMap = signal<AttribCodeMap>({});
  hlaEpitopesMap = signal<HlaEpitopesMap>({});

  // Static options (no API needed)
  readonly sexOptions: LovOption[] = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
  ];

  readonly statusOptions: LovOption[] = [
    { value: 'A', label: 'Active' },
    { value: 'I', label: 'Inactive' },
  ];

  readonly resultCodeOptions: LovOption[] = [
    { value: 'P', label: 'Positive' },
    { value: 'N', label: 'Negative' },
  ];

  readonly unitOptions: LovOption[] = Array.from({ length: 100 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  sectionsVisible = computed(() => this.isExpanded() || this.isCreateNew());

  private readonly requestFormStatus = signal<string>('INVALID');
  private readonly requestDateControlStatus = signal<string>('INVALID');
  readonly isSaveDisabled = computed(() =>
    this.isSaving() ||
    this.requestFormStatus() !== 'VALID' ||
    this.requestDateControlStatus() !== 'VALID'
  );

  requestForm!: FormGroup;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/' }, { label: '' }],
    title: '',
    subtitle: '',
    actions: [],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  private readonly uppercaseFields = ['lastName', 'firstName', 'contact', 'diagnosis'];

  ngOnInit(): void {
    this.initForm();
    this.loadPatients();
    this.loadLovs();
    this.subscribeToChapterChanges();
    this.subscribeToUppercaseFields();

    this.requestFormStatus.set(this.requestForm.status);
    this.requestDateControlStatus.set(this.requestDateControl.status);
    this.requestForm.statusChanges.pipe(takeUntil(this.destroy$))
      .subscribe(s => this.requestFormStatus.set(s));
    this.requestDateControl.statusChanges.pipe(takeUntil(this.destroy$))
      .subscribe(s => this.requestDateControlStatus.set(s));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToUppercaseFields(): void {
    for (const field of this.uppercaseFields) {
      this.requestForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(v => {
          if (v && v !== v.toUpperCase()) {
            this.requestForm.get(field)?.setValue(v.toUpperCase(), { emitEvent: false });
          }
        });
    }
  }


  // ─── Form Init ────────────────────────────────────────────────────────────

  private initForm(): void {
    this.requestForm = this.fb.group({
      // Recipient Information
      patientId:  [{ value: '-', disabled: true }],
      lastName:   ['', [Validators.required, Validators.maxLength(30)]],
      firstName:  ['', [Validators.maxLength(25)]],
      sex:        [''],
      abo:        ['', [Validators.maxLength(10)]],
      status:     ['', [Validators.required]],
      comments:   ['', [Validators.maxLength(240)]],
      // Match Criteria
      withAbo:              ['', [Validators.maxLength(10)]],
      exactMatch:           [false],
      matchCriteriaType:    ['HP'],
      hlaPhenotype:   this.fb.array([this.createHlaPhenotypeRow()]),
      hlaAntibodies:  this.fb.array([this.createHlaAntibodyRow()]),
      rbcAntibodies:  this.fb.array([this.createRbcAntibodyRow()]),
      rbcAntigens:    this.fb.array([this.createRbcAntigenRow()]),
      // Request Details
      requestId:    [''],
      hospital:     ['', [Validators.required, Validators.minLength(3)]],
      contact:      ['', [Validators.maxLength(50)]],
      phone:        ['', [Validators.maxLength(12)]],
      intlPhone:    ['', [Validators.maxLength(15)]],
      physician:    [''],
      diagnosis:    ['', [Validators.maxLength(250)]],
      productType:  [''],
      priority:     [''],
      inventorySearch: [false],
      scheduledDates:    this.fb.array([this.createScheduledDateRow()]),
      requestAttributes: this.fb.array([this.createRequestAttributeRow()]),
    }, {
      validators: [
        hlaAntibodyDuplicateValidator('hlaAntibodies'),
        rbcAntibodyDuplicateValidator('rbcAntibodies'),
        rbcAntigenDuplicateValidator('rbcAntigens'),
      ]
    });
  }

  // ─── Patient Load ─────────────────────────────────────────────────────────

  private loadPatients(): void {
    this.isLoadingPatients.set(true);
    this.service.getPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: patients => {
          this.allPatients.set(patients);
          this.isLoadingPatients.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingPatients.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  // ─── LOV Load ─────────────────────────────────────────────────────────────

  private loadLovs(): void {
    this.isLoadingLovs.set(true);
    forkJoin({
      aboCodes:      this.service.getAboCodes().pipe(catchError(() => of([]))),
      hospitals:     this.service.getHospitals().pipe(catchError(() => of([]))),
      physicians:    this.service.getPhysicians().pipe(catchError(() => of([]))),
      products:      this.service.getProducts().pipe(catchError(() => of([]))),
      priorities:    this.service.getPriorities().pipe(catchError(() => of([]))),
      hlaLocus:      this.service.getHlaLocus().pipe(catchError(() => of([]))),
      hlaA:          this.service.getHlaEpitopes('A').pipe(catchError(() => of([]))),
      hlaB:          this.service.getHlaEpitopes('B').pipe(catchError(() => of([]))),
      rbcTests:      this.service.getRbcTests().pipe(catchError(() => of([]))),
      attribGroups:  this.service.getAttributeGroups().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.aboCodeOptions.set(data.aboCodes);
          this.hospitalOptions.set(data.hospitals);
          this.physicianOptions.set(data.physicians);
          this.productTypeOptions.set(data.products);
          this.priorityOptions.set(data.priorities);
          this.hlaLocusOptions.set(data.hlaLocus);
          this.hlaAOptions.set(data.hlaA);
          this.hlaBOptions.set(data.hlaB);
          this.rbcTestOptions.set(data.rbcTests);
          this.attribGroupOptions.set(data.attribGroups);
          this.isLoadingLovs.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingLovs.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearSearch();
        this.allPatients.set([]);
        this.patientSearchFilterCtrl.setValue('');
        this.loadPatients();
        this.loadLovs();
      });
  }

  // ─── Patient Selection ────────────────────────────────────────────────────

  /** Dropdown change — only stores the selected ID, does NOT fetch yet */
  onPatientDropdownChange(patId: string): void {
    this.selectedPatientId.set(patId || null);
  }

  /** RETRIEVE button — fetches patient detail + requests */
  onRetrieve(): void {
    const patId = this.selectedPatientId();
    if (!patId) return;

    this.isExpanded.set(true);
    this.isCreateNew.set(false);
    this.isRecipientExpanded.set(true);
    this.isMatchCriteriaExpanded.set(true);
    this.isRequestDetailsExpanded.set(true);

    forkJoin({
      detail:   this.service.getPatientDetail(patId).pipe(catchError(() => of(null))),
      requests: this.service.getPatientRequests(patId).pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ detail, requests }) => {
          if (detail) this.populatePatientDetail(detail);
          this.patientRequests.set(requests);
          this.requestForm.get('requestId')?.setValue('');
          this.cdr.markForCheck();
        },
      });
  }

  private populatePatientDetail(p: PatientDetailDto): void {
    this.requestForm.patchValue({
      patientId: p.patId,
      lastName:  p.patLastName,
      firstName: p.patFirstName ?? '',
      sex:       p.sex ?? '',
      abo:       p.aboType ?? '',
      status:    p.status,
      comments:  p.comments ?? '',
    });

    if (p.dob) {
      this.dobDateControl.setValue(moment(p.dob));
    } else {
      this.dobDateControl.reset();
    }

    // Populate match criteria from patient data
    if (p.hlaAntigens) {
      const ag = p.hlaAntigens;
      const phenoArray = this.hlaPhenotypeArray;
      while (phenoArray.length > 1) phenoArray.removeAt(phenoArray.length - 1);
      phenoArray.at(0).patchValue({ a1: ag.a1 ?? '', a2: ag.a2 ?? '', b1: ag.b1 ?? '', b2: ag.b2 ?? '' });
    }

    if (p.hlaAntibodies?.length) {
      const arr = this.hlaAntibodiesArray;
      while (arr.length) arr.removeAt(0);
      p.hlaAntibodies.forEach(ab => arr.push(this.fb.group({ locus: [ab.locus], epitopeId: [ab.epitopeId] })));
    }

    if (p.rbcAntibodies?.length) {
      const arr = this.rbcAntibodiesArray;
      while (arr.length) arr.removeAt(0);
      p.rbcAntibodies.forEach(ab => arr.push(this.fb.group({ testId: [ab.testId] })));
    }

    if (p.rbcAntigens?.length) {
      const arr = this.rbcAntigensArray;
      while (arr.length) arr.removeAt(0);
      p.rbcAntigens.forEach(ag => arr.push(this.fb.group({ testId: [ag.testId], resultCode: [ag.resultCode ?? ''] })));
    }

    // Auto-select the radio based on which data is present
    const matchType = p.rbcAntigens?.length  ? 'RP'
                    : p.rbcAntibodies?.length ? 'RA'
                    : p.hlaAntibodies?.length ? 'HA'
                    : 'HP';
    this.requestForm.patchValue({ matchCriteriaType: matchType });
  }

  // ─── Request Selection ────────────────────────────────────────────────────

  /** CREATE NEW button beside Request ID */
  onCreateNewRequest(): void {
    this.isNewRequest.set(true);
    this.requestForm.get('requestId')?.disable();
    this.requestForm.get('requestId')?.setValue('');
    this.clearRequestDetailFields();
    this.cdr.markForCheck();
  }

  onRequestSelectChange(requestId: string): void {
    if (!requestId) return;
    this.isNewRequest.set(false);
    this.requestForm.get('requestId')?.enable();
    this.service.getRequestDetail(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: detail => {
          if (detail) {
            // Oracle Forms REQUEST_ID WHEN-VALIDATE-ITEM: check submit_request
            if (detail.submitRequest === 'Y' || detail.submitRequest === 'E') {
              this.showErrorToast('Error 14402: Request already submitted or executed. Cannot edit.');
              this.requestForm.get('requestId')?.setValue('');
              return;
            }
            this.populateRequestDetail(detail);
          }
          this.cdr.markForCheck();
        },
        error: err => {
          this.showErrorToast(err?.error?.message || 'Failed to load request details.');
          this.cdr.markForCheck();
        },
      });
  }

  private clearRequestDetailFields(): void {
    this.currentRequestDetail.set(null);
    this.requestForm.patchValue({
      hospital: '', contact: '', phone: '', intlPhone: '',
      physician: '', diagnosis: '', productType: '', priority: '',
      withAbo: '', exactMatch: false, inventorySearch: false,
    });
    this.requestDateControl.reset();

    const datesArr = this.scheduledDatesArray;
    while (datesArr.length) datesArr.removeAt(0);
    datesArr.push(this.createScheduledDateRow());

    const attrArr = this.requestAttributesArray;
    while (attrArr.length) attrArr.removeAt(0);
    attrArr.push(this.createRequestAttributeRow());
  }

  private populateRequestDetail(r: RequestDetailDto): void {
    this.currentRequestDetail.set(r);
    this.requestForm.patchValue({
      hospital:             r.hospitalId ?? '',
      contact:              r.contactPerson ?? '',
      phone:                r.contactPhone ?? '',
      intlPhone:            r.intlContactPhone ?? '',
      physician:            r.physicianId ?? '',
      diagnosis:            r.diagnosis ?? '',
      productType:          r.productType ?? '',
      priority:             r.priority ?? '',
      withAbo:              r.bloodType ?? '',
      exactMatch:           r.exactMatch === 'Y',
      matchCriteriaType: r.hlaPheno === 'Y' ? 'HP'
                       : r.hlaAnti  === 'Y' ? 'HA'
                       : r.rbcAnti  === 'Y' ? 'RA'
                       : r.rbcPheno === 'Y' ? 'RP'
                       : 'HP',
      inventorySearch:      r.unitRequest === 'Y',
    });

    if (r.requestedDate) {
      this.requestDateControl.setValue(moment(r.requestedDate));
    }

    // Scheduled dates
    const datesArr = this.scheduledDatesArray;
    while (datesArr.length) datesArr.removeAt(0);
    for (let i = 1; i <= 7; i++) {
      const dateKey = `expTransfusionDate${i}` as keyof RequestDetailDto;
      const qtyKey  = `quantity${i}` as keyof RequestDetailDto;
      const targetDate = r[dateKey] as string | undefined;
      const quantity   = r[qtyKey]  as number | undefined;
      if (targetDate || quantity) {
        const group = this.fb.group({
          targetDate: [targetDate ? moment(targetDate) : null],
          units:      [quantity ? String(quantity) : null],
        });
        if (targetDate) {
          const unitsCtrl = group.get('units')!;
          unitsCtrl.setValidators([Validators.required]);
          unitsCtrl.updateValueAndValidity();
        }
        datesArr.push(group);
      }
    }
    if (!datesArr.length) datesArr.push(this.createScheduledDateRow());

    // Groups & Attributes
    const attrArr = this.requestAttributesArray;
    while (attrArr.length) attrArr.removeAt(0);
    if (r.requestDetails?.length) {
      r.requestDetails.forEach(d => attrArr.push(this.fb.group({ attribGroup: [d.attribGroup], attribCode: [d.attribCode] })));
    } else {
      attrArr.push(this.createRequestAttributeRow());
    }
  }

  // ─── Create New ───────────────────────────────────────────────────────────

  onCreateNewRecipient(): void {
    this.isCreateNew.set(true);
    this.isExpanded.set(true);
    this.isRecipientExpanded.set(true);
    this.isMatchCriteriaExpanded.set(true);
    this.isRequestDetailsExpanded.set(true);
    this.selectedPatientId.set(null);
    this.patientRequests.set([]);
    this.currentRequestDetail.set(null);
    this.requestForm.reset({
      patientId: '-', status: '', exactMatch: false, matchCriteriaType: 'HP',
      inventorySearch: false,
    });
    this.resetFormArrays();
    this.dobDateControl.reset();
    this.requestDateControl.reset();
    this.cdr.markForCheck();
  }

  onClearSearch(): void {
    this.selectedPatientId.set(null);
    this.patientRequests.set([]);
    this.isCreateNew.set(false);
    this.isExpanded.set(false);
    this.isNewRequest.set(false);
    this.hasSaved.set(false);
    this.hasSubmittedSearch.set(false);
    this.isRecipientExpanded.set(false);
    this.isMatchCriteriaExpanded.set(false);
    this.isRequestDetailsExpanded.set(false);
    this.resetFormArrays();
    this.dobDateControl.reset();
    this.cdr.markForCheck();
  }

  private resetFormArrays(): void {
    const reset = (arr: FormArray, create: () => FormGroup) => {
      while (arr.length) arr.removeAt(0);
      arr.push(create());
    };
    reset(this.hlaPhenotypeArray,      () => this.createHlaPhenotypeRow());
    reset(this.hlaAntibodiesArray,     () => this.createHlaAntibodyRow());
    reset(this.rbcAntibodiesArray,     () => this.createRbcAntibodyRow());
    reset(this.rbcAntigensArray,       () => this.createRbcAntigenRow());
    reset(this.scheduledDatesArray,    () => this.createScheduledDateRow());
    reset(this.requestAttributesArray, () => this.createRequestAttributeRow());
  }

  // ─── Date of Birth ────────────────────────────────────────────────────────

  onExactMatchChange(): void {
    (document.activeElement as HTMLElement)?.blur();
  }

  onInventorySearchChange(): void {
    (document.activeElement as HTMLElement)?.blur();
  }

  onDobInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.dobDateControl
    );
    this.cdr.markForCheck();
  }

  onDobBlur(): void {
    setTimeout(() => {
      const control = this.dobDateControl;
      const inputElement = this.dobInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';
      control.markAsTouched();
      if (inputValue && !control.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];
        const parsed = moment(inputValue, formats, true);
        if (parsed?.isValid()) {
          control.setValue(parsed);
          if (inputElement) inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
        } else {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      }
      this.cdr.markForCheck();
    }, 0);
  }

  getDobError(): string {
    const control = this.dobDateControl;
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Date of Birth is invalid';
    if (control.hasError('invalidDate')) return 'Date of Birth is invalid';
    if (control.hasError('matDatepickerMax')) return 'Date of Birth cannot be a future date';
    if (control.hasError('dobMaxAge')) return 'Date of Birth cannot be more than 150 years ago';
    return '';
  }

  // ─── Request Date ─────────────────────────────────────────────────────────

  onRequestDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.requestDateControl
    );
    this.cdr.markForCheck();
  }

  onRequestDateBlur(): void {
    setTimeout(() => {
      const control = this.requestDateControl;
      const inputElement = this.requestDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';
      control.markAsTouched();
      if (inputValue && !control.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];
        const parsed = moment(inputValue, formats, true);
        if (parsed?.isValid()) {
          control.setValue(parsed);
          if (inputElement) inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
        } else {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      }
      this.cdr.markForCheck();
    }, 0);
  }

  getRequestDateError(): string {
    const control = this.requestDateControl;
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Request Date is required';
    if (control.hasError('matDatepickerParse')) return 'Request Date is invalid';
    if (control.hasError('invalidDate')) return 'Request Date is invalid';
    if (control.hasError('matDatepickerMin')) return 'Request Date cannot be a past date';
    return '';
  }

  // ─── Target Date ──────────────────────────────────────────────────────────

  onTargetDateInput(event: Event, control: FormControl): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      control
    );
    this.cdr.markForCheck();
  }

  onTargetDateBlur(event: FocusEvent, control: FormControl): void {
    setTimeout(() => {
      const inputElement = event.target as HTMLInputElement;
      const inputValue = inputElement?.value?.trim() || '';
      control.markAsTouched();
      if (inputValue && !control.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];
        const parsed = moment(inputValue, formats, true);
        if (parsed?.isValid()) {
          control.setValue(parsed);
          if (inputElement) inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
        } else {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      }
      this.cdr.markForCheck();
    }, 0);
  }

  getTargetDateError(control: FormControl): string {
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Target Date is invalid';
    if (control.hasError('invalidDate')) return 'Target Date is invalid';
    if (control.hasError('matDatepickerMin')) return 'Target Date cannot be a past date';
    return '';
  }

  // ─── Section Toggle ───────────────────────────────────────────────────────

  toggleSection(section: 'recipient' | 'matchCriteria' | 'requestDetails'): void {
    if (section === 'recipient')      this.isRecipientExpanded.update(v => !v);
    else if (section === 'matchCriteria') this.isMatchCriteriaExpanded.update(v => !v);
    else if (section === 'requestDetails') this.isRequestDetailsExpanded.update(v => !v);
    this.cdr.markForCheck();
  }

  // ─── HLA Phenotype Array ──────────────────────────────────────────────────

  get hlaPhenotypeArray(): FormArray { return this.requestForm.get('hlaPhenotype') as FormArray; }

  private createHlaPhenotypeRow(): FormGroup {
    return this.fb.group(
      { a1: [''], a2: [''], b1: [''], b2: [''] },
      { validators: [hlaPhenotypeDuplicateValidator()] }
    );
  }

  addHlaPhenotypeRow(): void {
    if (this.hlaPhenotypeArray.length >= 5) return;
    this.hlaPhenotypeArray.push(this.createHlaPhenotypeRow());
  }

  removeHlaPhenotypeRow(index: number): void {
    if (this.hlaPhenotypeArray.length > 1) this.hlaPhenotypeArray.removeAt(index);
  }

  // HLA Phenotype change handlers removed - Oracle Forms does not auto-sort A1/A2 or B1/B2

  // ─── HLA Antibodies Array ─────────────────────────────────────────────────

  get hlaAntibodiesArray(): FormArray { return this.requestForm.get('hlaAntibodies') as FormArray; }

  private createHlaAntibodyRow(): FormGroup {
    return this.fb.group({ locus: [''], epitopeId: [''] });
  }

  addHlaAntibodyRow(): void {
    if (this.hlaAntibodiesArray.length >= 5) return;
    this.hlaAntibodiesArray.push(this.createHlaAntibodyRow());
  }

  removeHlaAntibodyRow(index: number): void {
    if (this.hlaAntibodiesArray.length > 1) this.hlaAntibodiesArray.removeAt(index);
  }

  onHlaLocusChange(rowIndex: number): void {
    const locus = this.hlaAntibodiesArray.at(rowIndex).get('locus')?.value;
    this.hlaAntibodiesArray.at(rowIndex).get('epitopeId')?.setValue('');
    if (!locus || this.hlaEpitopesMap()[locus]) return;
    this.service.getHlaEpitopesByLocus(locus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: opts => {
          this.hlaEpitopesMap.update(m => ({ ...m, [locus]: opts }));
          this.cdr.markForCheck();
        },
      });
  }

  getEpitopeOptions(rowIndex: number): LovOption[] {
    const locus = this.hlaAntibodiesArray.at(rowIndex)?.get('locus')?.value;
    return locus ? (this.hlaEpitopesMap()[locus] ?? []) : [];
  }

  // ─── RBC Antibodies Array ─────────────────────────────────────────────────

  get rbcAntibodiesArray(): FormArray { return this.requestForm.get('rbcAntibodies') as FormArray; }

  private createRbcAntibodyRow(): FormGroup {
    return this.fb.group({ testId: [''] });
  }

  addRbcAntibodyRow(): void {
    if (this.rbcAntibodiesArray.length >= 5) return;
    this.rbcAntibodiesArray.push(this.createRbcAntibodyRow());
  }

  removeRbcAntibodyRow(index: number): void {
    if (this.rbcAntibodiesArray.length > 1) this.rbcAntibodiesArray.removeAt(index);
  }

  // ─── RBC Antigens Array ───────────────────────────────────────────────────

  get rbcAntigensArray(): FormArray { return this.requestForm.get('rbcAntigens') as FormArray; }

  private createRbcAntigenRow(): FormGroup {
    return this.fb.group({ testId: [''], resultCode: [''] });
  }

  addRbcAntigenRow(): void {
    if (this.rbcAntigensArray.length >= 4) return;
    this.rbcAntigensArray.push(this.createRbcAntigenRow());
  }

  removeRbcAntigenRow(index: number): void {
    if (this.rbcAntigensArray.length > 1) this.rbcAntigensArray.removeAt(index);
  }

  // ─── Scheduled Dates Array ────────────────────────────────────────────────

  get scheduledDatesArray(): FormArray { return this.requestForm.get('scheduledDates') as FormArray; }

  addScheduledDate(): void {
    if (this.scheduledDatesArray.length >= 7) return;
    this.scheduledDatesArray.push(this.createScheduledDateRow());
    this.requestForm.updateValueAndValidity();
    this.requestFormStatus.set(this.requestForm.status);
  }

  removeScheduledDate(index: number): void {
    if (this.scheduledDatesArray.length > 1) this.scheduledDatesArray.removeAt(index);
    this.requestForm.updateValueAndValidity();
    this.requestFormStatus.set(this.requestForm.status);
  }

  private createScheduledDateRow(defaultDate?: Moment | null): FormGroup {
    // Oracle Forms does not show auto-increment logic - default to null
    const date = defaultDate ?? null;
    const group = this.fb.group({ targetDate: [date], units: [null] });
    if (date) {
      const unitsCtrl = group.get('units')!;
      unitsCtrl.setValidators([Validators.required]);
      unitsCtrl.updateValueAndValidity();
    }
    return group;
  }

  onScheduledDateChange(index: number): void {
    const group = this.scheduledDatesArray.at(index) as FormGroup;
    const dateVal = group.get('targetDate')?.value;
    const unitsCtrl = group.get('units')!;
    if (dateVal) {
      unitsCtrl.setValidators([Validators.required]);
    } else {
      unitsCtrl.clearValidators();
    }
    unitsCtrl.updateValueAndValidity();
    this.requestFormStatus.set(this.requestForm.status);
  }

  onSelectPanelChange(opened: boolean, searchCtrl: FormControl): void {
    if (!opened) searchCtrl.setValue('');
  }

  // ─── Request Attributes Array ─────────────────────────────────────────────

  get requestAttributesArray(): FormArray { return this.requestForm.get('requestAttributes') as FormArray; }

  addRequestAttribute(): void {
    if (this.requestAttributesArray.length >= 10) return;
    this.requestAttributesArray.push(this.createRequestAttributeRow());
  }

  removeRequestAttribute(index: number): void {
    if (this.requestAttributesArray.length > 1) this.requestAttributesArray.removeAt(index);
  }

  private createRequestAttributeRow(): FormGroup {
    return this.fb.group({ attribGroup: [''], attribCode: [''] });
  }

  onAttribGroupChange(rowIndex: number): void {
    const group = this.requestAttributesArray.at(rowIndex).get('attribGroup')?.value;
    this.requestAttributesArray.at(rowIndex).get('attribCode')?.setValue('');
    if (!group || this.attribCodeOptionsMap()[group]) return;
    this.service.getAttributeCodes(group)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: opts => {
          this.attribCodeOptionsMap.update(m => ({ ...m, [group]: opts }));
          this.cdr.markForCheck();
        },
      });
  }

  getAttribCodeOptions(rowIndex: number): LovOption[] {
    const group = this.requestAttributesArray.at(rowIndex)?.get('attribGroup')?.value;
    return group ? (this.attribCodeOptionsMap()[group] ?? []) : [];
  }

  // ─── Form Array Accessor ──────────────────────────────────────────────────

  controlAt(array: FormArray, index: number, name: string): FormControl {
    return (array.at(index) as FormGroup).get(name) as FormControl;
  }

  getPhenoALabel(value: string | null): string {
    if (!value) return '';
    return this.hlaAOptions().find(o => o.value === value)?.label ?? value;
  }

  getPhenoBLabel(value: string | null): string {
    if (!value) return '';
    return this.hlaBOptions().find(o => o.value === value)?.label ?? value;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  onQueryRequest(): void {
    this.router.navigate([ROUTES.DONOR_FUNCTIONS.HLA_RBC_REQUEST_QUERY]);
  }

  onCloseRequest(): void {
    const requestId = this.requestForm.get('requestId')?.value;
    if (!requestId) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Close Request',
        message: 'Do you want to close this request?',
        cancelText: 'NO',
        confirmText: 'YES',
      } as ConfirmActionDialogData,
      width: '480px',
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.service.closeRequest(requestId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showSuccessToast('Request closed successfully (Error 9163).');
              // Refresh request detail to show closed status
              this.service.getRequestDetail(requestId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: detail => {
                    if (detail) this.currentRequestDetail.set(detail);
                    this.cdr.markForCheck();
                  },
                });
            },
            error: err => {
              this.showErrorToast(err?.error?.message || 'Failed to close request.');
              this.cdr.markForCheck();
            },
          });
      }
    });
  }

  onSave(startSearch: boolean): void {
    this.requestForm.markAllAsTouched();
    this.requestDateControl.markAsTouched();
    this.cdr.markForCheck();

    if (!this.sectionsVisible()) {
      this.showErrorToast('Please select or create a recipient before saving.');
      return;
    }
    if (this.requestForm.invalid || this.requestDateControl.invalid) return;

    if (startSearch) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        data: {
          title: 'Start Search',
          message: 'The search has been successfully submitted. Do you want the search to begin now?',
          cancelText: 'NO',
          confirmText: 'YES',
        } as ConfirmActionDialogData,
        width: '480px',
        disableClose: true,
      });
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
        // Only save if user clicked YES
        if (confirmed === true) {
          this.doSave(true);
        }
        // If NO or dialog dismissed, do nothing (don't save)
      });
    } else {
      this.doSave(false);
    }
  }

  private deriveMatchType(): MatchType | null {
    const type = this.requestForm.get('matchCriteriaType')?.value as MatchType;
    return type || null;
  }

  private doSave(submitSearch: boolean): void {
    this.isSaving.set(true);
    const v = this.requestForm.getRawValue();

    const matchType = this.deriveMatchType();
    if (!matchType) {
      this.showErrorToast('Please select at least one match criteria type.');
      this.isSaving.set(false);
      return;
    }

    const isNewPatient = this.isCreateNew();
    const patId = isNewPatient ? undefined : (v.patientId !== '-' ? v.patientId : undefined);

    // HLA Phenotype — API takes flat a1/a2/b1/b2 from first row
    const firstPheno = (v.hlaPhenotype?.[0] ?? {}) as { a1?: string; a2?: string; b1?: string; b2?: string };

    // Scheduled dates
    const scheduledDates = (v.scheduledDates ?? [])
      .filter((r: { targetDate: unknown; units: unknown }) => r.targetDate || r.units)
      .map((r: { targetDate: unknown; units: string | null }) => ({
        targetDate: r.targetDate ? moment(r.targetDate as string).format('YYYY-MM-DD') : undefined,
        quantity:   r.units ? Number(r.units) : undefined,
      }));

    // Request attributes
    const requestDetails = (v.requestAttributes ?? [])
      .filter((r: { attribGroup: string; attribCode: string }) => r.attribGroup)
      .map((r: { attribGroup: string; attribCode: string }) => ({
        attribGroup: r.attribGroup,
        attribCode:  r.attribCode,
      }));

    // Resolve hospital label (API needs the description/name, not code)
    const selectedHospital = this.hospitalOptions().find(h => h.value === v.hospital);
    const hospitalName = selectedHospital?.label ?? v.hospital ?? '';

    // Resolve physician
    const selectedPhysician = this.physicianOptions().find(p => p.value === v.physician);

    const requestIdValue = this.isNewRequest() ? undefined : (v.requestId || undefined);

    const payload = {
      isNewPatient,
      ...(patId ? { patId } : {}),
      patLastName:  v.lastName,
      patFirstName: v.firstName || undefined,
      sex:          v.sex || undefined,
      dob:          this.dobDateControl.value ? moment(this.dobDateControl.value).format('YYYY-MM-DD') : undefined,
      aboType:      v.abo || undefined,
      status:       v.status,
      comments:     v.comments || undefined,
      matchType,
      exactMatch:   v.exactMatch,
      withAbo:      v.withAbo || undefined,
      ...(matchType === 'HP' ? {
        hlaA1: firstPheno.a1 || undefined,
        hlaA2: firstPheno.a2 || undefined,
        hlaB1: firstPheno.b1 || undefined,
        hlaB2: firstPheno.b2 || undefined,
      } : {}),
      ...(matchType === 'HA' ? {
        hlaAntibodies: (v.hlaAntibodies ?? [])
          .filter((r: { locus: string; epitopeId: string }) => r.locus || r.epitopeId),
      } : {}),
      ...(matchType === 'RA' ? {
        rbcAntibodies: (v.rbcAntibodies ?? []).filter((r: { testId: string }) => r.testId),
      } : {}),
      ...(matchType === 'RP' ? {
        rbcAntigens: (v.rbcAntigens ?? [])
          .filter((r: { testId: string; resultCode: string }) => r.testId),
      } : {}),
      ...(requestIdValue ? { requestId: requestIdValue } : {}),
      hospitalName,
      contactPerson:    v.contact || undefined,
      contactPhone:     v.phone || undefined,
      intlContactPhone: v.intlPhone || undefined,
      ...(v.physician ? { physicianId: v.physician, physicianName: selectedPhysician?.label } : {}),
      diagnosis:    v.diagnosis || undefined,
      productType:  v.productType || undefined,
      priority:     v.priority || undefined,
      requestDate:  this.requestDateControl.value
        ? moment(this.requestDateControl.value).format('YYYY-MM-DD')
        : undefined,
      inventorySearch: !!v.inventorySearch,
      submitSearch,
      scheduledDates:  scheduledDates.length ? scheduledDates : undefined,
      requestDetails:  requestDetails.length ? requestDetails : undefined,
    };

    this.service.saveRequest(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.isSaving.set(false);
          this.hasSaved.set(true);
          if (submitSearch) this.hasSubmittedSearch.set(true);

          // Update form with generated IDs
          this.requestForm.get('patientId')?.setValue(result.patId);
          const existingReqs = this.patientRequests();
          if (!existingReqs.some(r => r.requestId === result.requestId)) {
            this.patientRequests.set([{ requestId: result.requestId }, ...existingReqs]);
          }
          this.requestForm.get('requestId')?.setValue(result.requestId);
          this.requestForm.get('requestId')?.enable();
          this.isNewRequest.set(false);
          this.selectedPatientId.set(result.patId);

          // Refresh patient dropdown to include newly created patient
          if (isNewPatient) {
            this.loadPatients();
          }

          this.showSuccessToast(submitSearch
            ? 'Request submitted for searching.'
            : 'The search has been successfully saved.');

          this.cdr.markForCheck();
        },
        error: err => {
          this.isSaving.set(false);
          const msg = err?.error?.message || err?.message || 'Failed to save the request. Please try again.';
          this.showErrorToast(msg);
          this.cdr.markForCheck();
        },
      });
  }

  private showStartSearchDialog(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Start Search',
        message: 'The search has been successfully submitted. Do you want the search to begin now?',
        cancelText: 'NO',
        confirmText: 'YES',
      } as ConfirmActionDialogData,
      width: '480px',
      disableClose: true,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.showSuccessToast('The search has been successfully saved.');
      this.cdr.markForCheck();
    });
  }

  private showSuccessToast(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end', verticalPosition: 'top', duration: 5000,
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      horizontalPosition: 'end', verticalPosition: 'top', duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  hasError(controlName: string): boolean {
    const ctrl = this.requestForm.get(controlName);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  private readonly fieldLabels: Record<string, string> = {
    lastName:  'Last Name',
    firstName: 'First Name',
    status:    'Status',
    hospital:  'Hospital',
    physician: 'Physician',
    productType: 'Product Type',
    priority:  'Priority',
    contact:   'Contact',
    phone:     'Phone',
    intlPhone: 'International Phone',
    diagnosis: 'Diagnosis',
    comments:  'Comments',
  };

  getError(controlName: string): string {
    const ctrl = this.requestForm.get(controlName);
    if (!ctrl?.errors) return '';
    const label = this.fieldLabels[controlName] ?? controlName;
    if (ctrl.errors['required']) return `${label} is required`;
    if (ctrl.errors['maxlength']) return `${label} must not exceed ${ctrl.errors['maxlength'].requiredLength} characters`;
    if (ctrl.errors['minlength']) return `${label} must be at least ${ctrl.errors['minlength'].requiredLength} characters`;
    return '';
  }

  /**
   * Get form-level error message for duplicate validation
   */
  getFormDuplicateError(): string {
    if (this.requestForm.hasError('hlaAntibodyDuplicate')) {
      return 'Duplicate HLA Antibody entries detected (same Locus and Epitope ID)';
    }
    if (this.requestForm.hasError('rbcAntibodyDuplicate')) {
      return 'Duplicate RBC Antibody entries detected (same Test ID)';
    }
    if (this.requestForm.hasError('rbcAntigenDuplicate')) {
      return 'Duplicate RBC Antigen entries detected (same Test ID and Result Code)';
    }
    return '';
  }

  /**
   * Get HLA Phenotype row-level error
   */
  getHlaPhenotypeError(rowIndex: number): string {
    const row = this.hlaPhenotypeArray.at(rowIndex) as FormGroup;
    if (!row || !(row.touched || row.dirty)) return '';
    if (row.hasError('a1a2Duplicate')) return 'A1 and A2 cannot have the same value';
    if (row.hasError('b1b2Duplicate')) return 'B1 and B2 cannot have the same value';
    return '';
  }
}
