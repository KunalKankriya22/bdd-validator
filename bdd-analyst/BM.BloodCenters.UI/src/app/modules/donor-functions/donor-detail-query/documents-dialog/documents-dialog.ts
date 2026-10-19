import { Component, inject, OnInit, OnDestroy, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { DocumentLibraryApiService } from 'src/app/modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/services/document-library-api.service';
import { DocumentDisplay } from 'src/app/modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/models/document-library.model';

/**
 * Dialog data for DocumentsDialog
 */
export interface DocumentsDialogData {
  donorId: string;
  donorName?: string;
}

/**
 * Documents Dialog Component
 * MLT-10898: Dialog for viewing and downloading donor documents
 *
 * Displays documents linked to a specific donor from the document library.
 * Allows downloading documents.
 */
@Component({
  selector: 'app-documents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DataTable,
  ],
  templateUrl: './documents-dialog.html',
  styleUrl: './documents-dialog.scss',
})
export class DocumentsDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<DocumentsDialog>);
  private readonly documentService = inject(DocumentLibraryApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  readonly documents = signal<DocumentDisplay[]>([]);
  readonly loading = signal<boolean>(false);
  readonly downloading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedDocuments = signal<DocumentDisplay[]>([]);

  // Computed values
  readonly hasDocuments = computed(() => this.documents().length > 0);
  readonly hasSelection = computed(() => this.selectedDocuments().length > 0);
  readonly singleSelection = computed(() => this.selectedDocuments().length === 1);

  // Table configuration
  tableConfig: DataTableConfig<DocumentDisplay> = {
    columns: [
      { key: 'docName', header: 'Document Name', sortable: false },
      { key: 'docLinkedDesc', header: 'Description', sortable: false },
      { key: 'docId', header: 'Document ID', sortable: false },
      { key: 'linkedValue', header: 'Linked Value', sortable: false },
    ],
    stickyHeader: true,
    enableSelection: true,
    showTableOnEmpty: false,
    emptyMessage: 'No documents found for this donor',
    enableRowHighlight: true,
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: DocumentsDialogData) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load documents linked to the donor
   */
  loadDocuments(): void {
    if (!this.data?.donorId) {
      this.error.set('Donor ID is required to load documents');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Search for documents linked to this donor
    // Documents are linked via DONORS table, DONOR_ID column
    const searchCriteria = {
      docLinkedTable: 'DONORS',
      docLinkedColumn: 'DONOR_ID',
      docLinkedValue: this.data.donorId,
    };

    this.documentService
      .searchDocuments(searchCriteria, 1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map DTOs to display format
          const displayDocs = this.mapToDisplayDocuments(response.documents);
          this.documents.set(displayDocs);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load documents:', err);
          this.error.set('Failed to load documents. Please try again.');
          this.loading.set(false);
          this.showError('Failed to load documents');
        },
      });
  }

  /**
   * Map DTOs to DocumentDisplay format
   * Each document can have multiple linked values, so we expand them into separate rows
   */
  private mapToDisplayDocuments(dtos: any[]): DocumentDisplay[] {
    const displayDocs: DocumentDisplay[] = [];

    dtos.forEach((dto) => {
      // If document has linked values, create a row for each value
      if (dto.linkedValues && dto.linkedValues.length > 0) {
        dto.linkedValues.forEach((value: string) => {
          displayDocs.push({
            sessionId: dto.sessionId,
            docName: dto.docName,
            docLinkedDesc: dto.docLinkedDesc,
            docId: dto.docId,
            docLinkedTable: dto.docLinkedTable,
            docLinkedColumn: dto.docLinkedColumn,
            linkedValue: value,
          });
        });
      } else {
        // No linked values, create a single row
        displayDocs.push({
          sessionId: dto.sessionId,
          docName: dto.docName,
          docLinkedDesc: dto.docLinkedDesc,
          docId: dto.docId,
          docLinkedTable: dto.docLinkedTable,
          docLinkedColumn: dto.docLinkedColumn,
          linkedValue: '',
        });
      }
    });

    return displayDocs;
  }

  /**
   * Handle row selection changes
   */
  onSelectionChange(selectedRows: DocumentDisplay[]): void {
    this.selectedDocuments.set(selectedRows);
  }

  /**
   * Download the selected document
   */
  onDownload(): void {
    if (!this.singleSelection()) {
      this.showError('Please select exactly one document to download');
      return;
    }

    const doc = this.selectedDocuments()[0];
    this.downloading.set(true);

    const startTime = Date.now();

    this.documentService
      .downloadDocument(doc.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          // Create a blob URL and trigger download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.docName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Ensure loader is shown for at least 500ms for better UX
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 500 - elapsedTime);

          setTimeout(() => {
            this.downloading.set(false);
            this.showSuccess(`Downloaded: ${doc.docName}`);
          }, remainingTime);
        },
        error: (err) => {
          console.error('Download failed:', err);
          this.downloading.set(false);
          this.showError('Failed to download document');
        },
      });
  }

  /**
   * Close the dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
