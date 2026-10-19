import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, catchError, EMPTY, throwError } from 'rxjs';
import moment, { Moment } from 'moment';


import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ROUTES } from '../../../../core/constants/route.constants';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { removePathPrefix } from '../../../../core/utils/route-utils';

import { SurveyTemplateService } from '../survey-template/services/survey-template.service';
import { SurveyQuestionService } from '../survey-template/services/survey-question.service';
import {
  SurveyQuestionModel,
  TemplateQuestionModel,
  QuestionAnswerModel
} from '../survey-template/models/survey-question.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { QuestionFilterPanel, QuestionFilterValue } from './question-filter-panel/question-filter-panel';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

interface TemplateFormRawValue {
  typeOfSurvey: string | null;
  templateId: string;
  effDate: Moment | null;
  termDate: Moment | null;
}

type TemplateQuestionPayload = {
  questionCode: string;
  dispQuestionCode: string;
  displayOrder: number;
  subQuestionFlag: string | null;
  parentQuesCode: string | null;
};

/**
 * AddEditTemplateComponent
 * Full-page component for adding or editing survey templates with question assignment
 */
@Component({
  selector: 'app-add-edit-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    MatTableModule,
    DragDropModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-template.html',
  styleUrls: ['./add-edit-template.scss']
})
export class AddEditTemplateComponent implements OnInit, OnDestroy {

  @ViewChild('filterBtn', { read: ElementRef }) filterBtnRef!: ElementRef;
  @ViewChild(SearchBar) searchBar!: SearchBar;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  mode: 'add' | 'edit' = 'add';
  templateId?: string;

  templateForm!: FormGroup;
  isEditMode = false;

  // Page Header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: 'Add New Survey Template',
    subtitle: '',
    actions: []
  };

  // Dropdowns
  serveTypes: Array<{ code: string; description: string }> = [];
  filteredServeTypes: Array<{ code: string; description: string }> = [];
  serveTypeSearchKeyword = '';
  nextTemplateId = '';

  // Questions
  allQuestions: SurveyQuestionModel[] = [];
  assignedQuestions: TemplateQuestionModel[] = [];
  availableQuestions: SurveyQuestionModel[] = [];
  filteredAvailableQuestions: SurveyQuestionModel[] = [];

  // Loading states
  isLoadingDropdowns = false;
  isLoadingQuestions = false;
  isSaving = false;

  // Displayed columns for assigned questions table
  displayedColumns: string[] = ['drag', 'sequence', 'questionId', 'description', 'sex', 'parentQuestionId', 'flag', 'actions'];

  // Row expansion
  expandedQuestionId: string | null = null;
  questionAnswers: Map<string, QuestionAnswerModel[]> = new Map();
  loadingAnswers: Map<string, boolean> = new Map();

  // Search bar
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code, description',
    minLength: 2,
    ariaLabel: 'Search questions',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  private searchKeyword = '';

  // Filter panel
  private filterOverlayRef: OverlayRef | null = null;
  appliedFilters: QuestionFilterValue | null = null;
  responseTypeOptions: string[] = [];

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  effectiveDateFilterFn: (date: Moment | null) => boolean = () => true;

  terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.templateForm?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  // Track original values for edit mode change detection
  private originalFormValue: TemplateFormRawValue | null = null;
  private originalAssignedQuestions: TemplateQuestionModel[] = [];

  // Cached save button state to avoid recomputation on every change detection
  saveButtonDisabled = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private surveyTemplateService: SurveyTemplateService,
    private surveyQuestionService: SurveyQuestionService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackBar: MatSnackBar,
    private overlay: Overlay,
    private loginService: LoginService,
    private dialog: MatDialog
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate(): Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  ngOnInit(): void {
    // Check query params for mode and templateId
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.templateId = params['templateId'];
        this.isEditMode = !!this.templateId;
        this.mode = this.isEditMode ? 'edit' : 'add';
        this.setupPageHeader();
      });

    this.effectiveDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(this.chapterOffset);

    this.templateForm = this.createForm();

    // Subscribe to effective date changes
    this.templateForm
      .get('effDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.templateForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        // Update button state after a micro-task to ensure validation completes
        // Only update in add mode (effective date is readonly in edit mode)
        if (!this.isEditMode) {
          setTimeout(() => this.updateSaveButtonState(), 0);
        }
      });

    // Subscribe to effective date status changes (valid/invalid)
    this.templateForm
      .get('effDate')
      ?.statusChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Only update in add mode (effective date is readonly in edit mode)
        if (!this.isEditMode) {
          this.updateSaveButtonState();
        }
      });

    // Subscribe to termination date changes
    this.templateForm
      .get('termDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        // Trigger form-level validation (for dateRangeValidator)
        this.templateForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        // Update button state after a micro-task to ensure validation completes
        setTimeout(() => this.updateSaveButtonState(), 0);
      });

    // Subscribe to termination date status changes (valid/invalid)
    this.templateForm
      .get('termDate')
      ?.statusChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSaveButtonState();
      });

    // Subscribe to survey type changes
    this.templateForm
      .get('typeOfSurvey')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSaveButtonState();
      });

    this.loadInitialData();
    this.subscribeToChapterChanges();

    if (this.isEditMode) {
      this.setupEditModeDateValidators();
    } else {
      this.setupAddModeDateValidators();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
        this.appliedFilters = null;
        this.searchKeyword = '';
        this.searchBar?.clearSearch();
        this.loadInitialData();
      });
  }

  ngOnDestroy(): void {
    this.closeFilterPanel();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPageHeader(): void {
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );

    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: ROUTES.HOME },
        { label: 'Donor Survey Manager', link: `/donor-functions/${dsmSegment}` },
        { label: this.isEditMode ? 'Edit Details' : 'Add New Template', link: null }
      ],
      title: this.isEditMode ? 'Edit Survey Template' : 'Add New Survey Template',
      subtitle: '',
      actions: []
    };
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        typeOfSurvey: [null, Validators.required],
        templateId: [{ value: '', disabled: true }],
        effDate: [null, Validators.required],
        termDate: [null]
      },
      {
        validators: [DateFieldValidationUtility.dateRangeValidator()]
      }
    );
  }

  private setupAddModeDateValidators(): void {
    const effCtrl = this.templateForm.get('effDate');
    const termCtrl = this.templateForm.get('termDate');

    if (effCtrl) {
      effCtrl.clearValidators();
      effCtrl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
      ]);
      effCtrl.updateValueAndValidity();
    }

    if (termCtrl) {
      termCtrl.clearValidators();
      termCtrl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termCtrl.updateValueAndValidity();
    }
  }

  private setupEditModeDateValidators(): void {
    const effCtrl = this.templateForm.get('effDate');
    const termCtrl = this.templateForm.get('termDate');

    if (effCtrl) {
      effCtrl.clearValidators();
      effCtrl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      effCtrl.enable();
      effCtrl.updateValueAndValidity();
    }

    if (termCtrl) {
      termCtrl.clearValidators();
      termCtrl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termCtrl.updateValueAndValidity();
    }
  }

  private loadInitialData(): void {
    this.isLoadingDropdowns = true;
    this.isLoadingQuestions = true;

    // Load survey types from API
    this.surveyTemplateService.getSurveyTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (serveTypes) => {
          this.serveTypes = serveTypes || [];
          this.filteredServeTypes = [...this.serveTypes];
          this.isLoadingDropdowns = false;
        },
        error: () => {
          this.isLoadingDropdowns = false;
          this.showErrorSnackbar('Failed to load survey types');
        }
      });

    // Load questions from API
    this.surveyQuestionService.getAllQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.allQuestions = questions || [];
          this.isLoadingQuestions = false;

          // Extract unique response types for filter dropdown
          const types = new Set(this.allQuestions.map(q => q.responseType).filter(Boolean));
          this.responseTypeOptions = Array.from(types) as string[];

          if (this.isEditMode && this.templateId) {
            this.loadTemplateForEdit();
          } else {
            this.updateAvailableQuestions();
          }
        },
        error: () => {
          this.isLoadingQuestions = false;
          this.showErrorSnackbar('Failed to load questions');
        }
      });

    if (!this.isEditMode) {
      // Template ID is server-assigned upon creation, not set in add mode
      // Initialize original values for add mode (empty state)
      this.originalFormValue = this.templateForm.getRawValue();
      this.originalAssignedQuestions = [];
      this.updateSaveButtonState();
    }
  }

  private loadTemplateForEdit(): void {
    if (!this.templateId) return;

    const chapterId = this.headerService.chapterId() || '';

    this.surveyTemplateService.getSurveyTemplateById(chapterId, this.templateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            const first = data[0];

            // Populate form from first record
            this.templateForm.patchValue({
              typeOfSurvey: first.typeOfSurvey,
              templateId: first.templateId,
              effDate: first.effDate ? moment(first.effDate).startOf('day') : null,
              termDate: first.termDate ? moment(first.termDate).startOf('day') : null,
            });

            // Disable survey type in edit mode
            this.templateForm.get('typeOfSurvey')?.disable();

            // Map questions from response
            this.assignedQuestions = data.map((item: TemplateQuestionPayload) => {
              const questionInfo = this.allQuestions.find(q => q.questionId === item.questionCode);
              return {
                sequence: item.displayOrder,
                questionId: item.questionCode,
                description: questionInfo?.description || item.dispQuestionCode,
                sex: questionInfo?.sex || null,
                parentQuestionId: item.parentQuesCode || null,
                flag: item.subQuestionFlag || null
              };
            });

            // Reorganize to ensure parent-child groups are together
            this.reorganizeParentChildGroups();
            this.resequenceQuestions();
            this.updateAvailableQuestions();

            // Store original values for change detection in edit mode
            this.originalFormValue = this.templateForm.getRawValue();
            this.originalAssignedQuestions = JSON.parse(JSON.stringify(this.assignedQuestions));

            // Update save button state after loading
            this.updateSaveButtonState();
          }
        },
        error: () => {
          // handled by interceptor
        }
      });
  }

  private updateAvailableQuestions(): void {
    // Don't filter out assigned questions - keep them in the available list
    // Deduplicate questions by questionId to prevent duplicate key errors
    const uniqueQuestions = this.allQuestions.reduce((acc, current) => {
      const existing = acc.find(q => q.questionId === current.questionId);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as SurveyQuestionModel[]);

    this.availableQuestions = uniqueQuestions;
    this.applySearch();
  }

  onSearch(searchText: string): void {
    this.searchKeyword = searchText;
    this.applySearch();
  }

  private applySearch(): void {
    let filtered = [...this.availableQuestions];

    // Apply text search
    if (this.searchKeyword) {
      const search = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(
        q =>
          q.questionId.toLowerCase().includes(search) ||
          q.description.toLowerCase().includes(search)
      );
    }

    // Apply filters
    if (this.appliedFilters) {
      const f = this.appliedFilters;

      if (f.sex) {
        filtered = filtered.filter(q => q.sex === f.sex);
      }

      if (f.responseType) {
        filtered = filtered.filter(q => q.responseType === f.responseType);
      }

      if (f.effDate && f.effDatePeriod) {
        const filterDate = moment(f.effDate).startOf('day');
        filtered = filtered.filter(q => {
          if (!q.lastModified) return false;
          const qDate = moment(q.lastModified).startOf('day');
          return f.effDatePeriod === 'after' ? qDate.isSameOrAfter(filterDate) : qDate.isSameOrBefore(filterDate);
        });
      }

      if (f.termDate && f.termDatePeriod) {
        // termDate filtering can be added when termination date is available in the question model
      }
    }

    filtered.sort((a, b) => a.questionId.localeCompare(b.questionId));
    this.filteredAvailableQuestions = filtered;
  }

  openFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.closeFilterPanel();
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtnRef)
      .withPositions([
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' }
      ]);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px'
    });

    const portal = new ComponentPortal(QuestionFilterPanel);
    const ref = this.filterOverlayRef.attach(portal);

    ref.instance.currentFilters = this.appliedFilters;
    ref.instance.responseTypeOptions = this.responseTypeOptions;

    ref.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: QuestionFilterValue) => {
        this.appliedFilters = filters;
        this.applySearch();
        this.closeFilterPanel();
      });

    ref.instance.clearAll
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: QuestionFilterValue) => {
        this.appliedFilters = filters;
        this.applySearch();
      });

    ref.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());
  }

  closeFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
  }

  onServeTypeSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.serveTypeSearchKeyword = input.value;
    this.applyServeTypeSearch();
  }

  applyServeTypeSearch(): void {
    if (!this.serveTypeSearchKeyword) {
      this.filteredServeTypes = [...this.serveTypes];
    } else {
      const search = this.serveTypeSearchKeyword.toLowerCase();
      this.filteredServeTypes = this.serveTypes.filter(
        type =>
          type.code.toLowerCase().includes(search) ||
          type.description.toLowerCase().includes(search)
      );
    }
  }

  addQuestion(question: SurveyQuestionModel): void {
    const newSequence = this.assignedQuestions.length + 1;
    const templateQuestion: TemplateQuestionModel = {
      sequence: newSequence,
      questionId: question.questionId,
      description: question.description,
      sex: question.sex,
      parentQuestionId: question.parentQuestionId,
      flag: question.flag
    };

    // Create new array reference to trigger change detection
    this.assignedQuestions = [...this.assignedQuestions, templateQuestion];
    this.reorganizeParentChildGroups();
    this.resequenceQuestions();
    this.updateAvailableQuestions();
    this.updateSaveButtonState();
  }

  removeQuestion(question: TemplateQuestionModel): void {
    const index = this.assignedQuestions.findIndex(q => q.questionId === question.questionId);
    if (index > -1) {
      // Clear parent reference from child questions
      this.assignedQuestions.forEach(q => {
        if (q.parentQuestionId === question.questionId) {
          q.parentQuestionId = null;
        }
      });

      // Create new array reference to trigger change detection
      this.assignedQuestions = this.assignedQuestions.filter(q => q.questionId !== question.questionId);
      this.reorganizeParentChildGroups();
      this.resequenceQuestions();
      this.updateAvailableQuestions();
      this.updateSaveButtonState();
    }
  }

  removeQuestionById(questionId: string): void {
    // Clear parent reference from child questions
    this.assignedQuestions.forEach(q => {
      if (q.parentQuestionId === questionId) {
        q.parentQuestionId = null;
      }
    });

    this.assignedQuestions = this.assignedQuestions.filter(q => q.questionId !== questionId);
    this.reorganizeParentChildGroups();
    this.resequenceQuestions();
    this.updateAvailableQuestions();
    this.updateSaveButtonState();
  }

  isQuestionAssigned(questionId: string): boolean {
    return this.assignedQuestions.some(q => q.questionId === questionId);
  }

  getResponseTypeIconPath(responseType: string | undefined): string {
    const type = (responseType || 'S').toUpperCase();
    switch (type) {
      case 'S':
        return 'assets/images/icons/type-single.svg';
      case 'M':
        return 'assets/images/icons/type-multiple.svg';
      case 'C':
        return 'assets/images/icons/type-comment.svg';
      case 'R':
        return 'assets/images/icons/type-ranking.svg';
      default:
        return 'assets/images/icons/type-single.svg';
    }
  }

  getResponseTypeLabel(responseType: string | undefined): string {
    const type = (responseType || 'S').toUpperCase();
    switch (type) {
      case 'S':
        return 'Single';
      case 'M':
        return 'Multiple';
      case 'C':
        return 'Comment';
      case 'R':
        return 'Ranking';
      default:
        return 'Single';
    }
  }

  getGenderIconPath(gender: string | null | undefined): string {
    switch (gender) {
      case 'M':
      case 'Male':
        return 'assets/images/icons/gender-male.svg';
      case 'F':
      case 'Female':
        return 'assets/images/icons/gender-female.svg';
      case 'A':
      case 'All':
      default:
        return 'assets/images/icons/gender-all.svg';
    }
  }

  getGenderLabel(gender: string | null | undefined): string {
    switch (gender) {
      case 'M':
      case 'Male':
        return 'Male';
      case 'F':
      case 'Female':
        return 'Female';
      case 'A':
      case 'All':
      default:
        return 'All';
    }
  }

  getAvailableParentQuestions(question: TemplateQuestionModel): TemplateQuestionModel[] {
    return this.assignedQuestions.filter(q => q.questionId !== question.questionId);
  }

  isChildQuestion(questionId: string): boolean {
    return this.assignedQuestions.some(q => q.parentQuestionId === questionId);
  }

  onParentQuestionChange(row: TemplateQuestionModel): void {
    // Reorganize to keep all parent-child groups together
    // This handles both setting and clearing parent questions
    this.reorganizeParentChildGroups();
    this.resequenceQuestions();
    this.updateSaveButtonState();
  }

  onFlagChange(): void {
    this.updateSaveButtonState();
  }

  /**
   * Reorganizes questions to ensure all children are immediately after their parent
   */
  private reorganizeParentChildGroups(): void {
    const result: TemplateQuestionModel[] = [];
    const processedIds = new Set<string>();

    // Process each question
    for (const question of this.assignedQuestions) {
      // Skip if already processed
      if (processedIds.has(question.questionId)) {
        continue;
      }

      // If it's a child, skip it (it will be added with its parent)
      if (question.parentQuestionId) {
        continue;
      }

      // Add the parent question
      result.push(question);
      processedIds.add(question.questionId);

      // Add all its children immediately after
      const children = this.assignedQuestions.filter(
        q => q.parentQuestionId === question.questionId
      );
      for (const child of children) {
        result.push(child);
        processedIds.add(child.questionId);
      }
    }

    // Add any remaining orphaned children at the end (shouldn't happen, but safety net)
    for (const question of this.assignedQuestions) {
      if (!processedIds.has(question.questionId)) {
        result.push(question);
      }
    }

    this.assignedQuestions = result;
  }

  getParentQuestionError(row: TemplateQuestionModel): string {
    if (!row.parentQuestionId) return '';
    const parentQuestion = this.allQuestions.find(q => q.questionId === row.parentQuestionId);
    if (parentQuestion && parentQuestion.responseType?.toUpperCase() !== 'S') {
      return 'Parent question only be single type';
    }
    const parentIsChild = this.assignedQuestions.some(q => q.questionId === row.parentQuestionId && q.parentQuestionId);
    if (parentIsChild) {
      return 'Child question cannot be a parent';
    }
    return '';
  }

  getFlagError(row: TemplateQuestionModel): string {
    if (row.parentQuestionId && row.flag) {
      return 'Child question cannot have a flag';
    }
    return '';
  }

  hasAssignedQuestionsValidationErrors(): boolean {
    return this.assignedQuestions.some(row =>
      this.getParentQuestionError(row) !== '' || this.getFlagError(row) !== ''
    );
  }

  onRowDrop(event: CdkDragDrop<TemplateQuestionModel[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const draggedRow = this.assignedQuestions[event.previousIndex];

    // Only allow dragging parent questions (not children)
    if (draggedRow.parentQuestionId) {
      return; // Don't allow dragging child questions
    }

    // Collect the dragged row and its children (if it's a parent)
    const children = this.assignedQuestions.filter(q => q.parentQuestionId === draggedRow.questionId);
    const group = [draggedRow, ...children];
    const groupIds = new Set(group.map(q => q.questionId));

    // Remove group from list
    const remaining = this.assignedQuestions.filter(q => !groupIds.has(q.questionId));

    // Calculate insert index in the remaining list
    let insertIndex = event.currentIndex;
    if (event.currentIndex > event.previousIndex) {
      insertIndex = Math.min(insertIndex - (group.length - 1), remaining.length);
    }
    insertIndex = Math.max(0, Math.min(insertIndex, remaining.length));

    // Validate: Cannot drop between a parent and its children
    // Check if the insert position would split another parent-child group
    if (insertIndex > 0 && insertIndex < remaining.length) {
      const itemBefore = remaining[insertIndex - 1];
      const itemAtPosition = remaining[insertIndex];

      // Check if we're trying to insert between a parent and its child
      if (itemAtPosition.parentQuestionId === itemBefore.questionId) {
        this.showErrorSnackbar('Cannot insert between a parent question and its children');
        return;
      }

      // Check if we're trying to insert within a child group
      if (itemBefore.parentQuestionId && itemAtPosition.parentQuestionId === itemBefore.parentQuestionId) {
        this.showErrorSnackbar('Cannot insert between child questions');
        return;
      }
    }

    // Insert group at new position
    remaining.splice(insertIndex, 0, ...group);
    this.assignedQuestions = remaining;

    // Just resequence - don't reorganize since we've already positioned the group correctly
    this.resequenceQuestions();
    this.updateSaveButtonState();
  }

  toggleRowExpansion(row: TemplateQuestionModel): void {
    if (this.expandedQuestionId === row.questionId) {
      this.expandedQuestionId = null;
    } else {
      this.expandedQuestionId = row.questionId;
      if (!this.questionAnswers.has(row.questionId)) {
        this.loadAnswers(row.questionId);
      }
    }
  }

  private loadAnswers(questionCode: string): void {
    this.loadingAnswers.set(questionCode, true);
    this.surveyQuestionService.getQuestionAnswers(questionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (answers) => {
          this.questionAnswers.set(questionCode, answers);
          this.loadingAnswers.set(questionCode, false);
        },
        error: () => {
          this.loadingAnswers.set(questionCode, false);
          this.showErrorSnackbar('Failed to load answers');
        }
      });
  }

  getQuestionEffDate(questionId: string): string {
    const q = this.allQuestions.find(q => q.questionId === questionId);
    return q?.lastModified ? moment(q.lastModified).format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  getQuestionTermDate(questionId: string): string {
    const q = this.allQuestions.find(q => q.questionId === questionId);
    return q?.termDate ? moment(q.termDate).format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private resequenceQuestions(): void {
    this.assignedQuestions.forEach((q, index) => {
      q.sequence = index + 1;
    });
    // Create new array reference to trigger change detection
    this.assignedQuestions = [...this.assignedQuestions];
  }

  private updateSaveButtonState(): void {
    this.saveButtonDisabled = this._computeSaveDisabled();
  }

  private _computeSaveDisabled(): boolean {
    // Check if form is saving
    if (this.isSaving) {
      return true;
    }

    // Check if there are assigned questions
    if (this.assignedQuestions.length === 0) {
      return true;
    }

    // Check form validity (considering disabled fields)
    // In edit mode, typeOfSurvey is disabled but still needs to have a value
    const rawValue = this.templateForm.getRawValue();

    // Required fields check
    if (!rawValue.typeOfSurvey || !rawValue.effDate) {
      return true;
    }

    // Check for form-level errors (like date range validation)
    if (this.templateForm.errors) {
      return true;
    }

    // Check individual field errors (excluding disabled fields)
    const effDateControl = this.templateForm.get('effDate');
    const termDateControl = this.templateForm.get('termDate');

    if (effDateControl?.invalid || termDateControl?.invalid) {
      return true;
    }

    // Check for validation errors in assigned questions
    if (this.hasAssignedQuestionsValidationErrors()) {
      return true;
    }

    // In edit mode, check if anything has changed
    if (this.isEditMode) {
      return !this.hasFormChanged();
    }

    return false;
  }

  private hasFormChanged(): boolean {
    // Check if assigned questions changed (count, order, or properties)
    const questionsChanged = this.haveAssignedQuestionsChanged();

    // If no original form value stored yet, only check questions
    if (!this.originalFormValue) {
      return questionsChanged;
    }

    // Check if form values changed
    const currentFormValue = this.templateForm.getRawValue();

    // In edit mode, effective date is readonly, so only check termination date
    // In add mode, check both dates
    const formChanged = this.isEditMode
      ? !this.areDatesEqual(currentFormValue.termDate, this.originalFormValue.termDate)
      : (!this.areDatesEqual(currentFormValue.effDate, this.originalFormValue.effDate) ||
         !this.areDatesEqual(currentFormValue.termDate, this.originalFormValue.termDate));

    return formChanged || questionsChanged;
  }

  private haveAssignedQuestionsChanged(): boolean {
    // If no original questions stored, check against empty array
    const original = this.originalAssignedQuestions || [];

    // Check if count changed
    if (this.assignedQuestions.length !== original.length) {
      return true;
    }

    // If both are empty, no change
    if (this.assignedQuestions.length === 0 && original.length === 0) {
      return false;
    }

    // Check if any question properties changed
    for (let i = 0; i < this.assignedQuestions.length; i++) {
      const current = this.assignedQuestions[i];
      const originalItem = original[i];

      if (!originalItem) {
        return true; // Original doesn't exist at this index
      }

      if (current.questionId !== originalItem.questionId ||
          current.sequence !== originalItem.sequence ||
          current.parentQuestionId !== originalItem.parentQuestionId ||
          current.flag !== originalItem.flag) {
        return true;
      }
    }

    return false;
  }

  private areDatesEqual(date1: Moment | Date | string | null, date2: Moment | Date | string | null): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;

    const moment1 = moment.isMoment(date1) ? date1 : moment(date1);
    const moment2 = moment.isMoment(date2) ? date2 : moment(date2);

    return moment1.isSame(moment2, 'day');
  }

  onSave(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    if (this.assignedQuestions.length === 0) {
      this.showErrorSnackbar('Please assign at least one question to the template');
      return;
    }

    const formValue = this.templateForm.getRawValue();
    const chapterId = this.headerService.chapterId() || '';
    const warehouseId = this.headerService.warehouseId() || '';
    const warehouseName = this.headerService.warehouseName() || '';
    const chapterTimezone = this.headerService.chapterTimeZone() || '';
    const loggedInUserName = this.loginService.getStoredUsername() || '';

    const questions = this.assignedQuestions.map(q => ({
      questionCode: q.questionId,
      dispQuestionCode: q.questionId,
      displayOrder: q.sequence,
      subQuestionFlag: q.flag ?? null,
      parentQuesCode: q.parentQuestionId ?? null
    }));

    this.isSaving = true;
    this.updateSaveButtonState();

    if (this.isEditMode && this.templateId) {
      // Edit mode - start with resolveOverlaps: false
      this.updateSurveyTemplate(formValue, questions, chapterId, warehouseId, warehouseName, chapterTimezone, loggedInUserName, false);
    } else {
      // Add mode - start with resolveOverlaps: false
      this.createSurveyTemplate(formValue, questions, chapterId, warehouseId, warehouseName, chapterTimezone, loggedInUserName, false);
    }
  }

  private createSurveyTemplate(
    formValue: TemplateFormRawValue,
    questions: TemplateQuestionPayload[],
    chapterId: string,
    warehouseId: string,
    warehouseName: string,
    chapterTimezone: string,
    loggedInUserName: string,
    resolveOverlaps: boolean
  ): void {
    const payload = {
      typeOfSurvey: formValue.typeOfSurvey!,
      effDate: this.formatDateIso(formValue.effDate),
      termDate: this.formatDateIso(formValue.termDate),
      questions,
      resolveOverlaps,
      loggedInUserName,
      chapterId,
      warehouseId,
      warehouseName,
      chapterTimezone
    };

    this.surveyTemplateService.addSurveyTemplate(payload)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isSaving = false;
          this.updateSaveButtonState();

          // Handle HTTP 409 - Overlapping templates exist
          if (error.status === 409) {
            const errorMessage = error.error?.message || '';
            this.showOverlapConfirmation(formValue, questions, chapterId, warehouseId, warehouseName, chapterTimezone, loggedInUserName, errorMessage);
            // Return EMPTY to complete the observable without error
            return EMPTY;
          }

          // For other errors, rethrow to let interceptor handle the snackbar
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.updateSaveButtonState();
          if (response.success) {
            const message = `Survey template '${formValue.typeOfSurvey}' created successfully`;
            this.snackBar.open(message, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.navigateBack();
          }
        }
      });
  }

  private showOverlapConfirmation(
    formValue: TemplateFormRawValue,
    questions: TemplateQuestionPayload[],
    chapterId: string,
    warehouseId: string,
    warehouseName: string,
    chapterTimezone: string,
    loggedInUserName: string,
    errorMessage: string
  ): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Template Date Overlap',
      message: errorMessage,
      confirmText: 'Yes, Create',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          // User confirmed - retry with resolveOverlaps: true
          this.isSaving = true;
          this.updateSaveButtonState();
          this.createSurveyTemplate(formValue, questions, chapterId, warehouseId, warehouseName, chapterTimezone, loggedInUserName, true);
        }
      });
  }

  private updateSurveyTemplate(
    formValue: TemplateFormRawValue,
    questions: TemplateQuestionPayload[],
    chapterId: string,
    warehouseId: string,
    warehouseName: string,
    chapterTimezone: string,
    loggedInUserName: string,
    resolveOverlaps: boolean
  ): void {
    const payload = {
      templateId: this.templateId!,
      typeOfSurvey: formValue.typeOfSurvey!,
      chapterId,
      effDate: this.formatDateIso(formValue.effDate),
      termDate: this.formatDateIso(formValue.termDate),
      questions,
      resolveOverlaps,
      loggedInUserName,
      warehouseId,
      warehouseName,
      chapterTimezone
    };

    this.surveyTemplateService.updateSurveyTemplate(payload)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isSaving = false;
          this.updateSaveButtonState();

          if (error.status === 409) {
            const errorMessage = error.error?.message || '';
            this.showEditOverlapConfirmation(formValue, questions, chapterId, warehouseId, warehouseName, chapterTimezone, loggedInUserName, errorMessage);
            return EMPTY;
          }

          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.updateSaveButtonState();
          if (response.success) {
            const message = `Survey template '${formValue.typeOfSurvey}' updated successfully`;
            this.snackBar.open(message, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.navigateBack();
          }
        }
      });
  }

  private showEditOverlapConfirmation(
    formValue: TemplateFormRawValue,
    questions: TemplateQuestionPayload[],
    chapterId: string,
    warehouseId: string,
    warehouseName: string,
    chapterTimezone: string,
    loggedInUserName: string,
    errorMessage: string
  ): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Template Date Overlap',
      message: errorMessage,
      confirmText: 'Yes, Update',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isSaving = true;
          this.updateSaveButtonState();
          this.updateSurveyTemplate(formValue, questions, chapterId, warehouseId, warehouseName, chapterTimezone, loggedInUserName, true);
        }
      });
  }

  onCancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'survey-template']);
  }

  private formatDateIso(date: Moment | Date | string | null): string | null {
    if (!date) return null;
    return moment(date).format('YYYY-MM-DD');
  }

  getFormattedEffectiveDate(): string {
    const effDate = this.templateForm.get('effDate')?.value;
    if (!effDate) return '-';
    return moment(effDate).format('DD-MMM-YYYY').toUpperCase();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.templateForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.templateForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.templateForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.templateForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.templateForm.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.templateForm.get('termDate'), this.isEditMode
    );
  }

  onDateBlur(event: Event, controlName: 'effDate' | 'termDate'): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() ?? '';
    if (!inputValue) return;

    // Try to parse and auto-format shorthand date entry
    const parsedDate = this.parseShorthandDate(inputValue);
    if (parsedDate && parsedDate.isValid()) {
      const control = this.templateForm.get(controlName);
      if (control) {
        control.setValue(parsedDate);
      }
    }
  }

  onDateKeyDown(event: KeyboardEvent, controlName: 'effDate' | 'termDate'): void {
    if (event.key === 'Enter') {
      const input = event.target as HTMLInputElement;
      const inputValue = input.value?.trim() ?? '';
      if (!inputValue) return;

      const parsedDate = this.parseShorthandDate(inputValue);
      if (parsedDate && parsedDate.isValid()) {
        const control = this.templateForm.get(controlName);
        if (control) {
          control.setValue(parsedDate);
        }
      }
    }
  }

  /**
   * Parse shorthand date entry (DDMMYY format) like "111226" to moment date
   * @param input - The input string to parse
   * @returns Moment date if valid, null otherwise
   */
  private parseShorthandDate(input: string): Moment | null {
    if (!input) return null;

    const trimmed = input.trim();

    // Check if it's a 6-digit shorthand format (DDMMYY)
    if (/^\d{6}$/.test(trimmed)) {
      const day = parseInt(trimmed.substring(0, 2), 10);
      const month = parseInt(trimmed.substring(2, 4), 10);
      const yearTwoDigit = parseInt(trimmed.substring(4, 6), 10);

      // Determine century (20xx for 00-99, can be adjusted based on business logic)
      // Common logic: if year is 00-50, assume 2000-2050, else 1950-1999
      const year = yearTwoDigit < 50 ? 2000 + yearTwoDigit : 1900 + yearTwoDigit;

      // Validate month (1-12)
      if (month < 1 || month > 12) {
        return null;
      }

      // Create moment date (month is 0-indexed in moment)
      const date = moment([year, month - 1, day]).startOf('day');

      // Validate the date is valid (catches invalid days like Feb 30, Apr 31, etc.)
      if (!date.isValid() || date.date() !== day || date.month() !== month - 1 || date.year() !== year) {
        return null;
      }

      return date;
    }

    // Try parsing other common formats
    const formats = [
      'DD-MMM-YYYY', 'D-MMM-YYYY',
      'DD/MMM/YYYY', 'D/MMM/YYYY',
      'DD-MM-YYYY', 'D-M-YYYY',
      'DD/MM/YYYY', 'D/M/YYYY',
      'YYYY-MM-DD', 'YYYY/MM/DD'
    ];

    const parsedDate = moment(trimmed, formats, true);

    if (parsedDate.isValid()) {
      return parsedDate.startOf('day');
    }

    return null;
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.templateForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  private showErrorSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
