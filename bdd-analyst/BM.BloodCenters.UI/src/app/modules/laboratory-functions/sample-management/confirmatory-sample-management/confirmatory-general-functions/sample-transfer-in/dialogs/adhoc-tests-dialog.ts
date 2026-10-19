import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface AdhocTestsDialogData {
  tests: Array<{ testId: string; testDesc: string; testGroup: string }>;
  previouslySelected: string[];
}

export interface AdhocTestsDialogResult {
  selectedTestIds: string[];
}

@Component({
  selector: 'app-adhoc-tests-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCheckboxModule,
  ],
  template: `
    <div class="adhoc-dialog">
      <div class="adhoc-dialog__header">
        <h2>Adhoc Tests</h2>
        <button mat-icon-button (click)="onCancel()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="adhoc-dialog__search">
        <mat-form-field appearance="fill" floatLabel="always" subscriptSizing="dynamic" class="search-field">
          <mat-label>Search Tests</mat-label>
          <input matInput [formControl]="searchCtrl" placeholder="Filter by ID or description">
        </mat-form-field>
      </div>

      <div class="adhoc-dialog__content">
        <div class="test-table">
          <div class="test-table__header">
            <span class="col-check"></span>
            <span class="col-id">Test ID</span>
            <span class="col-desc">Description</span>
            <span class="col-group">Group</span>
          </div>
          @for (t of filteredTests(); track t.testId) {
            <div class="test-table__row" (click)="toggleTest(t.testId)">
              <span class="col-check">
                <mat-checkbox [checked]="isSelected(t.testId)" (click)="$event.stopPropagation()" (change)="toggleTest(t.testId)" color="primary"></mat-checkbox>
              </span>
              <span class="col-id">{{ t.testId }}</span>
              <span class="col-desc">{{ t.testDesc }}</span>
              <span class="col-group">{{ t.testGroup }}</span>
            </div>
          }
          @if (filteredTests().length === 0) {
            <div class="test-table__empty">No tests found.</div>
          }
        </div>
      </div>

      <div class="adhoc-dialog__footer">
        <button mat-stroked-button (click)="onCancel()">CANCEL</button>
        <button mat-raised-button color="primary" (click)="onConfirm()">CONFIRM</button>
      </div>
    </div>
  `,
  styles: [`
    .adhoc-dialog { display: flex; flex-direction: column; height: 100%; }
    .adhoc-dialog__header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; }
    .adhoc-dialog__header h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .adhoc-dialog__search { padding: 12px 16px 0; }
    .search-field { width: 100%; }
    .adhoc-dialog__content { flex: 1; overflow-y: auto; padding: 0 16px; }
    .test-table__header, .test-table__row { display: flex; align-items: center; padding: 6px 0; font-size: 13px; }
    .test-table__header { font-weight: 600; border-bottom: 2px solid #e0e0e0; position: sticky; top: 0; background: white; }
    .test-table__row { border-bottom: 1px solid #f0f0f0; cursor: pointer; }
    .test-table__row:hover { background: #f5f5f5; }
    .col-check { width: 40px; flex-shrink: 0; }
    .col-id { width: 100px; flex-shrink: 0; }
    .col-desc { flex: 1; }
    .col-group { width: 80px; flex-shrink: 0; }
    .test-table__empty { padding: 24px; text-align: center; color: #999; }
    .adhoc-dialog__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid #e0e0e0; }
  `],
})
export class AdhocTestsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AdhocTestsDialogComponent>);
  readonly data: AdhocTestsDialogData = inject(MAT_DIALOG_DATA);

  searchCtrl = new FormControl<string>('');
  private selectedIds = signal<Set<string>>(new Set(this.data.previouslySelected || []));

  filteredTests = computed(() => {
    const term = (this.searchCtrl.value || '').toUpperCase().trim();
    const all = this.data.tests || [];
    if (!term) return all;
    return all.filter(t =>
      t.testId.toUpperCase().includes(term) || t.testDesc.toUpperCase().includes(term),
    );
  });

  isSelected(testId: string): boolean {
    return this.selectedIds().has(testId);
  }

  toggleTest(testId: string): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(testId)) { next.delete(testId); } else { next.add(testId); }
      return next;
    });
  }

  onConfirm(): void {
    this.dialogRef.close({ selectedTestIds: Array.from(this.selectedIds()) } as AdhocTestsDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
