import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AntigenTestDetailDto, TestExclusionItem } from '../../models/donor-rbc-ag-query.model';

/**
 * Dialog data interface for excluding units
 */
export interface ExcludeUnitsDialogData {
  antigenCode: string;
  resultCode: string | null;
  confirmDate: string | null;
  serologicalTests: AntigenTestDetailDto[];
  molecularTests: AntigenTestDetailDto[];
}

/**
 * Dialog result interface
 */
export interface ExcludeUnitsDialogResult {
  action: 'save' | 'cancel';
  serologicalExclusions?: TestExclusionItem[];
  molecularExclusions?: TestExclusionItem[];
}

/**
 * Internal test row with selection state
 */
interface TestRowWithSelection extends AntigenTestDetailDto {
  selected: boolean;
}

@Component({
  selector: 'app-exclude-units-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './exclude-units-dialog.html',
  styleUrl: './exclude-units-dialog.scss',
})
export class ExcludeUnitsDialog {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `exclude-units-dialog-${ExcludeUnitsDialog.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly tableId = (type: string) => `${this.componentId}-${type}-table`;

  private readonly dialogRef = inject(MatDialogRef<ExcludeUnitsDialog>);
  readonly data: ExcludeUnitsDialogData = inject(MAT_DIALOG_DATA);

  // Table columns
  displayedColumns = ['select', 'unitId', 'testId', 'result', 'collectionDate', 'confirm', 'luaFlag'];

  // Test data with selection state
  protected readonly serologicalTestsWithSelection = signal<TestRowWithSelection[]>([]);
  protected readonly molecularTestsWithSelection = signal<TestRowWithSelection[]>([]);

  protected readonly hasSerologicalTests = computed(() => {
    return this.serologicalTestsWithSelection().length > 0;
  });

  protected readonly hasMolecularTests = computed(() => {
    return this.molecularTestsWithSelection().length > 0;
  });

  constructor() {
    // Initialize serological tests with selection state
    this.serologicalTestsWithSelection.set(
      (this.data.serologicalTests || []).map(test => ({
        ...test,
        selected: test.excludeFlag === 'Y'
      }))
    );

    // Initialize molecular tests with selection state
    this.molecularTestsWithSelection.set(
      (this.data.molecularTests || []).map(test => ({
        ...test,
        selected: test.excludeFlag === 'Y'
      }))
    );
  }

  toggleSerologicalTest(test: TestRowWithSelection): void {
    const tests = this.serologicalTestsWithSelection();
    const index = tests.findIndex(t => t.testSeqNo === test.testSeqNo);
    if (index !== -1) {
      const updated = [...tests];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      this.serologicalTestsWithSelection.set(updated);
    }
  }

  toggleMolecularTest(test: TestRowWithSelection): void {
    const tests = this.molecularTestsWithSelection();
    const index = tests.findIndex(t => t.testSeqNo === test.testSeqNo);
    if (index !== -1) {
      const updated = [...tests];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      this.molecularTestsWithSelection.set(updated);
    }
  }

  onSave(): void {
    const serologicalExclusions: TestExclusionItem[] = this.serologicalTestsWithSelection()
      .map(test => ({
        unitId: test.unitId || '',
        testSeqNo: test.testSeqNo,
        excludeFlag: test.selected ? 'Y' : 'N'
      }));

    const molecularExclusions: TestExclusionItem[] = this.molecularTestsWithSelection()
      .map(test => ({
        unitId: test.unitId || '',
        testSeqNo: test.testSeqNo,
        excludeFlag: test.selected ? 'Y' : 'N'
      }));

    this.dialogRef.close({
      action: 'save',
      serologicalExclusions,
      molecularExclusions,
    } as ExcludeUnitsDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as ExcludeUnitsDialogResult);
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Get result badge style
   */
  getResultBadgeClass(result: string | null): string {
    if (!result) return 'result-badge';
    if (result === '+' || result.toUpperCase().includes('POS')) return 'result-badge positive';
    if (result === '-' || result.toUpperCase().includes('NEG')) return 'result-badge negative';
    return 'result-badge indeterminate';
  }
}
