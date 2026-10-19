import { Component, Input, Output, EventEmitter, signal, computed, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

import {
  SelectTestsDialogResult,
  ActiveTestDto,
  TestGroupDto,
} from '../models/void-cancel-test-results.model';

@Component({
  selector: 'app-select-tests-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    DataTable,
  ],
  templateUrl: './select-tests-dialog.html',
  styleUrl: './select-tests-dialog.scss',
})
export class SelectTestsDialogComponent implements OnDestroy, OnChanges {
  @Input() testGroups: TestGroupDto[] = [];
  @Input() availableTests: ActiveTestDto[] = [];
  @Input() selectedTestIds: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<SelectTestsDialogResult>();

  private destroy$ = new Subject<void>();

  groupSearchCtrl = new FormControl('');
  selectedGroupCtrl = new FormControl<string | null>(null);

  private readonly groupSearchText = signal('');
  protected readonly selectedIds = signal<Set<string>>(new Set());
  private readonly selectedGroup = signal<string | null>(null);
  private readonly sortColumn = signal<string>('testId');
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('A');
  private readonly testGroupsSignal = signal<TestGroupDto[]>([]);
  private readonly availableTestsSignal = signal<ActiveTestDto[]>([]);

  protected readonly filteredGroups = computed(() => {
    const s = this.groupSearchText().toLowerCase();
    const groups = this.testGroupsSignal();
    return !s ? groups : groups.filter(g =>
      g.code.toLowerCase().includes(s) || g.description.toLowerCase().includes(s)
    );
  });

  protected readonly selectedGroupDescription = computed(() => {
    const groupCode = this.selectedGroup();
    if (!groupCode) return '-';
    const group = this.testGroupsSignal().find(g => g.code === groupCode);
    return group?.description || '-';
  });

  protected readonly filteredTests = computed(() => {
    const groupCode = this.selectedGroup();
    let tests = this.availableTestsSignal();
    if (groupCode) {
      tests = tests.filter(t => t.testGroup === groupCode);
    }
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col === 'testId' && dir !== 'default') {
      tests = [...tests].sort((a, b) => {
        const cmp = a.testId.localeCompare(b.testId);
        return dir === 'A' ? cmp : -cmp;
      });
    }
    return tests;
  });

  protected readonly tableConfig: DataTableConfig<ActiveTestDto> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: true },
      { key: 'testGroup', header: 'Group', sortable: false },
      { key: 'testDesc', header: 'Test Description', sortable: false },
    ],
    enableSelection: true,
    selectionKey: 'testId',
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No tests available',
    showTableOnEmpty: true,
    sortConfig: { column: 'testId', direction: 'A' },
  };

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  constructor() {
    this.groupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.groupSearchText.set(v || ''));

    this.selectedGroupCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.selectedGroup.set(v));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTestIds']) {
      this.selectedIds.set(new Set(this.selectedTestIds || []));
    }
    if (changes['testGroups']) {
      this.testGroupsSignal.set(this.testGroups || []);
    }
    if (changes['availableTests']) {
      this.availableTestsSignal.set(this.availableTests || []);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectionChange(selectedRows: ActiveTestDto[]): void {
    this.selectedIds.set(new Set(selectedRows.map(t => t.testId)));
  }

  onSortChange(event: TableSortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction as 'A' | 'D' | 'default');
  }

  onClose(): void {
    this.close.emit();
  }

  onProceed(): void {
    const ids = this.selectedIds();
    const allTests = this.availableTestsSignal();
    const selectedTests = allTests.filter(t => ids.has(t.testId));
    this.proceed.emit({ selectedTests });
  }
}
