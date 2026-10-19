import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { formatTableDate } from '@shared/utils/date-format.util';
import { CancelTestBatchApiService } from './services';
import { WorksheetDto, TestIdDto, UnitDisplayDto } from './models/cancel-test-batch.model';

@Component({
  selector: 'app-cancel-test-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './cancel-test-batch.html',
  styleUrls: ['./cancel-test-batch.scss'],
})
export class CancelTestBatchComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(CancelTestBatchApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  filterForm!: FormGroup;

  worksheets = signal<WorksheetDto[]>([]);
  testIds = signal<TestIdDto[]>([]);
  units = signal<UnitDisplayDto[]>([]);

  worksheetSearchCtrl = new FormControl('');
  testIdSearchCtrl = new FormControl('');

  worksheetSearch = signal('');
  testIdSearch = signal('');

  filteredWorksheets = computed(() => this.filterWorksheetOptions(this.worksheets(), this.worksheetSearch()));
  filteredTestIds = computed(() => this.filterTestIdOptions(this.testIds(), this.testIdSearch()));

  isLoadingWorksheets = signal(false);
  isLoadingTestIds = signal(false);
  isLoadingUnits = signal(false);
  isCancelling = signal(false);

  selectedWorksheetId = signal('');
  unitCount = computed(() => this.units().length);
  hasUnits = computed(() => this.units().length > 0);

  private static readonly FALLBACK_TITLE = 'Cancel Test Batch';
  private static readonly FALLBACK_SUBTITLE = 'Cancel test batches in the holding area before results are loaded into the system.';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: CancelTestBatchComponent.FALLBACK_TITLE, link: null },
    ],
    title: CancelTestBatchComponent.FALLBACK_TITLE,
    subtitle: CancelTestBatchComponent.FALLBACK_SUBTITLE,
  };

  constructor() {
    this.initializeForm();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || CancelTestBatchComponent.FALLBACK_SUBTITLE,
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadWorksheets();
    this.setupSearchControls();
    this.setupWorksheetChange();
    this.setupTestIdChange();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDate(isoDate: string | null | undefined): string {
    return formatTableDate(isoDate);
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      worksheetId: ['', Validators.required],
      testId: ['', Validators.required],
    });
  }

  private setupSearchControls(): void {
    this.worksheetSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.worksheetSearch.set(v || ''));

    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testIdSearch.set(v || ''));
  }

  private loadWorksheets(): void {
    this.isLoadingWorksheets.set(true);
    this.apiService.getWorksheets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingWorksheets.set(false);
          if (response.success) {
            this.worksheets.set(response.item ?? []);
          }
        },
        error: (error) => {
          this.isLoadingWorksheets.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load worksheets'),
          );
        },
      });
  }

  private setupWorksheetChange(): void {
    this.filterForm.get('worksheetId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((worksheetId) => {
        this.filterForm.get('testId')!.reset('');
        this.testIdSearchCtrl.setValue('');
        this.units.set([]);
        this.testIds.set([]);
        this.selectedWorksheetId.set(worksheetId || '');

        if (worksheetId) {
          this.loadTestIds(worksheetId);
        }
      });
  }

  private setupTestIdChange(): void {
    this.filterForm.get('testId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId) => {
        this.units.set([]);
        const worksheetId = this.filterForm.get('worksheetId')!.value;

        if (worksheetId && testId) {
          this.loadUnits(worksheetId);
        }
      });
  }

  private loadTestIds(worksheetId: string): void {
    this.isLoadingTestIds.set(true);
    this.apiService.getTestIds(worksheetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingTestIds.set(false);
          if (response.success) {
            const tests = response.item ?? [];
            this.testIds.set(tests);
            if (tests.length === 1) {
              this.filterForm.get('testId')!.setValue(tests[0].testId);
            }
          }
        },
        error: (error) => {
          this.isLoadingTestIds.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load test IDs'),
          );
        },
      });
  }

  private loadUnits(worksheetId: string): void {
    this.isLoadingUnits.set(true);
    this.apiService.getUnitsInBatch(worksheetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingUnits.set(false);
          if (response.success) {
            this.units.set(response.item ?? []);
          }
        },
        error: (error) => {
          this.isLoadingUnits.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load units'),
          );
        },
      });
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.worksheetSearchCtrl.setValue('');
    this.testIdSearchCtrl.setValue('');
    this.worksheets.set([]);
    this.testIds.set([]);
    this.units.set([]);
    this.selectedWorksheetId.set('');
    this.loadWorksheets();
  }

  onCancelBatch(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Are you sure you want to cancel the batch?',
      message: 'This batch will be canceled and removed from the active holding workflow. Results that have not been loaded will not be processed.',
      confirmText: 'YES, CANCEL THE BATCH',
      cancelText: 'NO, GO BACK',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === true) {
          this.executeCancelBatch();
        }
      });
  }

  private executeCancelBatch(): void {
    const tbId = this.filterForm.get('worksheetId')!.value;
    const testId = this.filterForm.get('testId')!.value;

    this.isCancelling.set(true);
    this.apiService.cancelBatch({ tbId, testId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isCancelling.set(false);
          if (response.success) {
            this.snackbarService.showSuccess(`Test Batch ${tbId} canceled successfully`);
            this.onClearAll();
          } else {
            this.snackbarService.showError(
              response.errorResponse?.error || response.message || 'Failed to cancel batch',
            );
          }
        },
        error: (error) => {
          this.isCancelling.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to cancel batch'),
          );
        },
      });
  }

  private filterWorksheetOptions(options: WorksheetDto[], search: string): WorksheetDto[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.tbId?.toLowerCase().includes(q));
  }

  private filterTestIdOptions(options: TestIdDto[], search: string): TestIdDto[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.testId?.toLowerCase().includes(q) ||
      o.testDesc?.toLowerCase().includes(q),
    );
  }
}
