import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import {
  PrintTestsDialogData,
  PrintTestsDialogResult,
  TestBatchDetailDto,
} from '../../wks.models';

interface TestRow {
  testId: string;
  description: string;
  testKit: string;
}

@Component({
  selector: 'app-print-tests-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './print-tests-dialog.component.html',
  styleUrl: './print-tests-dialog.component.scss',
})
export class PrintTestsDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `print-tests-dialog-${PrintTestsDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly dialogRef = inject(MatDialogRef<PrintTestsDialogComponent>);

  // Search control
  protected readonly searchControl = new FormControl('');
  protected readonly searchTerm = signal<string>('');

  // Table data
  protected readonly tests = signal<TestRow[]>([]);
  protected readonly selection = new SelectionModel<TestRow>(true, []);

  // Computed filtered tests
  protected readonly filteredTests = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const allTests = this.tests();

    if (!search) return allTests;

    return allTests.filter(
      (test) =>
        test.testId.toLowerCase().includes(search) ||
        test.description.toLowerCase().includes(search) ||
        test.testKit.toLowerCase().includes(search)
    );
  });

  protected readonly displayedColumns = ['select', 'testId', 'description', 'testKit'];

  protected readonly isEmpty = computed(() => this.filteredTests().length === 0);
  protected readonly hasSelection = computed(() => this.selection.hasValue());

  constructor(@Inject(MAT_DIALOG_DATA) public data: PrintTestsDialogData) {
    // Subscribe to search control changes
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerm.set(value || '');
    });
  }

  ngOnInit(): void {
    // Convert API tests to table rows
    const testRows: TestRow[] = this.data.tests.map((test) => ({
      testId: test.testId,
      description: test.testDesc || '',
      testKit: test.testKitId || '–',
    }));

    this.tests.set(testRows);
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredTests().length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.filteredTests());
  }

  checkboxLabel(row?: TestRow): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row for ${row.testId}`;
  }

  onCancel(): void {
    const result: PrintTestsDialogResult = {
      selectedTestIds: [],
      action: 'cancel',
    };
    this.dialogRef.close(result);
  }

  onPrint(): void {
    const selectedTestIds = this.selection.selected.map((row) => row.testId);
    const result: PrintTestsDialogResult = {
      selectedTestIds,
      action: 'print',
    };
    this.dialogRef.close(result);
  }
}
