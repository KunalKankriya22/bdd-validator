import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { TestGroupLookup, TestByGroupLookup } from '../../models/regional-testing-contract.model';

@Component({
  selector: 'app-select-multiple-test-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    SidePanelBase
  ],
  templateUrl: './select-multiple-test-panel.html',
  styleUrl: './select-multiple-test-panel.scss'
})
export class SelectMultipleTestPanelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `select-test-panel-${SelectMultipleTestPanelComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly destroy$ = new Subject<void>();

  @Input() excludedTestIds: string[] = [];
  @Output() testsSelected = new EventEmitter<string[]>();
  @Output() close = new EventEmitter<void>();

  groupIdControl = new FormControl<string>('');
  groupSearchControl = new FormControl<string>('');

  groups = signal<TestGroupLookup[]>([]);
  allTests = signal<TestByGroupLookup[]>([]);
  selectedTestIds = signal<Set<string>>(new Set());
  loading = signal<boolean>(false);

  filteredGroups = computed(() => {
    const search = (this.groupSearchControl.value || '').toLowerCase();
    const g = this.groups();
    return !search ? g : g.filter(grp =>
      grp.groupId.toLowerCase().includes(search) ||
      grp.description.toLowerCase().includes(search)
    );
  });

  selectedGroupDescription = computed(() => {
    const groupId = this.groupIdControl.value;
    if (!groupId) return '-';
    const group = this.groups().find(g => g.groupId === groupId);
    return group?.description || '-';
  });

  availableTests = computed(() => {
    const groupId = this.groupIdControl.value;
    const excluded = new Set(this.excludedTestIds);
    return this.allTests()
      .filter(t => !groupId || t.testGroup === groupId)
      .filter(t => !excluded.has(t.testId));
  });

  allSelected = computed(() => {
    const tests = this.availableTests();
    if (tests.length === 0) return false;
    const selected = this.selectedTestIds();
    return tests.every(t => selected.has(t.testId));
  });

  someSelected = computed(() => {
    const tests = this.availableTests();
    const selected = this.selectedTestIds();
    const count = tests.filter(t => selected.has(t.testId)).length;
    return count > 0 && count < tests.length;
  });

  footerButtons: DialogButton[] = [
    { label: 'CANCEL', action: 'cancel', variant: 'text' },
    { label: 'CLEAR ALL', action: 'clearAll', variant: 'secondary' },
    { label: 'SAVE AND CLOSE', action: 'save', variant: 'primary' }
  ];

  ngOnInit(): void {
    this.loadData();
    this.setupGroupFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading.set(true);

    // Load test groups for filtering
    this.apiService.getTestGroups('NEW') // Use 'NEW' for add mode, actual contractId for edit
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => this.groups.set(groups));

    // Load non-profile test lookup
    this.apiService.getTestsByGroup('NEW', '')
      .pipe(takeUntil(this.destroy$))
      .subscribe(tests => {
        this.allTests.set(tests);
        this.loading.set(false);
      });
  }

  private setupGroupFilter(): void {
    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {});
  }

  isTestSelected(testId: string): boolean {
    return this.selectedTestIds().has(testId);
  }

  toggleTest(testId: string): void {
    const current = new Set(this.selectedTestIds());
    if (current.has(testId)) {
      current.delete(testId);
    } else {
      current.add(testId);
    }
    this.selectedTestIds.set(current);
  }

  toggleAll(): void {
    const tests = this.availableTests();
    if (this.allSelected()) {
      this.selectedTestIds.set(new Set());
    } else {
      this.selectedTestIds.set(new Set(tests.map(t => t.testId)));
    }
  }

  onButtonClick(action: string): void {
    switch (action) {
      case 'save':
        this.testsSelected.emit(Array.from(this.selectedTestIds()));
        break;
      case 'clearAll':
        this.selectedTestIds.set(new Set());
        break;
      case 'cancel':
        this.close.emit();
        break;
    }
  }

  onClosePanel(): void {
    this.close.emit();
  }
}
