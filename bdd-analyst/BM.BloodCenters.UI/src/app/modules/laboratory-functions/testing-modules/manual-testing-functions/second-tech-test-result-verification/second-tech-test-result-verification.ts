import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatInputModule } from '@angular/material/input';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SecondTechTestResultVerificationApiService } from './services';
import {
  TbWsOption,
  TestIdOption,
  ResultCodeOption,
  SecondTechTestResultRow
} from './models';

@Component({
  selector: 'app-second-tech-test-result-verification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './second-tech-test-result-verification.html',
  styleUrls: ['./second-tech-test-result-verification.scss']
})
export class SecondTechTestResultVerificationComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `second-tech-test-result-${SecondTechTestResultVerificationComponent.nextId++}`;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(SecondTechTestResultVerificationApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly pageHeaderService = inject(PageHeaderService);

  filterForm!: FormGroup;

  // Search controls for dropdown filter boxes
  tbIdSearchControl = new FormControl('');
  testIdSearchControl = new FormControl('');
  private readonly tbIdSearchText = signal('');
  private readonly testIdSearchText = signal('');
  private readonly selectedTestId = signal('');

  // Dropdown options
  tbWsOptions = signal<TbWsOption[]>([]);
  testIdOptions = signal<TestIdOption[]>([]);
  resultCodes = signal<ResultCodeOption[]>([]);

  // Filtered options (driven by search box inputs)
  filteredTbWsOptions = computed(() => {
    const search = this.tbIdSearchText();
    const options = this.tbWsOptions();
    if (!search) return options;
    return options.filter(o =>
      o.tbId?.toLowerCase().includes(search) ||
      o.testId?.toLowerCase().includes(search)
    );
  });

  filteredTestIdOptions = computed(() => {
    const search = this.testIdSearchText();
    const options = this.testIdOptions();
    if (!search) return options;
    return options.filter(o =>
      o.testId?.toLowerCase().includes(search) ||
      o.testDesc?.toLowerCase().includes(search)
    );
  });

  // Loading states
  isLoadingDropdowns = signal(false);
  isLoadingTestIds = signal(false);
  isSearching = signal(false);
  isSaving = signal(false);

  // Table data
  testResults = signal<SecondTechTestResultRow[]>([]);
  hasSearched = signal(false);

  // Go To navigation
  goToSequence: number | null = null;
  highlightedSeq = signal<number | null>(null);

  // Sentinel values for mat-option states
  readonly selectPanelLoadingValue = '__SELECT_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__SELECT_PANEL_EMPTY__';

  // Computed
  hasResults = computed(() => this.hasSearched() && this.testResults().length > 0);
  canSave = computed(() => this.hasResults() && !this.isSaving() && !this.isSearching());

  testDescription = computed(() => {
    const testId = this.selectedTestId();
    const found = this.testIdOptions().find(t => t.testId === testId);
    return found?.testDesc || '-';
  });

  pageHeaderConfig: PageHeaderConfig = this.buildPageHeaderConfig();

  private buildPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Second Tech Test Result Verification';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ]
    };
  }

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupAutoSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      tbId: ['', Validators.required],
      testId: ['', Validators.required]
    });
  }

  private loadInitialData(): void {
    this.isLoadingDropdowns.set(true);

    this.apiService.getTbWsOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tbWsOptions.set(data);
          this.isLoadingDropdowns.set(false);
        },
        error: (err) => {
          this.handleError('Failed to load Test Batch options', err);
          this.isLoadingDropdowns.set(false);
        }
      });
  }

  private loadResultCodes(testId: string): void {
    // antigenFlag defaults to 'N' (regular tests); antigen tests are excluded per API design
    this.apiService.getResultCodes(testId, 'N')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.resultCodes.set(data),
        error: (err) => this.handleError('Failed to load Result Code options', err)
      });
  }

  private setupAutoSearch(): void {
    this.tbIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.tbIdSearchText.set(val?.toLowerCase() ?? ''));

    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.testIdSearchText.set(val?.toLowerCase() ?? ''));

    this.filterForm.get('tbId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tbId: string) => {
        this.filterForm.get('testId')!.reset('');
        this.testIdSearchControl.setValue('');
        this.clearResults();
        if (tbId) {
          this.loadTestIds(tbId);
        } else {
          this.testIdOptions.set([]);
        }
      });

    this.filterForm.get('testId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId: string) => {
        this.selectedTestId.set(testId || '');
        if (testId && this.filterForm.get('tbId')!.value && !this.isSearching()) {
          this.loadResultCodes(testId);
          this.search();
        } else if (!testId) {
          this.resultCodes.set([]);
          this.clearResults();
        }
      });
  }

  private loadTestIds(tbId: string): void {
    this.isLoadingTestIds.set(true);
    this.apiService.getTestIdOptions(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testIdOptions.set(data);
          this.isLoadingTestIds.set(false);
        },
        error: (err) => {
          this.handleError('Failed to load Test ID options', err);
          this.isLoadingTestIds.set(false);
        }
      });
  }

  private search(): void {
    const { tbId, testId } = this.filterForm.getRawValue();
    this.isSearching.set(true);

    this.apiService.searchTestResults(tbId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.testResults.set(response.results);
          this.hasSearched.set(true);
          this.isSearching.set(false);
          this.goToSequence = null;
          this.highlightedSeq.set(null);
        },
        error: (err) => {
          this.handleError('Failed to load test results', err);
          this.isSearching.set(false);
          this.hasSearched.set(true);
        }
      });
  }

  onResultCodeChange(row: SecondTechTestResultRow, code: string): void {
    const found = this.resultCodes().find(rc => rc.resultStatus === code);
    row.resultCodeDesc2 = found?.codeDesc || '';
  }

  onGoTo(): void {
    const seq = Number(this.goToSequence);
    if (!seq || seq < 1) {
      this.snackbarService.showError('Please enter a valid sequence number greater than 0');
      return;
    }
    const row = this.testResults().find(r => r.tbSeqNo === seq);
    if (!row) {
      this.snackbarService.showError('Sequence number not found in current results');
      return;
    }
    this.highlightedSeq.set(seq);
    const el = document.getElementById(`row-seq-${seq}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async onSave(): Promise<void> {
    if (!this.hasResults()) {
      this.snackbarService.showError('No results to save');
      return;
    }

    const results = this.testResults();
    const validation = this.apiService.validateResults(results);

    if (validation.hasWarnings) {
      const proceed = await this.showWarningDialog(validation.warnings[0]);
      if (!proceed) return;
    }

    this.executeSave();
  }

  private showWarningDialog(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const data: ConfirmActionDialogData = {
        title: 'Warning',
        message,
        confirmText: 'Yes',
        cancelText: 'No'
      };
      this.dialog.open(ConfirmActionDialogComponent, {
        width: '500px',
        data,
        disableClose: true
      }).afterClosed().subscribe(result => resolve(result === true));
    });
  }

  private executeSave(): void {
    this.isSaving.set(true);

    const { tbId, testId } = this.filterForm.getRawValue();
    const request = {
      tbId,
      testId,
      results: this.testResults(),
      loggedInUserName: this.loginService.getStoredUsername() || '',
      chapterId: this.headerService.getCurrentChapterId() || ''
    };

    this.apiService.saveTestResults(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          if (response.success) {
            if (response.hasDiscrepancy) {
              this.showDiscrepancyMessage();
            } else {
              this.clearForm();
            }
          } else {
            this.snackbarService.showError(response.message || 'Failed to save test results');
          }
        },
        error: (err) => {
          this.handleError('Failed to save test results', err);
          this.isSaving.set(false);
        }
      });
  }

  private showDiscrepancyMessage(): void {
    const data: MessageDialogData = {
      title: 'Message',
      message: 'Msg:9301: Result discrepancy must be reconciled by supervisor!',
      primaryAction: { label: 'EXIT', action: 'exit' }
    };
    this.dialog.open(MessageDialog, {
      width: '500px',
      data,
      disableClose: true
    }).afterClosed().subscribe(() => this.clearForm());
  }

  onExit(): void {
    this.clearForm();
  }

  private clearForm(): void {
    this.filterForm.reset();
    this.clearResults();
    this.testIdOptions.set([]);
    this.selectedTestId.set('');
    this.tbIdSearchControl.setValue('');
    this.testIdSearchControl.setValue('');
    this.goToSequence = null;
    this.highlightedSeq.set(null);
  }

  private clearResults(): void {
    this.testResults.set([]);
    this.hasSearched.set(false);
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.snackbarService.showError(message);
  }

  getFormControl(name: string) {
    return this.filterForm.get(name);
  }
}
