import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface SelectTestsDialogData {
  contractId?: string;
  selectedTests?: SelectedTest[];
}

export interface SelectedTest {
  testId: string;
  group: string;
  description: string;
}

interface TestItem {
  testId: string;
  description: string;
  testGroup?: string;
}

@Component({
  selector: 'app-select-tests-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './select-tests-dialog.html',
  styleUrls: ['./select-tests-dialog.scss']
})
export class SelectTestsDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dialogRef = inject(MatDialogRef<SelectTestsDialogComponent>);
  readonly data = inject<SelectTestsDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly snackbarService = inject(SnackbarService);

  // Signals
  protected readonly loading = signal(false);
  protected readonly allTests = signal<TestItem[]>([]);
  protected readonly selectedTestIds = signal<Set<string>>(new Set());
  protected readonly testGroups = signal<string[]>([]);
  protected readonly selectedGroup = signal<string>('');

  // Search control
  searchControl = new FormControl('');
  groupControl = new FormControl('');
  protected readonly searchText = signal('');

  // Computed filtered tests
  protected readonly filteredTests = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const group = this.selectedGroup();
    let tests = this.allTests();

    // Filter by group if selected
    if (group) {
      tests = tests.filter(test => test.testGroup === group);
    }

    // Filter by search text
    if (search) {
      tests = tests.filter(test =>
        test.testId.toLowerCase().includes(search) ||
        test.description.toLowerCase().includes(search)
      );
    }

    return tests;
  });

  // Computed description - show description when exactly one test is selected
  protected readonly selectedDescription = computed(() => {
    const selected = this.selectedTestIds();
    if (selected.size === 1) {
      const testId = Array.from(selected)[0];
      const test = this.allTests().find(t => t.testId === testId);
      return test?.description || '';
    }
    return '';
  });

  ngOnInit(): void {
    // Initialize with pre-selected tests
    if (this.data.selectedTests) {
      const selected = new Set(this.data.selectedTests.map(t => t.testId));
      this.selectedTestIds.set(selected);
    }

    // Setup search
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.searchText.set(value || ''));

    // Setup group filter
    this.groupControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedGroup.set(value || ''));

    // Load tests
    this.loadTests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load available tests from API
   */
  private loadTests(): void {
    this.loading.set(true);
    const contractId = this.data.contractId || 'NEW';

    this.apiService.getTestLookups(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.allTests.set(tests);

          // Extract unique groups - filter out undefined and cast to string[]
          const groups = [...new Set(
            tests.map(t => t.testGroup).filter((g): g is string => !!g)
          )].sort();
          this.testGroups.set(groups);

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading tests:', error);
          this.snackbarService.showError('Failed to load tests');
          this.loading.set(false);
        }
      });
  }

  /**
   * Toggle test selection
   */
  toggleTest(testId: string): void {
    const selected = new Set(this.selectedTestIds());

    if (selected.has(testId)) {
      selected.delete(testId);
    } else {
      selected.add(testId);
    }

    this.selectedTestIds.set(selected);
  }

  /**
   * Check if test is selected
   */
  isSelected(testId: string): boolean {
    return this.selectedTestIds().has(testId);
  }

  /**
   * Clear all selections
   */
  onClearAll(): void {
    this.selectedTestIds.set(new Set());
  }

  /**
   * Save and close
   */
  onSave(): void {
    const selected = this.selectedTestIds();
    const tests = this.allTests();

    const selectedTests: SelectedTest[] = Array.from(selected).map(testId => {
      const test = tests.find(t => t.testId === testId);
      return {
        testId,
        group: test?.testGroup || '',
        description: test?.description || ''
      };
    });

    this.dialogRef.close(selectedTests);
  }

  /**
   * Cancel and close
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
