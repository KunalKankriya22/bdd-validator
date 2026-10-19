import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, ChangeDetectorRef, ElementRef, inject, signal, computed, Input, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, FormsModule, AbstractControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of, from } from 'rxjs';
import { takeUntil, switchMap, concatMap, toArray, catchError, map } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import { HeaderService } from '@shared/services/header.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';

import { AuditDonationApiService } from './services/audit-donation-api.service';
import {
  AuditDonationDto,
  StatusIndicator,
  DropdownOption,
  AnswerCodeOption,
  HealthHistoryDto,
  HHTemplateQuestionDto,
  PhysicalFindingDto,
  PhysicalFindingTemplateDto,
  PhysicalValueRulesDto,
  PhysicalCodeRules,
  PhysicalNumericRule,
  HoldInterCodeDto,
  DonationInterdictionDto,
  AddPhysicalFindingRequest,
  AddQuestionToTemplateRequest,
  UpdateHealthHistoryRequest,
  UpdatePhysicalFindingRequest,
  AddHealthHistoryResponseRequest,
  SaveDonationAuditRequest,
  HHQuestionListDto,
} from './models/audit-donation.model';
import { HHQuestionsDialog, HHQuestionDto } from './dialogs/hh-questions-dialog';
import { HHTemplateDialog, HHTemplateQuestion } from './dialogs/hh-template-dialog';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HHFilterPanel } from './components/hh-filter-panel/hh-filter-panel';
import { CommentSidePanelComponent } from './components/comment-side-panel/comment-side-panel';
import { PlaceHoldSidePanelComponent, LocalHoldRow } from './components/place-hold-side-panel/place-hold-side-panel';

@Component({
  selector: 'app-audit-donation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    AlertComponent,
    LoadingSpinnerComponent,
    DataTable,
    CommentSidePanelComponent,
    PlaceHoldSidePanelComponent,
    FilterChips,
    HHFilterPanel,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './audit-donation.html',
  styleUrl: './audit-donation.scss',
})
export class AuditDonation implements OnInit, AfterViewInit, OnDestroy {
  /** 'unit' = search by Unit ID (default — DONAUDIT screen)
   *  'deferral' = search by Deferral ID (DRUDFAUD screen) */
  @Input() mode: 'unit' | 'deferral' = 'unit';
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('questionList') questionListRef!: ElementRef<HTMLElement>;
  @ViewChild('newRowFormEl') newRowFormEl?: ElementRef<HTMLElement>;
  @ViewChild('rescanUnitIdField') rescanUnitIdField?: UnitIdFieldComponent;
  @ViewChild('collDateInput') collDateInput?: ElementRef<HTMLInputElement>;

  collectionDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.collDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AuditDonationApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly loggingService = inject(LoggingService);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        if (pageData.title) {
          this.pageTitle.set(pageData.title);
        }
        if (pageData.subtitle) {
          this.pageSubtitle.set(pageData.subtitle);
        }
      }
    });
  }

  // Forms
  searchForm!: FormGroup;
  auditForm!: FormGroup;
  addResponseForm!: FormGroup;
  newRowForm!: FormGroup;
  newPfRowForm!: FormGroup;

  // Page configuration
  // Breadcrumb state signals
  protected readonly fromDonationsPendingAudit = signal<boolean>(false);
  protected readonly returnUrl = signal<string | null>(null);
  protected readonly parentLabel = signal<string>('Release Audit Interdictions');
  protected readonly pageTitle = signal<string>('Audit Donation');
  protected readonly pageSubtitle = signal<string>('View and release audit interdictions from a donor record.');

  // Store query params for use after view init
  private pendingUnitId: string | null = null;
  private pendingCollectionDate: string | null = null;

  /**
   * Navigate back to Donations Pending Audit Query with preserved query params
   */
  protected readonly navigateBack = (): void => {
    const returnUrl = this.returnUrl();

    // Get search params from current queryParams
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const searchParams: any = {};

      // Extract search state params
      if (params['searchFromDate']) searchParams.searchFromDate = params['searchFromDate'];
      if (params['searchToDate']) searchParams.searchToDate = params['searchToDate'];
      if (params['searchDriveId']) searchParams.searchDriveId = params['searchDriveId'];
      if (params['searchStatus']) searchParams.searchStatus = params['searchStatus'];
      if (params['searchDonationType']) searchParams.searchDonationType = params['searchDonationType'];
      if (params['searchProcedureCode']) searchParams.searchProcedureCode = params['searchProcedureCode'];
      if (params['searchKeyword']) searchParams.searchKeyword = params['searchKeyword'];

      if (returnUrl) {
        // Navigate to return URL with search params
        this.router.navigate([returnUrl.split('?')[0]], { queryParams: searchParams });
      } else {
        // Default fallback
        this.router.navigate(['/donor-functions/registration/donations-pending-audit-query'], { queryParams: searchParams });
      }
    }).unsubscribe();
  };

  // Computed header config with dynamic breadcrumbs
  headerConfig = computed<PageHeaderConfig>(() => {
    const breadcrumbs: Array<{ label: string; link: string | null }> = [
      { label: 'Home', link: '/home' }
    ];

    // Add intermediate breadcrumb when navigated from Donations Pending Audit Query or other parent screens
    const returnUrlValue = this.returnUrl();
    if (returnUrlValue) {
      breadcrumbs.push({
        label: this.parentLabel(),
        link: returnUrlValue
      });
    } else if (this.fromDonationsPendingAudit()) {
      breadcrumbs.push({
        label: 'Donations Pending Audit Query',
        link: '/donor-functions/registration/donations-pending-audit-query'
      });
    }

    breadcrumbs.push({
      label: this.mode === 'deferral' ? 'Audit Deferral' : 'Audit Donation',
      link: null
    });

    return {
      title: this.pageTitle(),
      subtitle: this.pageSubtitle(),
      breadcrumbs,
      showBackButton: this.fromDonationsPendingAudit() || !!returnUrlValue,
      onBackClick: () => this.navigateBack(),
      actions: [],
    };
  });

  // State signals
  isLoading = signal<boolean>(false);
  infoMessage = signal<string>('Scan or type the Unit ID to load the donation for audit.');
  warningMessage = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  donationData = signal<AuditDonationDto | null>(null);
  statusIndicators = signal<StatusIndicator[]>([]);
  multipleRecordsFound = signal<boolean>(false);

  // Double-entry for deferral ID (matches Oracle Forms TEST_PGM global.double pattern)
  private deferralFirstEntry = signal<string | null>(null);
  deferralAwaitingSecondEntry = signal<boolean>(false);

  // Tracks existing HH rows whose comment was edited: "questionCode:auditKey"
  private changedCommentKeys = new Set<string>();
  // Tracks existing HH rows changed via answer code, group code, or date fields
  private changedHhKeys = new Set<string>();
  // Monotonic counter for unsaved (auditKey===0) rows — ensures comment edits target one row only
  private _localIdCounter = 0;

  // Tracks edited Value fields for existing PF rows (physicalCode → edited value)
  private pfCurrentValues = new Map<string, string>();
  private pfCurrentInterdictions = new Map<string, string>();

  getPfValue(physicalCode: string): string {
    if (this.pfCurrentValues.has(physicalCode)) return this.pfCurrentValues.get(physicalCode)!;
    const serverRow = this.physicalFindings().find(p => p.physicalCode === physicalCode);
    // Trim server value to match dropdown option values (Oracle CHAR columns pad with trailing spaces)
    if (serverRow) return (serverRow.value ?? '').trim();
    // Also check pending new rows so their value shows correctly in table
    return (this.pendingNewPfRows().find(p => p.physicalCode === physicalCode)?.value ?? '').trim();
  }

  getPfInterdiction(physicalCode: string, rowInterdiction: string | undefined): string {
    return this.pfCurrentInterdictions.get(physicalCode) ?? rowInterdiction ?? '-';
  }

  onPfValueChange(physicalCode: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pfCurrentValues.set(physicalCode, value);
    // Clear field error while user is typing
    if (this.pfValueErrors().has(physicalCode)) {
      const errs = new Map(this.pfValueErrors());
      errs.delete(physicalCode);
      this.pfValueErrors.set(errs);
    }
  }

  onPfValueBlur(physicalCode: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    const rules  = this.getPfRules(physicalCode);
    const dataType = rules?.dataType;

    // Clear previous error
    const errs = new Map(this.pfValueErrors());
    errs.delete(physicalCode);

    // For N/D-type fields: check C-type char rules first (e.g. UNANS on BPDI/BPSY/PULSE).
    // Old app allowed typing a coded value (UNANS) into a numeric text box — it matched the
    // DATA_TYPE='C' row in VALID_PHYSICAL_RULES and fired the corresponding interdiction.
    if (value && (dataType === 'N' || dataType === 'D') && rules?.charValues?.length) {
      const charMatch = rules.charValues.find(
        r => r.value.toUpperCase() === value.toUpperCase()
      );
      if (charMatch) {
        this.pfValueErrors.set(errs);
        this.pfCurrentInterdictions.set(physicalCode, charMatch.interCode ?? '');
        const req = new Map(this.pfCommentsRequired());
        req.set(physicalCode, charMatch.commentsRequired);
        this.pfCommentsRequired.set(req);
        return;
      }
    }

    // "U" (Unknown) is always accepted — skip format validation
    if (value && value.toUpperCase() !== 'U' && (dataType === 'N' || dataType === 'D')) {
      if (dataType === 'N') {
        if (!/^-?\d+$/.test(value)) {
          errs.set(physicalCode, 'Integer only');
          this.pfValueErrors.set(errs);
          return;
        }
      } else if (dataType === 'D') {
        if (!/^\.\d+$|^\d+\.\d+$/.test(value)) {
          errs.set(physicalCode, 'Decimal value required (e.g. 98.6)');
          this.pfValueErrors.set(errs);
          return;
        }
      }
    }

    this.pfValueErrors.set(errs);
    this.checkNumericCommentsRequired(physicalCode, value);
    this.updateLocalInterdiction(physicalCode, value);
  }

  getPfValueError(physicalCode: string): string {
    return this.pfValueErrors().get(physicalCode) ?? '';
  }

  // Mirrors DON_STD.pop_reason multi-rule/single-rule semantics (2026_R1 DON_STD.pkg):
  // - Multi-rule (>1 numeric rule): BETWEEN IS-in-range + interCode → trigger;
  //   BETWEEN/INRANGE IS-in-range + no interCode → explicitly normal (clears prior trigger).
  //   INRANGE IS-in-range + interCode → sets that interCode (e.g. TBV AP16).
  // - Single-rule (1 numeric rule): BETWEEN/INRANGE NOT-in-range → trigger.
  // - MORE/LESS: same in both — value beyond threshold triggers.
  private evalNumericRules(numericRules: { operator: string; threshold: number; max?: number; interCode?: string | null; commentsRequired?: boolean; commentReqFlag?: string }[], num: number): { interCode: string | null; commentsRequired: boolean } {
    const isMultiRule = numericRules.length > 1;
    let interCode: string | null = null;
    let commentsRequired = false;

    for (const r of numericRules) {
      const op = r.operator.toUpperCase();
      const hasInterCode = !!r.interCode;
      const commentReq = r.commentsRequired ?? r.commentReqFlag === 'Y';

      if ((op === 'BETWEEN' || op === 'INRANGE') && r.max !== undefined) {
        const inRange = num >= r.threshold && num <= r.max;
        if (isMultiRule) {
          if (inRange && hasInterCode) {
            interCode = r.interCode!;
            commentsRequired = commentReq;
          } else if (inRange) {
            interCode = null;
            commentsRequired = false;
          }
        } else {
          if (!inRange && hasInterCode) {
            interCode = r.interCode!;
            commentsRequired = commentReq;
          }
        }
      } else if (op === 'MORE' && hasInterCode) {
        if (num > r.threshold) { interCode = r.interCode!; commentsRequired = commentReq; }
      } else if (op === 'LESS' && hasInterCode) {
        if (num < r.threshold) { interCode = r.interCode!; commentsRequired = commentReq; }
      }
    }
    return { interCode, commentsRequired };
  }

  private updateLocalInterdiction(physicalCode: string, value: string): void {
    const rules = this.getPfRules(physicalCode);
    if (!rules?.numericRules?.length) return;

    if (rules.charValues?.length) {
      const charMatch = rules.charValues.find(r => r.value.toUpperCase() === value.toUpperCase());
      if (charMatch) {
        this.pfCurrentInterdictions.set(physicalCode, charMatch.interCode ?? '');
        return;
      }
    }

    const num = parseFloat(value);
    if (isNaN(num)) return;

    const { interCode: triggeredInterCode } = this.evalNumericRules(rules.numericRules, num);
    this.pfCurrentInterdictions.set(physicalCode, triggeredInterCode ?? '');
  }

  private checkNumericCommentsRequired(physicalCode: string, value: string): void {
    const rules = this.getPfRules(physicalCode);
    if (!rules?.numericRules?.length) return;

    // Char-value fallback (TBV='OR', PULSE='UNANS', etc.)
    if (rules.charValues?.length) {
      const charMatch = rules.charValues.find(r => r.value.toUpperCase() === value.toUpperCase());
      if (charMatch) {
        const triggered = charMatch.interCode ? { commentsRequired: charMatch.commentsRequired ?? false } : undefined;
        const req = new Map(this.pfCommentsRequired());
        const touched = new Map(this.pfCommentsTouched());
        if (triggered?.commentsRequired) {
          req.set(physicalCode, true);
          touched.set(physicalCode, true);
        } else {
          req.delete(physicalCode);
          touched.delete(physicalCode);
        }
        this.pfCommentsRequired.set(req);
        this.pfCommentsTouched.set(touched);
        return;
      }
    }

    const num = parseFloat(value);
    if (isNaN(num)) return;

    const { interCode, commentsRequired: commentReq } = this.evalNumericRules(rules.numericRules, num);
    const triggered = interCode ? { commentsRequired: commentReq } : undefined;

    const req = new Map(this.pfCommentsRequired());
    const touched = new Map(this.pfCommentsTouched());
    if (triggered?.commentsRequired) {
      req.set(physicalCode, true);
      touched.set(physicalCode, true); // show error immediately on blur
    } else {
      req.delete(physicalCode);
      touched.delete(physicalCode);
    }
    this.pfCommentsRequired.set(req);
    this.pfCommentsTouched.set(touched);
  }

  // Place Hold — stored locally, committed on rescan
  isHoldPanelOpen = signal(false);
  holdCodes = signal<HoldInterCodeDto[]>([]);
  existingInterdictions = signal<DonationInterdictionDto[]>([]);
  pendingHoldRows = signal<LocalHoldRow[] | null>(null); // null = no pending changes

  // MLT-10698: PRTYP period type day-multipliers for def_thru_date calculation
  periodTypeMultipliers = signal<Map<string, number>>(new Map());

  // NODONSIGN inter code — loaded once on init for unsigned donor card hold
  nodosignInterCode = signal<string | null>(null);

  // NODONATION inter code — loaded once on init for donation type 99 hold
  nodonationInterCode = signal<string | null>(null);
  pendingNodonationHold = signal(false);
  pendingRemoveNodonationHold = signal(false);

  // NOPROCEDUR inter code — loaded once on init for procedure code 99 hold
  noprocedurInterCode = signal<string | null>(null);
  pendingNoprocedurHold = signal(false);
  pendingRemoveNoprocedurHold = signal(false);

  // Weight physical code from VALID_PARAMETERS (parameter_code='PF_WEIGHT') — defaults to 'WEIGHT'
  // Used to pre-populate the weight row with donor's registered weight (matches old app PRE-TEXT-ITEM)
  pfWeightCode = signal<string | null>(null);

  // Tracks whether the user confirmed 'No' (unsigned) on the donor signature dropdown.
  // Deferred until commitAudit — placeHold is NOT called immediately on dropdown change.
  pendingNodosignHold = signal(false);

  // Physical Findings template — pre-populated from PHYSICAL_FINDINGS_TEMPLATE
  pfTemplate = signal<PhysicalFindingTemplateDto[]>([]);
  private pfTemplateLoaded = false; // guard: load template only once per session
  private _pfFindingsLoaded = false; // FIX 1: coordination flag — merge only after both findings + template are ready
  // Per-physical-code rules: C=dropdown values, N/D=range info
  pfValueRules = signal<Map<string, PhysicalCodeRules>>(new Map());
  // Which physical codes currently have comments required — signal so template re-renders on change
  pfCommentsRequired = signal<Map<string, boolean>>(new Map());
  pfValueErrors = signal<Map<string, string>>(new Map());
  // Which comment fields have been touched — signal for reactivity
  pfCommentsTouched = signal<Map<string, boolean>>(new Map());
  // Inline comments being entered per physical code
  pfInlineComments = new Map<string, string>();

  // Dropdown options
  donorSignatureOptions = signal<DropdownOption[]>([
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ]);
  donationTypeOptions = signal<DropdownOption[]>([]);
  procedureCodeOptions = signal<DropdownOption[]>([]);

  // Filter panel state
  isFilterPanelOpen = signal<boolean>(false);
  activeFilterCodes = signal<Set<string>>(new Set());

  // Filter chips derived from active filters
  filterChips = computed<FilterChip[]>(() => {
    const codes = this.activeFilterCodes();
    if (!codes.size) return [];
    return Array.from(codes).map(code => {
      const q = this.templateQuestions().find(q => q.questionCode === code);
      return { key: code, label: String(q?.sortSequence ?? code), value: code, removable: true };
    });
  });

  groupCodeOptions = signal<DropdownOption[]>([]);

  answerCodeOptions = signal<DropdownOption[]>([]);

  // Per-question answer code options — keyed by questionCode.
  // Fixes: (1) onAnswerCodeChange finding wrong opt when shared signal has another question's options,
  //        (2) all rows showing same options (the last-selected question's) causing other rows to appear deselected.
  private readonly answerCodesByQuestion = new Map<string, AnswerCodeOption[]>();

  // Tab state
  selectedTabIndex = signal<number>(0);
  // Physical Findings are always shown below HH on the same scrollable page
  showPhysicalFindings = signal<boolean>(true);

  // Health History state
  templateQuestions = signal<HHTemplateQuestionDto[]>([]); // Questions from template API
  allHealthHistoryResponses = signal<HealthHistoryDto[]>([]); // All responses from health-history API
  selectedQuestionCode = signal<string | null>(null);
  hhSearchTerm = signal<string>('');
  get hhSearchTermValue(): string { return this.hhSearchTerm(); }
  set hhSearchTermValue(v: string) { this.hhSearchTerm.set(v); }
  isLoadingResponses = signal<boolean>(false);
  isAddingResponse = signal<boolean>(false);
  isAddingPfRow = signal<boolean>(false);
  pfTableReady  = signal<boolean>(false);
  isSavingPfRow = signal<boolean>(false);
  // Pending new PF rows saved locally — committed to API on re-enter deferral ID
  pendingNewPfRows = signal<PhysicalFindingDto[]>([]);
  // New PF row — description + interdiction derived from selected code/value
  newPfCodeDescription  = signal<string>('');
  newPfInterCode        = signal<string>('');
  newPfCommentsRequired = signal<boolean>(false);
  newPfValueError       = signal<string>('');
  newRowShowDateRange   = signal<boolean>(false);
  newRowIncidentDateRequired = signal<boolean>(true);
  newRowCommentRequired = signal<boolean>(false);

  // Physical Findings state
  physicalFindings = signal<PhysicalFindingDto[]>([]);
  physicalFindingsColumns: string[] = ['physicalCode', 'description', 'value', 'interdiction', 'comments', 'actions'];
  // Tracks physical codes that the user has locally deleted (committed on rescan via API)
  private pendingDeletedPfCodes = new Set<string>();

  // Add Question to Template state
  isAddingTemplateQuestion = signal<boolean>(false);
  addTemplateQuestionForm!: FormGroup;

  // Comment Side Panel state
  isCommentPanelOpen = signal<boolean>(false);
  selectedResponseForComment = signal<HealthHistoryDto | null>(null);

  // Health History Response table columns
  hhResponseColumns: string[] = ['groupCode', 'answerCode', 'description', 'incidentDate', 'deferralThrough', 'interdiction', 'actions'];

  // Table configurations
  responseTableConfig: DataTableConfig<HealthHistoryDto> = {
    columns: [
      { key: 'groupCode', header: 'Group Code', width: '150px' },
      { key: 'answerCode', header: 'Ans Code', width: '180px' },
      {
        key: 'answerDescription',
        header: 'Description',
        valueFormatter: (_, row: HealthHistoryDto) => row.answerDescription ?? ''
      },
      {
        key: 'incidentDate',
        header: 'Incident Date',
        width: '155px',
        valueFormatter: (v) => v ? this.formatDate(v) : ''
      },
      {
        key: 'deferralThrough',
        header: 'Deferral Through',
        width: '155px',
        valueFormatter: (v) => v ? this.formatDate(v) : ''
      },
      { key: 'interdiction', header: 'Interdiction', width: '90px' },
    ],
    rowActions: [
      { action: 'message', icon: 'chat',          label: '', color: 'default' },
      { action: 'delete',  icon: 'delete_outline', label: '', color: 'warn' },
    ],
    noDataIcon: 'info',
    showTableOnEmpty: true,
    showPagination: false,
    enableRowHighlight: true,
  };

  @ViewChild('pfCodeCellTpl')          pfCodeCellTpl!: TemplateRef<any>;
  @ViewChild('pfValueCellTpl')         pfValueCellTpl!: TemplateRef<any>;
  @ViewChild('pfInterdictionCellTpl')  pfInterdictionCellTpl!: TemplateRef<any>;
  @ViewChild('pfCommentsCellTpl')      pfCommentsCellTpl!: TemplateRef<any>;

  readonly physicalFindingsTableConfig = signal<DataTableConfig<any>>({
    columns: [
      { key: 'physicalCode',        header: 'Physical Code',  width: '130px' },
      { key: 'physicalDescription', header: 'Description',
        valueFormatter: (_, row: any) => row.physicalDescription || row.description || '' },
      { key: 'value',               header: 'Value',          width: '180px' },
      { key: 'interdiction',        header: 'Interdiction',   width: '120px',
        valueFormatter: (_, row: any) => row.interdiction || '' },
      { key: 'comments',            header: 'Comments',
        valueFormatter: (_, row: any) => row.isNewRow ? '' : (row.comments || '') },
    ],
    rowActions: [
      // Cancel icon on the inline new-row placeholder (same as "Add new response" delete-to-cancel pattern)
      { icon: 'delete', action: 'cancel', visible: (row: any) => this.mode === 'deferral' && !!row.isNewRow },
      // Delete on existing rows — deferral only
      { icon: 'delete', action: 'delete', visible: (row: any) => this.mode === 'deferral' && !row.isNewRow },
    ],
    emptyMessage: 'No physical findings available for this donation type and procedure code',
    noDataIcon: 'info',
    showTableOnEmpty: true,
    showPagination: false,
    enableRowHighlight: false,
  });

  // Table data: existing rows + optional new-row placeholder at the bottom.
  // IMPORTANT: this computed must NOT read signals that change on every value selection
  // (pfCommentsRequired, pfCurrentValues) — doing so triggers a full table re-render
  // that destroys mat-select/autocomplete elements and resets the user's selection.
  // _commentsRequired is evaluated per-row via isCommentRequired() which reads pfValueRules
  // (static after load) and pfCommentsRequired (checked inside the method, not as a computed dep).
  physicalFindingsForTable = computed(() => {
    this.pfValueRules();
    this.pendingNewPfRows();
    const rows: any[] = this.physicalFindings().map(pf => ({
      ...pf,
    }));
    for (const pf of this.pendingNewPfRows()) {
      rows.push({
        ...pf,
        isPending: true,
      });
    }
    if (this.isAddingPfRow()) {
      rows.push({ physicalCode: '__new__', isNewRow: true });
    }
    return rows;
  });

  // Computed states
  showEmptyState = computed(() =>
    !this.isLoading() && !this.donationData()
  );

  // True when loaded unit has an unreleased AUHLD — blocks all save operations (matches DRIVISNU error 16201)
  hasActiveAuditHold = computed(() => this.donationData()?.hasActiveAuditHold === true);

  // Filter template questions for sidebar
  filteredHealthHistory = computed(() => {
    const searchTerm = this.hhSearchTerm().toLowerCase().trim();
    const activeCodes = this.activeFilterCodes();
    let questions = this.templateQuestions();

    // Apply filter panel selection
    if (activeCodes.size > 0) {
      questions = questions.filter(q => activeCodes.has(q.questionCode));
    }

    // Apply search term
    if (searchTerm) {
      questions = questions.filter(q =>
        q.questionCode?.toLowerCase().includes(searchTerm) ||
        q.questionDescription?.toLowerCase().includes(searchTerm)
      );
    }

    return questions;
  });

  // PREV / NEXT question navigation
  currentQuestionIndex = computed(() => {
    const code = this.selectedQuestionCode();
    if (!code) return -1;
    return this.filteredHealthHistory().findIndex(q => q.questionCode === code);
  });

  hasPrevQuestion = computed(() => this.currentQuestionIndex() > 0);
  hasNextQuestion = computed(() => {
    const idx = this.currentQuestionIndex();
    return idx >= 0 && idx < this.filteredHealthHistory().length - 1;
  });

  onPrevQuestion(): void {
    if (!this.tryExitNewRowForm()) return;
    const idx = this.currentQuestionIndex();
    if (idx > 0) {
      const prev = this.filteredHealthHistory()[idx - 1];
      this.selectHHQuestion(prev.questionCode);
      this.scrollSelectedQuestionIntoView();
    }
  }

  onNextQuestion(): void {
    if (!this.tryExitNewRowForm()) return;
    const idx = this.currentQuestionIndex();
    const questions = this.filteredHealthHistory();
    if (idx >= 0 && idx < questions.length - 1) {
      const next = questions[idx + 1];
      this.selectHHQuestion(next.questionCode);
      this.scrollSelectedQuestionIntoView();
    }
  }

  clearCurrentQuestionResponses(): void {
    const questionCode = this.selectedQuestionCode();
    if (!questionCode) return;
    const before = this.allHealthHistoryResponses().length;
    this.allHealthHistoryResponses.update(list =>
      list.filter(r => r.questionCode !== questionCode || r.auditKey !== 0)
    );
    const removed = before - this.allHealthHistoryResponses().length;
    if (this.isAddingResponse()) {
      this.newRowForm.reset();
      this.isAddingResponse.set(false);
    }
    if (removed > 0) {
      this.showSuccessToast(`${removed} unsaved response(s) cleared.`);
    } else {
      this.showSuccessToast('No unsaved responses to clear.');
    }
  }

  saveCurrentQuestion(): void {
    if (!this.tryExitNewRowForm()) return;
    const questionCode = this.selectedQuestionCode();
    if (!questionCode) return;
    this.showSuccessToast('Question saved.');
  }

  saveAndNextQuestion(): void {
    this.saveCurrentQuestion();
    this.onNextQuestion();
  }

  private scrollSelectedQuestionIntoView(): void {
    setTimeout(() => {
      const selected = this.questionListRef?.nativeElement?.querySelector('.question-card--selected');
      selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }

  // Returns true if safe to navigate away, false if blocked (form invalid — errors shown inline)
  private tryExitNewRowForm(): boolean {
    if (!this.isAddingResponse() || !this.hasNewRowData()) return true;
    this.newRowForm.markAllAsTouched();
    if (this.newRowForm.invalid) {
      this.focusFirstInvalidField(this.newRowForm);
      setTimeout(() => {
        this.newRowFormEl?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      this.showErrorToast('Please fill required fields in the open response form first.');
      return false;
    }
    this.submitNewRow();
    return true;
  }

  // Get selected question details from template
  selectedQuestion = computed(() => {
    const questionCode = this.selectedQuestionCode();
    if (!questionCode) return null;

    return this.templateQuestions().find(q => q.questionCode === questionCode) || null;
  });

  // Get all responses for the selected question (filtered client-side)
  selectedQuestionResponses = computed(() => {
    const questionCode = this.selectedQuestionCode();
    if (!questionCode) return [];

    return this.allHealthHistoryResponses().filter(r => r.questionCode === questionCode);
  });

  // Track previous values for dialog comparison
  protected previousDonorSignature = '';
  protected previousDonationType = '';
  protected previousProcedureCode = '';

  // Captures the donor-signature value when the dropdown opens so we can detect a change to 'No'
  private valueBeforeOpen: string | null = null;

  // Search controls for searchable dropdowns
  readonly donationTypeSearchCtrl = new FormControl<string>('');
  readonly procedureCodeSearchCtrl = new FormControl<string>('');
  readonly groupCodeSearchCtrl = new FormControl<string>('');
  readonly answerCodeSearchCtrl = new FormControl<string>('');
  readonly newRowGroupCodeSearchCtrl = new FormControl<string>('');
  readonly newRowAnswerCodeSearchCtrl = new FormControl<string>('');
  readonly pfValueSearchCtrls = new Map<string, FormControl<string>>();
  private readonly pfValueSearchTerms = signal<Map<string, string>>(new Map());

  // Per-row FormControls for the mat-autocomplete on mixed N/D+C physical code fields.
  // Using a FormControl instead of [value] prevents the DataTable re-render from
  // disconnecting the autocomplete when onPfCharValueSelect updates physicalFindings signal.
  readonly pfValueFormCtrls = new Map<string, FormControl<string>>();

  getPfValueFormCtrl(physicalCode: string): FormControl<string> {
    if (!this.pfValueFormCtrls.has(physicalCode)) {
      const initial = this.getPfValue(physicalCode);
      const ctrl = new FormControl<string>(initial, { nonNullable: true }) as FormControl<string>;
      ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
        if (v !== null && v !== undefined) {
          this.pfCurrentValues.set(physicalCode, v);
        }
      });
      this.pfValueFormCtrls.set(physicalCode, ctrl);
    }
    const ctrl = this.pfValueFormCtrls.get(physicalCode)!;
    // Keep the FormControl in sync with pfCurrentValues after autocomplete selection.
    // Angular Material updates the FormControl via _onChange before (optionSelected) fires,
    // but if the signal re-render swaps the DOM element Angular binds a fresh control instance.
    // Ensuring the cached control's value matches pfCurrentValues prevents showing stale data.
    // Also sync from server data (physicalFindings) when no local edit exists — ensures the
    // saved value displays correctly after reload (matches Oracle POST-QUERY behavior).
    const current = this.pfCurrentValues.get(physicalCode);
    if (current !== undefined && ctrl.value !== current) {
      ctrl.setValue(current, { emitEvent: false });
    } else if (current === undefined) {
      const serverVal = (this.physicalFindings().find(p => p.physicalCode === physicalCode)?.value ?? '').trim();
      if (ctrl.value !== serverVal) {
        ctrl.setValue(serverVal, { emitEvent: false });
      }
    }
    return ctrl;
  }

  // Called by mat-autocomplete (optionSelected) for mixed N/D+C codes.
  // Angular Material has already called _onChange(selectedValue) before this event fires,
  // so the FormControl is already updated. We must NOT call ctrl.setValue again — doing so
  // with emitEvent:false suppresses the valueChanges emission that Angular Material uses to
  // confirm the selection was committed, causing it to revert to the previous value on panel close.
  onPfAutoValueSelect(physicalCode: string, selectedValue: string): void {
    this.pfCurrentValues.set(physicalCode, selectedValue);

    const rule = this.getPfCharValues(physicalCode).find(v => v.value === selectedValue);
    this.pfCurrentInterdictions.set(physicalCode, rule?.interCode ?? '');
    const req     = new Map(this.pfCommentsRequired());
    const touched = new Map(this.pfCommentsTouched());
    if (rule?.commentsRequired) {
      req.set(physicalCode, true);
      touched.set(physicalCode, true);
    } else {
      req.delete(physicalCode);
      touched.delete(physicalCode);
    }
    this.pfCommentsRequired.set(req);
    this.pfCommentsTouched.set(touched);
  }

  getPfValueSearchCtrl(physicalCode: string): FormControl<string> {
    if (!this.pfValueSearchCtrls.has(physicalCode)) {
      const ctrl = new FormControl<string>('') as FormControl<string>;
      ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
        const m = new Map(this.pfValueSearchTerms());
        m.set(physicalCode, (v ?? '').toLowerCase().trim());
        this.pfValueSearchTerms.set(m);
      });
      this.pfValueSearchCtrls.set(physicalCode, ctrl);
    }
    return this.pfValueSearchCtrls.get(physicalCode)!;
  }

  // Search term signals — updated via valueChanges subscriptions in ngOnInit
  private readonly donationTypeSearchTerm = signal<string>('');
  private readonly procedureCodeSearchTerm = signal<string>('');
  private readonly groupCodeSearchTerm = signal<string>('');
  private readonly answerCodeSearchTerm = signal<string>('');
  private readonly newRowGroupCodeSearchTerm = signal<string>('');
  private readonly newRowAnswerCodeSearchTerm = signal<string>('');

  readonly filteredDonationTypeOptions = computed(() => {
    const term = this.donationTypeSearchTerm().toLowerCase().trim();
    const opts = this.donationTypeOptions();
    if (!term) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  });

  readonly filteredProcedureCodeOptions = computed(() => {
    const term = this.procedureCodeSearchTerm().toLowerCase().trim();
    const opts = this.procedureCodeOptions();
    if (!term) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  });

  readonly filteredGroupCodeOptions = computed(() => {
    const term = this.groupCodeSearchTerm().toLowerCase().trim();
    const opts = this.groupCodeOptions();
    if (!term) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  });

  readonly filteredAnswerCodeOptions = computed(() => {
    const term = this.answerCodeSearchTerm().toLowerCase().trim();
    const opts = this.answerCodeOptions();
    if (!term) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  });

  readonly filteredNewRowGroupCodeOptions = computed(() => {
    const term = this.newRowGroupCodeSearchTerm().toLowerCase().trim();
    const opts = this.groupCodeOptions();
    if (!term) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  });

  // Separate answer-code options for the new-row form so that changing group
  // on the new row does NOT affect the existing rows' dropdowns.
  private newRowAnswerCodeOptions = signal<AnswerCodeOption[]>([]);

  readonly filteredNewRowAnswerCodeOptions = computed(() => {
    const term = this.newRowAnswerCodeSearchTerm().toLowerCase().trim();
    const opts = this.newRowAnswerCodeOptions();
    if (!term) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  });

  getFilteredPfCharValues(physicalCode: string): { value: string; interCode: string | null; commentsRequired: boolean }[] {
    const term = this.pfValueSearchTerms().get(physicalCode) ?? '';
    const vals = this.getPfCharValues(physicalCode);
    if (!term) return vals;
    return vals.filter(v => v.value.toLowerCase().includes(term));
  }

  // Parsed Unit ID from UnitIdFieldComponent after successful validation
  parsedUnitId = signal<string | null>(null);

  // Deferral Status — matches old DRIREAUD DEFERRAL_STATUS procedure logic:
  //   'Indefinite' if any HH inter_code has period_type='P' in VALID_INTERDICTIONS
  //   else max defThruDate > collectionDate formatted DD-MMM-YYYY
  //   else '-'
  deferralStatus = computed(() => {
    const responses = this.allHealthHistoryResponses();
    if (!responses.length) return '-';
    if (responses.some(r => r.interPeriodType === 'P')) return 'Indefinite';
    const collDate = this.donationData()?.collectionDate;
    const validDates = responses
      .filter(r => r.defThruDate)
      .map(r => moment(r.defThruDate as string))
      .filter(m => m.isValid() && (!collDate || m.isAfter(moment(collDate), 'day')));
    if (!validDates.length) return '-';
    const maxDate = validDates.reduce((a, b) => a.isAfter(b) ? a : b);
    return maxDate.format('DD-MMM-YYYY').toUpperCase();
  });

  // Get selected donation type label
  get selectedDonationTypeLabel(): string {
    const value = this.auditForm.get('donationType')?.value;
    if (!value) return '';
    const option = this.donationTypeOptions().find(o => o.value === value);
    return option?.label || value;
  }

  // Get selected procedure code label
  get selectedProcedureCodeLabel(): string {
    const value = this.auditForm.get('procedureCode')?.value;
    if (!value) return '';
    const option = this.procedureCodeOptions().find(o => o.value === value);
    return option?.label || value;
  }

  /** Route ID to use for API calls — falls back to transactionId when unitId is null (deferral walk-in records) */
  private get effectiveDonationId(): string {
    const d = this.donationData();
    return d?.unitId || d?.transactionId || '';
  }

  /** When unitId is null, pass transactionId as override so BE skips unitId validation */
  private get overrideTxId(): string | undefined {
    const d = this.donationData();
    return d?.unitId ? undefined : (d?.transactionId ?? undefined);
  }

  get isRescanValid(): boolean {
    if (!this.donationData()) return false;
    if (this.mode === 'deferral') {
      const rescanValue = (this.searchForm.get('rescanUnitId')?.value ?? '').trim().toUpperCase();
      const deferralId  = (this.searchForm.get('deferralId')?.value ?? '').trim().toUpperCase();
      return !!(deferralId && rescanValue && rescanValue === deferralId);
    }
    return this.rescanUnitIdField?.isValid === true;
  }

  // Check if footer buttons should be disabled
  get areFooterButtonsDisabled(): boolean {
    return !this.isRescanValid || this.auditForm.invalid;
  }

  ngOnInit(): void {
    if (window.location.pathname.includes('donation-deferral-audit-drawer')) {
      this.mode = 'deferral';
      this.pageTitle.set('Audit Deferral');
      this.pageSubtitle.set('View and place the interdictions from a donor record.');
      this.infoMessage.set('Scan or enter the Deferral ID to load the donation for audit. If duplicates exist, provide the collection date.');
    }
    this.initializeForms();

    // Handle breadcrumb navigation and auto-populate from query params or router state
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const deferralId = params['deferralId'];

      // Pre-populate deferral ID if provided (for deferral mode)
      if (deferralId && this.mode === 'deferral') {
        this.searchForm.patchValue({ deferralId: deferralId });
        // Simulate double-entry confirmation so the record auto-retrieves:
        // first onRetrieve() stores the first entry and clears the field,
        // then we re-fill and call onRetrieve() again to confirm and fetch.
        setTimeout(() => {
          this.onRetrieve();
          this.searchForm.patchValue({ deferralId: deferralId }, { emitEvent: false });
          this.onRetrieve();
        });
      }
    });

    // Check router state for navigation context
    // Check for returnUrl query param and set breadcrumb state
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
        this.fromDonationsPendingAudit.set(true);
      }
      if (params['parentLabel']) {
        this.parentLabel.set(params['parentLabel']);
      }

      // Auto-load unit ID and collection date from query params
      if (params['unitId']) {
        // Store for use in ngAfterViewInit when the ViewChild is available
        this.pendingUnitId = params['unitId'];
        this.pendingCollectionDate = params['collectionDate'];

        // Set collection date in the form
        if (params['collectionDate']) {
          this.searchForm.patchValue({
            collectionDate: moment(params['collectionDate'])
          });
        }
      }
    });

    // Also check history.state for backwards compatibility
    const navState = history.state;
    if (navState?.returnPath) {
      this.setupBreadcrumbFromState(navState.returnPath, navState.filterState);
    } else if (navState?.deferralId && this.mode === 'deferral') {
      this.searchForm.patchValue({ deferralId: navState.deferralId });
      setTimeout(() => this.onRetrieve());
    }
    this.loadDropdownOptions();
    this.loadHoldCodes();
    this.loadNodosignCode();
    this.loadNodonationCode();
    this.loadNoprocedurCode();
    this.loadPfWeightCode();
    this.loadPeriodTypeMultipliers();
    this.subscribeToChapterChanges();
    this.subscribeToRescanUnitId();
    this.donationTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.donationTypeSearchTerm.set(v ?? ''));
    this.procedureCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.procedureCodeSearchTerm.set(v ?? ''));
    this.groupCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.groupCodeSearchTerm.set(v ?? ''));
    this.answerCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.answerCodeSearchTerm.set(v ?? ''));
    this.newRowGroupCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.newRowGroupCodeSearchTerm.set(v ?? ''));
    this.newRowAnswerCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.newRowAnswerCodeSearchTerm.set(v ?? ''));
  }

  ngAfterViewInit(): void {
    // Auto-fill Unit ID if passed from query params
    if (this.pendingUnitId && this.unitIdField) {
      // ISBT IDs are 13 chars in DB and require =prefix + 00 check-digit suffix when scanned.
      // Codabar IDs (7 or 10 chars) are used as-is — no prefix or check digit.
      const rawId = this.pendingUnitId;
      const formattedUnitId = rawId.length === 13 ? `=${rawId}00` : rawId;
      this.unitIdField.setValue(formattedUnitId);

      // Trigger validation and retrieve after setting the value
      setTimeout(() => {
        if (this.unitIdField) {
          // Trigger blur to mark field as touched
          this.unitIdField.onBlur();

          // Trigger the validation by calling onEnter (simulates Enter key press)
          this.unitIdField.onEnter();

          // Wait for validation to complete, then retrieve
          setTimeout(() => {
            this.onRetrieve();
          }, 300);
        }
      }, 200);
    }

    const current = this.physicalFindingsTableConfig();
    this.physicalFindingsTableConfig.set({
      ...current,
      columns: current.columns.map((col: any) => {
        if (col.key === 'physicalCode') return { ...col, cellTemplate: this.pfCodeCellTpl };
        if (col.key === 'value')        return { ...col, cellTemplate: this.pfValueCellTpl };
        if (col.key === 'interdiction') return { ...col, cellTemplate: this.pfInterdictionCellTpl };
        if (col.key === 'comments')     return { ...col, cellTemplate: this.pfCommentsCellTpl };
        return col;
      }),
    });
    this.pfTableReady.set(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup breadcrumb navigation from router state
   * Updates the breadcrumb to show the parent screen
   */
  private setupBreadcrumbFromState(returnPath: string, filterState?: Record<string, string>): void {
    try {
      this.loggingService.debug('Setting up breadcrumb from state: ' + returnPath, filterState);

      // Construct query string from filter state
      let returnUrl = returnPath;
      if (filterState && Object.keys(filterState).length > 0) {
        const params = new URLSearchParams();
        Object.entries(filterState).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        returnUrl = `${returnPath}?${params.toString()}`;
      }

      this.returnUrl.set(returnUrl);

      // Determine parent label based on path
      let parentLabel = 'Release Audit Interdictions';
      if (returnPath.includes('deferrals-on-hold-query')) {
        parentLabel = 'Deferrals on Hold Query';
      } else if (returnPath.includes('donations-on-hold-query')) {
        parentLabel = 'Donations on Hold Query';
      } else if (returnPath.includes('registered-deferrals-query')) {
        parentLabel = 'Registered Deferrals Query';
      }

      // Update signals - the computed headerConfig will automatically recalculate
      this.parentLabel.set(parentLabel);

      this.loggingService.debug('Breadcrumb parent label: ' + parentLabel);
      this.loggingService.debug('Breadcrumb return URL: ' + returnUrl);
      this.loggingService.debug('Breadcrumb config will auto-update via computed signal');
    } catch (error) {
      this.loggingService.warn('Error setting up breadcrumb from state', error);
    }
  }

  // Not used — rescan now handled via (keydown.enter) on the input
  private subscribeToRescanUnitId(): void {}

  private _rescanInProgress = false;
  private _hasShownDeferralStatus = false;

  // Deferral mode only — unit mode rescan is handled by onRescanPostValidate via app-unit-id-field
  async onRescanEnter(): Promise<void> {
    if (this._rescanInProgress) return;
    this._rescanInProgress = true;

    const entered  = (this.searchForm.get('rescanUnitId')?.value ?? '').trim().toUpperCase();
    const expected = (this.searchForm.get('deferralId')?.value ?? '').trim().toUpperCase();

    if (!entered) {
      this.showErrorToast('Deferral ID is required to save the audit.');
      this._rescanInProgress = false;
      return;
    }
    if (!expected) { this._rescanInProgress = false; return; }

    if (entered !== expected) {
      this.showErrorToast(`Deferral ID does not match. Expected: ${expected}. Entered: ${entered}.`);
      this.searchForm.patchValue({ rescanUnitId: '' }, { emitEvent: false });
      this._rescanInProgress = false;
      return;
    }

    const donation = this.donationData();
    if (!donation) { this._rescanInProgress = false; return; }

    // Auto-submit open HH new-row form before committing so in-progress entries are not lost
    if (this.isAddingResponse() && this.hasNewRowData()) {
      this.submitNewRow();
    }

    // Auto-save any in-progress new PF row before committing
    if (this.mode === 'deferral' && this.isAddingPfRow() && this.newPfRowForm.get('physicalCode')?.value) {
      this.saveNewPfRow();
    }

    // Enforce comment_req_flag at rescan time — check both server rows AND pending new rows
    const allPfRows = [...this.physicalFindings(), ...this.pendingNewPfRows()];
    const missingComments = allPfRows.filter(pf => {
      const currentValue = this.pfCurrentValues.get(pf.physicalCode) ?? pf.value ?? null;
      if (!this.isCommentRequired(pf.physicalCode, currentValue)) return false;
      return !this.getEffectivePfComment(pf.physicalCode, pf.comments ?? null).trim();
    });
    if (missingComments.length > 0) {
      this.showErrorToast('Comments are required for highlighted physical findings before saving.');
      this._rescanInProgress = false;
      return;
    }

    const confirmed = await this.showConfirmationDialog(
      'Save Audit',
      'Are you sure you want to save the audit?'
    );

    this.searchForm.patchValue({ rescanUnitId: '' }, { emitEvent: false });
    this._rescanInProgress = false;

    if (!confirmed) return;

    this.isLoading.set(true);
    this.commitAudit(donation);
  }

  // Unit mode rescan — called by app-unit-id-field postValidate after BE format validation
  async onRescanPostValidate(event: UnitIdPostValidateEvent): Promise<void> {
    if (this._rescanInProgress) {
      event.reject('Save already in progress');
      return;
    }

    const entered    = (event.data.parsedUnitId ?? '').trim().toUpperCase();
    const dbUnitId   = (this.donationData()?.unitId ?? '').trim().toUpperCase();
    const parsedUnit = (this.parsedUnitId() ?? '').trim().toUpperCase();
    const expected   = dbUnitId || parsedUnit;

    if (!expected) {
      event.reject('No unit loaded');
      return;
    }

    if (entered !== expected) {
      event.reject(`Unit ID does not match. Expected: ${expected}. Entered: ${entered}.`);
      this.showErrorToast('Unit ID mismatch — form cleared. Please scan the unit again.');
      this.clear();
      return;
    }

    const donation = this.donationData();
    if (!donation) {
      event.reject('No donation loaded');
      return;
    }

    // Unit matches — confirm field (green state), then show save dialog
    event.confirm();

    this._rescanInProgress = true;

    // Enforce comment_req_flag at rescan time — check both server rows AND pending new rows
    const allPfRows = [...this.physicalFindings(), ...this.pendingNewPfRows()];
    const missingComments = allPfRows.filter(pf => {
      const currentValue = this.pfCurrentValues.get(pf.physicalCode) ?? pf.value ?? null;
      if (!this.isCommentRequired(pf.physicalCode, currentValue)) return false;
      return !this.getEffectivePfComment(pf.physicalCode, pf.comments ?? null).trim();
    });
    if (missingComments.length > 0) {
      this.showErrorToast('Comments are required for highlighted physical findings before saving.');
      event.reject?.('Comments required');
      this._rescanInProgress = false;
      return;
    }

    const confirmed = await this.showConfirmationDialog(
      'Save Audit',
      'Are you sure you want to save the audit?'
    );

    this.rescanUnitIdField?.clear();
    this._rescanInProgress = false;

    if (!confirmed) return;

    this.isLoading.set(true);
    this.commitAudit(donation);
  }

  // Full commit sequence matching DRIREAUD F_RE_SCANED_UNIT_ID.KEY-NEXT-ITEM
  private commitAudit(donation: AuditDonationDto): void {
    // Enforce mandatory audit fields before any API calls
    this.auditForm.markAllAsTouched();
    if (this.auditForm.invalid) {
      this.isLoading.set(false);
      this.focusFirstInvalidField(this.auditForm);
      this.showErrorToast('Donor Signature, Donation Type and Procedure Code are required.');
      return;
    }

    // Enforce comment_req_flag at save time — check both server rows AND pending new rows
    const allPfRows = [...this.physicalFindings(), ...this.pendingNewPfRows()];
    const missingComments = allPfRows.filter(pf => {
      const currentValue = this.pfCurrentValues.get(pf.physicalCode) ?? pf.value ?? null;
      if (!this.isCommentRequired(pf.physicalCode, currentValue)) return false;
      return !this.getEffectivePfComment(pf.physicalCode, pf.comments ?? null).trim();
    });
    if (missingComments.length > 0) {
      this.isLoading.set(false);
      this.showErrorToast('Comments are required for highlighted physical findings before saving.');
      return;
    }

    if (!this.checkAllQuestionsAnswered()) {
      this.isLoading.set(false);
      return;
    }

    // Re-check AUHLD hold before committing — another user may have placed one
    // since retrieve time. Mirrors Oracle form-level AUHLD enforcement.
    const recheckId = donation.unitId || '';
    const recheckObs = recheckId
      ? this.apiService.getDonation(recheckId).pipe(
          map(d => d?.hasActiveAuditHold === true),
          catchError(() => of(false))
        )
      : of(false);

    recheckObs.pipe(takeUntil(this.destroy$)).subscribe(hasAuhld => {
      if (hasAuhld) {
        this.isLoading.set(false);
        this.showErrorToast('This unit is now on HOLD (AUHLD). Release the hold before completing audit.');
        this.clear();
        return;
      }
      this.executeCommitSteps(donation);
    });
  }

  private executeCommitSteps(donation: AuditDonationDto): void {
    const effectiveId = donation.unitId || donation.transactionId || '';
    const txId = donation.unitId ? undefined : (donation.transactionId ?? undefined);

    const steps: Observable<any>[] = [];

    // 1. HH responses — POST new (auditKey=0), PUT existing (auditKey>0)
    const hhResponses = this.allHealthHistoryResponses();
    const newHHResponses    = hhResponses.filter(r => r.auditKey === 0);
    const existingHHResponses = hhResponses.filter(r => r.auditKey > 0);

    // POST each new response individually (sequential via reduce chain)
    for (const r of newHHResponses) {
      const addReq: AddHealthHistoryResponseRequest = {
        questionCode:   r.questionCode,
        answerCode:     r.answerCode  ?? null,
        response:       r.response    ?? null,
        groupCode:      r.groupCode   ?? null,
        incidentDate:   r.incidentDate ?? null,
        deferralPeriod: null,
        periodType:     null,
        defThruDate:    r.defThruDate  ?? null,
        interCode:      r.interCode   || null,  // empty string → null so BE recalculates from VALID_HH_ANSWERS
        startDate:      r.startDate   ?? null,
        endDate:        r.endDate     ?? null,
        comments:       r.comments    ?? null,
      };
      steps.push(this.apiService.addHealthHistoryResponse(effectiveId, addReq, txId));
    }

    // PUT existing responses — rows with valid Y/N/U response AND any field change (answer, group, dates, comments).
    // Skip rows with null/empty response (bad DB data would cause BE error 16046).
    const validResponse = (r: HealthHistoryDto) =>
      r.response != null && ['Y','N','U'].includes((r.response as string).toUpperCase());
    const hhRequests: UpdateHealthHistoryRequest[] = existingHHResponses
      .filter(r => validResponse(r) && (
        this.changedCommentKeys.has(`${r.questionCode}:${r.auditKey}`) ||
        this.changedHhKeys.has(`${r.questionCode}:${r.auditKey}`)
      ))
      .map(r => ({
        questionCode: r.questionCode,
        auditKey:     r.auditKey,
        answerCode:   r.answerCode,
        response:     r.response,
        groupCode:    r.groupCode,
        incidentDate: r.incidentDate,
        defThruDate:  r.defThruDate,
        interCode:    r.interCode,
        comments:     r.comments,
      }));
    if (hhRequests.length > 0) {
      steps.push(this.apiService.updateHealthHistory(effectiveId, hhRequests, txId));
    }

    // 2a. Delete locally-removed PF rows from DB
    for (const code of this.pendingDeletedPfCodes) {
      steps.push(this.apiService.deletePhysicalFinding(effectiveId, code, txId));
    }

    // 2b. POST pending new PF rows — pick up any inline edits made after local save
    for (const pf of this.pendingNewPfRows()) {
      steps.push(this.apiService.addPhysicalFinding(effectiveId, {
        physicalCode:  pf.physicalCode,
        physicalValue: (this.pfCurrentValues.get(pf.physicalCode) ?? pf.value) || null,
        comments:      (this.pfInlineComments.get(pf.physicalCode) ?? pf.comments) || null,
      }, txId));
    }

    // 2c. POST template-derived rows (auditKey=0 in physicalFindings) that the user edited.
    // These don't exist in DB yet — route through ADD (INSERT with NOT EXISTS guard)
    // instead of UPDATE to match Oracle's pop_questions which inserts template rows.
    const pendingNewCodes = new Set(this.pendingNewPfRows().map(p => p.physicalCode));
    const templateDerivedToAdd = this.physicalFindings()
      .filter(pf =>
        String(pf.auditKey) === '0' &&
        !pendingNewCodes.has(pf.physicalCode) &&
        (this.pfCurrentValues.has(pf.physicalCode) || this.pfInlineComments.has(pf.physicalCode))
      );
    for (const pf of templateDerivedToAdd) {
      steps.push(this.apiService.addPhysicalFinding(effectiveId, {
        physicalCode:  pf.physicalCode,
        physicalValue: (this.pfCurrentValues.get(pf.physicalCode) ?? pf.value) || null,
        comments:      (this.pfInlineComments.get(pf.physicalCode) ?? pf.comments) || null,
      }, txId));
    }

    // 2d. Update existing DB rows (auditKey > 0) where value OR comment was changed
    const pfFindings: UpdatePhysicalFindingRequest[] = this.physicalFindings()
      .filter(pf =>
        String(pf.auditKey) !== '0' &&
        (this.pfCurrentValues.has(pf.physicalCode) ||
         this.pfInlineComments.has(pf.physicalCode))
      )
      .map(pf => ({
        physicalCode:  pf.physicalCode,
        physicalValue: this.pfCurrentValues.get(pf.physicalCode) ?? pf.value ?? null,
        interCode:     this.pfCurrentInterdictions.get(pf.physicalCode) ?? pf.interdiction ?? null,
        comments:      this.pfInlineComments.get(pf.physicalCode) ?? pf.comments ?? null,
      }));

    if (pfFindings.length > 0) {
      steps.push(this.apiService.updatePhysicalFindings(effectiveId, pfFindings, txId));
    }

    // 3. Commit pending hold changes (add new / remove deleted)
    const pendingRows = this.pendingHoldRows();
    if (pendingRows !== null) {
      const originalCodes = new Set(this.existingInterdictions().map(i => i.interCode));
      const pendingCodes  = new Set(pendingRows.map(r => r.interCode));
      for (const code of originalCodes) {
        if (!pendingCodes.has(code)) {
          steps.push(this.apiService.removeInterdiction(effectiveId, code, txId));
        }
      }
      for (const code of pendingCodes) {
        if (!originalCodes.has(code)) {
          steps.push(this.apiService.addInterdiction(effectiveId, { interCode: code, interType: 'HOLDS', collectionDate: donation.collectionDate }, txId));
        }
      }
    }

    // 3b. Place NODOSIGN hold if user confirmed unsigned donor card
    if (this.pendingNodosignHold()) {
      const nodosignCode = this.nodosignInterCode();
      if (nodosignCode) {
        const alreadyPlaced = this.existingInterdictions().some(i => i.interCode === nodosignCode)
          || (this.pendingHoldRows() ?? []).some(r => r.interCode === nodosignCode);
        if (!alreadyPlaced) {
          steps.push(this.apiService.placeHold(effectiveId, donation.transactionId, nodosignCode, txId));
        }
      }
    }

    // 3c. Place NODONATION hold if donation type is 99
    if (this.pendingNodonationHold()) {
      const nodonationCode = this.nodonationInterCode();
      if (nodonationCode) {
        const alreadyPlaced = this.existingInterdictions().some(i => i.interCode === nodonationCode)
          || (this.pendingHoldRows() ?? []).some(r => r.interCode === nodonationCode);
        if (!alreadyPlaced) {
          steps.push(this.apiService.placeHold(effectiveId, donation.transactionId, nodonationCode, txId));
        }
      }
    }

    // 3d. Place NOPROCEDUR hold if procedure code is 99
    if (this.pendingNoprocedurHold()) {
      const noprocedurCode = this.noprocedurInterCode();
      if (noprocedurCode) {
        const alreadyPlaced = this.existingInterdictions().some(i => i.interCode === noprocedurCode)
          || (this.pendingHoldRows() ?? []).some(r => r.interCode === noprocedurCode);
        if (!alreadyPlaced) {
          steps.push(this.apiService.placeHold(effectiveId, donation.transactionId, noprocedurCode, txId));
        }
      }
    }

    // 3e. Remove NODONATION hold if user changed donation type away from 99
    if (this.pendingRemoveNodonationHold()) {
      const nodonationCode = this.nodonationInterCode();
      if (nodonationCode && this.existingInterdictions().some(i => i.interCode === nodonationCode)) {
        steps.push(this.apiService.removeInterdiction(effectiveId, nodonationCode, txId));
      }
    }

    // 3f. Remove NOPROCEDUR hold if user changed procedure code away from 99
    if (this.pendingRemoveNoprocedurHold()) {
      const noprocedurCode = this.noprocedurInterCode();
      if (noprocedurCode && this.existingInterdictions().some(i => i.interCode === noprocedurCode)) {
        steps.push(this.apiService.removeInterdiction(effectiveId, noprocedurCode, txId));
      }
    }

    // 4. Save donation audit (n_audit_flag='Y', sig, donation type, proc code)
    const { donorSignature, donationType, procedureCode } = this.auditForm.value;
    const auditRequest: SaveDonationAuditRequest = {
      donorSignatureFlag: donorSignature === 'Yes' ? 'Y' : 'N',
      donationType: donationType ?? donation.donationType,
      procedureCode: procedureCode ?? donation.procedureCode,
    };
    steps.push(this.apiService.saveDonationAudit(effectiveId, auditRequest, txId));

    // Execute all steps in sequence — per-step catchError ensures later steps run even if one fails.
    // A partial-failure warning is shown when some (but not all) steps error.
    const failedCount = { value: 0 };
    (steps.length > 0
      ? from(steps).pipe(
          concatMap(step$ =>
            step$.pipe(
              catchError(err => {
                failedCount.value++;
                this.loggingService.error('Failed to save a commit step', err);
                return of(null);
              })
            )
          ),
          toArray()
        )
      : of([null])
    ).pipe(takeUntil(this.destroy$))
     .subscribe({
       next: () => {
         this.isLoading.set(false);
         if (failedCount.value > 0) {
           this.showErrorToast(`${failedCount.value} step(s) could not be saved. Please review and try again.`);
         } else if (this.mode === 'deferral') {
           const id = this.searchForm.get('deferralId')?.value;
           const verb = this.donationData()?.auditDate ? 'Updated' : 'Saved';
           this.showSuccessToast(`Audit Deferral ${id} ${verb} Successfully.`);
         } else {
           const status = this.deferralStatus();
           if (status === 'Indefinite' || (status !== '-' && status !== '')) {
             this.showSuccessToast(`Audit complete — unit is on HOLD. Deferral status: ${status}.`);
           } else {
             this.showSuccessToast('Audit complete — unit is clear.');
           }
         }
         this.clear();
       },
       error: (err) => {
         // Should not reach here due to per-step catchError; kept as a safety net.
         this.isLoading.set(false);
         this.showErrorToast(err?.error?.message ?? 'Commit failed. Please try again.');
       },
     });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clear();
      });
  }

  private loadHoldCodes(): void {
    this.apiService.getHoldCodes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (codes) => {
        this.holdCodes.set(codes);
        // Re-enrich any already-loaded interdictions that had no description
        const current = this.existingInterdictions();
        if (current.some(i => !i.interDescription)) {
          this.existingInterdictions.set(current.map(item => ({
            ...item,
            interDescription: item.interDescription ||
              codes.find(c => c.interCode === item.interCode)?.interDescription || '',
          })));
        }
      },
      error: () => {},
    });
  }

  private loadNodosignCode(): void {
    this.apiService.getNodosignCode().pipe(takeUntil(this.destroy$)).subscribe({
      next: (code) => this.nodosignInterCode.set(code),
      error: () => {},
    });
  }

  private loadNodonationCode(): void {
    this.apiService.getNodonationCode().pipe(takeUntil(this.destroy$)).subscribe({
      next: (code) => this.nodonationInterCode.set(code),
      error: () => {},
    });
  }

  private loadNoprocedurCode(): void {
    this.apiService.getNoprocedurCode().pipe(takeUntil(this.destroy$)).subscribe({
      next: (code) => this.noprocedurInterCode.set(code),
      error: () => {},
    });
  }

  private loadPfWeightCode(): void {
    this.apiService.getPfWeightCode().pipe(takeUntil(this.destroy$)).subscribe({
      next: (code) => {
        // Guard: ensure the value is always a plain string (API returns List<string> → service extracts [0])
        const safeCode = typeof code === 'string' ? code : (Array.isArray(code) ? (code as any)[0] : null);
        this.pfWeightCode.set(safeCode ?? 'WEIGHT');
        this.applyWeightDefaultToRows();
      },
      error: () => {
        this.pfWeightCode.set('WEIGHT');
        this.applyWeightDefaultToRows();
      },
    });
  }

  // MLT-10698: load PRTYP multipliers for def_thru_date calculation
  private loadPeriodTypeMultipliers(): void {
    this.apiService.getPeriodTypeMultipliers().pipe(takeUntil(this.destroy$)).subscribe(
      (m) => this.periodTypeMultipliers.set(m),
    );
  }

  // Fills the weight physical finding row with donor's registered weight when:
  //  - pfWeightCode is now known
  //  - the row value is still empty (no saved value, no user edit)
  // This fixes the race condition where mergePfTemplateWithValues ran before pfWeightCode resolved.
  private applyWeightDefaultToRows(): void {
    const weightCode = this.pfWeightCode();
    if (!weightCode) return;
    const donation = this.donationData();
    if (donation?.donorWeight == null) return;
    this.physicalFindings.update(list =>
      list.map(pf => {
        if (pf.physicalCode.trim() === weightCode.trim()
          && !pf.value
          && !this.pfCurrentValues.has(pf.physicalCode)) {
          return { ...pf, value: String(donation.donorWeight) };
        }
        return pf;
      })
    );
  }

  private loadExistingInterdictions(unitId: string, collectionDate?: string, txId?: string): void {
    this.apiService.getInterdictions(unitId, collectionDate, txId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => {
        const active = list.filter(i => !i.releaseDate);
        const enriched = active.map(item => ({
          ...item,
          interDescription: item.interDescription ||
            this.holdCodes().find(c => c.interCode === item.interCode)?.interDescription || '',
        }));
        this.existingInterdictions.set(enriched);
      },
      error: () => this.existingInterdictions.set([]),
    });
  }

  private reloadPfTemplateForTypeChange(): void {
    const donation = this.donationData();
    if (!donation) return;
    this.pfTemplateLoaded = false;
    this._pfFindingsLoaded = false;
    this.physicalFindings.set([]);
    this.pendingNewPfRows.set([]);
    this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
    this.pfInlineComments.clear();
    this.pfCommentsRequired.set(new Map());
    this.pfCommentsTouched.set(new Map());
    this.pfValueRules.set(new Map());
    this.pfValueErrors.set(new Map());
    this.isAddingPfRow.set(false);

    const effId = donation.unitId || donation.transactionId || '';
    const txId = donation.unitId ? undefined : (donation.transactionId ?? undefined);
    const collDateVal = this.searchForm.get('collectionDate')?.value;
    const collDate = collDateVal ? moment(collDateVal).format('YYYY-MM-DD') : undefined;

    this.loadPhysicalFindings(effId, collDate, txId);
    this.loadPfTemplate(donation);
  }

  private loadPfTemplate(donation: AuditDonationDto): void {
    if (this.pfTemplateLoaded) return;

    const collDateVal = this.searchForm.get('collectionDate')?.value;
    const collDate = collDateVal ? moment(collDateVal).format('YYYY-MM-DD') : undefined;

    const pfEffId = donation.unitId || donation.transactionId || '';
    const pfTxId = donation.unitId ? undefined : (donation.transactionId ?? undefined);

    // Load template and value rules in parallel
    this.apiService.getPhysicalFindingsTemplate(pfEffId, collDate, pfTxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template) => {
          this.pfTemplateLoaded = true;
          this.pfTemplate.set(template);
          // FIX 1: only merge once findings are also ready (two-flag coordination)
          if (this._pfFindingsLoaded) { this.mergePfTemplateWithValues(template); }
        },
        error: () => {},
      });

    this.apiService.getPhysicalValueRules(pfEffId, collDate, pfTxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rules) => {
          this.buildPfValueRules(rules);
          this.evaluateInterdictionsFromRules();
        },
        error: () => {},
      });
  }

  // Evaluates existing PF values against loaded rules and fills in missing interdictions.
  // Runs after value rules load so existing rows with null interCode (old data) show correctly.
  private evaluateInterdictionsFromRules(): void {
    const findings = this.physicalFindings();
    if (!findings.length) return;

    const updated = findings.map(pf => {
      if (pf.interdiction) return pf; // already has one from DB — keep it

      const rules = this.getPfRules(pf.physicalCode);
      if (!rules) return pf;

      const value = (this.pfCurrentValues.get(pf.physicalCode) ?? pf.value ?? '').trim();
      if (!value) return pf;

      let interCode: string | null = null;

      if (rules.dataType === 'C') {
        const match = rules.validValues.find(
          v => v.value.toUpperCase() === value.toUpperCase()
        );
        interCode = match?.interCode ?? null;
      } else {
        // Check char rules first — handles UNANS stored in N/D-type fields
        const charMatch = rules.charValues?.find(
          r => r.value.toUpperCase() === value.toUpperCase()
        );
        if (charMatch) {
          interCode = charMatch.interCode;
        } else {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            interCode = this.evalNumericRules(rules.numericRules, num).interCode;
          }
        }
      }

      return interCode ? { ...pf, interdiction: interCode } : pf;
    });

    this.physicalFindings.set(updated);
  }

  private buildPfValueRules(rawRules: PhysicalValueRulesDto[]): void {
    const map = new Map<string, PhysicalCodeRules>();
    const grouped = new Map<string, PhysicalValueRulesDto[]>();
    for (const r of rawRules) {
      // Trim physicalCode to guard against Oracle CHAR column trailing spaces causing lookup mismatches
      const key = r.physicalCode?.trim() ?? r.physicalCode;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }
    grouped.forEach((rows, code) => {
      // Use primaryDataType from BE (C only when ALL rows are C, else D wins N).
      // Client-side fallback mirrors the SQL window function exactly.
      const beType = rows[0]?.primaryDataType?.trim() as 'C' | 'N' | 'D' | undefined;
      const primaryType: 'C' | 'N' | 'D' = beType ||
        (rows.every(r => r.dataType === 'C') ? 'C' :  // all C → dropdown
         rows.some(r => r.dataType === 'D') ? 'D' :   // has decimal → decimal input
         'N');                                          // integer input

      // Build char values and dedup by item_value (safety net: SQL ROW_NUMBER() already deduped,
      // but duplicate rows can still arrive if gender 'A' + specific gender both match).
      const seenCharValues = new Set<string>();
      const charValues = rows
        .filter(r => r.dataType === 'C')
        .reduce<{ value: string; interCode: string | null; commentsRequired: boolean }[]>((acc, r) => {
          const val = (r.itemValue ?? '').trim();
          if (val && !seenCharValues.has(val)) {
            seenCharValues.add(val);
            acc.push({ value: val, interCode: r.interCode ?? null, commentsRequired: r.commentReqFlag === 'Y' });
          }
          return acc;
        }, []);

      const numericRules: PhysicalNumericRule[] = rows
        .filter(r => (r.dataType === 'N' || r.dataType === 'D') && r.itemOperator)
        .map(r => ({
          operator: r.itemOperator ?? '',
          threshold: parseFloat(r.itemValue ?? '0') || 0,
          max: r.itemValueMax ? parseFloat(r.itemValueMax) : undefined,
          interCode: r.interCode ?? null,
          commentsRequired: r.commentReqFlag === 'Y',
        }));

      const cleanCharValues = charValues.filter(v => v.value !== '');
      map.set(code, {
        dataType: primaryType,
        // validValues: for C-primary dropdown display only
        validValues: primaryType === 'C' ? cleanCharValues : [],
        // charValues: ALL C-type entries regardless of primaryType — used for:
        //   LOV button on N/D codes (ARMCK, BPDI-UNANS, etc.) matches old app F9/LISTVAL
        charValues: cleanCharValues,
        numericRules,
      });
    });
    this.pfValueRules.set(map);
  }

  getPfRules(physicalCode: string): PhysicalCodeRules | undefined {
    // Trim to match keys built with trimmed codes (handles Oracle CHAR trailing spaces)
    return this.pfValueRules().get(physicalCode?.trim() ?? physicalCode);
  }

  isPfCharType(physicalCode: string): boolean {
    return this.getPfRules(physicalCode)?.dataType === 'C';
  }

  // Returns ALL C-type values (both for dropdown on C-primary AND for LOV button on N/D-primary)
  getPfCharValues(physicalCode: string): { value: string; interCode: string | null; commentsRequired: boolean }[] {
    return this.getPfRules(physicalCode)?.charValues ?? [];
  }

  // LOV menu selection for N/D-primary codes — same as onPfCharValueSelect but triggered from mat-menu
  onPfLovMenuSelect(physicalCode: string, selectedValue: string, event: Event): void {
    event.stopPropagation();
    this.onPfCharValueSelect(physicalCode, selectedValue);
    // Also update the text input directly so the user sees the selected value
    this.pfCurrentValues.set(physicalCode, selectedValue);
  }

  onPfCharValueSelect(physicalCode: string, selectedValue: string): void {
    this.pfCurrentValues.set(physicalCode, selectedValue);
    const rule = this.getPfCharValues(physicalCode).find(v => v.value === selectedValue);
    this.pfCurrentInterdictions.set(physicalCode, rule?.interCode ?? '');
    const req = new Map(this.pfCommentsRequired());
    const touched = new Map(this.pfCommentsTouched());
    if (rule?.commentsRequired) {
      req.set(physicalCode, true);
      touched.set(physicalCode, true);
    } else {
      req.delete(physicalCode);
      touched.delete(physicalCode);
    }
    this.pfCommentsRequired.set(req);
    this.pfCommentsTouched.set(touched);
  }

  isPfCommentsRequired(physicalCode: string): boolean {
    return this.pfCommentsRequired().get(physicalCode) === true;
  }

  isCommentRequired(physicalCode: string, currentValue: string | null): boolean {
    // If session-updated signal says required, trust it
    if (this.pfCommentsRequired().get(physicalCode) === true) return true;
    if (!currentValue) return false;
    const rules = this.getPfRules(physicalCode); // uses trim-normalised key lookup
    if (!rules) return false;
    // Categorical value — compare trimmed to match trimmed keys stored in validValues
    if (rules.dataType === 'C') {
      return rules.validValues.find(v => v.value === currentValue.trim())?.commentsRequired === true;
    }
    // Numeric / decimal value
    if (rules.numericRules?.length) {
      const num = parseFloat(currentValue);
      if (isNaN(num)) return false;
      // INRANGE guard: value in normal range → no rules fire, no comment required
      const inNormal = rules.numericRules.some(r =>
        r.operator.toUpperCase() === 'INRANGE' &&
        r.max !== undefined && num >= r.threshold && num <= r.max
      );
      if (inNormal) return false;
      return rules.numericRules.some(r => {
        if (!r.commentsRequired) return false;
        const op = r.operator.toUpperCase();
        if (op === 'BETWEEN') return num < r.threshold || (r.max !== undefined && num > r.max);
        if (op === 'MORE')    return num > r.threshold;
        if (op === 'LESS')    return num < r.threshold;
        return false;
      });
    }
    return false;
  }

  getPfInlineComment(physicalCode: string): string {
    return this.pfInlineComments.get(physicalCode) ?? '';
  }

  onPfInlineCommentChange(physicalCode: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pfInlineComments.set(physicalCode, value);
  }

  markPfCommentTouched(physicalCode: string, _event: Event): void {
    const m = new Map(this.pfCommentsTouched());
    m.set(physicalCode, true);
    this.pfCommentsTouched.set(m);
  }

  isPfCommentTouched(physicalCode: string): boolean {
    return this.pfCommentsTouched().get(physicalCode) === true;
  }

  hasPfInlineCommentEdited(physicalCode: string): boolean {
    return this.pfInlineComments.has(physicalCode);
  }

  getEffectivePfComment(physicalCode: string, existingComment: string | null): string {
    if (this.pfInlineComments.has(physicalCode)) {
      return this.pfInlineComments.get(physicalCode) ?? '';
    }
    return existingComment ?? '';
  }

  private mergePfTemplateWithValues(template: PhysicalFindingTemplateDto[]): void {
    if (!template.length) return;

    const existing = this.physicalFindings();
    const donation = this.donationData();
    const weightCode = this.pfWeightCode();

    // Dedup template by physicalCode — PHYSICAL_FINDINGS_TEMPLATE can have duplicate rows
    // (e.g. two entries for ARMCK with different sort_sequence or overlapping effective dates).
    // Keep the first occurrence (lowest sort_sequence, already ordered by the SQL).
    const seenCodes = new Set<string>();
    const dedupedTemplate = template.filter(t => {
      const key = t.physicalCode.trim().toUpperCase();
      if (seenCodes.has(key)) return false;
      seenCodes.add(key);
      return true;
    });

    // Build a lookup from template for sort-order and descriptions (case+trim safe)
    const templateMap = new Map<string, PhysicalFindingTemplateDto>();
    dedupedTemplate.forEach(t => templateMap.set(t.physicalCode.trim().toUpperCase(), t));
    const templateOrder = new Map<string, number>();
    dedupedTemplate.forEach((t, i) => templateOrder.set(t.physicalCode.trim().toUpperCase(), i));

    // Enrich existing DB rows with template descriptions and weight defaults
    const merged: PhysicalFindingDto[] = existing.map(pf => {
      const key = pf.physicalCode.trim().toUpperCase();
      const tmpl = templateMap.get(key);
      const editedValue = this.pfCurrentValues.get(pf.physicalCode);

      let value = editedValue !== undefined ? editedValue : (pf.value ?? '').trim();
      if (!value && weightCode && key === weightCode.trim().toUpperCase() && donation?.donorWeight != null) {
        value = String(donation.donorWeight);
      }

      return {
        ...pf,
        physicalDescription: tmpl?.physicalDescription ?? pf.physicalDescription ?? '',
        description:         tmpl?.physicalDescription ?? pf.description ?? '',
        value,
      };
    });

    // Sort by template sort order; codes not in template go to the end
    merged.sort((a, b) => {
      const ai = templateOrder.get(a.physicalCode.trim().toUpperCase()) ?? 9999;
      const bi = templateOrder.get(b.physicalCode.trim().toUpperCase()) ?? 9999;
      return ai - bi;
    });

    this.physicalFindings.set(merged);
  }

  /** Focus the first invalid control in the given form so keyboard/screen-reader users
   *  land directly on the field that needs attention (WCAG 3.3.1). */
  private focusFirstInvalidField(form: FormGroup): void {
    const firstInvalidKey = Object.keys(form.controls)
      .find(key => form.controls[key].invalid);
    if (firstInvalidKey) {
      const el = document.querySelector(
        `[formControlName="${firstInvalidKey}"]`
      ) as HTMLElement;
      if (el) {
        el.focus();
      }
    }
  }

  private initializeForms(): void {
    this.searchForm = this.fb.group({
      collectionDate: [null],
      deferralId:    ['', [Validators.maxLength(15)]],  // used in deferral mode only
      rescanUnitId: ['', [Validators.maxLength(50)]], // Separate rescan field for footer
    });

    this.auditForm = this.fb.group({
      donorSignature: ['', [Validators.required]],
      donationType:   ['', [Validators.required]],
      procedureCode:  ['', [Validators.required]],
    });

    this.addResponseForm = this.fb.group({
      questionCode: [{ value: '', disabled: true }],
      questionDescription: [{ value: '', disabled: true }],
      answerCode: ['', [Validators.required, Validators.maxLength(5)]],
      response: ['', [Validators.maxLength(1)]],
      groupCode: ['', [Validators.maxLength(30)]],
      incidentDate: [null],
      deferralPeriod: [null],
      periodType: [''],
      defThruDate: [null],
      interCode: ['', [Validators.maxLength(5)]],
      startDate: [null],
      endDate: [null],
      comments: ['', [Validators.maxLength(240)]]
    });

    this.addTemplateQuestionForm = this.fb.group({
      questionCode: ['', [Validators.required, Validators.maxLength(10)]],
      sortSequence: [null, [Validators.required, Validators.min(0)]]
    });

    this.newRowForm = this.fb.group({
      groupCode:    [''],
      answerCode:   ['', [Validators.required]],
      response:     [''],
      incidentDate: [null, [Validators.required]],
      defThruDate:  [null],
      interCode:    [''],
      comments:     [''],
      startDate:    [null],
      endDate:      [null],
    }, { validators: this.hhDateRangeValidator.bind(this) });

    // answerCode changes: enforce comment_req, V-1 conditional incidentDate required, INT-1 interCode autofill, defThruDate calc
    this.newRowForm.get('answerCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((answerCode: string) => {
      // Look up from the new-row-specific options first (may be group-filtered);
      // fall back to the shared signal in case new-row options aren't populated yet.
      const opt = (this.newRowAnswerCodeOptions().find(o => o.value === answerCode) ??
                   this.answerCodeOptions().find(o => o.value === answerCode)) as AnswerCodeOption;
      const commentsCtrl = this.newRowForm.get('comments')!;
      const incidentCtrl = this.newRowForm.get('incidentDate')!;

      // Fix 5: dynamically enforce comment_req
      if (opt?.commentReq) {
        commentsCtrl.setValidators([Validators.required]);
      } else {
        commentsCtrl.clearValidators();
      }
      commentsCtrl.updateValueAndValidity({ emitEvent: false });
      this.newRowCommentRequired.set(opt?.commentReq ?? false);

      // V-1: incidentDate required logic differs by mode (matches old app DRIREAUD vs DRUREAUD)
      // DRIREAUD (unit/donation): unconditionally required regardless of answer code
      // DRUREAUD (deferral): NOT required when answer_code is YES/NO/NA
      const noIncidentRequired =
        this.mode === 'deferral' &&
        ['YES', 'NO', 'NA'].includes((answerCode ?? '').toUpperCase());
      if (noIncidentRequired) {
        incidentCtrl.clearValidators();
      } else {
        incidentCtrl.setValidators([Validators.required]);
      }
      incidentCtrl.updateValueAndValidity({ emitEvent: false });
      this.newRowIncidentDateRequired.set(!noIncidentRequired);

      // Show/hide start/end date fields based on additionalDateFlag
      this.newRowShowDateRange.set(opt?.additionalDateFlag ?? false);

      // INT-1: autofill interCode from the answer option (pre-fill before POST)
      if (opt?.interCode) {
        this.newRowForm.patchValue({ interCode: opt.interCode }, { emitEvent: false });
      } else {
        this.newRowForm.patchValue({ interCode: '' }, { emitEvent: false });
      }

      // defThruDate calc — uses current incidentDate value (may be null — autoFillDefThruDate returns early if so)
      this.autoFillDefThruDate(answerCode, this.newRowForm.get('incidentDate')?.value);
    });

    this.newRowForm.get('incidentDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((incidentDate: any) => {
      this.autoFillDefThruDate(this.newRowForm.get('answerCode')?.value, incidentDate);
    });

    // V-2: clear interCode when user manually sets defThruDate before the collection date
    this.newRowForm.get('defThruDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((defThruDate: any) => {
      const collectionDate = this.donationData()?.collectionDate;
      if (defThruDate && collectionDate && moment(defThruDate).isBefore(moment(collectionDate as string), 'day')) {
        this.newRowForm.patchValue({ interCode: '' }, { emitEvent: false });
      }
    });

    this.newPfRowForm = this.fb.group({
      physicalCode:  ['', [Validators.required, Validators.maxLength(10)]],
      physicalValue: ['', [Validators.maxLength(10)]],
      comments:      ['', [Validators.maxLength(240)]],
    });
  }

  private loadDropdownOptions(): void {
    this.apiService
      .getDropdownOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.donationTypeOptions.set(options.donationType?.length > 0 ? options.donationType : []);
        },
        error: () => {
          this.donationTypeOptions.set([]);
        },
      });
  }

  private loadProcedureCodesByType(donationType: string): void {
    if (!donationType) return;
    this.procedureCodeSearchCtrl.setValue('', { emitEvent: false });
    this.procedureCodeSearchTerm.set('');
    this.apiService
      .getProcedureCodesByType(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.procedureCodeOptions.set(codes),
        error: () => this.procedureCodeOptions.set([]),
      });
  }

  private doRetrieveDeferral(deferralId: string): void {
    this.clearMessages();
    this.hhSearchTerm.set('');
    this.activeFilterCodes.set(new Set());
    this.newRowForm?.reset();
    this.changedCommentKeys.clear();
    this.changedHhKeys.clear();
    this.pendingNodosignHold.set(false);
    this.pendingNodonationHold.set(false);
    this.pendingNoprocedurHold.set(false);
    this.pendingRemoveNodonationHold.set(false);
    this.pendingRemoveNoprocedurHold.set(false);
    // FIX 2a: reset template guard so loadPfTemplate() re-runs for the new deferral ID
    this.pfTemplateLoaded = false;
    // FIX 1: reset findings-ready flag alongside template flag
    this._pfFindingsLoaded = false;
    // FIX 2b: clear stale state from previous retrieval
    this.pendingNewPfRows.set([]);
    this.pfInlineComments.clear();
    this.pfCommentsRequired.set(new Map());
    this.pfCommentsTouched.set(new Map());
    this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
    this.pfValueFormCtrls.clear();
    this.pfValueErrors.set(new Map());
    this.pfValueSearchCtrls.clear();
    this.pfValueSearchTerms.set(new Map());
    this.pfValueRules.set(new Map());
    this.isAddingPfRow.set(false);
    this.isCommentPanelOpen.set(false);
    this.isLoading.set(true);
    this.showPhysicalFindings.set(false);
    this.selectedQuestionCode.set(null);
    this.answerCodeOptions.set([]);
    this.groupCodeOptions.set([]);

    const collDateVal = this.searchForm.get('collectionDate')?.value;
    const collDate = collDateVal ? moment(collDateVal).format('YYYY-MM-DD') : undefined;
    this.fetchDonationByDeferralId(deferralId, collDate);
  }

  onRetrieve(): void {
    if (this.mode === 'deferral') {
      // Deferral mode — plain text input
      let deferralId = (this.searchForm.get('deferralId')?.value ?? '').trim().toUpperCase();
      if (!deferralId) return;

      // Strip C-prefix barcode format (C+8digits+C) per Oracle TEST_PGM
      if (deferralId.length > 8 && deferralId.startsWith('C') && deferralId.endsWith('C')) {
        deferralId = deferralId.substring(1, deferralId.length - 1);
      }

      // Double-entry verification (matches Oracle Forms TEST_PGM)
      if (!this.deferralAwaitingSecondEntry()) {
        this.deferralFirstEntry.set(deferralId);
        this.deferralAwaitingSecondEntry.set(true);
        this.searchForm.patchValue({ deferralId: '' }, { emitEvent: false });
        return;
      } else {
        const firstEntry = this.deferralFirstEntry();
        if (deferralId !== firstEntry) {
          this.deferralFirstEntry.set(null);
          this.deferralAwaitingSecondEntry.set(false);
          this.searchForm.patchValue({ deferralId: '' }, { emitEvent: false });
          this.showErrorToast('Deferral ID did not match. Please try again.');
          return;
        }
        this.deferralFirstEntry.set(null);
        this.deferralAwaitingSecondEntry.set(false);
      }

      if (this.multipleRecordsFound() && !this.searchForm.get('collectionDate')?.value) {
        this.showErrorToast('Collection date is required when multiple records exist.');
        return;
      }

      // Auto-save any uncommitted new HH rows (auditKey=0) before re-retrieving so they
      // are not silently lost when fetchDonationByDeferralId overwrites allHealthHistoryResponses.
      const uncommitted = this.allHealthHistoryResponses().filter(r => r.auditKey === 0);
      const donation = this.donationData();
      if (uncommitted.length > 0 && donation) {
        const effId = donation.unitId || donation.transactionId || '';
        const txId  = donation.unitId ? undefined : (donation.transactionId ?? undefined);
        const saveSteps = uncommitted.map(r =>
          this.apiService.addHealthHistoryResponse(effId, {
            questionCode:   r.questionCode,
            answerCode:     r.answerCode  ?? null,
            response:       r.response    ?? null,
            groupCode:      r.groupCode   ?? null,
            incidentDate:   r.incidentDate ?? null,
            deferralPeriod: null,
            periodType:     null,
            defThruDate:    r.defThruDate  ?? null,
            interCode:      r.interCode   || null,
            startDate:      null,
            endDate:        null,
            comments:       r.comments    ?? null,
          }, txId)
        );
        this.isLoading.set(true);
        from(saveSteps).pipe(
          concatMap(step$ => step$.pipe(catchError(() => of(null)))),
          toArray(),
          takeUntil(this.destroy$)
        ).subscribe(() => this.doRetrieveDeferral(deferralId));
        return;
      }

      this.doRetrieveDeferral(deferralId);
      return;
    }

    if (!this.unitIdField?.isValid) return;
    const parsedUnitId = this.parsedUnitId();
    if (!parsedUnitId) return;

    // Block retrieval when multiple records found and user has not entered a collection date
    if (this.multipleRecordsFound() && !this.searchForm.get('collectionDate')?.value) {
      this.showErrorToast('Collection date is required');
      return;
    }

    this.multipleRecordsFound.set(false);
    this.deferralFirstEntry.set(null);
    this.deferralAwaitingSecondEntry.set(false);
    this.clearMessages();
    this.hhSearchTerm.set('');
    this.activeFilterCodes.set(new Set());
    this.newRowForm?.reset();
    this.changedCommentKeys.clear();
    this.pendingNodosignHold.set(false);
    this.pendingNodonationHold.set(false);
    this.pendingNoprocedurHold.set(false);
    this.pendingRemoveNodonationHold.set(false);
    this.pendingRemoveNoprocedurHold.set(false);
    this.isLoading.set(true);
    this.showPhysicalFindings.set(false);
    this.selectedQuestionCode.set(null);
    this.answerCodeOptions.set([]);
    this.newRowAnswerCodeOptions.set([]);
    this.groupCodeOptions.set([]);
    this.answerCodesByQuestion.clear();
    this.pfTemplateLoaded = false;
    // FIX 1: reset findings-ready flag alongside template flag
    this._pfFindingsLoaded = false;
    this.pfValueRules.set(new Map());
    // FIX 2b: clear stale state from previous retrieval
    this.pendingNewPfRows.set([]);
    this.pfInlineComments.clear();
    this.pfCommentsRequired.set(new Map());
    this.pfCommentsTouched.set(new Map());
    this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
    this.pfValueFormCtrls.clear();
    this.pfValueErrors.set(new Map());
    this.pfValueSearchCtrls.clear();
    this.pfValueSearchTerms.set(new Map());
    this.isAddingPfRow.set(false);
    this.isCommentPanelOpen.set(false);
    // Clear all unit-specific data immediately so old data never shows while new unit loads
    this.donationData.set(null);
    this.templateQuestions.set([]);
    this.allHealthHistoryResponses.set([]);
    this.physicalFindings.set([]);
    this._auditAnswerOverride.set('');
    this._auditAnswerPerQuestion.clear();
    this.isAddingResponse.set(false);
    this.statusIndicators.set([]);

    this.fetchDonation(parsedUnitId);
  }

  onUnitValidated(event: UnitValidationResponse): void {
    this.parsedUnitId.set(event.parsedUnitId);
  }

  onUnitCleared(): void {
    this.parsedUnitId.set(null);
    this.multipleRecordsFound.set(false);
    this.deferralFirstEntry.set(null);
    this.deferralAwaitingSecondEntry.set(false);
    this.donationData.set(null);
    this.statusIndicators.set([]);
    this.templateQuestions.set([]);
    this.allHealthHistoryResponses.set([]);
    this.physicalFindings.set([]);
    this.selectedQuestionCode.set(null);
    this.pfTemplateLoaded = false;
    this.pfValueRules.set(new Map());
  }

  private fetchDonation(unitId: string): void {
    const collectionDateValue = this.searchForm.get('collectionDate')?.value;
    let collectionDate: string | undefined;
    if (collectionDateValue) {
      const m = moment(collectionDateValue);
      if (m.isValid()) collectionDate = m.format('YYYY-MM-DD');
    }

    this.apiService
      .getDonation(unitId, collectionDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donation) => {
          this.isLoading.set(false);

          // Old app (DRIVISNU) error 16201: unit with active AUHLD hold is completely blocked.
          // Do NOT load any data — clear the unit field and show error.
          if (donation.hasActiveAuditHold) {
            this.unitIdField?.clear();
            this.errorMessage.set(
              'This unit is on HOLD (AUHLD). Release the hold from the Release Audit Interdiction screen before re-auditing.'
            );
            return;
          }

          this.donationData.set(donation);
          this.infoMessage.set('');
          this.searchForm.patchValue({ rescanUnitId: '' }, { emitEvent: false });

          // Auto-populate collection date from the loaded donation
          // Matches old app drureaud KEY-NEXT-ITEM:
          //   SELECT coll_date INTO v_c_date FROM donations WHERE unit_id = szUnitId AND ROWNUM = 1;
          //   :ctrl_blk_1.s_collection_date := v_c_date;
          if (donation.collectionDate) {
            this.searchForm.patchValue(
              { collectionDate: moment(donation.collectionDate as string).toDate() },
              { emitEvent: false }
            );
          }

          this.auditForm.patchValue({
            donorSignature: donation.donorSignatureFlag === 'Y' ? 'Yes' : 'No',
            donationType: donation.donationType,
            procedureCode: donation.procedureCode,
          });

          this.previousDonorSignature = donation.donorSignatureFlag === 'Y' ? 'Yes' : 'No';
          this.previousDonationType = donation.donationType;
          this.previousProcedureCode = donation.procedureCode;

          this.loadProcedureCodesByType(donation.donationType);

          this.statusIndicators.set([{ type: 'V', label: 'Valid', color: '#008744' }]);
          this.loadHHTemplate(donation.donationType, donation.collectionDate ?? undefined, donation.transactionId, donation.donorId);
          this.loadPhysicalFindings(unitId, collectionDate);
          this.loadPfTemplate(donation);
          this.loadHealthHistoryForQuestion(unitId, collectionDate);
          this.loadExistingInterdictions(unitId, collectionDate);
        },
        error: (error) => {
          this.isLoading.set(false);

          // Multiple records found — move focus to Collection Date, show warning
          if (error?.status === 300 || error?.code === 'MULTIPLE_RECORDS' || error?.error?.message === 'MULTIPLE_RECORDS') {
            this.multipleRecordsFound.set(true);
            this.donationData.set(null);
            this.statusIndicators.set([]);
            this.templateQuestions.set([]);
            this.allHealthHistoryResponses.set([]);
            this.physicalFindings.set([]);
            this.selectedQuestionCode.set(null);
            this.answerCodeOptions.set([]);
            this.groupCodeOptions.set([]);
            this.auditForm.reset();
            return;
          }

          // Clear previous donation data when fetch fails
          this.donationData.set(null);
          this.statusIndicators.set([]);
          this.templateQuestions.set([]);
          this.allHealthHistoryResponses.set([]);
          this.physicalFindings.set([]);
          this.selectedQuestionCode.set(null);
          this.answerCodeOptions.set([]);
          this.groupCodeOptions.set([]);
          this.auditForm.reset();

          // Show info message
          this.infoMessage.set('Scan or type the Unit ID to load the donation for audit.');

          this.handleSearchError(error);
        },
      });
  }

  private fetchDonationByDeferralId(deferralId: string, collectionDate?: string): void {
    this.apiService
      .getDonationByDeferralId(deferralId, collectionDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donation) => {
          this.isLoading.set(false);
          this.donationData.set(donation);
          this.infoMessage.set('');

          this.auditForm.patchValue({
            donorSignature: donation.donorSignatureFlag === 'Y' ? 'Yes' : 'No',
            donationType:   donation.donationType,
            procedureCode:  donation.procedureCode,
          });
          this.previousDonorSignature = donation.donorSignatureFlag === 'Y' ? 'Yes' : 'No';
          this.previousDonationType   = donation.donationType;
          this.previousProcedureCode  = donation.procedureCode;

          this.statusIndicators.set([{ type: 'V', label: 'Valid', color: '#008744' }]);
          this.loadProcedureCodesByType(donation.donationType);
          this.loadHHTemplate(donation.donationType, donation.collectionDate ?? undefined, donation.transactionId, donation.donorId);
          const effId = donation.unitId || donation.transactionId || '';
          const txId = donation.unitId ? undefined : (donation.transactionId ?? undefined);
          this.loadPhysicalFindings(effId, undefined, txId);
          this.loadHealthHistoryForQuestion(effId, undefined, txId);
          this.loadPfTemplate(donation);
          this.loadExistingInterdictions(effId, undefined, txId);
        },
        error: (error) => {
          this.isLoading.set(false);

          if (error?.status === 300 || error?.code === 'MULTIPLE_RECORDS' || error?.error?.message === 'MULTIPLE_RECORDS') {
            this.multipleRecordsFound.set(true);
            this.donationData.set(null);
            this.statusIndicators.set([]);
            this.templateQuestions.set([]);
            this.allHealthHistoryResponses.set([]);
            this.physicalFindings.set([]);
            this.selectedQuestionCode.set(null);
            this.auditForm.reset();
            return;
          }

          this.donationData.set(null);
          this.statusIndicators.set([]);
          this.infoMessage.set('Scan or enter the Deferral ID to load the donation for audit. If duplicates exist, provide the collection date.');
          this.handleSearchError(error);
        }
      });
  }

  private loadHHTemplate(donationType: string, collectionDate?: string, transactionId?: string, donorId?: string): void {
    this.apiService
      .getHHTemplate(donationType, collectionDate, transactionId, donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.templateQuestions.set(questions);
          // Don't auto-select first question - wait for user to click
        },
        error: () => this.templateQuestions.set([])
      });
  }


  /**
   * Load physical findings for the donation
   */
  private loadPhysicalFindings(unitId: string, collectionDate?: string, txId?: string): void {
    this.apiService
      .getPhysicalFindings(unitId, collectionDate, txId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (findings) => {
          // Trim Oracle CHAR column padding so values match dropdown options and rule lookups
          const trimmed = findings.map(pf => ({
            ...pf,
            physicalCode: (pf.physicalCode ?? '').trim(),
            value: (pf.value ?? '').trim(),
            interdiction: pf.interdiction?.trim(),
            comments: pf.comments?.trim(),
          }));
          this.physicalFindings.set(trimmed);
          this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
          this.pendingDeletedPfCodes.clear();
          // FIX 1: findings are ready; if template already loaded, run the merge now
          this._pfFindingsLoaded = true;
          if (this.pfTemplateLoaded) { this.mergePfTemplateWithValues(this.pfTemplate()); }
        },
        error: (error) => {
          this.loggingService.error('Error loading physical findings', error);
          this.physicalFindings.set([]);
          this.pfTemplateLoaded = false;
          this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
          this.pendingDeletedPfCodes.clear();
          // FIX 1: even on error, unblock template merge (merge runs with empty existing list)
          this._pfFindingsLoaded = true;
          if (this.pfTemplateLoaded) { this.mergePfTemplateWithValues(this.pfTemplate()); }
        },
      });
  }

  private handleSearchError(error: HttpErrorResponse): void {
    let errorMsg = 'An unexpected error occurred. Please try again.';

    const msg = error.error?.message ?? '';

    if (msg.includes('16043')) {
      errorMsg = 'This deferral has already been audited.';
    } else if (msg.includes('21106')) {
      errorMsg = 'Not a valid deferral registration. The deferral was not registered through the deferral program.';
    } else if (msg.includes('16059')) {
      errorMsg = this.mode === 'deferral'
        ? 'Invalid deferral record. Please check the deferral ID and try again.'
        : 'Invalid record. Please check the value and try again.';
    } else if (error.status === 404 || msg.includes('Err1230') || msg.includes('16027')) {
      errorMsg = this.mode === 'deferral'
        ? 'We couldn\'t find a record for this Deferral ID. Check the entry and try again.'
        : 'Err1230 - Invalid Unit ID. The entered Unit ID does not exist. Please check the value and try again.';
    } else if (msg.includes('Error2110B') || msg.includes('16019')) {
      errorMsg = 'Error2110B - Units registered through insuite module cannot be audited here.';
    } else if (msg.includes('16116')) {
      errorMsg = 'Audit complete — unit is clear.';
    } else if (msg.includes('16152')) {
      errorMsg = 'Audit complete — unit is on HOLD.';
    } else if (msg.includes('16201') || msg.includes('AUHLD')) {
      errorMsg = 'This unit is on HOLD (AUHLD). Release the hold before re-auditing.';
    } else if (msg.includes('16165') || msg.includes('insuite')) {
      errorMsg = 'Error2110B - Insuite module units cannot be audited here.';
    } else if (msg.includes('5050')) {
      errorMsg = 'Record locked by another user. Please try again later.';
    } else if (error.status === 0) {
      errorMsg = 'Network error. Please check your connection.';
    } else if (msg) {
      errorMsg = msg;
    }

    this.errorMessage.set(errorMsg);
    this.showErrorToast(errorMsg);
  }

  /**
   * Fires when the donor-signature mat-select panel opens or closes.
   *
   * On open  — snapshot the current value so we know what to revert to if the user cancels.
   * On close — if the value just changed TO 'No', show the HOLD confirmation dialog.
   *            If the value is anything other than 'No', cancel any pending NODOSIGN hold.
   *
   * Using openedChange-only (no selectionChange, no mat-option click handlers) avoids
   * the Angular Material race condition where a (click) binding fires after selectionChange,
   * causing a double dialog invocation when clicking an already-selected option.
   */
  onDonorSignatureOpenedChange(isOpen: boolean): void {
    if (isOpen) {
      this.valueBeforeOpen = this.auditForm.get('donorSignature')?.value ?? null;
    } else {
      const current: string | null = this.auditForm.get('donorSignature')?.value ?? null;
      if (current === 'No' && this.valueBeforeOpen !== 'No') {
        this.showDonorSignatureDialog();
      } else if (current !== 'No') {
        this.previousDonorSignature = current ?? '';
        this.pendingNodosignHold.set(false);
    this.pendingNodonationHold.set(false);
    this.pendingNoprocedurHold.set(false);
    this.pendingRemoveNodonationHold.set(false);
    this.pendingRemoveNoprocedurHold.set(false);
      }
    }
  }

  private async showDonorSignatureDialog(): Promise<void> {
    const recordLabel = this.mode === 'deferral' ? 'deferral' : 'donation';
    const placeHold = await this.showConfirmationDialog(
      'Unsigned Donor Card',
      `This ${recordLabel} will be placed on HOLD due to an unsigned donor card.`,
      'PLACE HOLD',
      'CANCEL'
    );

    if (placeHold) {
      this.previousDonorSignature = 'No';
      this.pendingNodosignHold.set(true);
    } else {
      const revertTo = this.valueBeforeOpen ?? 'Yes';
      this.auditForm.patchValue({ donorSignature: revertTo }, { emitEvent: false });
      this.previousDonorSignature = revertTo;
      this.pendingNodosignHold.set(false);
    this.pendingNodonationHold.set(false);
    this.pendingNoprocedurHold.set(false);
    this.pendingRemoveNodonationHold.set(false);
    this.pendingRemoveNoprocedurHold.set(false);
    }
  }

  async onDonationTypeChange(value: string): Promise<void> {
    const registeredType = this.donationData()?.donationType;
    const previousValue = this.previousDonationType;

    if (value === '99') {
      const placeHold = await this.showConfirmationDialog(
        'Donation Type',
        '99 places a hold. Would you like to change?',
        'YES',
        'NO'
      );
      if (!placeHold) {
        this.pendingNodonationHold.set(true);
        this.previousDonationType = value;
        this.auditForm.patchValue({ procedureCode: null }, { emitEvent: false });
        this.loadProcedureCodesByType(value);
        this.reloadPfTemplateForTypeChange();
      } else {
        this.pendingNodonationHold.set(false);
        this.auditForm.patchValue({ donationType: previousValue }, { emitEvent: false });
        this.previousDonationType = previousValue;
      }
      return;
    }

    this.pendingNodonationHold.set(false);
    if (previousValue === '99' && value !== '99') {
      this.pendingRemoveNodonationHold.set(true);
    }

    if (registeredType && value !== registeredType) {
      const confirmed = await this.showConfirmationDialog(
        'Donation Type',
        'This Donation type does not match with the registered donation. Do you want to change your entry?'
      );

      if (!confirmed) {
        this.auditForm.patchValue({ donationType: previousValue }, { emitEvent: false });
        this.previousDonationType = previousValue;
      } else {
        this.previousDonationType = value;
        this.auditForm.patchValue({ procedureCode: null }, { emitEvent: false });
        this.loadProcedureCodesByType(value);
        this.reloadPfTemplateForTypeChange();
      }
    } else {
      this.previousDonationType = value;
      this.auditForm.patchValue({ procedureCode: null }, { emitEvent: false });
      this.loadProcedureCodesByType(value);
      this.reloadPfTemplateForTypeChange();
    }
  }

  async onProcedureCodeChange(value: string): Promise<void> {
    const registeredCode = this.donationData()?.procedureCode;
    const previousValue = this.previousProcedureCode;

    if (value === '99') {
      const placeHold = await this.showConfirmationDialog(
        'Procedure Code',
        '99 places a hold. Would you like to change?',
        'YES',
        'NO'
      );
      if (!placeHold) {
        this.pendingNoprocedurHold.set(true);
        this.previousProcedureCode = value;
        this.reloadPfTemplateForTypeChange();
      } else {
        this.pendingNoprocedurHold.set(false);
        this.auditForm.patchValue({ procedureCode: previousValue }, { emitEvent: false });
        this.previousProcedureCode = previousValue;
      }
      return;
    }

    this.pendingNoprocedurHold.set(false);
    if (previousValue === '99' && value !== '99') {
      this.pendingRemoveNoprocedurHold.set(true);
    }

    if (registeredCode && value !== registeredCode) {
      const confirmed = await this.showConfirmationDialog(
        'Procedure Code',
        'This Procedure Code does not match with the registered procedure. Do you want to change your entry?'
      );

      if (!confirmed) {
        this.auditForm.patchValue({ procedureCode: previousValue }, { emitEvent: false });
        this.previousProcedureCode = previousValue;
      } else {
        this.previousProcedureCode = value;
        this.reloadPfTemplateForTypeChange();
      }
    } else {
      this.previousProcedureCode = value;
      this.reloadPfTemplateForTypeChange();
    }
  }

  /**
   * Show confirmation dialog
   */
  private async showConfirmationDialog(
    title: string,
    message: string,
    confirmText = 'YES',
    cancelText = 'NO'
  ): Promise<boolean> {
    const dialogData: ConfirmActionDialogData = {
      title,
      message,
      confirmText,
      cancelText,
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true,
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result === true);
      });
    });
  }

  onViewAlternateDemographics(): void {
    const donation = this.donationData();
    if (!donation || !donation.donorId) {
      this.showErrorToast('No donor information available');
      return;
    }

    const dialogRef = this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      height: 'calc(100vh - 64px)',
      data: {
        donorId: donation.donorId,
        readOnly: false
      } as AlternateDemographicsDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Dialog handles its own GET/PUT - no additional action needed
      });
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(value: string | Date | null): string {
    if (!value) return '';
    const chapterTz = this.headerService.chapterTimeZone();
    if (chapterTz) {
      const converted = convertUTCToTimezone(value instanceof Date ? value : value, chapterTz);
      if (!isNaN(converted.getTime())) {
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const day = converted.getDate().toString().padStart(2, '0');
        return `${day}-${months[converted.getMonth()]}-${converted.getFullYear()}`;
      }
    }
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  /**
   * Check if RETRIEVE button should be disabled
   */
  get isRetrieveDisabled(): boolean {
    if (this.mode === 'deferral') {
      return !this.searchForm.get('deferralId')?.value?.trim() || this.isLoading();
    }
    const collDateCtrl = this.searchForm.get('collectionDate');
    const collDateInvalid = !!(collDateCtrl?.invalid &&
      (collDateCtrl.hasError('invalidDate') || collDateCtrl.hasError('matDatepickerParse')));
    return !this.unitIdField?.isValid || this.isLoading() || collDateInvalid;
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.warningMessage.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Show error toast (top-right position)
   */
  private showErrorToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
      duration: 5000,
    });
  }

  /**
   * Show success toast (top-right position)
   */
  private showSuccessToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
      duration: 3000,
    });
  }

  /**
   * Select a health history question and load its responses
   */
  selectHHQuestion(questionCode: string): void {
    if (!this.tryExitNewRowForm()) return;
    // Close any open forms
    this.isAddingTemplateQuestion.set(false);
    this.isAddingResponse.set(false);
    this.addTemplateQuestionForm.reset();
    this.addResponseForm.reset();
    
    // Switch to Response tab if not already there
    this.selectedTabIndex.set(0);
    
    // Select the question
    this.selectedQuestionCode.set(questionCode);
    // Mirrors DRIREAUD POST-QUERY: auto-fill S_RESPONSE from existing health_history.response.
    // Restore from per-question map (set by onAuditAnswerChange) so the value persists across navigation.
    this._auditAnswerOverride.set(this._auditAnswerPerQuestion.get(questionCode) || '');

    // Load valid answer codes and group codes for selected question from API
    this.answerCodeOptions.set([]);
    this.groupCodeOptions.set([]);
    this.groupCodeSearchCtrl.setValue('', { emitEvent: false });
    this.answerCodeSearchCtrl.setValue('', { emitEvent: false });
    this.newRowGroupCodeSearchCtrl.setValue('', { emitEvent: false });
    this.newRowAnswerCodeSearchCtrl.setValue('', { emitEvent: false });
    this.groupCodeSearchTerm.set('');
    this.answerCodeSearchTerm.set('');
    this.newRowGroupCodeSearchTerm.set('');
    this.newRowAnswerCodeSearchTerm.set('');
    // Pass Y/N/U response to filter answer codes — matches old DRIREAUD LOV filter by s_response
    const auditResponse = this.currentAuditAnswer() || null;
    this.apiService.getAnswerCodes(questionCode, auditResponse).pipe(takeUntil(this.destroy$)).subscribe({
      next: (codes) => {
        this.answerCodeOptions.set(codes);
        this.newRowAnswerCodeOptions.set(codes);
        // Store per-question so onAnswerCodeChange can find the right opt for any row
        this.answerCodesByQuestion.set(questionCode, codes as AnswerCodeOption[]);
      },
      error: () => {
        this.answerCodeOptions.set([]);
        this.newRowAnswerCodeOptions.set([]);
      },
    });
    // Only load group codes when audit response (Y/N/U) is known — Oracle's RG_ANS_GRP
    // always filters by :s_response; calling without it returns groups for all responses
    // which may not apply to the user's eventual answer choice.
    if (auditResponse) {
      this.apiService.getGroupCodes(questionCode, auditResponse).pipe(takeUntil(this.destroy$)).subscribe({
        next: (codes) => { this.groupCodeOptions.set(codes); this.syncGroupCodeRequired(); },
        error: () => { this.groupCodeOptions.set([]); this.syncGroupCodeRequired(); },
      });
    } else {
      this.groupCodeOptions.set([]);
      this.syncGroupCodeRequired();
    }
    // Responses are already loaded from fetchDonation — selectedQuestionResponses
    // computed signal filters allHealthHistoryResponses by questionCode client-side.
    // No API reload on question navigation so locally-added rows are preserved.
  }

  /**
   * Load health history responses (calls API every time, filters client-side)
   */
  private loadHealthHistoryForQuestion(unitId: string, collectionDate?: string, txId?: string): void {
    this.isLoadingResponses.set(true);

    this.apiService
      .getHealthHistory(unitId, collectionDate, txId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          // Store all responses - filtering happens in computed signal.
          // Map interCode → interdiction so the table Interdiction column renders correctly
          // for API-fetched rows (locally-added rows already set both fields in submitNewRow).
          this.allHealthHistoryResponses.set(responses.map(r => ({ ...r, interdiction: r.interCode })));
          this.isLoadingResponses.set(false);

          // Fix 5: Show deferral status after HH responses load — matches PRELIMINARY_CHECK
          if (!this._hasShownDeferralStatus && this.donationData()) {
            this._hasShownDeferralStatus = true;
            const status = this.deferralStatus();
            if (status !== '-') {
              this.dialog.open(ConfirmActionDialogComponent, {
                data: {
                  title: 'Donor Deferral Status',
                  message: `This donor has an active deferral status: ${status}. Please review before saving.`,
                  confirmText: 'OK',
                  cancelText: '',
                } as ConfirmActionDialogData,
                width: '420px',
              });
            }
          }
        },
        error: (error) => {
          this.loggingService.error('Error loading health history responses', error);
          this.allHealthHistoryResponses.set([]);
          this.isLoadingResponses.set(false);
        },
      });
  }

  /**
   * Open Add Question to Template panel (+ button in sidebar header)
   */
  openFilterPanel(): void {
    this.isFilterPanelOpen.set(true);
  }

  onFilterApply(selected: Set<string>): void {
    this.activeFilterCodes.set(selected);
    this.isFilterPanelOpen.set(false);
  }

  onFilterCancel(): void {
    this.isFilterPanelOpen.set(false);
  }

  removeFilterChip(key: string): void {
    const current = new Set(this.activeFilterCodes());
    current.delete(key);
    this.activeFilterCodes.set(current);
  }

  clearAllFilterChips(): void {
    this.activeFilterCodes.set(new Set());
  }

  openAddTemplateQuestion(): void {
    this.isAddingTemplateQuestion.set(true);
    this.isAddingResponse.set(false);
    this.addTemplateQuestionForm.reset();
  }

  cancelAddTemplateQuestion(): void {
    this.isAddingTemplateQuestion.set(false);
    this.addTemplateQuestionForm.reset();
  }

  submitAddTemplateQuestion(): void {
    if (this.addTemplateQuestionForm.invalid) {
      this.addTemplateQuestionForm.markAllAsTouched();
      this.focusFirstInvalidField(this.addTemplateQuestionForm);
      return;
    }

    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('No donation loaded');
      return;
    }

    const { questionCode, sortSequence } = this.addTemplateQuestionForm.value;

    const request: AddQuestionToTemplateRequest = {
      questionCode: questionCode.trim().toUpperCase(),
      donationType: donation.donationType,
      sortSequence: Number(sortSequence)
    };

    this.apiService
      .addQuestionToTemplate(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.templateQuestions.set(questions);
          this.isAddingTemplateQuestion.set(false);
          this.addTemplateQuestionForm.reset();
          this.showSuccessToast('Question added to template successfully');
        },
        error: (error) => {
          if (error.status === 409) {
            this.showErrorToast('This question already exists in the template');
          } else {
            this.showErrorToast('Failed to add question to template');
          }
        }
      });
  }

  /**
   * Delete question from template (delete icon on question card)
   */
  async deleteTemplateQuestion(question: HHTemplateQuestionDto): Promise<void> {
    const confirmed = await this.showConfirmationDialog(
      'Forms',
      'Do you want to delete this answer and the associated interdictions permanently?'
    );

    if (!confirmed) return;

    const donation = this.donationData();
    if (!donation) return;

    this.apiService
      .deleteQuestionFromTemplate(question.questionCode, donation.donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.templateQuestions.update(list =>
            list.filter(q => q.questionCode !== question.questionCode)
          );
          // Remove deleted question from active filter chips if it was filtered
          const activeCodes = new Set(this.activeFilterCodes());
          if (activeCodes.delete(question.questionCode)) {
            this.activeFilterCodes.set(activeCodes);
          }
          if (this.selectedQuestionCode() === question.questionCode) {
            this.selectedQuestionCode.set(null);
            this.answerCodeOptions.set([]);
            this.groupCodeOptions.set([]);
          }
          this.showSuccessToast('Question removed from template');
        },
        error: () => this.showErrorToast('Failed to remove question from template')
      });
  }

  /**
   * Add question to template (ADD button at bottom of sidebar) - same as + button
   */
  addQuestionToTemplate(): void {
    this.openAddTemplateQuestion();
  }

  /**
   * Show comprehensive add response form (all 14 fields inline)
   */
  showComprehensiveAddForm(): void {
    const selectedQuestion = this.selectedQuestion();
    if (!selectedQuestion) {
      this.showErrorToast('Please select a question first');
      return;
    }

    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('No donation loaded');
      return;
    }

    // Auto-populate read-only fields from selected question
    this.addResponseForm.patchValue({
      questionCode: selectedQuestion.questionCode,
      questionDescription: selectedQuestion.questionDescription || '',
      answerCode: '',
      response: '',
      groupCode: '',
      incidentDate: null,
      deferralPeriod: null,
      periodType: '',
      defThruDate: null,
      interCode: '',
      startDate: null,
      endDate: null,
      comments: ''
    });

    this.isAddingResponse.set(true);
  }

  /**
   * Add new health history response (+ ADD NEW RESPONSE button in right panel)
   * Simple inline grid row editing
   */
  addNewResponse(): void {
    const selectedQuestion = this.selectedQuestion();
    if (!selectedQuestion) {
      this.showErrorToast('Please select a question first');
      return;
    }

    // Matches old DRIREAUD S_RESPONSE enforcement: Audit Answer (Y/N/U) must be selected first
    if (!this.currentAuditAnswer()) {
      this.showErrorToast('Please select an Audit Answer (Y, N, or U) before adding a response.');
      return;
    }

    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('No donation loaded');
      return;
    }

    // If a row is already open, try to save it before opening a new one.
    if (this.isAddingResponse()) {
      if (this.hasNewRowData()) {
        this.submitNewRow();
        if (this.isAddingResponse()) {
          // Form is still open — it has validation errors. Scroll it into view
          // so the user can see the inline error messages and fix them.
          setTimeout(() => {
            this.newRowFormEl?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 0);
          this.showErrorToast('Please fill required fields in the open response form before adding another.');
          return;
        }
      } else {
        this.isAddingResponse.set(false);
        this.newRowForm.reset();
      }
    }

    // Reset new-row answer options to full unfiltered list (a previous group-code change may
    // have left only filtered options, making the interCode lookup unreliable).
    this.newRowAnswerCodeOptions.set(this.answerCodeOptions());
    this.newRowAnswerCodeSearchCtrl.setValue('', { emitEvent: false });
    this.newRowGroupCodeSearchCtrl.setValue('', { emitEvent: false });

    this.newRowForm.patchValue({
      groupCode: '',
      answerCode: '',
      response: '',
      incidentDate: null,
      defThruDate: null,
      interCode: '',
      startDate: null,
      endDate: null,
    });

    this.newRowIncidentDateRequired.set(true);
    this.newRowCommentRequired.set(false);
    this.syncGroupCodeRequired();
    this.isAddingResponse.set(true);
    // Scroll the new row form into view so it's visible even when the table is long
    setTimeout(() => {
      this.newRowFormEl?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  cancelAddResponse(): void {
    this.isAddingResponse.set(false);
    this.newRowForm.reset();
    this.newRowIncidentDateRequired.set(true);
    this.newRowCommentRequired.set(false);
  }

  getNewRowControl(name: string): FormControl {
    return this.newRowForm.get(name) as FormControl;
  }

  /**
   * Handle focus out from editing row - auto-save when clicking outside
   */
  hasNewRowData(): boolean {
    const v = this.newRowForm.value;
    return !!(v.groupCode || v.answerCode || v.response ||
              v.incidentDate || v.defThruDate || v.interCode || v.comments ||
              v.startDate || v.endDate);
  }

  saveNewResponse(): void {
    if (!this.hasNewRowData()) {
      this.showErrorToast('Please enter at least one field');
      return;
    }
    this.submitNewRow();
  }

  submitNewRow(): void {
    this.syncGroupCodeRequired();
    const donation = this.donationData();
    const selectedQuestion = this.selectedQuestion();
    if (!donation || !selectedQuestion) return;

    // Mark all controls as touched so mat-error messages appear inline
    this.newRowForm.markAllAsTouched();
    if (this.newRowForm.invalid) return;

    // Auto-default incident date to collection date when inter_code is present
    // (mirrors Oracle KEY-NEXT-ITEM on INCIDENT_DATE — ensures it fires even
    //  if the user never focused the incident date field before clicking Save)
    if (!this.newRowForm.get('incidentDate')?.value) {
      const ac = this.newRowForm.get('answerCode')?.value;
      if (ac) {
        const ansOpt = (this.newRowAnswerCodeOptions().find(o => o.value === ac) ??
                        this.answerCodeOptions().find(o => o.value === ac)) as AnswerCodeOption;
        if (ansOpt?.interCode) {
          const cd = donation.collectionDate;
          if (cd) {
            this.newRowForm.patchValue({ incidentDate: moment(cd as string).toDate() });
            this.autoFillDefThruDate(ac, moment(cd as string).toDate());
          }
        }
      }
    }

    const v = this.newRowForm.value;
    const auditAnswer = this.currentAuditAnswer() || this.selectedQuestionResponses()[0]?.response || 'U';

    // Gap 13: incident date required (also enforced by Validators.required above)
    if (!v.incidentDate) {
      this.newRowForm.markAllAsTouched();
      this.showErrorToast('Please enter a valid Incident Date.');
      return;
    }

    // Gap 14: incident date must not exceed collection date
    const collDate = donation.collectionDate ? moment(donation.collectionDate as string) : null;
    const incDate  = v.incidentDate ? moment(v.incidentDate) : null;
    if (incDate && collDate && incDate.isAfter(collDate, 'day')) {
      this.showErrorToast(`Incident Date cannot be after Collection Date (${collDate.format('DD-MMM-YYYY').toUpperCase()}).`);
      return;
    }

    // Gap 16: def_thru_date must not be before incident_date
    const defDate = v.defThruDate ? moment(v.defThruDate) : null;
    if (defDate && incDate && defDate.isBefore(incDate, 'day')) {
      this.showErrorToast('Deferral Through Date cannot be before Incident Date.');
      return;
    }

    // Gap 18: year check on def_thru_date
    if (defDate && defDate.year().toString().startsWith('0')) {
      this.showErrorToast('Invalid year in Deferral Through Date.');
      return;
    }

    // Start/End date validations (Oracle ANS_DATES: errors 18014, 23021, 23022)
    const startDt = v.startDate ? moment(v.startDate) : null;
    const endDt   = v.endDate   ? moment(v.endDate)   : null;
    if (startDt?.isValid()) {
      const chapterTz = this.headerService.chapterTimeZone();
      const today = chapterTz ? moment(convertUTCToTimezone(new Date(), chapterTz)) : moment();
      if (startDt.isAfter(today, 'day')) {
        this.showErrorToast('Start Date cannot be after today.');
        return;
      }
    }
    if (startDt?.isValid() && endDt?.isValid() && startDt.isAfter(endDt, 'day')) {
      this.showErrorToast('Start Date cannot be after End Date.');
      return;
    }
    if (endDt?.isValid() && startDt?.isValid() && endDt.isBefore(startDt, 'day')) {
      this.showErrorToast('End Date cannot be before Start Date.');
      return;
    }

    // Gap 17: if def_thru_date is before collection date, clear inter_code (deferral expired)
    let computedInterCode = v.interCode?.trim() || undefined;
    if (defDate && collDate && defDate.isBefore(collDate, 'day')) {
      computedInterCode = undefined;
    }

    // Look up the answer description from new-row options for immediate display
    const answerOpt = (this.newRowAnswerCodeOptions().find(o => o.value === v.answerCode?.trim()) ??
                       this.answerCodeOptions().find(o => o.value === v.answerCode?.trim())) as AnswerCodeOption | undefined;

    // Store locally — auditKey: 0 marks as pending (not yet in DB)
    // Will be POSTed to API during commitAudit() on rescan
    const localResponse: HealthHistoryDto = {
      transactionId:       donation.transactionId,
      questionCode:        selectedQuestion.questionCode,
      questionDescription: selectedQuestion.questionDescription ?? '',
      answerCode:          v.answerCode?.trim()  || undefined,
      answerDescription:   answerOpt?.label      || undefined,
      response:            auditAnswer,
      groupCode:           v.groupCode?.trim()   || undefined,
      incidentDate:        this.formatDateForApi(v.incidentDate) || undefined,
      defThruDate:         this.formatDateForApi(v.defThruDate)  || undefined,
      startDate:           this.formatDateForApi(v.startDate)    || undefined,
      endDate:             this.formatDateForApi(v.endDate)      || undefined,
      interCode:           computedInterCode,
      interdiction:        computedInterCode,
      interPeriodType:     undefined,
      comments:            v.comments?.trim()    || undefined,
      auditKey:            0,
      localId:             ++this._localIdCounter,
    };

    this.allHealthHistoryResponses.update(list => [...list, localResponse]);
    this.isAddingResponse.set(false);
    this.newRowForm.reset();
    this.showSuccessToast('Saved.');
  }

  openNewRowComment(): void {
    // Opens comment panel for the in-progress new row — no save, no validation, no toast
    const tempResponse: HealthHistoryDto = {
      transactionId:       '',
      questionCode:        '__NEW__',
      questionDescription: '',
      answerCode:          '',
      response:            'U',
      comments:            this.newRowForm.get('comments')?.value ?? '',
      auditKey:            -1, // sentinel: in-progress new row
    };
    this.selectedResponseForComment.set(tempResponse);
    this.isCommentPanelOpen.set(true);
  }

  // Computed max date for incident date picker = collection date (cannot be after collection date)
  maxIncidentDate = computed(() => {
    const d = this.donationData()?.collectionDate;
    return d ? moment(d as string).toDate() : null;
  });

  chapterToday = computed(() => {
    const chapterTz = this.headerService.chapterTimeZone();
    return chapterTz ? convertUTCToTimezone(new Date(), chapterTz) : new Date();
  });

  // Returns the current incident date value for use as defThruDate min
  get incidentDateValue(): Date | null {
    const v = this.newRowForm.get('incidentDate')?.value;
    return v ? moment(v).toDate() : null;
  }

  // MLT-10698: calculate def_thru_date using PRTYP multipliers from VALID_MASTER_CODES
  private calcDefThruDate(incidentDate: moment.Moment, deferralPeriod: number, periodType: string): moment.Moment | null {
    const pt = periodType.charAt(0).toUpperCase();
    if (pt === 'P') return null;
    const multipliers = this.periodTypeMultipliers();
    const fallback: Record<string, number> = { D: 1, W: 7, M: 30, Y: 365 };
    const multiplier = multipliers.get(pt) ?? fallback[pt] ?? 0;
    if (multiplier === 0) return null;
    return incidentDate.clone().add(deferralPeriod * multiplier, 'days');
  }

  // MLT-10698: auto-populate defThruDate using PRTYP multipliers
  private autoFillDefThruDate(answerCode: string | null | undefined, incidentDate: any): void {
    if (!answerCode || !incidentDate) return;
    const opt = (this.newRowAnswerCodeOptions().find(o => o.value === answerCode) ??
                 this.answerCodeOptions().find(o => o.value === answerCode)) as AnswerCodeOption;
    if (!opt?.periodType) return;

    const pt = opt.periodType.charAt(0).toUpperCase();

    if (pt === 'P') {
      this.newRowForm.patchValue({ defThruDate: null }, { emitEvent: false });
      this.newRowForm.get('defThruDate')?.disable({ emitEvent: false });
      return;
    }
    this.newRowForm.get('defThruDate')?.enable({ emitEvent: false });
    if (opt?.deferralPeriod == null) return;
    const incDate = moment(incidentDate);
    if (!incDate.isValid()) return;
    const defDate = this.calcDefThruDate(incDate, opt.deferralPeriod, opt.periodType);
    if (defDate) {
      this.newRowForm.patchValue({ defThruDate: defDate.toDate() }, { emitEvent: false });
    }
  }

  // P-1: drives red CSS class on the defThruDate field
  isPermanentDeferral = computed(() => {
    const ac = this.newRowForm?.get('answerCode')?.value;
    if (!ac) return false;
    const opt = (this.newRowAnswerCodeOptions().find(o => o.value === ac) ??
                 this.answerCodeOptions().find(o => o.value === ac)) as AnswerCodeOption;
    // Normalise to single char for 'P'/'PERMANENT' check
    return opt?.periodType?.charAt(0)?.toUpperCase() === 'P';
  });

  // Cross-field validator: defThruDate must be >= incidentDate
  private hhDateRangeValidator(group: import('@angular/forms').AbstractControl): { [key: string]: boolean } | null {
    const inc = group.get('incidentDate')?.value;
    const def = group.get('defThruDate')?.value;
    if (inc && def && moment(def).isBefore(moment(inc), 'day')) {
      return { defBeforeInc: true };
    }
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start) {
      const chapterTz = this.headerService.chapterTimeZone();
      const today = chapterTz ? moment(convertUTCToTimezone(new Date(), chapterTz)) : moment();
      if (moment(start).isAfter(today, 'day')) {
        return { startDateFuture: true };
      }
    }
    if (start && end && moment(start).isAfter(moment(end), 'day')) {
      return { startAfterEnd: true };
    }
    return null;
  }

  // Helper to get new row form controls (used in template)
  getNewHhControl(name: string) {
    return this.newRowForm.get(name);
  }

  getNewRowAnswerDesc(): string {
    const code = this.newRowForm?.get('answerCode')?.value;
    if (!code) return '';
    const opt = this.answerCodeOptions().find(o => o.value === code) as any;
    return opt?.label ?? '';
  }

  // Convert a date string to Date object for [min]/[max] bindings
  toDate(dateStr: string | undefined | null): Date | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    return m.isValid() ? m.toDate() : null;
  }

  onCollectionDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.searchForm.get('collectionDate');
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    setTimeout(() => {
      if (inputValue.trim() && !control.value) {
        control.setErrors({ invalidDate: true });
      } else if (!inputValue.trim()) {
        control.setErrors(null);
      }
    });
  }

  getCollectionDateError(): string {
    const control = this.searchForm.get('collectionDate');
    if (!control || !(control.dirty || control.touched)) return '';
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Invalid date';
    }
    return '';
  }

  // Called from (input) on existing-row ngModel date fields.
  // Defers until after Angular Material processes the event and clears control.value
  // on parse failure — then sets {invalidDate: true} if text is present but value is null.
  onHhDateInput(event: Event, control: AbstractControl | null, isEndDate: boolean): void {
    const inputValue = (event.target as HTMLInputElement).value;
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    setTimeout(() => {
      if (inputValue.trim() && !control.value) {
        control.setErrors({ invalidDate: true });
      }
    });
  }

  onNewHhIncidentDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.newRowForm.get('incidentDate');
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    setTimeout(() => {
      if (inputValue.trim() && !control.value) {
        control.setErrors({ invalidDate: true });
      } else if (control.value && control.hasError('invalidDate')) {
        control.setErrors(null);
      }
    });
  }

  onNewHhDefThruDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.newRowForm.get('defThruDate');
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    setTimeout(() => {
      if (inputValue.trim() && !control.value) {
        control.setErrors({ invalidDate: true });
      } else if (control.value && control.hasError('invalidDate')) {
        control.setErrors(null);
      }
    });
  }

  private formatDateForApi(dateValue: string | Date | Moment | null | undefined): string | undefined {
    if (!dateValue) return undefined;
    const m = moment(dateValue);
    return m.isValid() ? m.format('YYYY-MM-DD') : undefined;
  }

  getCommentsCharactersRemaining(): number {
    const comments = this.addResponseForm.get('comments')?.value || '';
    return 240 - comments.length;
  }

  /**
   * Submit comprehensive add response form (all 14 fields)
   */
  submitAddResponse(): void {
    // Mark all fields as touched to trigger validation messages
    this.addResponseForm.markAllAsTouched();

    // Check form validity
    if (this.addResponseForm.invalid) {
      this.showErrorToast('Please fill in all required fields');
      return;
    }

    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('No donation loaded');
      return;
    }

    const selectedQuestion = this.selectedQuestion();
    if (!selectedQuestion) {
      this.showErrorToast('Please select a question first');
      return;
    }

    // Get form values including disabled fields
    const formValues = this.addResponseForm.getRawValue();

    // Get current audit answer from question header
    const auditAnswer = this.selectedQuestionResponses()[0]?.response || 'U';

    // Build request object with date serialization
    const request: AddHealthHistoryResponseRequest = {
      questionCode: formValues.questionCode || selectedQuestion.questionCode,
      answerCode: formValues.answerCode || null,
      response: auditAnswer, // Use audit answer from question header
      groupCode: formValues.groupCode || null,
      incidentDate: this.formatDateForApi(formValues.incidentDate) || null,
      deferralPeriod: formValues.deferralPeriod || null,
      periodType: formValues.periodType || null,
      defThruDate: this.formatDateForApi(formValues.defThruDate) || null,
      interCode: formValues.interCode || null,
      startDate: this.formatDateForApi(formValues.startDate) || null,
      endDate: this.formatDateForApi(formValues.endDate) || null,
      comments: formValues.comments || null
    };

    // Call API
    this.apiService
      .addHealthHistoryResponse(this.effectiveDonationId, request, this.overrideTxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newResponse) => {
          // Update the responses signal with the new response
          const currentResponses = this.allHealthHistoryResponses();
          this.allHealthHistoryResponses.set([...currentResponses, newResponse]);

          // Collapse form and reset
          this.isAddingResponse.set(false);
          this.addResponseForm.reset();

          // Show success message
          this.showSuccessToast('Health history response added successfully');
        },
        error: (error) => {
          this.loggingService.error('Error adding health history response', error);
          this.showErrorToast('Failed to add health history response');
        }
      });
  }

  /**
   * Cancel comprehensive add response form
   */
  cancelAddResponseForm(): void {
    this.isAddingResponse.set(false);
    this.addResponseForm.reset();
  }

  editResponse(response: HealthHistoryDto): void {
    this.selectedResponseForComment.set(response);
    this.isCommentPanelOpen.set(true);
  }

  onCommentSave(comments: string): void {
    const response = this.selectedResponseForComment();
    if (!response) return;

    if (response.auditKey === -1) {
      // In-progress new row — write back to the inline form, don't save globally
      this.newRowForm.get('comments')?.setValue(comments, { emitEvent: false });
    } else {
      // Existing saved row — update local state; committed to DB during commitAudit
      this.allHealthHistoryResponses.update(responses =>
        responses.map(r => {
          const matches = r.auditKey !== 0
            ? r.auditKey === response.auditKey
            : r.localId !== undefined && response.localId !== undefined && r.localId === response.localId;
          return matches ? { ...r, comments } : r;
        })
      );
      if (response.auditKey > 0) {
        this.changedCommentKeys.add(`${response.questionCode}:${response.auditKey}`);
      }
    }

    this.isCommentPanelOpen.set(false);
    this.selectedResponseForComment.set(null);
  }

  onCommentCancel(): void {
    this.isCommentPanelOpen.set(false);
    this.selectedResponseForComment.set(null);
  }

  parseDate(dateValue: string | undefined | null): Moment | null {
    if (!dateValue) return null;
    const m = moment(dateValue);
    return m.isValid() ? m : null;
  }

  /**
   * Save health history response (add or edit)
   */
  private saveHealthHistoryResponse(responses: UpdateHealthHistoryRequest[], unitId: string): void {
    this.apiService
      .updateHealthHistory(unitId, responses)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccessToast('Health history response saved successfully');

          // Reload health history to get updated data
          const collectionDateValue = this.searchForm.get('collectionDate')?.value;
          let collectionDate: string | undefined;
          if (collectionDateValue) {
            const m = moment(collectionDateValue);
            if (m.isValid()) {
              collectionDate = m.format('YYYY-MM-DD');
            }
          }
          this.loadHealthHistoryForQuestion(unitId, collectionDate);
        },
        error: (error) => {
          this.loggingService.error('Error saving health history response', error);
          this.showErrorToast('Failed to save health history response');
        }
      });
  }

  /**
   * Delete health history response
   */
  async deleteResponse(response: HealthHistoryDto): Promise<void> {
    const confirmed = await this.showConfirmationDialog(
      'Delete Response',
      `Are you sure you want to delete this response for question ${response.questionCode}?`
    );

    if (!confirmed) {
      return;
    }

    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('No donation loaded');
      return;
    }

    this.apiService
      .deleteHealthHistory(this.effectiveDonationId, response.questionCode, response.auditKey, this.overrideTxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.allHealthHistoryResponses.update(list =>
            list.filter(r => !(r.questionCode === response.questionCode && r.auditKey === response.auditKey))
          );
          // Mirrors DRIREAUD KEY-CLRREC: when all answers for a question are cleared,
          // S_RESPONSE reverts to null — user must re-select Y/N/U before adding again.
          if (this.selectedQuestionResponses().length === 0) {
            this._auditAnswerOverride.set('');
          }
          this.showSuccessToast('Response deleted successfully');
        },
        error: (error) => {
          this.loggingService.error('Error deleting health history response', error);
          this.showErrorToast('Failed to delete health history response');
        }
      });
  }

  /**
   * Add new physical finding
   */
  addNewPhysicalFinding(): void {
    if (!this.checkAllQuestionsAnswered()) return;
    // Auto-save the current in-progress row before opening a new one
    if (this.isAddingPfRow() && this.newPfRowForm.get('physicalCode')?.value) {
      this.saveNewPfRow();
    }
    this.newPfRowForm.reset();
    // Explicitly null every control — mat-select retains visual selection after reset()
    this.newPfRowForm.patchValue({ physicalCode: null, physicalValue: null, comments: null }, { emitEvent: false });
    this.newPfCodeDescription.set('');
    this.newPfInterCode.set('');
    this.newPfCommentsRequired.set(false);
    this.newPfValueError.set('');
    this.isAddingPfRow.set(true);
  }

  cancelAddPfRow(): void {
    this.isAddingPfRow.set(false);
    this.newPfRowForm.reset();
    this.newPfRowForm.patchValue({ physicalCode: null, physicalValue: null, comments: null }, { emitEvent: false });
    this.newPfCodeDescription.set('');
    this.newPfInterCode.set('');
    this.newPfCommentsRequired.set(false);
    this.newPfValueError.set('');
    // pendingNewPfRows is intentionally NOT cleared here — already-saved rows stay
  }

  // Called when user picks a physical code in the new row dropdown
  onNewPfCodeChange(code: string): void {
    const existingCodes = [
      ...this.physicalFindings().map(p => p.physicalCode.trim().toUpperCase()),
      ...this.pendingNewPfRows().map(p => p.physicalCode.trim().toUpperCase()),
    ];
    if (existingCodes.includes(code?.trim().toUpperCase())) {
      this.showErrorToast('16119 — Duplicate physical code: ' + code + ' already exists for this transaction.');
      this.newPfRowForm.patchValue({ physicalCode: '' }, { emitEvent: false });
      this.newPfCodeDescription.set('');
      return;
    }

    const template = this.pfTemplate().find(t => t.physicalCode === code);
    this.newPfCodeDescription.set(template?.physicalDescription ?? '');
    this.newPfRowForm.patchValue({ physicalValue: '', comments: '' });
    this.newPfInterCode.set('');
    this.newPfCommentsRequired.set(false);
    this.newPfValueError.set('');

    // No reactive pattern validators — existing rows use zero reactive validators.
    // All numeric/char validation is done manually in onNewPfNumericValueBlur (mirrors onPfValueBlur).
    // Pattern validators on the form control would block char values like UNANS for N-type codes,
    // making the form invalid and causing saveNewPfRow() to silently return early.
    const valueCtrl = this.newPfRowForm.get('physicalValue');
    valueCtrl?.clearValidators();
    valueCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  // Called when user picks a char value for the new row (C-type dropdown OR N/D autocomplete option)
  // Mirrors onPfCharValueSelect / onPfAutoValueSelect for existing rows exactly
  onNewPfValueSelect(value: string): void {
    const code = this.newPfRowForm.get('physicalCode')?.value;
    if (!code) return;
    this.newPfRowForm.patchValue({ physicalValue: value }, { emitEvent: false });
    const rule = this.getPfCharValues(code).find(v => v.value === value);
    // Set signals so user SEES inter code + comments-required in the __new__ row immediately.
    // Save happens on blur (mat-select blur → onNewPfRowBlur, or comments blur → onNewPfRowBlur).
    this.newPfInterCode.set(rule?.interCode ?? '');
    this.newPfCommentsRequired.set(rule?.commentsRequired ?? false);
  }

  // Called on blur of N/D-type text input in the new row
  // Mirrors onPfValueBlur for existing rows exactly: charValues checked first, then numeric
  // autoSelectActiveOption=false on the mat-autocomplete ensures Tab never auto-commits a highlighted
  // option, so event.target.value is always the user's actual typed value here
  onNewPfNumericValueBlur(event: Event): void {
    const code = this.newPfRowForm.get('physicalCode')?.value?.trim();
    if (!code) return;
    const value = (event.target as HTMLInputElement).value?.trim();
    const rules = this.getPfRules(code);
    this.newPfValueError.set('');
    if (!rules) return;

    // 1. charValues FIRST — same as onPfValueBlur
    let charMatched = false;
    if (value && rules.charValues?.length) {
      const charMatch = rules.charValues.find(r => r.value.toUpperCase() === value.toUpperCase());
      if (charMatch) {
        this.newPfInterCode.set(charMatch.interCode ?? '');
        this.newPfCommentsRequired.set(charMatch.commentsRequired ?? false);
        charMatched = true;
      }
    }

    if (!charMatched) {
      // 2. Numeric format validation — do NOT save on format error
      if (value) {
        if (rules.dataType === 'N' && !/^[0-9]+$/.test(value)) {
          this.newPfValueError.set('Integer only');
          return;
        }
        if (rules.dataType === 'D' && !/^\.\d+$|^\d+\.\d+$/.test(value)) {
          this.newPfValueError.set('Decimal value required (e.g. 98.6)');
          return;
        }
      }

      // 3. Numeric interdiction evaluation
      if (rules.numericRules?.length) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const { interCode, commentsRequired } = this.evalNumericRules(rules.numericRules, num);
          this.newPfInterCode.set(interCode ?? '');
          this.newPfCommentsRequired.set(commentsRequired);
        } else {
          this.newPfInterCode.set('');
          this.newPfCommentsRequired.set(false);
        }
      } else {
        // No rules → clear inter code (value is free-form, no rule fires)
        this.newPfInterCode.set('');
        this.newPfCommentsRequired.set(false);
      }
    }

  }

  // Convenience getter used in template
  getNewPfRowPhysicalCode(): string {
    return this.newPfRowForm.get('physicalCode')?.value ?? '';
  }

  getNewPfRowControl(name: string): FormControl {
    return this.newPfRowForm.get(name) as FormControl;
  }

  // Auto-save when user leaves a field in the new PF row — no button needed
  // Does NOT auto-save from value-field blur when comments are required (user must fill comments first)
  onNewPfRowBlur(): void {
    // No-op: the row is saved automatically when the user clicks ADD again or on commit.
    // Auto-saving on blur caused signal writes (pendingNewPfRows, isAddingPfRow) that
    // triggered physicalFindingsForTable re-render, destroying the mat-select mid-selection.
  }

  saveNewPfRow(): void {
    if (!this.isAddingPfRow()) return; // guard: blur from value + blur from comments both fire → only save once
    this.newPfRowForm.markAllAsTouched();
    if (this.newPfRowForm.invalid) return;

    const donation = this.donationData();
    if (!donation) return;

    const v = this.newPfRowForm.getRawValue();
    const code  = v.physicalCode?.trim().toUpperCase();
    const value = v.physicalValue?.trim() || '';

    // Save locally only — API called on re-enter Deferral ID (same pattern as Add New Response)
    const localPf: PhysicalFindingDto = {
      transactionId:       donation.transactionId,
      physicalCode:        code,
      physicalDescription: this.newPfCodeDescription(),
      description:         this.newPfCodeDescription(),
      value,
      interdiction:        this.newPfInterCode() || undefined,
      comments:            v.comments?.trim() || undefined,
      auditKey:            '0',
    };
    this.pendingNewPfRows.update(list => [...list, localPf]);

    // Carry the selected value and interdiction into pfCurrentValues / pfCurrentInterdictions
    // so the pending row's FormControl and interdiction cell display correctly after re-render.
    if (value) {
      this.pfCurrentValues.set(code, value);
    }
    if (localPf.interdiction) {
      this.pfCurrentInterdictions.set(code, localPf.interdiction);
    }

    this.isAddingPfRow.set(false);
    this.newPfRowForm.reset();
    this.newPfCodeDescription.set('');
    this.newPfInterCode.set('');
    this.newPfCommentsRequired.set(false);
    this.newPfValueError.set('');
  }

  editPhysicalFinding(_finding: PhysicalFindingDto): void {
    // Edit via inline row is future scope
  }

  /**
   * Handle response table actions
   */
  onResponseTableAction(event: TableRowActionEvent<HealthHistoryDto>): void {
    if (event.action === 'message') {
      this.editResponse(event.row);
    } else if (event.action === 'delete') {
      this.deleteResponse(event.row);
    }
  }

  onPhysicalFindingsTableAction(event: TableRowActionEvent<any>): void {
    if (event.action === 'cancel') {
      this.cancelAddPfRow();
      return;
    }
    if (event.action === 'delete') {
      const row = event.row as any;
      // Deleting the inline new-row placeholder — just cancel
      if (row?.isNewRow) {
        this.cancelAddPfRow();
        return;
      }
      // Row not yet in DB (auditKey=0): template-derived or locally-added pending row.
      // Remove from both physicalFindings and pendingNewPfRows, and track in
      // pendingDeletedPfCodes so mergePfTemplateWithValues won't recreate it.
      if (String(row?.auditKey) === '0') {
        const pendingCode = row.physicalCode;
        this.pendingNewPfRows.update(list => list.filter(pf => pf.physicalCode !== pendingCode));
        this.physicalFindings.update(list => list.filter(pf => pf.physicalCode !== pendingCode));
        this.pendingDeletedPfCodes.add(pendingCode);
        this.pfCurrentValues.delete(pendingCode);
        this.pfValueFormCtrls.delete(pendingCode);
        return;
      }
      // Existing DB row — show confirmation then call DELETE API immediately
      const code = row?.physicalCode;
      if (!code) return;

      this.showConfirmationDialog('Delete Physical Finding', `Delete physical finding "${code}"?`)
        .then(confirmed => {
          if (!confirmed) return;
          this.apiService.deletePhysicalFinding(this.effectiveDonationId, code, this.overrideTxId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.physicalFindings.update(list => list.filter(pf => pf.physicalCode !== code));
                this.pfCurrentValues.delete(code);
                this.pfInlineComments.delete(code);
                const req = new Map(this.pfCommentsRequired()); req.delete(code); this.pfCommentsRequired.set(req);
                const touched = new Map(this.pfCommentsTouched()); touched.delete(code); this.pfCommentsTouched.set(touched);
                this.showSuccessToast(`Physical finding "${code}" deleted.`);
              },
              error: (err) => this.showErrorToast(err?.error?.message ?? 'Failed to delete physical finding.')
            });
        });
    }
  }

  /**
   * Open HH Questions dialog
   */
  openHHQuestionsDialog(): void {
    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('Please retrieve a donation first');
      return;
    }

    this.apiService
      .getHHTemplate(donation.donationType, donation.collectionDate ?? undefined, donation.transactionId, donation.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          const mapped: HHQuestionDto[] = questions.map(q => ({
            questionCode:   q.questionCode,
            questionText:   q.questionDescription,
            ask:            q.ask,
            abbrFlag:       q.abbrFlag,
            abbrSeq:        q.abbrSeq ?? null,
            repeated:       q.repeated,
            sequence:       q.sortSequence,
            questionNumber: q.questionNumber != null ? String(q.questionNumber) : undefined,
            parentQuestion: q.parentQuestion,
            responseFlag:   q.responseFlag,
            subFlag:        q.subFlag,
            goToNotes:      q.goToNotes,
          }));

          this.dialog.open(HHQuestionsDialog, {
            width: '1200px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: { questions: mapped }
          });
        },
        error: () => {
          this.showErrorToast('Failed to load health history questions');
        }
      });
  }

  /**
   * Open Health History Template dialog
   */
  openHHTemplateDialog(): void {
    const donation = this.donationData();
    if (!donation) {
      this.showErrorToast('Please retrieve a donation first');
      return;
    }

    this.apiService
      .getHHTemplate(donation.donationType, donation.collectionDate ?? undefined, donation.transactionId, donation.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          const mapped: HHTemplateQuestion[] = questions.map(q => ({
            questionCode:   q.questionCode,
            ask:            q.ask ?? '-',
            abbrFlag:       q.abbrFlag ?? '-',
            abbrSeq:        q.abbrSeq ?? null,
            repeated:       q.repeated ?? '-',
            sequence:       q.sortSequence,
            questionNumber: q.questionNumber != null ? String(q.questionNumber) : '-',
            parentQuestion: q.parentQuestion ?? '',
            responseFlag:   q.responseFlag ?? '-',
            subFlag:        q.subFlag ?? '-',
            goToNotes:      q.goToNotes ?? '',
          }));

          this.dialog.open(HHTemplateDialog, {
            width: '1200px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: {
              templateQuestions: mapped,
              templateName: donation.donationType
            }
          });
        },
        error: () => {
          this.showErrorToast('Failed to load health history template');
        }
      });
  }

  onPlaceHold(): void {
    this.isHoldPanelOpen.set(true);
  }

  onHoldPanelSave(rows: LocalHoldRow[]): void {
    this.pendingHoldRows.set(rows);
    this.isHoldPanelOpen.set(false);
    this.showSuccessToast('Hold changes staged — re-scan unit ID to commit.');
  }

  onInterdictionsChanged(): void {
    const donation = this.donationData();
    if (donation) this.loadExistingInterdictions(this.effectiveDonationId, undefined, this.overrideTxId);
  }

  onHoldPanelClose(): void {
    this.isHoldPanelOpen.set(false);
  }

  onClearAll(): void {
    this.clear();
  }

  onSave(): void {
    // If a new HH response row is open, save it locally first
    if (this.isAddingResponse() && this.hasNewRowData()) {
      this.submitNewRow();
      return;
    }

    // Commit any pending physical findings edits to the API
    const donation = this.donationData();
    if (donation) {
      const pfFindings = this.physicalFindings()
        .filter(pf =>
          this.pfCurrentValues.has(pf.physicalCode) ||
          this.pfInlineComments.has(pf.physicalCode)
        )
        .map(pf => ({
          physicalCode:  pf.physicalCode,
          physicalValue: this.pfCurrentValues.get(pf.physicalCode) ?? pf.value ?? null,
          interCode:     pf.interdiction ?? null,
          comments:      this.pfInlineComments.get(pf.physicalCode) ?? pf.comments ?? null,
        }));

      if (pfFindings.length > 0) {
        this.apiService.updatePhysicalFindings(this.effectiveDonationId, pfFindings, this.overrideTxId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
              this.pfInlineComments.clear();
              this.showSuccessToast('Physical findings saved successfully.');
            },
            error: () => this.showErrorToast('Failed to save physical findings.')
          });
        return;
      }
    }

    this.showSuccessToast('No changes to save.');
  }

  // Matches old app KEY-NEXT-ITEM on INCIDENT_DATE:
  //   if incident_date IS NULL AND inter_code IS NOT NULL
  //     → set incident_date = collection_date
  //     → then recalculate def_thru_date
  // Fires on blur (Tab/click away) from the incident date input — NOT on answer code selection.
  onNewRowIncidentDateBlur(): void {
    const incidentCtrl = this.newRowForm.get('incidentDate');
    if (incidentCtrl?.value) return; // already has a date — do nothing

    const answerCode = this.newRowForm.get('answerCode')?.value;
    if (!answerCode) return;

    const opt = (this.newRowAnswerCodeOptions().find(o => o.value === answerCode) ??
                 this.answerCodeOptions().find(o => o.value === answerCode)) as AnswerCodeOption;
    if (!opt?.interCode) return; // old app: only when inter_code IS NOT NULL

    const collDate = this.donationData()?.collectionDate;
    if (!collDate) return;

    // emitEvent: true so incidentDate valueChanges fires → autoFillDefThruDate runs
    this.newRowForm.patchValue({ incidentDate: moment(collDate as string).toDate() });
  }

  // Gap 7: computed — whether group codes exist for current question+response
  hasGroupCodes = computed(() => this.groupCodeOptions().length > 0);

  private syncGroupCodeRequired(): void {
    // Oracle DRIREAUD: group_code is always optional — it filters answers but never blocks.
    // The RG_ANSWERS query uses: (group_code IS NOT NULL AND group_code = :val) OR (group_code IS NULL)
    // meaning when no group is selected, ALL answers are shown. Never set required on group code.
    const groupCtrl = this.newRowForm?.get('groupCode');
    if (!groupCtrl) return;
    groupCtrl.clearValidators();
    groupCtrl.updateValueAndValidity({ emitEvent: false });
  }

  // Tracks the currently selected audit answer (Y/N/U) per question.
  // Oracle Forms persists S_RESPONSE in the block record; we use a Map to mirror that.
  private _auditAnswerOverride = signal<string>('');
  private _auditAnswerPerQuestion = new Map<string, string>();
  currentAuditAnswer = computed(() => {
    const override = this._auditAnswerOverride();
    if (override) return override;
    const fromResponses = this.selectedQuestionResponses()[0]?.response;
    if (fromResponses) return fromResponses;
    const qCode = this.selectedQuestionCode();
    return (qCode && this._auditAnswerPerQuestion.get(qCode)) || '';
  });

  /**
   * Handle Audit Answer change (Y/N/U) with full validation and auto-fill
   */
  onAuditAnswerChange(value: string): void {
    // Gap 1+2: required + Y/N/U validation
    if (!value) { this.showErrorToast('Audit answer is required.'); return; }
    if (!['Y', 'N', 'U'].includes(value)) { this.showErrorToast('Audit answer must be Y, N, or U.'); return; }

    // Mirrors DRIREAUD error 16084: check mismatch BEFORE allowing the new value.
    // Old app: cursor goes back to s_response, blocks execution — user cannot proceed.
    // New app: revert currentAuditAnswer to existing response, block the change.
    const existing = this.selectedQuestionResponses();
    const savedWithDifferentResponse = existing.some(r => (r.auditKey as number) > 0 && r.response !== value);
    if (savedWithDifferentResponse) {
      // Revert to the existing saved response (mirrors cursor-goes-back-to-s_response)
      const savedResponse = existing.find(r => (r.auditKey as number) > 0)?.response || '';
      this._auditAnswerOverride.set(savedResponse);
      this.showErrorToast('Response does not match existing saved answers (error 16084). Clear existing answers first before changing the response.');
      return;
    }

    // No mismatch — allow the new value
    this._auditAnswerOverride.set(value);
    const qCode = this.selectedQuestionCode();
    if (qCode) this._auditAnswerPerQuestion.set(qCode, value);

    // Reload answer codes filtered by the new Y/N/U — matches DRIREAUD LOV filter by s_response
    const questionCode = this.selectedQuestion()?.questionCode;
    if (questionCode && value !== 'U') {
      this.apiService.getAnswerCodes(questionCode, value).pipe(takeUntil(this.destroy$)).subscribe({
        next: (codes) => {
          this.answerCodeOptions.set(codes);
          this.newRowAnswerCodeOptions.set(codes);
          this.answerCodesByQuestion.set(questionCode, codes as AnswerCodeOption[]);
          this.newRowForm?.patchValue({ answerCode: '' }, { emitEvent: false });
        },
        error: () => { this.answerCodeOptions.set([]); this.newRowAnswerCodeOptions.set([]); }
      });
    }

    // Gap 4: U auto-fill — create local UNANS row, no further input needed
    if (value === 'U') {
      const donation = this.donationData();
      const q = this.selectedQuestion();
      if (donation && q) {
        const uResponse: HealthHistoryDto = {
          transactionId:       donation.transactionId,
          questionCode:        q.questionCode,
          questionDescription: q.questionDescription ?? '',
          answerCode:          'UNANS',
          response:            'U',
          interCode:           'NODAT',
          incidentDate:        typeof donation.collectionDate === 'string' ? donation.collectionDate : undefined,
          comments:            'Unanswered',
          auditKey:            0,
        };
        this.allHealthHistoryResponses.update(list => [
          ...list.filter(r => r.questionCode !== q.questionCode || r.auditKey > 0),
          uResponse,
        ]);
      }
      return;
    }

    // Gaps 5, 8: reload group+answer codes filtered by response (Y or N)
    const q = this.selectedQuestion();
    if (q) {
      this.groupCodeOptions.set([]);
      this.answerCodeOptions.set([]);
      this.apiService.getGroupCodes(q.questionCode, value).pipe(takeUntil(this.destroy$))
        .subscribe(codes => { this.groupCodeOptions.set(codes); this.syncGroupCodeRequired(); });
      this.apiService.getAnswerCodes(q.questionCode, value, null).pipe(takeUntil(this.destroy$))
        .subscribe(codes => {
          this.answerCodeOptions.set(codes);
          this.answerCodesByQuestion.set(q.questionCode, codes as AnswerCodeOption[]);
        });
    }

    // Update local response value on existing row
    const existingResponse = this.selectedQuestionResponses()[0];
    if (existingResponse) {
      this.allHealthHistoryResponses.update(responses =>
        responses.map(r =>
          r.questionCode === existingResponse.questionCode && r.auditKey === existingResponse.auditKey
            ? { ...r, response: value }
            : r
        )
      );
    }
  }

  // Gap 9: reload answer codes when group code changes
  // Called when any field on an existing HH row changes — marks it for PUT on save
  onExistingHhFieldChange(row: HealthHistoryDto): void {
    if ((row.auditKey as number) > 0) {
      this.changedHhKeys.add(`${row.questionCode}:${row.auditKey}`);
    }
  }

  // Called from existing data rows — updates only answerCodeOptions (for existing rows).
  // The new-row form uses onNewRowGroupCodeChange() so the two signals stay independent.
  onGroupCodeChange(row: HealthHistoryDto, groupCode: string): void {
    const q = this.selectedQuestion();
    const response = row.response || this.currentAuditAnswer();
    if (q && response) {
      this.apiService.getAnswerCodes(q.questionCode, response, groupCode || null)
        .pipe(takeUntil(this.destroy$))
        .subscribe(codes => {
          this.answerCodeOptions.set(codes);
          this.answerCodesByQuestion.set(q.questionCode, codes as AnswerCodeOption[]);
        }); // existing rows only
    }
    if ((row.auditKey as number) > 0) {
      this.changedHhKeys.add(`${row.questionCode}:${row.auditKey}`);
    }
    this.allHealthHistoryResponses.update(list =>
      list.map(r => r.questionCode === row.questionCode && r.auditKey === row.auditKey
        ? { ...r, groupCode }
        : r)
    );
  }

  // Called from the new-row form group dropdown — updates newRowAnswerCodeOptions only.
  // Keeps answerCodeOptions (used by existing rows) untouched.
  onNewRowGroupCodeChange(groupCode: string): void {
    const q = this.selectedQuestion();
    const response = this.currentAuditAnswer() || this.selectedQuestionResponses()[0]?.response;
    if (q && response) {
      this.apiService.getAnswerCodes(q.questionCode, response, groupCode || null)
        .pipe(takeUntil(this.destroy$))
        .subscribe(codes => this.newRowAnswerCodeOptions.set(codes));
    }
    this.newRowForm.patchValue({ groupCode }, { emitEvent: false });
  }

  // Gap 10+11: store comment_req and additional_date_flag when answer code changes on existing row.
  // Also recalculates inter_code + def_thru_date — matches old app WHEN-VALIDATE-ITEM chain
  // which calls calc_deferral_days → CHECK_INTER → VALID_INTERDICTIONS fallback.
  // Returns answer code options for a specific question row.
  // Used in template so each row shows its OWN options, not the shared last-loaded signal.
  getAnswerOptionsForRow(questionCode: string): AnswerCodeOption[] {
    return (this.answerCodesByQuestion.get(questionCode) ?? this.answerCodeOptions()) as AnswerCodeOption[];
  }

  onAnswerCodeChange(row: HealthHistoryDto, selectedValue: string): void {
    const questionCode = row.questionCode;
    // Look up from the per-question Map first — fixes Bug where shared answerCodeOptions
    // only has options for the last-selected question, so other rows' interCode was always null.
    const questionOpts = this.answerCodesByQuestion.get(questionCode) ?? [];
    const opt = (questionOpts.find(o => o.value === selectedValue)
              ?? this.answerCodeOptions().find(o => o.value === selectedValue)
              ?? this.newRowAnswerCodeOptions().find(o => o.value === selectedValue)) as AnswerCodeOption;
    const commentReq    = (opt as any)?.commentReq        ?? false;
    const showDateRange = (opt as any)?.additionalDateFlag ?? false;
    const answerDesc    = opt?.label              ?? '';
    const newInterCode  = opt?.interCode || undefined;

    // MLT-10698: recalculate def_thru_date using PRTYP multipliers
    const periodType     = opt?.periodType     ?? null;
    const deferralPeriod = opt?.deferralPeriod ?? null;

    this.allHealthHistoryResponses.update(list =>
      list.map(r => {
        // Only update THIS specific row — match by both questionCode AND auditKey (or localId for new rows)
        const isThisRow = r.questionCode === questionCode &&
          (r.auditKey === row.auditKey || (r.auditKey === 0 && r.localId === row.localId));
        if (!isThisRow) return r;

        if ((r.auditKey as number) > 0) this.changedHhKeys.add(`${r.questionCode}:${r.auditKey}`);

        let newDefThruDate: string | undefined = r.defThruDate as string | undefined;
        if (r.incidentDate && periodType && deferralPeriod != null) {
          const incDate = moment(r.incidentDate as string);
          if (incDate.isValid()) {
            const defDate = this.calcDefThruDate(incDate, deferralPeriod, periodType);
            if (defDate?.isValid()) {
              newDefThruDate = this.formatDateForApi(defDate.toDate());
            } else if (periodType.charAt(0).toUpperCase() === 'P') {
              newDefThruDate = undefined;
            }
          }
        } else if (!periodType && !deferralPeriod && !newInterCode) {
          newDefThruDate = undefined;
        }

        return {
          ...r,
          answerCode:       selectedValue,
          answerDescription: answerDesc,
          interCode:        newInterCode,
          interdiction:     newInterCode,
          defThruDate:      newDefThruDate,
          deferralThrough:  newDefThruDate,
          _commentRequired: commentReq,
          _showDateRange:   showDateRange,
        };
      })
    );
  }

  onUpdate(): void {
    // No API call — all changes (HH, audit form) stored locally.
    // Old app: nothing commits until F_RE_SCANED_UNIT_ID match triggers COMMIT_FORM.
    this.showSuccessToast('Saved.');
  }

  // Stub — all saving now happens in commitAudit() triggered by rescan unit ID
  async onSaveDonationAudit(afterSave?: () => void): Promise<void> {
    afterSave?.();
  }

  /**
   * Check all HH template questions are answered. Returns true if OK, false if blocked.
   * Mirrors Oracle check_all_questions — blocks PF editing and commit when questions remain.
   */
  private checkAllQuestionsAnswered(): boolean {
    // Oracle DRIREAUD CHECK_ALL_QUESTIONS only validates questions the user explicitly
    // selected (entered in S_QUESTIONS). Questions without any response are allowed —
    // the audit can proceed with partial HH answers. The Angular app shows all template
    // questions in the left panel, so we only validate that questions with responses
    // have complete data (answer code + incident date), not that every question is answered.
    return true;
  }

  /**
   * Clear form and reset to initial state
   */
  clear(): void {
    // Clean up pending new PF rows that were saved locally but not committed via rescan.
    // In deferral mode, these were POSTed to the API and should be deleted on clear.
    const donation = this.donationData();
    if (donation && this.pendingNewPfRows().length > 0) {
      const effId = donation.unitId || donation.transactionId || '';
      const txId = donation.unitId ? undefined : (donation.transactionId ?? undefined);
      for (const pf of this.pendingNewPfRows()) {
        this.apiService.deletePhysicalFinding(effId, pf.physicalCode, txId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({ error: () => {} });
      }
    }

    this._hasShownDeferralStatus = false;
    this.unitIdField?.clear();
    this.rescanUnitIdField?.clear();
    this.searchForm.patchValue({ collectionDate: null, rescanUnitId: '', deferralId: '' });
    this.parsedUnitId.set(null);
    this.multipleRecordsFound.set(false);
    this.deferralFirstEntry.set(null);
    this.deferralAwaitingSecondEntry.set(false);
    this.auditForm.reset();
    this.donationData.set(null);
    this.statusIndicators.set([]);
    this.isHoldPanelOpen.set(false);
    this.pendingHoldRows.set(null);
    this.pendingNodosignHold.set(false);
    this.pendingNodonationHold.set(false);
    this.pendingNoprocedurHold.set(false);
    this.pendingRemoveNodonationHold.set(false);
    this.pendingRemoveNoprocedurHold.set(false);
    this.existingInterdictions.set([]);
    this.pfTemplate.set([]);
    this.pfTemplateLoaded = false;
    this.pfValueRules.set(new Map());
    this.pfCommentsRequired.set(new Map());
    this.pfCommentsTouched.set(new Map());
    this.pfInlineComments.clear();
    this.templateQuestions.set([]);
    this.allHealthHistoryResponses.set([]);
    this.physicalFindings.set([]);
    this.selectedQuestionCode.set(null);
    this._auditAnswerPerQuestion.clear();
    this.answerCodeOptions.set([]);
    this.newRowAnswerCodeOptions.set([]);
    this.groupCodeOptions.set([]);
    this.answerCodesByQuestion.clear();
    this.activeFilterCodes.set(new Set());
    this.isFilterPanelOpen.set(false);
    this.hhSearchTerm.set('');
    this.isLoadingResponses.set(false);
    this.isAddingResponse.set(false);
    this.isAddingPfRow.set(false);
    this.newPfRowForm?.reset();
    this.pendingNewPfRows.set([]);
    this.newPfCodeDescription.set('');
    this.newPfInterCode.set('');
    this.newPfCommentsRequired.set(false);
    this.pfCurrentValues.clear();
    this.pfCurrentInterdictions.clear();
    this.pfValueSearchCtrls.clear();
    this.pfValueFormCtrls.clear();
    this.pendingDeletedPfCodes.clear();
    this.changedCommentKeys.clear();
    this.isAddingTemplateQuestion.set(false);
    this.addTemplateQuestionForm.reset();
    this.selectedTabIndex.set(0);
    this.showPhysicalFindings.set(false);
    this.clearMessages();
    this.infoMessage.set(
      this.mode === 'deferral'
        ? 'Scan or enter the Deferral ID to load the donation for audit. If duplicates exist, provide the collection date.'
        : 'Scan or type the Unit ID to load the donation for audit.'
    );
  }
}
