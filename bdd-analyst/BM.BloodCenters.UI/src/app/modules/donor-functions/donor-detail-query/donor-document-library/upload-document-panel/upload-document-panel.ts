import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { FileUploadZoneComponent, FileUploadEvent } from '@shared/components/file-upload-zone/file-upload-zone';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ValueChipsInputComponent } from '@shared/components/value-chips-input/value-chips-input';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DonorDocumentLibraryService } from '../services/donor-document-library.service';
import { UploadDocumentData } from '../models/donor-document-library.model';

interface LinkCategory {
  code: string;
  linkWith: string;
  linkTable: string;
  linkColumn: string;
}

function noSpacesValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value && /\s/.test(control.value)) {
    return { noSpaces: true };
  }
  return null;
}

@Component({
  selector: 'app-upload-document-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FileUploadZoneComponent,
    DataTable,
    ValueChipsInputComponent,
    SearchBar,
  ],
  templateUrl: './upload-document-panel.html',
  styleUrl: './upload-document-panel.scss',
})
export class UploadDocumentPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(DonorDocumentLibraryService);
  private readonly dialogRef = inject(MatDialogRef<UploadDocumentPanelComponent>);
  private readonly destroy$ = new Subject<void>();

  // Step tracking: 1 = Upload, 2 = Link
  readonly currentStep = signal<1 | 2>(1);

  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  // Link step state
  readonly linkCategories = signal<LinkCategory[]>([]);
  readonly filteredLinkCategories = signal<LinkCategory[]>([]);
  readonly selectedLink = signal<LinkCategory | null>(null);
  readonly linkedValues = signal<string[]>([]);
  readonly loadingCategories = signal(false);
  readonly validatingValue = signal(false);

  get isStep1Complete(): boolean {
    return this.uploadForm.valid && this.selectedFile() !== null;
  }

  get canUpload(): boolean {
    return (
      this.selectedFile() !== null &&
      this.uploadForm.valid &&
      this.selectedLink() !== null &&
      this.linkedValues().length > 0 &&
      !this.uploading()
    );
  }

  uploadForm: FormGroup = this.fb.group({
    docType: [{ value: '', disabled: true }],
    docName: ['', [Validators.required, Validators.maxLength(50)]],
    docId: [
      '',
      [Validators.required, Validators.maxLength(30), noSpacesValidator],
    ],
  });

  linkTableConfig: DataTableConfig<LinkCategory> = {
    columns: [
      { key: 'linkWith', header: 'Link With', sortable: true },
      { key: 'linkTable', header: 'Link Table', sortable: true },
      { key: 'linkColumn', header: 'Link Column', sortable: true },
    ],
    stickyHeader: true,
    enableSelection: true,
    showTableOnEmpty: false,
    emptyMessage: 'No link categories available',
    enableRowHighlight: true,
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: UploadDocumentData) {}

  ngOnInit(): void {
    this.loadLinkCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLinkCategories(): void {
    this.loadingCategories.set(true);
    this.apiService
      .getLinkCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.linkCategories.set(categories);
          this.filteredLinkCategories.set(categories);
          this.loadingCategories.set(false);

          // Auto-select DONORS link if available
          const donorLink = categories.find(
            (c: LinkCategory) =>
              c.linkTable === 'DONORS' && c.linkColumn === 'DONOR_ID',
          );
          if (donorLink) {
            this.selectedLink.set(donorLink);
            this.linkedValues.set([this.data.donorId]);
          }
        },
        error: () => {
          this.loadingCategories.set(false);
        },
      });
  }

  // -- Step 1: Upload --

  onFileSelected(event: FileUploadEvent): void {
    if (event.isValid && event.file) {
      this.selectedFile.set(event.file);
      const ext = event.file.name.split('.').pop()?.toUpperCase() || '';
      this.uploadForm.patchValue({ docType: ext });
      this.uploadError.set(null);
    } else {
      this.selectedFile.set(null);
      this.uploadForm.patchValue({ docType: '' });
      if (event.error) {
        this.uploadError.set(event.error);
      }
    }
  }

  onFileRemoved(): void {
    this.selectedFile.set(null);
    this.uploadForm.patchValue({ docType: '' });
    this.uploadError.set(null);
  }

  onNextStep(): void {
    if (this.isStep1Complete) {
      this.currentStep.set(2);
    }
  }

  onBackToStep1(): void {
    this.currentStep.set(1);
  }

  // -- Step 2: Link --

  onLinkSearchChange(searchText: string): void {
    if (!searchText) {
      this.filteredLinkCategories.set(this.linkCategories());
      return;
    }
    const lower = searchText.toLowerCase();
    this.filteredLinkCategories.set(
      this.linkCategories().filter(
        (c) =>
          c.linkWith.toLowerCase().includes(lower) ||
          c.linkTable.toLowerCase().includes(lower) ||
          c.linkColumn.toLowerCase().includes(lower),
      ),
    );
  }

  onLinkSelectionChange(selected: LinkCategory[]): void {
    if (selected.length > 0) {
      const newLink = selected[selected.length - 1];
      if (
        this.selectedLink() &&
        this.selectedLink()!.linkTable !== newLink.linkTable
      ) {
        this.linkedValues.set([]);
      }
      this.selectedLink.set(newLink);
    } else {
      this.selectedLink.set(null);
    }
  }

  onLinkedValuesChange(values: string[]): void {
    this.linkedValues.set(values);
  }

  onValidateValue(event: { value: string; callback: (isValid: boolean, errorMessage?: string) => void }): void {
    const link = this.selectedLink();
    if (!link) {
      event.callback(false, 'Please select a link table first');
      return;
    }

    if (!link.linkColumn) {
      event.callback(false, 'Error 9608: Column is not configured for this link table');
      return;
    }

    if (!event.value || !event.value.trim()) {
      event.callback(false, 'Error 9603: Value is required');
      return;
    }

    this.validatingValue.set(true);
    this.apiService
      .validateValue(link.linkTable, link.linkColumn, event.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isValid) => {
          this.validatingValue.set(false);
          if (isValid) {
            event.callback(true);
          } else {
            event.callback(
              false,
              `Error 9602: "${event.value}" is not a valid value in ${link.linkTable}.${link.linkColumn}`,
            );
          }
        },
        error: (err) => {
          this.validatingValue.set(false);
          const errorCode =
            err?.error?.errorResponse?.errorCode ||
            err?.error?.errorCode ||
            '';
          const errorMsg =
            err?.error?.errorResponse?.error ||
            err?.error?.message ||
            'Validation failed';
          event.callback(
            false,
            errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg,
          );
        },
      });
  }

  // -- Submit --

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onUploadAndLink(): void {
    if (!this.canUpload) return;

    const file = this.selectedFile()!;
    const formValues = this.uploadForm.getRawValue();
    const link = this.selectedLink()!;

    const metadata = {
      docName: formValues.docName,
      docId: formValues.docId,
      docLinkedTable: link.linkTable,
      docLinkedColumn: link.linkColumn,
      docLinkedDesc: link.linkWith,
      linkedValues: this.linkedValues(),
    };

    this.uploading.set(true);
    this.uploadError.set(null);

    this.apiService
      .uploadDocument(file, metadata)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Upload failed:', err);
          this.uploading.set(false);
          this.uploadError.set('Failed to upload document. Please try again.');
        },
      });
  }

  // -- Helpers --

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'image';
      default:
        return 'insert_drive_file';
    }
  }

  getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return 'file-icon--pdf';
      case 'doc':
      case 'docx':
        return 'file-icon--doc';
      case 'xls':
      case 'xlsx':
        return 'file-icon--xls';
      default:
        return 'file-icon--default';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
