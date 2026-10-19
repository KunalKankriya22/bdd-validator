import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { AdhocTestDto, AdhocTestGroupDto } from '../../models/ad-hoc-tube-check-in.model';
import { AdHocTubeCheckInService } from '../../services/ad-hoc-tube-check-in.service';

@Component({
  selector: 'app-select-test-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    SidePanelBase,
  ],
  templateUrl: './select-test-panel.html',
  styleUrls: ['./select-test-panel.scss'],
})
export class SelectTestPanelComponent implements OnInit, OnDestroy {
  @Input() contractDescription = '';
  @Input() currentTests: AdhocTestDto[] = [];

  @Output() testsSelected = new EventEmitter<AdhocTestDto[]>();
  @Output() close = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(AdHocTubeCheckInService);

  selectByControl = new FormControl<'ALL' | 'GROUP'>('ALL');
  groupIdControl = new FormControl<string>('');
  groupSearchControl = new FormControl('');

  isLoading = signal(false);
  displayedTests = signal<AdhocTestDto[]>([]);
  testGroups = signal<AdhocTestGroupDto[]>([]);
  filteredTestGroups = signal<AdhocTestGroupDto[]>([]);
  selectedTestIds = signal<Set<string>>(new Set());
  sortDirection = signal<'asc' | 'desc'>('asc');

  groupDescription = computed(() => {
    const groupId = this.groupIdControl.value;
    const group = this.testGroups().find(g => g.code === groupId);
    return group?.codeDesc || '-';
  });

  sortedTests = computed(() => {
    const tests = this.displayedTests();
    const dir = this.sortDirection();
    return [...tests].sort((a, b) => {
      const cmp = a.testId.localeCompare(b.testId);
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  isAllSelected = computed(() => {
    const tests = this.sortedTests();
    const ids = this.selectedTestIds();
    return tests.length > 0 && tests.every(t => ids.has(t.testId));
  });

  isSomeSelected = computed(() => {
    const tests = this.sortedTests();
    const ids = this.selectedTestIds();
    const count = tests.filter(t => ids.has(t.testId)).length;
    return count > 0 && count < tests.length;
  });

  footerButtons: DialogButton[] = [
    { label: 'GO BACK', action: 'goBack', variant: 'secondary' },
    { label: 'PROCEED', action: 'proceed', variant: 'primary' },
  ];

  ngOnInit(): void {
    this.loadInitialData();

    this.selectByControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value === 'ALL') {
          this.groupIdControl.setValue('');
          this.loadTests();
        }
      });

    this.groupIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(groupId => {
        if (groupId) {
          this.loadTests(groupId);
        }
      });

    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.testGroups();
        this.filteredTestGroups.set(
          t ? all.filter(g => (g.code + ' ' + (g.codeDesc ?? '')).toLowerCase().includes(t)) : all
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.isLoading.set(true);

    const currentIds = new Set(this.currentTests.map(t => t.testId));
    this.selectedTestIds.set(currentIds);

    this.service.getTestGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => {
        this.testGroups.set(groups);
        this.filteredTestGroups.set(groups);
      });

    this.loadTests();
  }

  private loadTests(testGroup?: string): void {
    this.isLoading.set(true);
    this.service.getValidTests(testGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests: AdhocTestDto[]) => {
          this.displayedTests.set(tests);
          if (this.currentTests.length) {
            const currentIds = new Set(this.currentTests.map(t => t.testId));
            const visibleSelected = new Set(
              tests.filter(t => currentIds.has(t.testId)).map(t => t.testId)
            );
            this.selectedTestIds.set(visibleSelected);
          } else {
            this.selectedTestIds.set(new Set(tests.map(t => t.testId)));
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  toggleRow(test: AdhocTestDto): void {
    const ids = new Set(this.selectedTestIds());
    if (ids.has(test.testId)) {
      ids.delete(test.testId);
    } else {
      ids.add(test.testId);
    }
    this.selectedTestIds.set(ids);
  }

  toggleAll(): void {
    const tests = this.sortedTests();
    const ids = new Set(this.selectedTestIds());
    if (this.isAllSelected()) {
      tests.forEach(t => ids.delete(t.testId));
    } else {
      tests.forEach(t => ids.add(t.testId));
    }
    this.selectedTestIds.set(ids);
  }

  toggleSort(): void {
    this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  isTestSelected(testId: string): boolean {
    return this.selectedTestIds().has(testId);
  }

  onButtonClick(action: string): void {
    if (action === 'proceed') {
      const ids = this.selectedTestIds();
      const selected = this.displayedTests().filter(t => ids.has(t.testId));
      this.testsSelected.emit(selected);
    } else {
      this.close.emit();
    }
  }

  onClosePanel(): void {
    this.close.emit();
  }
}
