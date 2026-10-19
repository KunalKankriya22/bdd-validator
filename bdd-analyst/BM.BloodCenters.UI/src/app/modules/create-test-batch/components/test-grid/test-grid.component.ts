import { Component, computed, EventEmitter, HostListener, inject, Input, OnDestroy, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ValidTest, TestRow, TestKitLookup } from '../../models/create-test-batch.model';
import { TestKitDialogComponent } from '../test-kit-dialog/test-kit-dialog.component';
import { CreateTestBatchService } from '../../services/create-test-batch.service';

@Component({
  selector: 'app-test-grid',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule, NgxMatSelectSearchModule, TestKitDialogComponent,
  ],
  templateUrl: './test-grid.component.html',
  styleUrls: ['./test-grid.component.scss'],
})
export class TestGridComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly selectPanelLoadingValue = '__loading__';
  readonly selectPanelEmptyValue = '__empty__';

  showKitPanel = false;
  kitPanelTestIndex: number | null = null;
  kitPanelTestId = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isSorted = false;

  @Input() tests: TestRow[] = [];
  @Input() validTests: ValidTest[] = [];
  @Input() isLoadingTests = false;
  @Input() currentBatchId: string | null = null;
  @Output() testsChanged = new EventEmitter<TestRow[]>();

  testSearchControls: FormControl[] = [];

  getSearchControl(index: number): FormControl {
    while (this.testSearchControls.length <= index) {
      this.testSearchControls.push(new FormControl(''));
    }
    return this.testSearchControls[index];
  }

  getFilteredTests(index: number): ValidTest[] {
    const q = this.getSearchControl(index).value?.toLowerCase() ?? '';
    return q
      ? this.validTests.filter(t =>
          t.testId.toLowerCase().includes(q) || t.testDesc.toLowerCase().includes(q))
      : this.validTests;
  }

  compareTest = (a: string | null, b: string | null): boolean => a === b;

  get sortedTests(): TestRow[] {
    if (!this.tests.length) return [];
    if (!this.isSorted) return this.tests;
    return [...this.tests].sort((a, b) => {
      if (!a.testId && !b.testId) return 0;
      if (!a.testId) return this.sortDirection === 'asc' ? -1 : 1;
      if (!b.testId) return this.sortDirection === 'asc' ? 1 : -1;
      const cmp = a.testId.localeCompare(b.testId);
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  getOriginalIndex(test: TestRow): number {
    return this.tests.indexOf(test);
  }

  toggleSort(): void {
    if (!this.isSorted) {
      this.isSorted = true;
    } else {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }
  }

  addTest(): void {
    const updated = [...this.tests, { testId: '', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }];
    this.testsChanged.emit(updated);
  }

  onTestIdChange(index: number, testId: string): void {
    const match = this.validTests.find(t => t.testId === testId);
    const updated = [...this.tests];
    updated[index] = {
      ...updated[index],
      testId,
      testDesc: match?.testDesc ?? '',
      testGroup: match?.testGroup ?? null,
    };
    this.testsChanged.emit(updated);
  }

  onTestKitChange(index: number, testKitId: string): void {
    const updated = [...this.tests];
    updated[index] = { ...updated[index], testKitId: testKitId || null };
    this.testsChanged.emit(updated);
  }

  removeTest(index: number): void {
    const updated = this.tests.filter((_, i) => i !== index);
    this.testSearchControls.splice(index, 1);
    this.testsChanged.emit(updated);
  }

  openTestKitLookup(index: number): void {
    const test = this.tests[index];
    if (!test.testId) return;

    this.kitPanelTestIndex = index;
    this.kitPanelTestId = test.testId;
    this.showKitPanel = true;
  }

  onKitSelected(testKitId: string): void {
    if (this.kitPanelTestIndex !== null) {
      this.onTestKitChange(this.kitPanelTestIndex, testKitId);
    }
    this.showKitPanel = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showKitPanel) {
      this.onKitPanelClose();
    }
  }

  onKitPanelClose(): void {
    this.showKitPanel = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
