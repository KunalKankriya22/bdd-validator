import { Component, computed, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { QaLibraryApiService } from './services/qa-library-api.service';
import { HeaderService } from '@shared/services/header.service';
import { QaLibraryListComponent } from './components/qa-library-list/qa-library-list.component';
import { QaLibraryDetailFormComponent } from './components/qa-library-detail-form/qa-library-detail-form.component';
import { QaLibraryFilterPanelComponent } from './components/qa-library-filter-panel/qa-library-filter-panel.component';
import { Question, Answer, CommentConfig, QaLibraryFilters } from './models/qa-library.models';

@Component({
  selector: 'app-qa-library',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    SearchBar,
    QaLibraryListComponent,
    QaLibraryDetailFormComponent
  ],
  templateUrl: './qa-library.html',
  styleUrls: ['./qa-library.scss']
})
export class QaLibraryComponent implements OnInit, OnDestroy {
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef;
  @ViewChild('sidebar', { read: ElementRef }) sidebar!: ElementRef;
  @ViewChild(SearchBar) searchBar!: SearchBar;

  // Signals for reactive UI state
  allQuestions = signal<Question[]>([]);  // All questions from API
  questions = signal<Question[]>([]);     // Filtered questions for display
  selectedQuestion = signal<Question | null>(null);
  appliedFilters = signal<QaLibraryFilters | null>(null);
  isLoading = signal<boolean>(false);     // For GET operations (loading questions/answers)
  isSaving = signal<boolean>(false);      // For POST/PUT operations (saving)
  formMode: 'add' | 'edit' = 'edit';

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by question code, question',
    minLength: 2,
    ariaLabel: 'Search questions',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // RxJS Subjects
  private destroy$ = new Subject<void>();

  // CDK Overlay
  private overlayRef: OverlayRef | null = null;

  // Computed signals
  hasActiveFilters = computed(() => {
    const filters = this.appliedFilters();
    return filters !== null && Object.values(filters).some(v => v !== null);
  });

  constructor(
    private apiService: QaLibraryApiService,
    private overlay: Overlay,
    private snackbar: SnackbarService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
    this.subscribeToChapterChanges();
  }

  /**
   * Load all questions from API (no server-side filtering)
   * @param questionCodeToSelect - Optional question code to re-select after load
   */
  loadQuestions(questionCodeToSelect?: string): void {
    this.isLoading.set(true);
    this.apiService.getQuestions().subscribe({
      next: (data) => {
        this.allQuestions.set(data);
        this.applyClientSideFilters();

        // Re-select question if specified (after save)
        if (questionCodeToSelect) {
          const questionToSelect = data.find(q => q.questionCode === questionCodeToSelect);
          if (questionToSelect) {
            this.selectQuestionAndLoadAnswers(questionToSelect);
          }
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        this.showErrorMessage(error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Client-side search (filter by question code or question text)
   */
  onSearch(searchText: string): void {
    const filtered = this.allQuestions().filter(q =>
      q.questionCode.toLowerCase().includes(searchText.toLowerCase()) ||
      q.questionText.toLowerCase().includes(searchText.toLowerCase())
    );
    this.questions.set(filtered);

    // Programmatic clear from createQuestion() — don't auto-select
    if (this.formMode === 'add' && !searchText) return;

    // User searched while in add mode — exit add mode
    if (this.formMode === 'add') {
      this.formMode = 'edit';
    }

    if (filtered.length === 0) {
      // No results — clear the right panel
      this.selectedQuestion.set(null);
    } else if (!searchText) {
      // Search cleared: only auto-select if nothing is currently selected
      if (!this.selectedQuestion()) {
        this.selectQuestionAndLoadAnswers(filtered[0]);
      }
    } else {
      // Active search: always auto-select first result
      this.selectQuestionAndLoadAnswers(filtered[0]);
    }
  }

  /**
   * When a question is selected, load its answers
   */
  onQuestionSelected(question: Question): void {
    this.selectQuestionAndLoadAnswers(question);
  }

  /**
   * Select question and load its answers (if not Comment type)
   */
  private selectQuestionAndLoadAnswers(question: Question): void {
    this.formMode = 'edit';

    // Load answers for all types that persist answer rows
    if (['Single', 'Multiple', 'Ranking', 'Comment'].includes(question.responseType)) {
      this.isLoading.set(true);
      this.apiService.getAnswers(question.questionCode).subscribe({
        next: (answers) => {
          if (question.responseType === 'Comment') {
            // Map the single comment answer row back to commentConfig
            const first = answers[0];
            question.commentConfig = first ? {
              characterLimit: 240,
              answerCode: first.answerCode,
              answerDesc: first.answerCodeDescription,
              effectiveDate: first.effectiveDate,
              terminationDate: first.terminationDate
            } : null;
            question.answerOptions = [];
          } else {
            question.answerOptions = answers;
          }
          // Set question only once, after answers are loaded
          this.selectedQuestion.set({ ...question });
          this.isLoading.set(false);
        },
        error: (error) => {
          this.showErrorMessage(error);
          question.answerOptions = [];
          // Set question even if answer loading fails
          this.selectedQuestion.set({ ...question });
          this.isLoading.set(false);
        }
      });
    } else {
      // No answers to load - set question immediately
      this.selectedQuestion.set(question);
    }
  }

  createQuestion(): void {
    // Set add mode FIRST to prevent auto-selection from clearSearch/clearFilters
    this.formMode = 'add';

    const newQuestion: Question = {
      questionCode: '',
      questionText: '',
      sex: '',  // No default - user must select
      responseType: 'Single',  // Default to Single (optional field but show default)
      effectiveDate: null,
      terminationDate: null,
      answerOptions: [],
      commentConfig: null,
      isEditable: true
    };
    this.selectedQuestion.set(newQuestion);

    // Clear search text and filters — auto-select is guarded by formMode === 'add'
    this.searchBar?.clearSearch();
    this.clearFilters();
  }

  onSave(event: { question: Question; questionChanged: boolean; answersChanged: boolean }): void {
    this.isSaving.set(true);
    const formData = event.question;

    if (this.formMode === 'add') {
      // ADD MODE: Always create question, then save answers if needed
      this.apiService.createQuestion(formData).subscribe({
        next: (response: any) => {
          // Save answers: answer-option types use answerOptions array; Comment type uses commentConfig
          const answersToSave: Answer[] = formData.responseType === 'Comment'
            ? (formData.commentConfig?.answerCode ? [this.buildCommentAnswer(formData.commentConfig)] : [])
            : (formData.answerOptions ?? []);

          if (answersToSave.length > 0) {
            this.apiService.saveAnswers(formData.questionCode, answersToSave).subscribe({
              next: (answerResponse: any) => {
                // Show success message only from the final operation (saveAnswers)
                if (answerResponse?.success && answerResponse?.message) {
                  this.snackbar.showSuccess(answerResponse.message);
                }
                this.isSaving.set(false);
                this.loadQuestions(formData.questionCode);
              },
              error: (error) => {
                this.showErrorMessage(error);
                this.isSaving.set(false);
              }
            });
          } else {
            // No answers to save - show success message from createQuestion
            if (response?.success && response?.message) {
              this.snackbar.showSuccess(response.message);
            }
            this.isSaving.set(false);
            this.loadQuestions(formData.questionCode);
          }
        },
        error: (error) => {
          this.showErrorMessage(error);
          this.isSaving.set(false);
        }
      });
    } else {
      // EDIT MODE: Conditional API calls based on change flags
      const questionCode = this.selectedQuestion()?.questionCode;
      if (!questionCode) return;

      const requests: any[] = [];

      // Only call updateQuestion if question fields changed
      if (event.questionChanged) {
        requests.push(this.apiService.updateQuestion(questionCode, formData));
      }

      // Only call saveAnswers if answers changed
      if (event.answersChanged) {
        if (['Single', 'Multiple', 'Ranking'].includes(formData.responseType)) {
          requests.push(this.apiService.saveAnswers(questionCode, formData.answerOptions || []));
        } else if (formData.responseType === 'Comment') {
          const commentAnswers = formData.commentConfig?.answerCode
            ? [this.buildCommentAnswer(formData.commentConfig)]
            : [];
          requests.push(this.apiService.saveAnswers(questionCode, commentAnswers));
        }
      }

      // If no API calls needed, just reload
      if (requests.length === 0) {
        this.isSaving.set(false);
        this.loadQuestions(questionCode);
        return;
      }

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          // Show success message from first response
          if (responses?.length > 0 && responses[0]?.success && responses[0]?.message) {
            this.snackbar.showSuccess(responses[0].message);
          }
          this.isSaving.set(false);
          this.loadQuestions(questionCode);
        },
        error: (error) => {
          this.showErrorMessage(error);
          this.isSaving.set(false);
        }
      });
    }
  }

  /**
   * Build a single Answer row from a CommentConfig for saveAnswers()
   */
  private buildCommentAnswer(config: CommentConfig): Answer {
    return {
      sequence: 1,
      answerCode: config.answerCode,
      answerCodeDescription: config.answerDesc,
      effectiveDate: config.effectiveDate,
      terminationDate: config.terminationDate,
      auditKey: 0,
      isEditable: true,
      errors: {}
    };
  }

  /**
   * Extract and display error message from backend response
   */
  private showErrorMessage(error: any): void {
    let message = error?.error?.errorResponse?.error
                || error?.error?.message
                || error?.message;

    if (!message) {
      message = 'An error occurred. Please try again.';
    }

    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
    if (errorCode) {
      message = `Error ${errorCode}: ${message}`;
    }

    this.snackbar.showError(message);
  }

  onCancel(): void {
    // Revert to first question or null
    const questions = this.questions();
    if (questions.length > 0) {
      this.selectQuestionAndLoadAnswers(questions[0]);
    } else {
      this.selectedQuestion.set(null);
    }
  }

  onClearAll(): void {
    console.log('Clear all form fields');
  }

  /**
   * Open/close filter panel using CDK Overlay
   */
  openFilter(): void {
    // Toggle: close if already open
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      return;
    }

    // Position below filter button, right-aligned to sidebar edge
    const btnRect = this.filterBtn.nativeElement.getBoundingClientRect();
    const sidebarRect = this.sidebar.nativeElement.getBoundingClientRect();
    const offsetY = btnRect.bottom - sidebarRect.top;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.sidebar)
      .withPositions([{
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'top',
        offsetY,
      }]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(QaLibraryFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    // Pass current filters
    componentRef.instance.currentFilters = this.appliedFilters();

    // Listen for apply
    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.applyFilters(filters);
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    // Listen for clear all
    componentRef.instance.clearAll.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearFilters();
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    // Listen for close
    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });
  }

  applyFilters(filters: QaLibraryFilters): void {
    this.appliedFilters.set(filters);
    this.applyClientSideFilters();
  }

  clearFilters(): void {
    this.appliedFilters.set(null);
    this.applyClientSideFilters();
  }

  /**
   * Apply client-side filters to all questions
   */
  private applyClientSideFilters(): void {
    let filtered = [...this.allQuestions()];
    const filters = this.appliedFilters();

    if (!filters) {
      this.questions.set(filtered);
      // Auto-select first question if available (skip programmatic clear from createQuestion)
      if (this.formMode !== 'add' && filtered.length > 0 && !this.selectedQuestion()) {
        this.selectQuestionAndLoadAnswers(filtered[0]);
      }
      return;
    }

    // Filter by sex
    if (filters.sex) {
      filtered = filtered.filter(q => q.sex === filters.sex);
    }

    // Filter by response type
    if (filters.responseType) {
      filtered = filtered.filter(q => q.responseType === filters.responseType);
    }

    // Filter by effective date period
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const filterDate = new Date(filters.effectiveDate);
      if (filters.effectiveDatePeriod === 'After') {
        filtered = filtered.filter(q =>
          q.effectiveDate && q.effectiveDate >= filterDate
        );
      } else if (filters.effectiveDatePeriod === 'Before') {
        filtered = filtered.filter(q =>
          q.effectiveDate && q.effectiveDate <= filterDate
        );
      }
    }

    // Filter by termination date period
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const filterDate = new Date(filters.terminationDate);
      if (filters.terminationDatePeriod === 'After') {
        filtered = filtered.filter(q =>
          q.terminationDate && q.terminationDate >= filterDate
        );
      } else if (filters.terminationDatePeriod === 'Before') {
        filtered = filtered.filter(q =>
          q.terminationDate && q.terminationDate <= filterDate
        );
      }
    }

    this.questions.set(filtered);

    // User applied filters while in add mode — exit add mode
    if (this.formMode === 'add') {
      this.formMode = 'edit';
    }

    if (filtered.length === 0) {
      // No results after filtering — clear the right panel
      this.selectedQuestion.set(null);
    } else {
      // Auto-select first result
      this.selectQuestionAndLoadAnswers(filtered[0]);
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
        }
        this.appliedFilters.set(null);
        this.selectedQuestion.set(null);
        this.searchBar?.clearSearch();
        this.loadQuestions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }
}
