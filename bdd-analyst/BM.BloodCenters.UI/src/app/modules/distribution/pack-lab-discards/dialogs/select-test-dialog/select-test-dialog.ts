import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

export interface SelectTestDialogData {
  availableTests: { testId: string; testDesc: string; testGroup: string }[];
  selectedTestIds: string[];
}

@Component({
  selector: 'app-select-test-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule, MatDividerModule],
  templateUrl: './select-test-dialog.html',
  styleUrl: './select-test-dialog.scss'
})
export class SelectTestDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `select-test-dialog-${SelectTestDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  readonly data = inject<SelectTestDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SelectTestDialogComponent>);

  protected readonly selectBy = signal<'ALL' | 'GROUP'>('ALL');
  protected readonly selectedGroupId = signal<string>('');

  // Get unique group IDs for the Group ID dropdown
  protected readonly groupIds = computed(() => {
    const groups = new Set(this.data.availableTests.map(t => t.testGroup));
    return Array.from(groups).sort();
  });

  // Contract description based on selected group
  protected readonly contractDescription = computed(() => {
    const groupId = this.selectedGroupId();
    if (!groupId) return '-';
    // Get description from the first test in the group
    const test = this.data.availableTests.find(t => t.testGroup === groupId);
    return test ? `${test.testGroup} Tests` : '-';
  });

  // Filtered tests based on selectBy mode
  protected readonly filteredTests = computed(() => {
    if (this.selectBy() === 'GROUP' && this.selectedGroupId()) {
      return this.data.availableTests.filter(t => t.testGroup === this.selectedGroupId());
    }
    return this.data.availableTests;
  });

  // Track selected test IDs as a Set
  protected selectedIds = signal<Set<string>>(new Set());

  protected readonly isAllSelected = computed(() => {
    const filtered = this.filteredTests();
    if (filtered.length === 0) return false;
    return filtered.every(t => this.selectedIds().has(t.testId));
  });

  protected readonly isIndeterminate = computed(() => {
    const filtered = this.filteredTests();
    const selected = filtered.filter(t => this.selectedIds().has(t.testId));
    return selected.length > 0 && selected.length < filtered.length;
  });

  ngOnInit(): void {
    // Pre-select tests that were already selected
    const initial = new Set(this.data.selectedTestIds || []);
    this.selectedIds.set(initial);
  }

  protected onSelectByChange(value: 'ALL' | 'GROUP'): void {
    this.selectBy.set(value);
    if (value === 'ALL') this.selectedGroupId.set('');
  }

  protected onGroupChange(groupId: string): void {
    this.selectedGroupId.set(groupId);
  }

  protected onToggleAll(checked: boolean): void {
    const ids = new Set(this.selectedIds());
    this.filteredTests().forEach(t => {
      if (checked) ids.add(t.testId);
      else ids.delete(t.testId);
    });
    this.selectedIds.set(ids);
  }

  protected onToggleTest(testId: string, checked: boolean): void {
    const ids = new Set(this.selectedIds());
    if (checked) ids.add(testId);
    else ids.delete(testId);
    this.selectedIds.set(ids);
  }

  protected isTestSelected(testId: string): boolean {
    return this.selectedIds().has(testId);
  }

  protected onProceed(): void {
    const selectedTests = this.data.availableTests.filter(t => this.selectedIds().has(t.testId));
    this.dialogRef.close(selectedTests);
  }

  protected onGoBack(): void {
    this.dialogRef.close(null);
  }
}
