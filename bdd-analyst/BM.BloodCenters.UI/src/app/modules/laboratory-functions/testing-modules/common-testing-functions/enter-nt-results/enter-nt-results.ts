import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { NtResultsService } from './services/nt-results.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import {
  NtBatchDto,
  ValidTestDto,
  TestGroupDto,
  ProcessedUnit
} from './models/nt-results.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';

@Component({
  selector: 'app-enter-nt-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  templateUrl: './enter-nt-results.html',
  styleUrl: './enter-nt-results.scss'
})
export class EnterNtResultsComponent implements OnInit, OnDestroy {
  private readonly ntResultsService = inject(NtResultsService);
  private readonly snackbarService = inject(SnackbarService);
  protected readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  private destroy$ = new Subject<void>();

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const phData = this.pageHeaderService.pageHeaderData();
    const title = phData?.title ?? "Enter 'NT' Results";
    return {
      title,
      subtitle: phData?.subtitle ?? '',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title },
      ]
    };
  });

  protected readonly validTests = signal<ValidTestDto[]>([]);
  protected readonly testGroups = signal<TestGroupDto[]>([]);
  protected readonly selectedTests = signal<ValidTestDto[]>([]);
  protected readonly processedUnits = signal<ProcessedUnit[]>([]);
  protected readonly currentBatch = signal<NtBatchDto | null>(null);

  protected readonly loading = signal(false);
  protected readonly processingUnit = signal(false);
  protected readonly testsLoading = signal(false);

  protected readonly collectionDate = signal<string>('');
  protected readonly showSelectTestsDialog = signal(false);
  protected readonly validatingTestId = signal(false);

  // Direct test entry control
  protected readonly directTestIdCtrl = new FormControl('');

  // Dialog sort state
  protected readonly dialogSortDirection = signal<'asc' | 'desc' | null>('asc');

  // Selected group description for dialog
  protected readonly selectedGroupDesc = signal<string>('-');
  protected readonly groupValidating = signal(false);

  protected readonly testSearchCtrl = new FormControl('');
  private readonly testSearchText = signal('');
  protected readonly filteredTests = computed(() => {
    const s = this.testSearchText().toLowerCase();
    const all = this.validTests();
    const filtered = !s ? all : all.filter(t =>
      t.testId.toLowerCase().includes(s) || t.testDesc.toLowerCase().includes(s)
    );

    const sortDir = this.dialogSortDirection();
    if (sortDir) {
      return [...filtered].sort((a, b) => {
        const cmp = a.testId.localeCompare(b.testId);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return filtered;
  });

  protected readonly groupFilterCtrl = new FormControl<string | null>(null);
  protected readonly groupSearchCtrl = new FormControl('');
  private readonly groupSearchText = signal('');
  protected readonly filteredGroups = computed(() => {
    const s = this.groupSearchText().toLowerCase();
    const all = this.testGroups();
    return !s ? all : all.filter(g =>
      g.code.toLowerCase().includes(s) || g.codeDesc.toLowerCase().includes(s)
    );
  });

  protected readonly dialogSelectedTestIds = signal<Set<string>>(new Set());

  // Dynamic table config with unit count in header
  protected readonly tableConfig = computed<DataTableConfig<ProcessedUnit>>(() => {
    const count = this.processedUnits().length;
    const unitHeader = count > 0 ? `Unit ID (${count})` : 'Unit ID';
    return {
      columns: [
        { key: 'unitId', header: unitHeader, sortable: false },
        { key: 'collDate', header: 'Collection Date', sortable: false },
        { key: 'result', header: 'Result', sortable: false }
      ],
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: count,
        pageSizeOptions: [10, 25, 50]
      },
      showPagination: true,
      emptyMessage: 'No Results to Display'
    };
  });

  ngOnInit(): void {
    this.loadTestGroups();
    this.loadValidTests();
    this.subscribeToChapterChanges();
    this.setupSearchListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
        this.loadTestGroups();
        this.loadValidTests();
      });
  }

  private setupSearchListeners(): void {
    this.testSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testSearchText.set(v || ''));

    this.groupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.groupSearchText.set(v || ''));
  }

  private resetState(): void {
    this.selectedTests.set([]);
    this.processedUnits.set([]);
    this.currentBatch.set(null);
    this.collectionDate.set('');
  }

  private loadTestGroups(): void {
    this.ntResultsService.getTestGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: groups => this.testGroups.set(groups),
        error: () => this.snackbarService.showError('Failed to load test groups')
      });
  }

  private loadValidTests(testGroup?: string): void {
    this.testsLoading.set(true);
    this.ntResultsService.getValidTests(testGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tests => {
          this.validTests.set(tests);
          this.testsLoading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load tests');
          this.testsLoading.set(false);
        }
      });
  }

  protected openSelectTestsDialog(): void {
    const currentIds = new Set(this.selectedTests().map(t => t.testId));
    this.dialogSelectedTestIds.set(currentIds);
    this.groupFilterCtrl.setValue(null);
    this.testSearchCtrl.setValue('');
    this.selectedGroupDesc.set('-');
    this.dialogSortDirection.set('asc');
    this.loadValidTests();
    this.showSelectTestsDialog.set(true);
  }

  protected closeSelectTestsDialog(): void {
    this.showSelectTestsDialog.set(false);
  }

  protected onGroupFilterChange(groupCode: string | null): void {
    if (groupCode) {
      this.groupValidating.set(true);
      this.ntResultsService.validateTestGroup(groupCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: result => {
            this.selectedGroupDesc.set(result.codeDesc || '-');
            this.groupValidating.set(false);
            this.loadValidTests(groupCode);
          },
          error: error => {
            this.groupValidating.set(false);
            const msg = error?.error?.message || error?.message || 'Invalid test group';
            this.snackbarService.showError(msg);
            this.selectedGroupDesc.set('-');
            this.validTests.set([]);
            this.testsLoading.set(false);
          }
        });
    } else {
      this.selectedGroupDesc.set('-');
      this.loadValidTests();
    }
  }

  protected toggleDialogSort(): void {
    const current = this.dialogSortDirection();
    if (current === 'asc') {
      this.dialogSortDirection.set('desc');
    } else {
      this.dialogSortDirection.set('asc');
    }
  }

  protected toggleSelectAll(): void {
    const filtered = this.filteredTests();
    const current = this.dialogSelectedTestIds();
    const allSelected = filtered.length > 0 && filtered.every(t => current.has(t.testId));

    if (allSelected) {
      this.dialogSelectedTestIds.set(new Set());
    } else {
      this.dialogSelectedTestIds.set(new Set(filtered.map(t => t.testId)));
    }
  }

  protected toggleTestSelection(test: ValidTestDto): void {
    const current = new Set(this.dialogSelectedTestIds());
    if (current.has(test.testId)) {
      current.delete(test.testId);
    } else {
      current.add(test.testId);
    }
    this.dialogSelectedTestIds.set(current);
  }

  protected isTestSelected(testId: string): boolean {
    return this.dialogSelectedTestIds().has(testId);
  }

  protected confirmTestSelection(): void {
    const selectedIds = this.dialogSelectedTestIds();
    const allTests = this.validTests();
    const selected = allTests.filter(t => selectedIds.has(t.testId));
    this.selectedTests.set(selected);
    this.showSelectTestsDialog.set(false);
  }

  protected removeTest(testId: string): void {
    this.selectedTests.update(tests => tests.filter(t => t.testId !== testId));
  }

  protected clearAllTests(): void {
    this.selectedTests.set([]);
    this.currentBatch.set(null);
    this.processedUnits.set([]);
    this.collectionDate.set('');
  }

  private createBatch(tests: ValidTestDto[]): void {
    this.loading.set(true);
    const request = {
      testIds: tests.map(t => t.testId)
    };

    this.ntResultsService.createBatch(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: batch => {
          this.currentBatch.set(batch);
          this.loading.set(false);
          this.processUnit(this.pendingUnitEvent!);
          this.pendingUnitEvent = null;
        },
        error: error => {
          this.handleError(error, 'Failed to create batch');
          this.loading.set(false);
          this.processingUnit.set(false);
          this.pendingUnitEvent = null;
        }
      });
  }

  private pendingUnitEvent: UnitValidationResponse | null = null;

  protected onUnitValidated(event: UnitValidationResponse): void {
    if (event?.collectionDate) {
      this.collectionDate.set(this.formatDate(event.collectionDate));
    }

    const tests = this.selectedTests();
    if (tests.length === 0) {
      this.snackbarService.showError('Please select tests first');
      return;
    }

    const unitId = event?.parsedUnitId;
    if (!unitId) return;

    // Duplicate unit guard
    const alreadyProcessed = this.processedUnits().some(u => u.unitId === unitId);
    if (alreadyProcessed) {
      this.snackbarService.showError(`Unit ${unitId} has already been processed in this batch`);
      this.unitIdField?.clear();
      this.unitIdField?.focus();
      return;
    }

    this.processingUnit.set(true);

    // Defer batch creation to first unit scan (FMB BR-024 behavior)
    if (!this.currentBatch()) {
      this.pendingUnitEvent = event;
      this.createBatch(tests);
      return;
    }

    this.processUnit(event);
  }

  private processUnit(event: UnitValidationResponse): void {
    const batch = this.currentBatch()!;
    const unitId = event.parsedUnitId!;
    const request = { unitId, tbId: batch.tbId };

    this.ntResultsService.addUnitToBatch(batch.tbId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const newUnit: ProcessedUnit = {
            unitId: response.unitId,
            collDate: response.collDate || '',
            result: 'Not Tested'
          };
          this.processedUnits.update(units => [...units, newUnit]);
          this.collectionDate.set(this.formatDate(response.collDate || ''));
          this.processingUnit.set(false);

          const count = this.processedUnits().length;
          this.snackbarService.showSuccess(`${count} Unit${count > 1 ? 's' : ''} saved.`);

          // Auto-focus back to Unit ID field for continuous scanning
          this.unitIdField?.clear();
          this.unitIdField?.focus();
        },
        error: error => {
          this.handleError(error, 'Failed to process unit');
          this.processingUnit.set(false);
          this.unitIdField?.clear();
          this.unitIdField?.focus();
        }
      });
  }

  protected onDirectTestIdEntry(): void {
    const testId = this.directTestIdCtrl.value?.trim();
    if (!testId) return;

    if (this.selectedTests().some(t => t.testId === testId)) {
      this.snackbarService.showError(`Test ${testId} is already selected`);
      this.directTestIdCtrl.setValue('');
      return;
    }

    this.validatingTestId.set(true);
    this.ntResultsService.getTestById(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: test => {
          this.selectedTests.update(tests => [...tests, test]);
          this.directTestIdCtrl.setValue('');
          this.validatingTestId.set(false);
        },
        error: error => {
          const msg = error?.error?.message || error?.message || `Invalid test ID: ${testId}`;
          this.snackbarService.showError(msg);
          this.validatingTestId.set(false);
        }
      });
  }

  protected onUnitCleared(): void {
    this.collectionDate.set('');
  }

  private handleError(error: any, defaultMessage: string): void {
    const errorMessage =
      error?.error?.errorResponse?.error ||
      error?.error?.message ||
      defaultMessage;
    const errorCode = error?.error?.errorResponse?.errorCode;
    this.snackbarService.showError(
      errorCode ? `${errorCode}: ${errorMessage}` : errorMessage,
    );
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }
}
