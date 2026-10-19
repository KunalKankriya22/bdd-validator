import { Component, Inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import {
  MultiSelectInterdictionsDialogData,
  MultiSelectInterdictionsDialogResult,
  SelectableInterdiction
} from '../models/interdiction-query.model';
import { InterdictionQueryService } from '../../../../query-interdictions-holds/services/interdiction-query.service';
import { InterdictionType, InterdictionCode, VALIDATION_MESSAGES } from '../../../../query-interdictions-holds/models/interdiction-query.model';

@Component({
  selector: 'app-multi-select-interdictions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './multi-select-interdictions-dialog.component.html',
  styleUrls: ['./multi-select-interdictions-dialog.component.scss']
})
export class MultiSelectInterdictionsDialogComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  isLoading = signal(false);

  // Dropdown options
  interdictionTypes: InterdictionType[] = [];
  interdictionCodes: InterdictionCode[] = [];

  // Table data
  queryResults = signal<SelectableInterdiction[]>([]);
  displayedColumns: string[] = ['select', 'interdictionCode', 'description', 'effectiveDate', 'terminationDate'];

  // Sort state
  currentSortDirection: 'asc' | 'desc' | null = null;

  // Selection state
  selectedInterdictions = computed(() =>
    this.queryResults().filter(row => row.selected)
  );

  // Track initial state to detect changes
  private initialSelectedCodes: string[] = [];
  private initialLogicalOperation: 'AND' | 'OR' = 'OR';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private interdictionQueryService: InterdictionQueryService,
    public dialogRef: MatDialogRef<MultiSelectInterdictionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MultiSelectInterdictionsDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    // Capture initial state for change detection
    this.initialSelectedCodes = [...(this.data.selectedCodes || [])];
    this.initialLogicalOperation = this.data.mode || 'OR';

    // Use passed interdiction types if available, otherwise load from API
    if (this.data?.availableInterdictionTypes && this.data.availableInterdictionTypes.length > 0) {
      this.interdictionTypes = this.data.availableInterdictionTypes;

      const defaultType = this.getDefaultInterType();
      if (defaultType) {
        this.filterForm.patchValue({
          interdictionType: defaultType,
          description: defaultType.description
        });
      }

      if (this.hasPreviousSelections()) {
        this.autoRetrieveCodes();
      }
    } else {
      this.loadInterdictionTypes();
    }

    this.subscribeToInterdictionTypeChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      interdictionType: [null, Validators.required],
      description: [''],
      logicalOperation: [this.data.mode || 'OR', Validators.required]
    });
  }

  /**
   * Subscribe to interdiction type changes to auto-populate description
   */
  private subscribeToInterdictionTypeChanges(): void {
    this.filterForm.get('interdictionType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedType: InterdictionType) => {
        const description = selectedType?.description || '';
        this.filterForm.patchValue({ description }, { emitEvent: false });
      });
  }

  compareTypes(a: InterdictionType, b: InterdictionType): boolean {
    return a?.code === b?.code && a?.description === b?.description;
  }

  private loadInterdictionTypes(): void {
    this.interdictionQueryService
      .getValidInterdictionTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.interdictionTypes = (response.data || [])
            .filter(type => type.code)
            .sort((a, b) => a.code.localeCompare(b.code));

          const defaultType = this.getDefaultInterType();
          if (defaultType) {
            this.filterForm.patchValue({ interdictionType: defaultType });
          }

          if (this.hasPreviousSelections()) {
            this.autoRetrieveCodes();
          }
        },
        error: () => {
          this.showErrorMessage('Failed to load interdiction types');
        }
      });
  }

  private getDefaultInterType(): InterdictionType | null {
    if (this.data.selectedInterType) {
      const match = this.interdictionTypes.find(
        t => t.code === this.data.selectedInterType!.code && t.description === this.data.selectedInterType!.description
      );
      if (match) return match;
    }
    return this.interdictionTypes.find(t => t.code === 'INTER') || this.interdictionTypes[0] || null;
  }

  private hasPreviousSelections(): boolean {
    return !!(this.data.selectedCodes && this.data.selectedCodes.length > 0);
  }

  private autoRetrieveCodes(): void {
    const interType = this.filterForm.value.interdictionType?.code;
    if (!interType) return;

    this.isLoading.set(true);
    this.interdictionQueryService
      .getInterdictionCodesByType(interType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes: InterdictionCode[]) => {
          const results: SelectableInterdiction[] = codes.map((code: InterdictionCode) => ({
            selected: this.data.selectedCodes?.includes(code.code) || false,
            interdictionCode: code.code,
            description: code.description,
            effectiveDate: code.effDate || '',
            terminationDate: ''
          }));
          this.queryResults.set(results);
          this.isLoading.set(false);
        },
        error: () => {
          this.showErrorMessage('Failed to retrieve interdiction codes');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * RETRIEVE button handler - fetches interdictions based on filter criteria
   */
  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.filterForm.value;
    const interType = formValue.interdictionType?.code;

    this.interdictionQueryService
      .getInterdictionCodesByType(interType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes: InterdictionCode[]) => {
          const results: SelectableInterdiction[] = codes.map((code: InterdictionCode) => ({
            selected: this.data.selectedCodes?.includes(code.code) || false,
            interdictionCode: code.code,
            description: code.description,
            effectiveDate: code.effDate || '',
            terminationDate: ''
          }));

          this.queryResults.set(results);
          this.isLoading.set(false);
        },
        error: () => {
          this.showErrorMessage('Failed to retrieve interdiction codes');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Toggle individual row selection
   */
  toggleRow(row: SelectableInterdiction): void {
    const results = this.queryResults();
    const index = results.findIndex(r => r.interdictionCode === row.interdictionCode);
    if (index !== -1) {
      results[index].selected = row.selected;
      this.queryResults.set([...results]);
    }
  }

  /**
   * Toggle all rows selection
   */
  toggleAll(): void {
    const results = this.queryResults();
    const allSelected = this.isAllSelected();

    const updated = results.map(row => ({
      ...row,
      selected: !allSelected
    }));

    this.queryResults.set(updated);
  }

  /**
   * Check if all rows are selected
   */
  isAllSelected(): boolean {
    const results = this.queryResults();
    return results.length > 0 && results.every(row => row.selected);
  }

  /**
   * Check if some (but not all) rows are selected
   */
  isSomeSelected(): boolean {
    const results = this.queryResults();
    const selectedCount = results.filter(row => row.selected).length;
    return selectedCount > 0 && selectedCount < results.length;
  }

  /**
   * Toggle sort direction for interdiction code column
   */
  toggleSort(): void {
    // Default to descending on first click
    if (this.currentSortDirection === null) {
      this.currentSortDirection = 'desc';
    } else if (this.currentSortDirection === 'desc') {
      this.currentSortDirection = 'asc';
    } else {
      this.currentSortDirection = 'desc';
    }

    this.sortData();
  }

  /**
   * Sort the data based on current sort direction
   */
  private sortData(): void {
    if (this.currentSortDirection === null) {
      return;
    }

    const results = [...this.queryResults()];
    const isAsc = this.currentSortDirection === 'asc';

    const sorted = results.sort((a, b) => {
      return this.compare(a.interdictionCode, b.interdictionCode, isAsc);
    });

    this.queryResults.set(sorted);
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Get the sort icon based on current sort state
   */
  getSortIcon(): string {
    if (this.currentSortDirection === 'asc') {
      return 'arrow_upward';
    } else if (this.currentSortDirection === 'desc') {
      return 'arrow_downward';
    }
    return 'unfold_more';
  }

  /**
   * Check if sort is active
   */
  isSortActive(): boolean {
    return this.currentSortDirection !== null;
  }

  /**
   * Check if there are any changes from initial state
   * Returns true if either selected codes or logical operation has changed
   */
  hasChanges(): boolean {
    const currentSelectedCodes = this.selectedInterdictions().map(s => s.interdictionCode).sort();
    const initialCodes = [...this.initialSelectedCodes].sort();
    const currentLogicalOperation = this.filterForm.value.logicalOperation;

    // Check if logical operation changed
    if (currentLogicalOperation !== this.initialLogicalOperation) {
      return true;
    }

    // Check if selected codes changed (length or content)
    if (currentSelectedCodes.length !== initialCodes.length) {
      return true;
    }

    // Check if any code is different
    for (let i = 0; i < currentSelectedCodes.length; i++) {
      if (currentSelectedCodes[i] !== initialCodes[i]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if there are any selections
   */
  hasSelections(): boolean {
    return this.selectedInterdictions().length > 0;
  }

  /**
   * Check if APPLY button should be enabled
   * Enabled when there are changes from initial state (including clearing all selections)
   */
  canApply(): boolean {
    return this.hasChanges();
  }

  /**
   * APPLY button handler - returns selected interdictions to parent
   */
  onApply(): void {
    const selected = this.selectedInterdictions();
    const selectedCodes = selected.map(s => s.interdictionCode);

    // No interdiction code selected (Oracle error '17026')
    // Only show error if no selections AND no initial selections (i.e., no actual change)
    // Allow zero selections when clearing previous selections (valid state change)
    if (selectedCodes.length === 0 && this.initialSelectedCodes.length === 0) {
      this.showErrorMessage(`Error ${VALIDATION_MESSAGES.NO_INTER_SELECTED}: Please select at least one interdiction code`);
      return;
    }

    // Maximum 130 interdictions exceeded (Oracle error '16221')
    if (selectedCodes.length > 130) {
      this.showErrorMessage(`Error ${VALIDATION_MESSAGES.MAX_INTER_EXCEEDED}: Maximum 130 interdictions exceeded. Please reduce your selection.`);
      return;
    }

    const logicalOperation = this.filterForm.value.logicalOperation;

    // Format display string (max 50 chars with ellipsis)
    const fullString = selectedCodes.join(', ');
    const displayString = fullString.length > 50
      ? fullString.substring(0, 47) + '...'
      : fullString;

    const currentInterType = this.filterForm.value.interdictionType;
    const result: MultiSelectInterdictionsDialogResult = {
      success: true,
      selectedInterdictions: selected,
      selectedCodes: selectedCodes,
      selectedInterType: currentInterType ? { code: currentInterType.code, description: currentInterType.description } : undefined,
      logicalOperation: logicalOperation,
      displayString: displayString
    };

    this.dialogRef.close(result);
  }

  /**
   * CLOSE button handler
   */
  onClose(): void {
    const result: MultiSelectInterdictionsDialogResult = { success: false };
    this.dialogRef.close(result);
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
