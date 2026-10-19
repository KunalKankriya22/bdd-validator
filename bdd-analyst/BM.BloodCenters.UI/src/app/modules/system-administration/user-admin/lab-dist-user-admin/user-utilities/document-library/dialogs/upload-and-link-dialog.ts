import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FileUploadZoneComponent, FileUploadEvent } from '@shared/components/file-upload-zone/file-upload-zone';
import { ValueChipsInputComponent, ValueValidationEvent } from '@shared/components/value-chips-input/value-chips-input';
import { DocumentLibraryApiService } from '../services/document-library-api.service';
import { TableColumnLink, UploadMetadata } from '../models/document-library.model';

/**
 * Validator: No spaces allowed in the field
 */
function noSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'string' && /\s/.test(value)) {
      return { noSpaces: true };
    }
    return null;
  };
}

/**
 * Upload and Link Document Dialog Component
 * Two-step dialog for uploading a document and linking it to table values
 */
@Component({
  selector: 'app-upload-and-link-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DataTable,
    SearchBar,
    FileUploadZoneComponent,
    ValueChipsInputComponent
  ],
  templateUrl: './upload-and-link-dialog.html',
  styleUrl: './upload-and-link-dialog.scss'
})
export class UploadAndLinkDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private apiService = inject(DocumentLibraryApiService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<UploadAndLinkDialogComponent>);
  private destroy$ = new Subject<void>();

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('linkTable') linkTable!: DataTable<TableColumnLink>;
  @ViewChild('valueChipsInput') valueChipsInput!: ValueChipsInputComponent;

  uploadFormGroup!: FormGroup;
  selectedFile: File | null = null;
  uploadProgress = 0;
  valuesRequiredError = false;
  isUploading = false;

  // Link step data
  searchText = '';
  selectedLink: TableColumnLink | null = null;
  availableLinks: TableColumnLink[] = [];
  filteredLinks: TableColumnLink[] = [];
  isLoadingLinks = false;
  selectedValues: string[] = [];
  private uploadProgressInterval: ReturnType<typeof setInterval> | null = null;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 0,
    ariaLabel: 'Search link tables',
    debounceTime: 0,
    searchOnEnterOnly: false
  };

  linkTableConfig: DataTableConfig<TableColumnLink> = {
    columns: [
      { key: 'linkWith', header: 'Link With', sortable: true },
      { key: 'linkTable', header: 'Link Table', sortable: false },
      { key: 'linkColumn', header: 'Link Columns', sortable: false }
    ],
    sortConfig: {
      column: 'linkWith',
      direction: 'default'
    },
    stickyHeader: true,
    enableSelection: true,
    enableRowHighlight: true,
    emptyMessage: 'No link categories found',
    showTableOnEmpty: false
  };

  ngOnInit(): void {
    this.initializeForm();
    this.loadLinkCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.uploadProgressInterval) {
      clearInterval(this.uploadProgressInterval);
    }
  }

  private initializeForm(): void {
    this.uploadFormGroup = this.fb.group({
      docType: [{ value: '', disabled: true }],
      docName: ['', [Validators.required, Validators.maxLength(50)]],
      docId: ['', [Validators.required, Validators.maxLength(30), noSpacesValidator()]]
    });
  }

  private loadLinkCategories(): void {
    this.isLoadingLinks = true;
    this.apiService.getLinkCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (links) => {
          this.availableLinks = links;
          this.filteredLinks = [...links];
          this.isLoadingLinks = false;
        },
        error: () => {
          this.isLoadingLinks = false;
        }
      });
  }

  /**
   * Handle file selection from shared component
   */
  onFileSelected(event: FileUploadEvent): void {
    if (!event.isValid) {
      this.showError(event.error || 'Invalid file');
      return;
    }

    this.selectedFile = event.file;
    const fileExtension = event.file.name.split('.').pop() || '';

    this.uploadFormGroup.patchValue({
      docName: event.file.name,
      docType: fileExtension.toUpperCase()
    });

    this.uploadFormGroup.get('docName')?.markAsTouched();

    // Start upload progress simulation immediately
    this.startUploadSimulation();
  }

  /**
   * Handle file removal from shared component
   */
  onFileRemoved(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.uploadFormGroup.reset();

    // Clear upload progress interval
    if (this.uploadProgressInterval) {
      clearInterval(this.uploadProgressInterval);
      this.uploadProgressInterval = null;
    }
  }

  preventSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  canProceedToLink(): boolean {
    return !!this.selectedFile && this.uploadFormGroup.valid && this.uploadProgress === 100;
  }

  onProceedToLink(): void {
    if (!this.canProceedToLink()) {
      return;
    }

    // Move to the next step
    if (this.stepper) {
      this.stepper.next();
      // Remove focus from the NEXT button and stepper
      this.removeFocus();
    }
  }

  private removeFocus(): void {
    setTimeout(() => {
      // Double setTimeout to ensure it runs after all event handlers
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 0);
    }, 0);
  }

  /**
   * Start simulating upload progress
   */
  private startUploadSimulation(): void {
    // Clear any existing interval
    if (this.uploadProgressInterval) {
      clearInterval(this.uploadProgressInterval);
    }

    this.uploadProgress = 0;
    this.uploadProgressInterval = setInterval(() => {
      if (this.uploadProgress < 100) {
        const randomIncrement = Math.floor(Math.random() * 15) + 5;
        this.uploadProgress = Math.min(this.uploadProgress + randomIncrement, 100);
      } else {
        if (this.uploadProgressInterval) {
          clearInterval(this.uploadProgressInterval);
          this.uploadProgressInterval = null;
        }
      }
    }, 200);
  }

  onSearch(searchTerm: string): void {
    this.filterAndSort(searchTerm);
  }

  private filterLinks(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredLinks = [...this.availableLinks];
      return;
    }

    this.filteredLinks = this.availableLinks.filter(link =>
      link.linkWith.toLowerCase().includes(term) ||
      link.linkTable.toLowerCase().includes(term) ||
      link.linkColumn.toLowerCase().includes(term)
    );
  }

  onSortChange(event: TableSortEvent): void {
    if (this.linkTableConfig.sortConfig) {
      this.linkTableConfig.sortConfig.column = event.column;
      this.linkTableConfig.sortConfig.direction = event.direction;
    }

    this.filterAndSort(this.searchText);
  }

  private filterAndSort(searchTerm: string): void {
    // First apply filter
    this.filterLinks(searchTerm);

    // Then apply sort if needed
    if (!this.linkTableConfig.sortConfig || this.linkTableConfig.sortConfig.direction === 'default') {
      return;
    }

    const column = this.linkTableConfig.sortConfig.column;
    const direction = this.linkTableConfig.sortConfig.direction;

    this.filteredLinks.sort((a, b) => {
      const aValue = (a as any)[column] || '';
      const bValue = (b as any)[column] || '';

      if (direction === 'A') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  }

  onSelectLink(link: TableColumnLink): void {
    this.handleLinkChange(link);
    this.enforceSingleSelection(link);
    this.removeFocus();
  }

  onLinkSelectionChange(selectedRows: TableColumnLink[]): void {
    if (selectedRows.length > 0) {
      const lastSelected = selectedRows[selectedRows.length - 1];
      this.handleLinkChange(lastSelected);
      this.enforceSingleSelection(lastSelected);
      this.removeFocus();
    }
  }

  private handleLinkChange(newLink: TableColumnLink): void {
    // Check if link has changed and we have values
    if (this.selectedLink &&
        this.selectedLink.linkWith !== newLink.linkWith &&
        this.selectedValues.length > 0) {
      this.selectedValues = [];
      this.valuesRequiredError = false;
      this.showInfo('Previous values were cleared due to link table change');
    }
    this.selectedLink = newLink;
  }

  private enforceSingleSelection(link: TableColumnLink): void {
    if (!this.linkTable) return;
    this.linkTable.selectedRows = [link];
    this.linkTable.selectedIds.clear();
    this.linkTable.selectedIds.add(link.linkWith);
    this.linkTable.activeRow = link;
  }

  /**
   * Handle value validation from shared component
   */
  onValidateValue(event: ValueValidationEvent): void {
    if (!this.selectedLink) {
      event.callback(false, 'Please select a link table first');
      this.showError('Please select a link table before adding values');
      return;
    }

    // Validate value with API
    this.apiService.validateValue(
      this.selectedLink.linkTable,
      this.selectedLink.linkColumn,
      event.value
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isValid) => {
          if (isValid) {
            event.callback(true);
            this.showSuccess('Value added successfully');
          } else {
            event.callback(false, 'Value does not exist in the selected table');
          }
        }
      });
  }

  onValueAdded(): void {
    // Clear error when a value is added
    this.valuesRequiredError = false;
  }

  onValueRemoved(): void {
    // Show error if all values are removed
    if (this.selectedValues.length === 0 && this.selectedLink) {
      this.valuesRequiredError = true;
    }
  }

  onValueFieldBlur(): void {
    // Validate when field loses focus
    if (this.selectedLink && this.selectedValues.length === 0) {
      this.valuesRequiredError = true;
    }
  }

  canUploadAndLink(): boolean {
    return !!this.selectedFile &&
           !!this.selectedLink &&
           this.selectedValues.length > 0 &&
           this.uploadProgress === 100 &&
           !this.isUploading;
  }

  onUploadAndLink(): void {
    // Remove focus from the UPLOAD AND LINK button
    this.removeFocus();

    // Validate that at least one value is selected
    if (this.selectedValues.length === 0) {
      this.valuesRequiredError = true;
      return;
    }

    if (!this.canUploadAndLink() || !this.selectedFile || !this.selectedLink) {
      return;
    }

    const truncatedDocName = this.uploadFormGroup.get('docName')?.value || this.selectedFile.name;

    const metadata: UploadMetadata = {
      docName: truncatedDocName,
      docId: this.uploadFormGroup.get('docId')?.value || '',
      docLinkedTable: this.selectedLink.linkTable,
      docLinkedColumn: this.selectedLink.linkColumn,
      docLinkedDesc: this.selectedLink.linkWith,
      linkedValues: this.selectedValues
    };

    this.isUploading = true;

    this.apiService.uploadDocument(this.selectedFile, metadata)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isUploading = false;
          this.showSuccess(`Document "${truncatedDocName}" uploaded and linked successfully`);
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isUploading = false;
          const errorMessage = error?.error?.message || 'Failed to upload document';
          this.showError(errorMessage);
        }
      });
  }

  onClose(): void {
    // Remove focus from the close button
    this.removeFocus();
    this.dialogRef.close(false);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  /**
   * File type helper methods for styling
   */
  get isPdf(): boolean {
    if (!this.selectedFile) return false;
    return this.selectedFile.name.toLowerCase().endsWith('.pdf');
  }

  get isDoc(): boolean {
    if (!this.selectedFile) return false;
    const name = this.selectedFile.name.toLowerCase();
    return name.endsWith('.doc') || name.endsWith('.docx');
  }

  get isXls(): boolean {
    if (!this.selectedFile) return false;
    const name = this.selectedFile.name.toLowerCase();
    return name.endsWith('.xls') || name.endsWith('.xlsx');
  }

  getFileIcon(): string {
    if (!this.selectedFile) return 'insert_drive_file';

    const name = this.selectedFile.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'picture_as_pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'table_chart';
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image';

    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get the current display filename from form control
   * Updates reactively when user edits the Document Name field
   */
  get displayFileName(): string {
    return this.uploadFormGroup.get('docName')?.value || '';
  }
}
