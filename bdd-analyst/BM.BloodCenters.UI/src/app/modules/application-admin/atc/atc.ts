import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AtcApiService } from './services/atc-api.service';
import {
  AdditionalConfirmatoryTestScheduledDto,
  TestGroupLookupDto,
  SampleTypeLookupDto,
  UnitSequence,
  ExistingTestDto,
  ScheduleTestsRequest,
} from './models/atc.models';

@Component({
  selector: 'app-atc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
  ],
  templateUrl: './atc.html',
  styleUrls: ['./atc.scss'],
})
export class AdditionalConfirmatoryTestScheduledComponent implements OnInit, OnDestroy {
  private readonly atcApiService = inject(AtcApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Page header
  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: data?.title || 'Additional Test Scheduling', path: '' },
      ],
      title: data?.title,
      subtitle: data?.subtitle,
    };
  });

  // Signals
  protected readonly loading = signal(false);
  protected readonly testGroups = signal<TestGroupLookupDto[]>([]);
  protected readonly sampleTypes = signal<SampleTypeLookupDto[]>([]);
  protected readonly selectedTests = signal<AdditionalConfirmatoryTestScheduledDto[]>([]);
  protected readonly unitSequences = signal<UnitSequence[]>([]);
  protected readonly existingTests = signal<ExistingTestDto[]>([]);
  protected readonly selectedUnitIndex = signal<number | null>(null);
  protected readonly existingTestsSearchText = signal('');

  // Test group searchable dropdown
  protected readonly testGroupSearchCtrl = new FormControl('');
  private readonly testGroupSearchText = signal('');
  protected readonly filteredTestGroups = computed(() => {
    const s = this.testGroupSearchText().toLowerCase();
    const groups = this.testGroups();
    return !s ? groups : groups.filter(g =>
      g.testGroup.toLowerCase().includes(s) ||
      (g.description?.toLowerCase().includes(s) ?? false)
    );
  });

  // Test group selected value
  protected readonly selectedTestGroupId = signal<string | null>(null);

  // Computed
  protected readonly hasSelectedTests = computed(() => this.selectedTests().length > 0);
  protected readonly hasUnits = computed(() => this.unitSequences().length > 0);
  protected readonly scheduleCount = computed(() => {
    return this.selectedTests().length * this.unitSequences().length;
  });

  protected readonly filteredExistingTests = computed(() => {
    const search = this.existingTestsSearchText().toLowerCase();
    const tests = this.existingTests();
    if (!search) return tests;
    return tests.filter(t =>
      (t.testId?.toLowerCase().includes(search) ?? false) ||
      (t.tbId?.toLowerCase().includes(search) ?? false) ||
      (t.resultStatus1?.toLowerCase().includes(search) ?? false)
    );
  });

  // Unit sequences table config
  protected readonly unitTableConfig: DataTableConfig<UnitSequence> = {
    columns: [
      { key: 'sequenceNumber', header: 'Seq', sortable: false },
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'collectionDate', header: 'Collection Date', sortable: false },
    ],
    rowActions: [
      { action: 'delete', icon: 'delete', ariaLabel: 'Remove unit', color: 'warn' },
    ],
    showPagination: false,
    emptyMessage: 'No units scanned',
    emptySubMessage: 'Scan a unit barcode to begin',
  };

  // Existing tests table config
  protected readonly existingTestsTableConfig: DataTableConfig<ExistingTestDto> = {
    columns: [
      {
        key: 'statusFlag',
        header: 'Status',
        sortable: false,
        valueFormatter: (value: string | null) => value === 'S' ? 'Scheduled' : 'Unscheduled',
      },
      { key: 'testId', header: 'Test ID', sortable: false },
      { key: 'testSeqNo', header: 'Seq', sortable: false },
      { key: 'tbId', header: 'Test Batch ID', sortable: false },
      { key: 'resultStatus1', header: 'Result', sortable: false },
    ],
    showPagination: false,
    emptyMessage: 'No existing tests',
    emptySubMessage: 'Select a unit to view its tests',
  };

  // Existing tests search config
  protected readonly existingTestsSearchConfig: SearchBarConfig = {
    placeholder: 'Search existing tests...',
    ariaLabel: 'Search existing tests',
    minLength: 1,
  };

  // Unit ID input
  protected readonly unitIdValue = signal('');

  ngOnInit(): void {
    this.loadTestGroups();
    this.loadSampleTypes();

    this.testGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testGroupSearchText.set(v || ''));

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadTestGroups();
        this.loadSampleTypes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTestGroups(): void {
    this.atcApiService.getTestGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.testGroups.set(data),
        error: () => this.snackbarService.showError('Failed to load test groups'),
      });
  }

  private loadSampleTypes(): void {
    this.atcApiService.getSampleTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.sampleTypes.set(data),
        error: (err) => console.error('Failed to load sample types:', err),
      });
  }

  protected onTestGroupChange(testGroupId: string | null): void {
    this.selectedTestGroupId.set(testGroupId);
  }

  protected onLookupTests(): void {
    const testGroupId = this.selectedTestGroupId();
    const queryDto = {
      testGroup: testGroupId || undefined,
      activeOnly: true,
    };

    this.loading.set(true);
    this.atcApiService.getAllTests(100, 0, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.data.length === 0) {
            this.snackbarService.showError('No tests found');
            return;
          }
          const currentIds = new Set(this.selectedTests().map(t => t.testId));
          const newTests = response.data.filter(t => !currentIds.has(t.testId));
          if (newTests.length > 0) {
            this.selectedTests.update(current => [...current, ...newTests]);
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to retrieve tests');
        },
      });
  }

  protected removeTest(testId: string): void {
    this.selectedTests.update(tests => tests.filter(t => t.testId !== testId));
  }

  protected onClearTests(): void {
    this.selectedTests.set([]);
  }

  protected onUnitIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.unitIdValue.set(input.value);
  }

  protected onUnitIdScan(): void {
    const unitId = this.unitIdValue().trim();
    if (!unitId) {
      this.snackbarService.showError('Please enter a Unit ID');
      return;
    }

    this.loading.set(true);
    this.atcApiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          const alreadyScanned = this.unitSequences().some(
            u => u.unitId.toUpperCase() === result.unitId.toUpperCase()
          );
          if (alreadyScanned) {
            this.snackbarService.showError('Unit already scanned');
            return;
          }

          const seq = this.unitSequences().length + 1;
          this.unitSequences.update(units => [...units, {
            sequenceNumber: seq,
            unitId: result.unitId,
            collectionDate: result.collDate || '',
          }]);

          this.loadExistingTests(result.unitId, result.collDate);
          this.selectedUnitIndex.set(seq - 1);
          this.unitIdValue.set('');
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.message || 'Unit not found for current chapter';
          this.snackbarService.showError(msg);
        },
      });
  }

  private loadExistingTests(unitId: string, collDate: string | null): void {
    this.atcApiService.getExistingTests(unitId, collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.existingTests.set(tests),
        error: () => this.snackbarService.showError('Failed to load existing tests'),
      });
  }

  protected onUnitRowClick(unit: UnitSequence): void {
    const idx = this.unitSequences().indexOf(unit);
    this.selectedUnitIndex.set(idx);
    this.loadExistingTests(unit.unitId, unit.collectionDate || null);
  }

  protected onUnitRowAction(event: TableRowActionEvent<UnitSequence>): void {
    if (event.action === 'delete') {
      this.unitSequences.update(units => {
        const filtered = units.filter(u => u.unitId !== event.row.unitId);
        return filtered.map((u, i) => ({ ...u, sequenceNumber: i + 1 }));
      });
      if (this.unitSequences().length === 0) {
        this.existingTests.set([]);
        this.selectedUnitIndex.set(null);
      }
    }
  }

  protected onExistingTestsSearch(searchText: string): void {
    this.existingTestsSearchText.set(searchText);
  }

  protected onSchedule(): void {
    if (!this.hasSelectedTests() || !this.hasUnits()) {
      this.snackbarService.showError('Select tests and scan units before scheduling');
      return;
    }

    const request: ScheduleTestsRequest = {
      testIds: this.selectedTests().map(t => t.testId),
      units: this.unitSequences().map(u => ({
        unitId: u.unitId,
        collDate: u.collectionDate || null,
      })),
    };

    this.loading.set(true);
    this.atcApiService.scheduleTests(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Tests Scheduled Successfully');
          if (this.selectedUnitIndex() !== null) {
            const unit = this.unitSequences()[this.selectedUnitIndex()!];
            if (unit) {
              this.loadExistingTests(unit.unitId, unit.collectionDate || null);
            }
          }
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.message || 'Failed to schedule tests';
          this.snackbarService.showError(msg);
        },
      });
  }

  protected onClearAll(): void {
    this.selectedTests.set([]);
    this.unitSequences.set([]);
    this.existingTests.set([]);
    this.selectedTestGroupId.set(null);
    this.selectedUnitIndex.set(null);
    this.unitIdValue.set('');
    this.existingTestsSearchText.set('');
  }
}
