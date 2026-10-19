import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, switchMap, catchError, of, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { ViewResponsesService } from './services/view-responses.service';
import { HeaderService } from '@shared/services/header.service';
import {
  ResponseSummary,
  ResponseAnswer,
  ResponseDonor,
  ResponseComment
} from './models/view-responses.model';

interface RankDetail {
  rankCode: string;
  rankLabel: string;
  rankCount: number;
}

interface RankedAnswer {
  answerCode: string;
  answerDesc: string | null;
  weightedScore: number;
  allRanks: RankDetail[];
  ranks: RankDetail[];
  barWidth: number;
}

@Component({
  selector: 'app-view-responses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    DataTable
  ],
  templateUrl: './view-responses.html',
  styleUrls: ['./view-responses.scss']
})
export class ViewResponsesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private answerClick$ = new Subject<{ question: ResponseSummary; answer: ResponseAnswer }>();

  readonly barColor = '#CB4E0D';

  getBarColor(_index: number): string {
    return this.barColor;
  }

  chapterId = '';
  templateId = '';
  pageTitle = '';
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  // Data
  summaryData: ResponseSummary[] = [];
  filteredQuestions: ResponseSummary[] = [];
  donors: ResponseDonor[] = [];
  filteredDonors: ResponseDonor[] = [];
  comments: ResponseComment[] = [];

  // Selection
  selectedQuestion: ResponseSummary | null = null;
  selectedAnswer: ResponseAnswer | null = null;
  selectedStatQuestion: ResponseSummary | null = null;

  // Tab
  activeTab: 'answers' | 'statistics' = 'answers';

  // Loading
  isLoading = false;
  isDonorsLoading = false;
  isCommentsLoading = false;

  // Search bar configs
  questionSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Question or Answer Description',
    minLength: 2,
    ariaLabel: 'Search questions or answer descriptions',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  donorSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Name',
    minLength: 2,
    ariaLabel: 'Search donors by name',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  donorTableConfig: DataTableConfig<ResponseDonor> = {
    columns: [
      { key: 'donorId', header: 'Donor ID', sortable: true },
      { key: 'donorName', header: 'Name', sortable: false },
      { key: 'gender', header: 'Gender', sortable: false,
        valueFormatter: (value) => value === 'M' ? 'Male' : value === 'F' ? 'Female' : '-' },
      { key: 'age', header: 'Age', sortable: false,
        valueFormatter: (value) => value ?? '-' }
    ],
    sortConfig: { column: 'donorId', direction: 'A' },
    showPagination: false,
    enableRowHighlight: false,
    noDataIcon: 'edit',
    emptyMessage: 'No donors found for this answer',
    showTableOnEmpty: true
  };
  statisticsSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Question',
    minLength: 2,
    ariaLabel: 'Search questions for statistics',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Left filter state (By Answers tab)
  leftFilterSex = '';
  leftFilterResponseType = '';
  questionSearchText = '';
  showLeftFilterPanel = false;
  leftFilterForm = new FormGroup({
    sex: new FormControl<string | null>(null),
    responseType: new FormControl<string | null>(null)
  });
  leftFilterChips: FilterChip[] = [];

  // Right filter state
  rightFilterSex = '';
  donorSearchText = '';
  showRightFilterPanel = false;
  rightFilterForm = new FormGroup({
    sex: new FormControl<string | null>(null)
  });
  rightFilterChips: FilterChip[] = [];

  // Statistics
  statisticsSearchText = '';
  filteredStatQuestions: ResponseSummary[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private viewResponsesService: ViewResponsesService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.subscribeToChapterChanges();

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.chapterId = params['chapterId'] || '';
        this.templateId = params['templateId'] || '';
        this.pageTitle = `Responses - ${this.templateId}`;
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: 'Donor Survey Manager', link: '/donor-functions/donor-survey-manager/survey-template' },
            { label: 'Responses', link: null }
          ],
          title: '',
          subtitle: ''
        };
        this.loadSummaryData();
      });

    // Race-condition-safe answer click handler
    this.answerClick$.pipe(
      switchMap(({ question, answer }) => {
        this.isDonorsLoading = true;
        this.donors = [];
        this.filteredDonors = [];
        return this.viewResponsesService.getResponseDonors(
          this.chapterId, this.templateId, question.questionCode, answer.answerCode
        ).pipe(catchError(() => of({ data: [] as ResponseDonor[] })));
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.donors = res.data;
      this.applyDonorFilters();
      this.isDonorsLoading = false;
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chapterId = this.headerService.chapterId() || '';
        this.questionSearchText = '';
        this.donorSearchText = '';
        this.statisticsSearchText = '';
        this.leftFilterSex = '';
        this.leftFilterResponseType = '';
        this.leftFilterChips = [];
        this.rightFilterSex = '';
        this.rightFilterChips = [];
        this.showLeftFilterPanel = false;
        this.showRightFilterPanel = false;
        this.leftFilterForm.reset();
        this.rightFilterForm.reset();
        this.loadSummaryData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Loading ---

  private loadSummaryData(): void {
    this.isLoading = true;
    this.viewResponsesService.getResponseSummary(this.chapterId, this.templateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.summaryData = res.data;
          this.filteredQuestions = [...this.summaryData];
          this.filteredStatQuestions = [...this.summaryData];
          this.isLoading = false;
          this.autoSelectFirstItems();
        },
        error: () => {
          this.summaryData = [];
          this.filteredQuestions = [];
          this.filteredStatQuestions = [];
          this.isLoading = false;
        }
      });
  }

  // --- Tab ---

  setActiveTab(tab: 'answers' | 'statistics'): void {
    this.activeTab = tab;
    this.selectedQuestion = null;
    this.selectedAnswer = null;
    this.selectedStatQuestion = null;
    this.donors = [];
    this.filteredDonors = [];
    this.comments = [];
    this.autoSelectFirstItems();
  }

  private autoSelectFirstItems(): void {
    if (this.activeTab === 'answers' && this.filteredQuestions.length > 0) {
      const firstQuestion = this.filteredQuestions[0];
      if (firstQuestion.answers.length > 0) {
        this.onAnswerClick(firstQuestion, firstQuestion.answers[0]);
      }
    } else if (this.activeTab === 'statistics' && this.filteredStatQuestions.length > 0) {
      this.onStatQuestionClick(this.filteredStatQuestions[0]);
    }
  }

  // --- By Answers: Answer Click ---

  onAnswerClick(question: ResponseSummary, answer: ResponseAnswer): void {
    this.selectedQuestion = question;
    this.selectedAnswer = answer;
    this.comments = [];
    this.answerClick$.next({ question, answer });
  }

  isAnswerSelected(question: ResponseSummary, answer: ResponseAnswer): boolean {
    return this.selectedQuestion?.questionCode === question.questionCode
      && this.selectedAnswer?.answerCode === answer.answerCode;
  }

  // --- Statistics: Question Click ---

  onStatQuestionClick(question: ResponseSummary): void {
    this.selectedStatQuestion = question;
    this.comments = [];

    if (question.responseType === 'C') {
      this.isCommentsLoading = true;
      this.viewResponsesService.getResponseComments(
        this.chapterId, this.templateId, question.questionCode
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.comments = res.data;
          this.isCommentsLoading = false;
        },
        error: () => {
          this.comments = [];
          this.isCommentsLoading = false;
        }
      });
    }
  }

  isStatQuestionSelected(question: ResponseSummary): boolean {
    return this.selectedStatQuestion?.questionCode === question.questionCode;
  }

  // --- Left Filter (By Answers) ---

  get isLeftApplyDisabled(): boolean {
    if (!this.leftFilterForm) return true;
    const v = this.leftFilterForm.value;
    const isEmpty = !v.sex && !v.responseType;
    return isEmpty || !this.leftFilterForm.dirty;
  }

  toggleLeftFilterPanel(): void {
    this.showLeftFilterPanel = !this.showLeftFilterPanel;
    if (this.showLeftFilterPanel) {
      this.leftFilterForm.patchValue({
        sex: this.leftFilterSex || null,
        responseType: this.leftFilterResponseType || null
      });
      this.leftFilterForm.markAsPristine();
    }
  }

  applyLeftFilter(): void {
    const v = this.leftFilterForm.value;
    this.leftFilterSex = v.sex || '';
    this.leftFilterResponseType = v.responseType || '';
    this.buildLeftFilterChips();
    this.applyQuestionFilters();
    this.showLeftFilterPanel = false;
  }

  private applyQuestionFilters(): void {
    this.filteredQuestions = this.summaryData.filter(q => {
      if (this.leftFilterSex && q.gender !== this.leftFilterSex) {
        return false;
      }
      if (this.leftFilterResponseType && q.responseType !== this.leftFilterResponseType) {
        return false;
      }
      if (this.questionSearchText) {
        const text = this.questionSearchText.toLowerCase();
        return q.questionDesc.toLowerCase().includes(text) ||
          q.answers.some(a =>
            a.answerDesc?.toLowerCase().includes(text) ||
            a.answerCode.toLowerCase().includes(text)
          );
      }
      return true;
    });

    // If the currently selected question is no longer in filtered results, clear right panel
    if (this.selectedQuestion && !this.filteredQuestions.some(q => q.questionCode === this.selectedQuestion?.questionCode)) {
      this.selectedQuestion = null;
      this.selectedAnswer = null;
      this.donors = [];
      this.filteredDonors = [];
    }
  }

  buildLeftFilterChips(): void {
    this.leftFilterChips = [];
    if (this.leftFilterSex) {
      const sexLabels: Record<string, string> = { A: 'All', M: 'Male', F: 'Female' };
      const label = sexLabels[this.leftFilterSex] || this.leftFilterSex;
      this.leftFilterChips.push({ key: 'sex', label: 'Sex', value: label });
    }
    if (this.leftFilterResponseType) {
      const labels: Record<string, string> = { S: 'Single', M: 'Multiple', C: 'Comment', R: 'Ranking' };
      this.leftFilterChips.push({ key: 'responseType', label: 'Response Type', value: labels[this.leftFilterResponseType] || '' });
    }
  }

  onLeftChipRemove(key: string): void {
    if (key === 'sex') this.leftFilterSex = '';
    if (key === 'responseType') this.leftFilterResponseType = '';
    this.leftFilterForm.patchValue({ [key]: null });
    this.buildLeftFilterChips();
    this.applyQuestionFilters();
  }

  onLeftClearAllChips(): void {
    this.leftFilterSex = '';
    this.leftFilterResponseType = '';
    this.leftFilterForm.reset();
    this.leftFilterChips = [];
    this.applyQuestionFilters();
  }

  clearLeftFilters(): void {
    this.leftFilterForm.reset();
  }

  onQuestionSearchChange(searchText: string): void {
    this.questionSearchText = searchText;
    this.applyQuestionFilters();
    if (!searchText && !this.selectedQuestion && this.filteredQuestions.length > 0) {
      this.autoSelectFirstItems();
    }
  }

  // --- Right Filter (Donors) ---

  get isRightApplyDisabled(): boolean {
    if (!this.rightFilterForm) return true;
    const v = this.rightFilterForm.value;
    const isEmpty = !v.sex;
    return isEmpty || !this.rightFilterForm.dirty;
  }

  toggleRightFilterPanel(): void {
    this.showRightFilterPanel = !this.showRightFilterPanel;
    if (this.showRightFilterPanel) {
      this.rightFilterForm.patchValue({
        sex: this.rightFilterSex || null
      });
      this.rightFilterForm.markAsPristine();
    }
  }

  applyRightFilter(): void {
    const v = this.rightFilterForm.value;
    this.rightFilterSex = v.sex || '';
    this.buildRightFilterChips();
    this.applyDonorFilters();
    this.showRightFilterPanel = false;
  }

  applyDonorFilters(): void {
    this.filteredDonors = this.donors.filter(d => {
      if (this.rightFilterSex && d.gender !== this.rightFilterSex) {
        return false;
      }
      if (this.donorSearchText) {
        const text = (this.donorSearchText || '').toLowerCase();
        return d.donorName.toLowerCase().includes(text);
      }
      return true;
    });
  }

  buildRightFilterChips(): void {
    this.rightFilterChips = [];
    if (this.rightFilterSex) {
      const sexLabels: Record<string, string> = { A: 'All', M: 'Male', F: 'Female' };
      const label = sexLabels[this.rightFilterSex] || this.rightFilterSex;
      this.rightFilterChips.push({ key: 'sex', label: 'Sex', value: label });
    }
  }

  onRightChipRemove(key: string): void {
    if (key === 'sex') this.rightFilterSex = '';
    this.rightFilterForm.patchValue({ [key]: null });
    this.buildRightFilterChips();
    this.applyDonorFilters();
  }

  onRightClearAllChips(): void {
    this.rightFilterSex = '';
    this.rightFilterForm.reset();
    this.rightFilterChips = [];
    this.applyDonorFilters();
  }

  clearRightFilters(): void {
    this.rightFilterForm.reset();
  }

  onDonorSearchChange(searchText: string): void {
    this.donorSearchText = searchText;
    this.applyDonorFilters();
  }

  onDonorSortChange(event: TableSortEvent): void {
    this.donorTableConfig.sortConfig!.column = event.column;
    this.donorTableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.applyDonorFilters();
      return;
    }

    const dir = event.direction === 'A' ? 1 : -1;
    this.filteredDonors = [...this.filteredDonors].sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[event.column] ?? '';
      const valB = (b as any)[event.column] ?? '';
      return valA < valB ? -dir : valA > valB ? dir : 0;
    });
  }

  // --- Statistics Search ---

  onStatisticsSearchChange(searchText: string): void {
    this.statisticsSearchText = searchText;
    if (!this.statisticsSearchText) {
      this.filteredStatQuestions = [...this.summaryData];
      if (!this.selectedStatQuestion && this.filteredStatQuestions.length > 0) {
        this.onStatQuestionClick(this.filteredStatQuestions[0]);
      }
      return;
    }
    const text = this.statisticsSearchText.toLowerCase();
    this.filteredStatQuestions = this.summaryData.filter(q =>
      q.questionDesc.toLowerCase().includes(text)
    );

    // If the currently selected question is no longer in filtered results, clear right panel
    if (this.selectedStatQuestion && !this.filteredStatQuestions.some(q => q.questionCode === this.selectedStatQuestion?.questionCode)) {
      this.selectedStatQuestion = null;
      this.comments = [];
    }
  }

  // --- Bar Chart Helpers (Statistics) ---

  getTotalCount(question: ResponseSummary): number {
    return question.totalRespondents;
  }

  getPercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  getBarWidth(count: number, maxCount: number): number {
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  // --- Ranking Chart ---

  getRankedAnswers(question: ResponseSummary): RankedAnswer[] {
    const totalOptions = question.answers.length;

    const ranked = question.answers.map(answer => {
      const rankMap = new Map<string, number>();
      (answer.rankDistribution || []).forEach(r => rankMap.set(r.rankCode, r.rankCount));

      // Build all ranks 1..N, filling 0 for missing
      const allRanks = Array.from({ length: totalOptions }, (_, i) => {
        const rankNum = i + 1;
        const code = String(rankNum);
        return {
          rankCode: code,
          rankLabel: this.getOrdinal(rankNum),
          rankCount: rankMap.get(code) || 0
        };
      });

      const weightedScore = allRanks.reduce((sum, r) => {
        const rankNum = parseInt(r.rankCode, 10);
        const points = Math.max(totalOptions - rankNum + 1, 1);
        return sum + (points * r.rankCount);
      }, 0);

      return {
        answerCode: answer.answerCode,
        answerDesc: answer.answerDesc,
        weightedScore,
        allRanks,
        ranks: allRanks.filter(r => r.rankCount > 0),
        barWidth: 0
      };
    });

    // Perfect score = everyone ranks this option 1st = totalOptions points × total responses
    const totalResponses = ranked.length > 0
      ? Math.max(...ranked.map(r => r.ranks.reduce((s: number, rk: RankDetail) => s + rk.rankCount, 0)), 1)
      : 1;
    const perfectScore = totalOptions * totalResponses;
    ranked.forEach(r => r.barWidth = perfectScore > 0 ? (r.weightedScore / perfectScore) * 100 : 0);
    ranked.sort((a, b) => b.weightedScore - a.weightedScore);

    return ranked;
  }

  private getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // --- Answer Label ---

  getAnswerLabel(question: ResponseSummary, answer: ResponseAnswer): string {
    return question.responseType === 'C' ? 'Comment Type' : (answer.answerDesc || answer.answerCode);
  }

  // --- Question Type Icon ---

  getTypeIconPath(responseType: string): string {
    switch (responseType) {
      case 'M': return 'assets/images/icons/type-multiple.svg';
      case 'C': return 'assets/images/icons/type-comment.svg';
      case 'R': return 'assets/images/icons/type-ranking.svg';
      case 'S':
      default: return 'assets/images/icons/type-single.svg';
    }
  }

  getQuestionTypeLabel(responseType: string): string {
    switch (responseType) {
      case 'S': return 'Single Select';
      case 'M': return 'Multiple Select';
      case 'C': return 'Comment';
      case 'R': return 'Ranking';
      default: return 'Unknown';
    }
  }

  // --- Gender Icon ---

  getGenderIconPath(gender: string): string {
    switch (gender) {
      case 'M': return 'assets/images/icons/gender-male.svg';
      case 'F': return 'assets/images/icons/gender-female.svg';
      case 'A':
      default: return 'assets/images/icons/gender-all.svg';
    }
  }

  getGenderLabel(gender: string): string {
    switch (gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'A':
      default: return 'All Genders';
    }
  }

  // --- Navigation ---

  goBack(): void {
    this.router.navigate(['/donor-functions/donor-survey-manager/survey-template']);
  }
}
