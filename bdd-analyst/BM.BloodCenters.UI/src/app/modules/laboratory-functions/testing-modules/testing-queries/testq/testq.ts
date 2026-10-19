import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { formatTableDate, formatTableDateTime } from '@shared/utils/date-format.util';

import { TestqApiService } from './services/testq-api.service';
import { AllTestsForUnitQueryDto, UtrsTestDto, UnitTestBaseDto } from './models/testq.model';
import { UnitAttributesInterdictionsDialogComponent } from './unit-attributes-interdictions-dialog/unit-attributes-interdictions-dialog';

@Component({
  selector: 'app-testq',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './testq.html',
  styleUrl: './testq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TestqComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `testq-${TestqComponent.nextId++}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly apiService = inject(TestqApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'All Tests for a Unit Query', link: null },
    ],
    title: 'All Tests for a Unit Query',
    subtitle: 'View all scheduled, unscheduled, cancelled tests, results, and interpretations for a selected unit.',
  };

  protected readonly isLoading = signal<boolean>(false);
  protected readonly unitId = signal<string>('');
  protected readonly collectionDate = signal<string>('');
  protected readonly collectionDates = signal<string[]>([]);
  protected readonly hasMultipleDates = computed(() => this.collectionDates().length > 1);
  protected readonly hasResults = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly scheduledTests = signal<UtrsTestDto[]>([]);
  protected readonly unscheduledTests = signal<UnitTestBaseDto[]>([]);
  protected readonly expandedRows = signal<Set<string>>(new Set());

  protected readonly scheduledPageSize = signal<number>(10);
  protected readonly scheduledPageIndex = signal<number>(0);
  protected readonly scheduledPagedData = computed(() => {
    const data = this.scheduledTests();
    const pageSize = this.scheduledPageSize();
    const pageIndex = this.scheduledPageIndex();
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  });

  protected readonly unscheduledPageSize = signal<number>(10);
  protected readonly unscheduledPageIndex = signal<number>(0);
  protected readonly unscheduledPagedData = computed(() => {
    const data = this.unscheduledTests();
    const pageSize = this.unscheduledPageSize();
    const pageIndex = this.unscheduledPageIndex();
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  });

  protected readonly hasScheduledTests = computed(() => this.scheduledTests().length > 0);
  protected readonly hasUnscheduledTests = computed(() => this.unscheduledTests().length > 0);
  protected readonly isEmpty = computed(() => !this.hasScheduledTests() && !this.hasUnscheduledTests());
  protected readonly collectionDateDisplay = computed(() => {
    const date = this.collectionDate();
    return date ? formatTableDate(date) : '-';
  });

  displayedColumns = ['expand', 'can', 'si', 'testId', 'sq', 'resultCode1', 'resultDescription', 'testBatchId', 'absValChan', 'ratio'];

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['unitId'] && !this.unitId()) {
          this.unitId.set(params['unitId']);
          this.fetchCollectionDatesAndSearch();
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clear();
      });
  }

  ngAfterViewInit(): void {
    this.unitIdField?.unitIdControl.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.unitIdField?.validationState === 'invalid' && this.hasResults()) {
          this.clear(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  onUnitIdValidated(unitData: UnitValidationResponse): void {
    if (unitData.parsedUnitId) {
      this.unitId.set(unitData.parsedUnitId);
      this.fetchCollectionDatesAndSearch();
    }
  }

  onUnitIdCleared(): void {
    this.clear(false);
  }

  onCollectionDateSelected(date: string): void {
    this.collectionDate.set(date);
    this.searchTests();
  }

  private fetchCollectionDatesAndSearch(): void {
    const unitId = this.unitId();
    if (!unitId) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.apiService
      .getCollectionDates(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          const dateValues = dates.map((d) => d.collDate);
          this.collectionDates.set(dateValues);

          if (dateValues.length === 1) {
            this.collectionDate.set(dateValues[0]);
            this.searchTests();
          } else if (dateValues.length > 1) {
            this.collectionDate.set(dateValues[0]);
            this.searchTests();
          } else {
            this.searchTests();
          }
        },
        error: () => {
          this.searchTests();
        },
      });
  }

  private searchTests(): void {
    const unitId = this.unitId();
    if (!unitId) return;

    this.isLoading.set(true);
    this.error.set(null);

    const request: AllTestsForUnitQueryDto = {
      unitId,
      collDate: this.collectionDate() || undefined,
      chapterId: this.headerService.getCurrentChapterId() || undefined,
    };

    forkJoin({
      scheduled: this.apiService.searchAllTestsForUnit(request),
      unscheduled: this.apiService.searchUnscheduledTestsForUnit(request),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ scheduled, unscheduled }) => {
          this.scheduledTests.set(scheduled.utrsTests || []);
          this.unscheduledTests.set(unscheduled.unitTestBaseTests || []);
          const totalCount = (scheduled.utrsTests?.length ?? 0) + (unscheduled.unitTestBaseTests?.length ?? 0);
          this.hasResults.set(totalCount > 0);

          if (!this.collectionDate() && scheduled.utrsTests?.length > 0) {
            this.collectionDate.set(scheduled.utrsTests[0].collDate || '');
          }

          if (totalCount === 0) {
            this.snackbarService.showInfo('No test data found for this unit.');
          }

          this.isLoading.set(false);
        },
        error: (err) => {
          const errorMsg = HttpErrorHandler.extractErrorMessage(err, 'An error occurred while searching.');
          this.snackbarService.showError(errorMsg);
          this.isLoading.set(false);
          this.hasResults.set(false);
        },
      });
  }

  clear(clearInput = true): void {
    this.unitId.set('');
    this.collectionDate.set('');
    this.collectionDates.set([]);
    this.scheduledTests.set([]);
    this.unscheduledTests.set([]);
    this.hasResults.set(false);
    this.error.set(null);
    this.expandedRows.set(new Set());
    this.scheduledPageIndex.set(0);
    this.unscheduledPageIndex.set(0);

    if (clearInput && this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  openAttributesInterdictionsDialog(): void {
    const unitId = this.unitId();
    if (!unitId) return;

    this.dialog.open(UnitAttributesInterdictionsDialogComponent, {
      width: '80vw',
      maxWidth: '1200px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0' },
      panelClass: 'side-panel-dialog',
      hasBackdrop: false,
      data: {
        unitId,
        collectionDate: this.collectionDate(),
      },
      disableClose: false,
      autoFocus: true,
    });
  }

  toggleRow(row: UtrsTestDto | UnitTestBaseDto): void {
    const rowId = this.getRowId(row);
    const newExpanded = new Set(this.expandedRows());

    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }

    this.expandedRows.set(newExpanded);
  }

  isRowExpanded(row: UtrsTestDto | UnitTestBaseDto): boolean {
    return this.expandedRows().has(this.getRowId(row));
  }

  private getRowId(row: UtrsTestDto | UnitTestBaseDto): string {
    return `${row.unitId}-${row.testId}-${row.testSeqNo}`;
  }

  formatDateValue(value: string | null | undefined): string {
    return formatTableDate(value);
  }

  formatDateTimeValue(value: string | null | undefined): string {
    return formatTableDateTime(value);
  }

  getResultDescription(row: UtrsTestDto | UnitTestBaseDto): string {
    if (row.resultStatus1Desc) return row.resultStatus1Desc;
    if (!row.resultStatus1) return '';
    return row.resultStatus1;
  }

  onScheduledPageChange(event: PageEvent): void {
    this.scheduledPageSize.set(event.pageSize);
    this.scheduledPageIndex.set(event.pageIndex);
  }

  onUnscheduledPageChange(event: PageEvent): void {
    this.unscheduledPageSize.set(event.pageSize);
    this.unscheduledPageIndex.set(event.pageIndex);
  }
}
