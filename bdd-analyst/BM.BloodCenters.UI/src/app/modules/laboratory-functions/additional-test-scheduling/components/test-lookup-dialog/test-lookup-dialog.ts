import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormControl } from '@angular/forms';

import { ValidTestDto, TestGroupDto, SampleTypeDto } from '../../models/additional-test-scheduling.model';
import { AdditionalTestSchedulingApiService } from '../../services/additional-test-scheduling-api.service';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

export interface TestLookupDialogData {
  selectedTests: ValidTestDto[];
}

@Component({
  selector: 'app-test-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './test-lookup-dialog.html',
  styleUrl: './test-lookup-dialog.scss'
})
export class TestLookupDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `test-lookup-dialog-${TestLookupDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TestLookupDialogComponent>);
  private readonly data = inject<TestLookupDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(AdditionalTestSchedulingApiService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  protected readonly tests = signal<ValidTestDto[]>([]);
  protected readonly testGroups = signal<TestGroupDto[]>([]);
  protected readonly sampleTypes = signal<SampleTypeDto[]>([]);
  protected readonly selectedTests = signal<Set<string>>(new Set());
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = signal<number>(0);
  protected readonly pageSize = signal<number>(10);
  protected readonly pageIndex = signal<number>(0);

  protected readonly isEmpty = computed(() => this.tests().length === 0 && !this.loading());
  protected readonly hasSelection = computed(() => this.selectedTests().size > 0);
  protected readonly selectionCount = computed(() => this.selectedTests().size);

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

  protected readonly sampleTypeSearchCtrl = new FormControl('');
  private readonly sampleTypeSearchText = signal('');
  protected readonly filteredSampleTypes = computed(() => {
    const s = this.sampleTypeSearchText().toLowerCase();
    const types = this.sampleTypes();
    return !s ? types : types.filter(t =>
      t.sampleType.toLowerCase().includes(s) ||
      (t.description?.toLowerCase().includes(s) ?? false)
    );
  });

  filterForm!: FormGroup;
  displayedColumns = ['select', 'testId', 'testDesc', 'testGroup', 'effDate', 'termDate'];

  protected readonly sortColumn = signal<string | null>(null);
  protected readonly sortOrder = signal<'ASC' | 'DESC' | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadTestGroups();
    this.loadSampleTypes();
    this.loadTests();
    this.setupSearchListener();
    this.initializeSelectedTests();

    this.testGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testGroupSearchText.set(v || ''));

    this.sampleTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.sampleTypeSearchText.set(v || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      testGroup: [null],
      sampleType: [null],
      searchKeyword: ['']
    });
  }

  private initializeSelectedTests(): void {
    if (this.data?.selectedTests?.length) {
      this.selectedTests.set(new Set(this.data.selectedTests.map(t => t.testId)));
    }
  }

  private loadTestGroups(): void {
    this.apiService.getTestGroups('CNFRM')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => this.testGroups.set(groups),
        error: () => this.testGroups.set([])
      });
  }

  private loadSampleTypes(): void {
    this.apiService.getSampleTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.sampleTypes.set(types),
        error: () => this.sampleTypes.set([])
      });
  }

  protected loadTests(): void {
    this.loading.set(true);
    this.error.set(null);

    const { searchKeyword, testGroup, sampleType } = this.filterForm.value;
    const take = this.pageSize();
    const skip = this.pageIndex() * this.pageSize();

    this.apiService.getValidTests(take, skip, {
      searchKeyword: searchKeyword || null,
      testGroup: testGroup || null,
      sampleType: sampleType || null,
      sortColumn: this.sortColumn(),
      sortOrder: this.sortOrder(),
      screenMode: 'CNFRM'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data, totalCount }) => {
          this.tests.set(data);
          this.totalCount.set(totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load tests');
          this.loading.set(false);
        }
      });
  }

  private setupSearchListener(): void {
    this.filterForm.get('searchKeyword')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadTests();
      });
  }

  onTestGroupChange(): void {
    this.pageIndex.set(0);
    this.loadTests();
  }

  onSampleTypeChange(): void {
    this.pageIndex.set(0);
    this.loadTests();
  }

  onSort(column: string): void {
    if (this.sortColumn() !== column) {
      this.sortColumn.set(column);
      this.sortOrder.set('ASC');
    } else {
      const next = this.sortOrder() === 'ASC' ? 'DESC' : this.sortOrder() === 'DESC' ? null : 'ASC';
      this.sortOrder.set(next);
      if (!next) this.sortColumn.set(null);
    }
    this.pageIndex.set(0);
    this.loadTests();
  }

  sortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortOrder() === 'ASC' ? 'arrow_downward' : 'arrow_upward';
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    const utc = new Date(value);
    if (isNaN(utc.getTime())) return '';
    const timezone = this.headerService.getCurrentChapterTimezone();
    const d = convertUTCToTimezone(utc, timezone);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${day}-${month}-${d.getFullYear()}`;
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadTests();
  }

  onTestToggle(testId: string): void {
    const test = this.tests().find(t => t.testId === testId);
    if (test && !test.isActive) return;
    const selected = new Set(this.selectedTests());
    if (selected.has(testId)) {
      selected.delete(testId);
    } else {
      selected.add(testId);
    }
    this.selectedTests.set(selected);
  }

  isTestSelected(testId: string): boolean {
    return this.selectedTests().has(testId);
  }

  onMasterToggle(): void {
    const activeTests = this.tests().filter(t => t.isActive);
    if (this.isAllSelected()) {
      const selected = new Set(this.selectedTests());
      activeTests.forEach(test => selected.delete(test.testId));
      this.selectedTests.set(selected);
    } else {
      const selected = new Set(this.selectedTests());
      activeTests.forEach(test => selected.add(test.testId));
      this.selectedTests.set(selected);
    }
  }

  isAllSelected(): boolean {
    const activeTests = this.tests().filter(t => t.isActive);
    return activeTests.length > 0 && activeTests.every(test => this.selectedTests().has(test.testId));
  }

  isSomeSelected(): boolean {
    const activeTests = this.tests().filter(t => t.isActive);
    return activeTests.some(test => this.selectedTests().has(test.testId)) && !this.isAllSelected();
  }

  onClearFilters(): void {
    this.filterForm.reset({ testGroup: null, sampleType: null, searchKeyword: '' }, { emitEvent: false });
    this.testGroupSearchCtrl.setValue('');
    this.sampleTypeSearchCtrl.setValue('');
    this.sortColumn.set(null);
    this.sortOrder.set(null);
    this.pageIndex.set(0);
    this.loadTests();
  }

  onConfirm(): void {
    const selectedIds = Array.from(this.selectedTests());
    this.dialogRef.close(this.getAllSelectedTests(selectedIds));
  }

  private getAllSelectedTests(selectedIds: string[]): ValidTestDto[] {
    const allTests = new Map<string, ValidTestDto>();
    this.data?.selectedTests?.forEach(test => allTests.set(test.testId, test));
    this.tests().forEach(test => {
      if (selectedIds.includes(test.testId)) allTests.set(test.testId, test);
    });
    return selectedIds
      .map(id => allTests.get(id))
      .filter((test): test is ValidTestDto => test !== undefined);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
