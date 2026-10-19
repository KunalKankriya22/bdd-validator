import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FieldConfigurationRow, FieldConfigurationDto } from '../../models/find-donor-block.model';
import { FindDonorBlockService } from '../../services/find-donor-block.service';
import { PageHeaderService } from '@shared/services/page-header.service';

@Component({
  selector: 'app-field-configuration',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SearchBar,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './field-configuration.html',
  styleUrls: ['./field-configuration.scss']
})
export class FieldConfigurationComponent implements OnInit, OnDestroy {
  programName: string = '';
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  headerConfig!: PageHeaderConfig;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Field Name',
    minLength: 1,
    ariaLabel: 'Search fields by field name',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  dataSource: FieldConfigurationRow[] = [];
  filteredData: FieldConfigurationRow[] = [];

  isEditModeActive = false;
  showValidationError = false;
  searchText = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  isLoading = false;
  isSaving = false;

  private destroy$ = new Subject<void>();
  private originalDataSnapshot: Map<string, FieldConfigurationRow> = new Map();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private findDonorBlockService: FindDonorBlockService,
    private cdr: ChangeDetectorRef,
    private pageHeaderService: PageHeaderService
  ) {}

  ngOnInit(): void {
    // Get route params
    this.activatedRoute.params.subscribe((params) => {
      if (params['programName']) {
        this.programName = params['programName'];
        this.initializeHeaderConfig();
        this.loadFieldConfigurations();
      }
    });
  }

  private initializeHeaderConfig(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    this.headerConfig = {
      title: this.programName || 'Field Configuration',
      subtitle: menuItem?.remarks || '',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Find Donor Configuration', link: '/application-administration/donor-restricted-validations/find-donor-block' },
        { label: 'Field Configuration', link: null }
      ],
      showBackButton: true,
      onBackClick: () => this.onBack()
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFieldConfigurations(): void {
    this.isLoading = true;

    this.findDonorBlockService
      .getFieldConfigurations(this.programName)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.dataSource = response.map(field => ({
            ...field,
            isEditMode: false,
            isNewRow: false
          }));
          this.filteredData = [...this.dataSource];
        },
        error: (error) => {
          console.error('Error loading field configurations:', error);
          this.snackBar.open('Failed to load field configurations', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    if (!searchText) {
      this.filteredData = [...this.dataSource];
    } else {
      this.filteredData = this.dataSource.filter(row =>
        row.fieldName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
  }

  enableEditMode(): void {
    this.isEditModeActive = true;
    this.showValidationError = false;
    // Store snapshot of original values for change detection
    this.originalDataSnapshot.clear();
    this.dataSource.forEach(row => {
      this.originalDataSnapshot.set(row.fieldName, { ...row });
    });
    // Make all rows editable
    this.dataSource = this.dataSource.map(row => ({
      ...row,
      isEditMode: true,
      originalFieldName: row.fieldName
    }));
    this.filteredData = [...this.dataSource];
  }

  addNewField(): void {
    const newRow: FieldConfigurationRow = {
      fieldName: '',
      required: false,
      numberOfEntries: null as any,
      functionCheck: false,
      protectedEntry: false,
      isEditMode: true,
      isNewRow: true,
      originalFieldName: ''
    };

    this.dataSource = [newRow, ...this.dataSource];
    this.filteredData = [newRow, ...this.filteredData];
    this.isEditModeActive = true;
  }

  saveAll(): void {
    // Validate all rows
    const hasEmptyFieldNames = this.dataSource.some(row => !row.fieldName || row.fieldName.trim() === '');
    const hasInvalidEntries = this.dataSource.some(row => row.numberOfEntries === null || row.numberOfEntries === undefined || row.numberOfEntries < 0);

    if (hasEmptyFieldNames || hasInvalidEntries) {
      this.showValidationError = true;

      // Mark invalid fields as touched to show errors - create new object references for change detection
      this.dataSource = this.dataSource.map(row => {
        const needsFieldNameTouch = !row.fieldName || row.fieldName.trim() === '';
        const needsNumberTouch = row.numberOfEntries === null || row.numberOfEntries === undefined || row.numberOfEntries < 0;

        if (needsFieldNameTouch || needsNumberTouch) {
          return {
            ...row,
            fieldNameTouched: needsFieldNameTouch ? true : row.fieldNameTouched,
            numberOfEntriesTouched: needsNumberTouch ? true : row.numberOfEntriesTouched
          };
        }
        return row;
      });

      // Update filtered data to reflect touched state
      this.filteredData = [...this.dataSource];

      // Force change detection to ensure error messages appear
      this.cdr.detectChanges();

      return;
    }

    this.showValidationError = false;

    const newRows = this.dataSource.filter(row => row.isNewRow);
    const modifiedRows = this.getModifiedExistingRows();

    if (newRows.length === 0 && modifiedRows.length === 0) {
      this.snackBar.open('No changes to save.', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      this.exitEditMode();
      return;
    }

    this.isSaving = true;

    // Build requests: POST for new rows, PUT for modified existing rows
    const requests: Observable<any>[] = [];

    if (newRows.length > 0) {
      const addRequests = newRows.map(row => {
        const dto = this.findDonorBlockService.mapFieldConfigToDto(row);
        return this.findDonorBlockService.addFieldConfiguration(this.programName, dto);
      });
      requests.push(...addRequests);
    }

    if (modifiedRows.length > 0) {
      const updateDtos: FieldConfigurationDto[] = modifiedRows.map(row =>
        this.findDonorBlockService.mapFieldConfigToDto(row)
      );
      requests.push(this.findDonorBlockService.updateFieldConfigurations(this.programName, updateDtos));
    }

    forkJoin(requests)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (responses: any[]) => {
          // Check if any response has success: false
          const failedResponse = responses.find((r: any) => r?.success === false);
          if (failedResponse) {
            const errorResponse = failedResponse?.errorResponse;
            const errorMsg = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (failedResponse?.message || 'Failed to save field configurations');
            this.snackBar.open(errorMsg, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          }

          const action = newRows.length > 0 ? 'saved' : 'updated';
          this.snackBar.open(`Fields for ${this.programName} ${action} successfully.`, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.exitEditMode();
          // Reload data to get fresh state from server
          this.loadFieldConfigurations();
        },
        error: (err) => {
          const errorResponse = err?.error?.errorResponse;
          const message = errorResponse
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : 'Failed to save field configurations';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private getModifiedExistingRows(): FieldConfigurationRow[] {
    return this.dataSource.filter(row => {
      if (row.isNewRow) return false;
      const original = this.originalDataSnapshot.get(row.originalFieldName || row.fieldName);
      if (!original) return false;
      return (
        row.fieldName !== original.fieldName ||
        row.required !== original.required ||
        row.numberOfEntries !== original.numberOfEntries ||
        row.functionCheck !== original.functionCheck ||
        row.protectedEntry !== original.protectedEntry
      );
    });
  }

  private exitEditMode(): void {
    this.isEditModeActive = false;
    this.dataSource = this.dataSource.map(row => ({
      ...row,
      isEditMode: false,
      isNewRow: false
    }));
    this.filteredData = [...this.dataSource];
  }

  cancelEdit(): void {
    this.isEditModeActive = false;
    this.showValidationError = false;
    // Remove unsaved new rows and reset edit state on existing rows immediately
    this.dataSource = this.dataSource
      .filter(row => !row.isNewRow)
      .map(row => ({
        ...row,
        isEditMode: false,
        fieldNameTouched: false,
        numberOfEntriesTouched: false
      }));
    this.filteredData = [...this.dataSource];
    // Reload original data from server
    this.loadFieldConfigurations();
  }

  deleteRow(row: FieldConfigurationRow): void {
    if (row.isNewRow) {
      // New row not yet saved - just remove locally
      this.removeRowFromArrays(row);
      return;
    }

    // Existing row - call DELETE API
    row.isDeleting = true;
    this.findDonorBlockService
      .deleteFieldConfiguration(this.programName, row.fieldName)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          row.isDeleting = false;
        })
      )
      .subscribe({
        next: () => {
          this.removeRowFromArrays(row);
          this.snackBar.open('Field deleted successfully.', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          const errorResponse = err?.error?.errorResponse;
          const message = errorResponse
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : 'Failed to delete field';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private removeRowFromArrays(row: FieldConfigurationRow): void {
    this.dataSource = this.dataSource.filter(r => r !== row);
    this.filteredData = this.filteredData.filter(r => r !== row);

    // Check if there are any rows left in edit mode
    const hasEditableRows = this.dataSource.some(r => r.isEditMode);
    if (!hasEditableRows) {
      this.isEditModeActive = false;
      this.showValidationError = false;
    }
  }

  onFieldNameChange(row: FieldConfigurationRow, value: string): void {
    row.fieldName = value;
    this.clearValidationErrorIfAllValid();
  }

  onFieldNameBlur(row: FieldConfigurationRow): void {
    row.fieldNameTouched = true;
    if (!row.fieldName || row.fieldName.trim() === '') {
      this.showValidationError = true;
    }
  }

  onRequiredChange(row: FieldConfigurationRow, checked: boolean): void {
    row.required = checked;
  }

  onNumberOfEntriesChange(row: FieldConfigurationRow, value: string): void {
    if (value === '' || value === null || value === undefined) {
      row.numberOfEntries = null as any;
    } else {
      let numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        row.numberOfEntries = null as any;
      } else {
        if (numValue > 42) numValue = 42;
        row.numberOfEntries = numValue;
      }
    }
    this.clearValidationErrorIfAllValid();
  }

  onNumberOfEntriesKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    // Allow select all, copy, paste, cut
    if (event.ctrlKey || event.metaKey) return;
    // Block non-digit keys
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
      return;
    }
    // Block if already 2 digits and no text is selected
    const selectionLength = (input.selectionEnd || 0) - (input.selectionStart || 0);
    if (input.value.length >= 2 && selectionLength === 0) {
      event.preventDefault();
    }
  }

  onNumberOfEntriesBlur(row: FieldConfigurationRow): void {
    row.numberOfEntriesTouched = true;
    if (row.numberOfEntries === null || row.numberOfEntries === undefined || row.numberOfEntries < 0) {
      this.showValidationError = true;
    }
  }

  onFunctionCheckChange(row: FieldConfigurationRow, checked: boolean): void {
    row.functionCheck = checked;
  }

  onProtectedEntryChange(row: FieldConfigurationRow, checked: boolean): void {
    row.protectedEntry = checked;
  }

  private clearValidationErrorIfAllValid(): void {
    const hasInvalid = this.dataSource.some(row =>
      (!row.fieldName || row.fieldName.trim() === '') ||
      (row.numberOfEntries === null || row.numberOfEntries === undefined || row.numberOfEntries < 0)
    );
    if (!hasInvalid) {
      this.showValidationError = false;
    }
  }

  getRequiredTooltip(): string {
    return 'This field is required and cannot be left blank.';
  }

  get isSaveEnabled(): boolean {
    if (this.dataSource.length === 0) return false;

    // All rows must be valid
    const allValid = this.dataSource.every(row => {
      const hasFieldName = row.fieldName && row.fieldName.trim() !== '';
      const hasValidEntries = row.numberOfEntries !== null && row.numberOfEntries !== undefined && row.numberOfEntries >= 0;
      return hasFieldName && hasValidEntries;
    });
    if (!allValid) return false;

    // Must have at least one new row or one modified existing row
    const hasNewRows = this.dataSource.some(row => row.isNewRow);
    const hasModifiedRows = this.getModifiedExistingRows().length > 0;
    return hasNewRows || hasModifiedRows;
  }

  formatBoolean(value: boolean): string {
    return value ? 'Yes' : 'No';
  }

  onBack(): void {
    this.router.navigate(['/application-administration/donor-restricted-validations/find-donor-block']);
  }

  onSort(): void {
    // Cycle through: '' -> asc -> desc -> ''
    if (this.sortDirection === '') {
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = '';
    }

    this.applySort();
  }

  private applySort(): void {
    if (this.sortDirection === '') {
      // Reset to original order
      this.filteredData = [...this.dataSource];
    } else {
      this.filteredData = [...this.filteredData].sort((a, b) => {
        const comparison = a.fieldName.localeCompare(b.fieldName);
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
  }

  getSortIcon(): string {
    if (this.sortDirection === '') {
      return 'unfold_more';
    } else if (this.sortDirection === 'asc') {
      return 'arrow_upward';
    } else {
      return 'arrow_downward';
    }
  }
}
