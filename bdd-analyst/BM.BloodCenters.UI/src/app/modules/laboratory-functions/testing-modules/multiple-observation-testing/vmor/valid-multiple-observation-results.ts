import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { VmorTestItem, VmorRow, VmorBandResultDto } from './valid-multiple-observation-results.model';
import { VmorService } from './services/valid-multiple-observation-results.service';

@Component({
  selector: 'app-vmor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DragDropModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './valid-multiple-observation-results.html',
  styleUrl: './valid-multiple-observation-results.scss',
})
export class ValidMultipleObservationResultsComponent implements OnInit, OnDestroy {
  private vmorService = inject(VmorService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [],
        };
      }
    });
  }

  readonly displayedColumns = ['drag', 'sequence', 'result', 'description', 'delete'];

  // Left panel
  allTests: VmorTestItem[] = [];
  filteredTests: VmorTestItem[] = [];
  searchText = '';
  selectedTest: VmorTestItem | null = null;
  testsLoading = false;

  // Right panel
  rows: VmorRow[] = [];
  originalRows: VmorRow[] = [];
  isDirty = false;
  resultsLoading = false;
  isSaving = false;

  get hasIncompleteRows(): boolean {
    return this.rows.some(r => !r.result.trim() || !r.description.trim());
  }

  ngOnInit(): void {
    this.loadTests();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchText = '';
        this.selectedTest = null;
        this.rows = [];
        this.originalRows = [];
        this.isDirty = false;
        this.loadTests();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTests(): void {
    this.testsLoading = true;
    this.vmorService.getTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allTests = data.map(d => ({ testId: d.testId, description: d.testDesc }));
          this.filteredTests = [...this.allTests];
          this.testsLoading = false;
          if (this.allTests.length > 0) this.selectTest(this.allTests[0]);
        },
        error: () => {
          this.testsLoading = false;
        },
      });
  }

  onSearch(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredTests = q
      ? this.allTests.filter(
          t => t.testId.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        )
      : [...this.allTests];
  }

  selectTest(test: VmorTestItem): void {
    if (this.selectedTest?.testId === test.testId) return;
    this.selectedTest = test;
    this.isDirty = false;
    this.rows = [];
    this.originalRows = [];
    this.loadBandResults(test.testId);
  }

  private loadBandResults(testId: string): void {
    this.resultsLoading = true;
    this.vmorService.getBandResults(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const mapped = this.mapDtoToRows(data);
          this.originalRows = mapped.map(r => ({ ...r }));
          this.rows = mapped.map(r => ({ ...r }));
          this.resultsLoading = false;
        },
        error: () => {
          this.resultsLoading = false;
        },
      });
  }

  private mapDtoToRows(data: VmorBandResultDto[]): VmorRow[] {
    return data
      .slice()
      .sort((a, b) => a.resultSeq - b.resultSeq)
      .map((d, i) => ({ sequence: i, result: d.result, description: d.resultDesc }));
  }

  deleteRow(row: VmorRow): void {
    this.rows = this.rows.filter(r => r !== row);
    this.resequence();
    this.isDirty = true;
  }

  onRowChange(): void {
    this.isDirty = true;
  }

  addNewResult(): void {
    this.rows = [...this.rows, { sequence: this.rows.length, result: '', description: '' }];
    this.isDirty = true;
  }

  clearAll(): void {
    this.rows = [];
    this.isDirty = true;
  }

  cancel(): void {
    this.rows = this.originalRows.map(r => ({ ...r }));
    this.resequence();
    this.isDirty = false;
  }

  save(): void {
    if (!this.selectedTest || this.hasIncompleteRows || this.isSaving) return;

    const payload = {
      testId: this.selectedTest.testId,
      bandResults: this.rows.map(r => ({ result: r.result.trim(), resultDesc: r.description.trim() })),
    };

    this.isSaving = true;
    this.vmorService.saveBandResults(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const mapped = this.mapDtoToRows(data);
          this.originalRows = mapped.map(r => ({ ...r }));
          this.rows = mapped.map(r => ({ ...r }));
          this.isDirty = false;
          this.isSaving = false;
          this.snackbarService.showSuccess(`Valid results updated successfully for test ${this.selectedTest!.testId}.`);
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }

  onDrop(event: CdkDragDrop<VmorRow[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const updated = [...this.rows];
      const [moved] = updated.splice(event.previousIndex, 1);
      updated.splice(event.currentIndex, 0, moved);
      this.rows = updated;
      this.resequence();
      this.isDirty = true;
    }
  }

  private resequence(): void {
    this.rows.forEach((r, i) => (r.sequence = i));
  }
}
