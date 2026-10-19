import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { Subject, takeUntil } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DocumentLibraryApiService } from 'src/app/modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/services/document-library-api.service';
import { DocumentDisplay } from 'src/app/modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/models/document-library.model';

export interface ShipDocumentsDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-ship-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    DataTable,
  ],
  templateUrl: './ship-documents.html',
  styleUrl: './ship-documents.scss',
})
export class ShipDocumentsDialog implements OnInit, OnDestroy {
  readonly data = inject<ShipDocumentsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ShipDocumentsDialog>);
  private readonly documentService = inject(DocumentLibraryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  readonly documents = signal<DocumentDisplay[]>([]);
  readonly loading = signal<boolean>(false);
  readonly downloading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedDocuments = signal<DocumentDisplay[]>([]);

  readonly hasDocuments = computed(() => this.documents().length > 0);
  readonly hasSelection = computed(() => this.selectedDocuments().length > 0);
  readonly singleSelection = computed(() => this.selectedDocuments().length === 1);

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
    emptyMessage: 'No documents found for this shipment',
    enableRowHighlight: true,
  };

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocuments(): void {
    if (!this.data?.shipmentNo) {
      this.error.set('Shipment number is required to load documents');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const searchCriteria = {
      docLinkedTable: 'SHIPMENTS',
      docLinkedColumn: 'SHIPMENT_NO',
      docLinkedValue: this.data.shipmentNo,
    };

    this.documentService
      .searchDocuments(searchCriteria, 1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const displayDocs = this.mapToDisplayDocuments(response.documents);
          this.documents.set(displayDocs);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load documents. Please try again.');
          this.loading.set(false);
        },
      });
  }

  private mapToDisplayDocuments(dtos: any[]): DocumentDisplay[] {
    const displayDocs: DocumentDisplay[] = [];

    dtos.forEach((dto) => {
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

  onSelectionChange(selectedRows: DocumentDisplay[]): void {
    this.selectedDocuments.set(selectedRows);
  }

  onDownload(): void {
    if (!this.singleSelection()) {
      this.snackbarService.showError('Please select exactly one document to download');
      return;
    }

    const doc = this.selectedDocuments()[0];
    this.downloading.set(true);

    this.documentService
      .downloadDocument(doc.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.docName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.downloading.set(false);
          this.snackbarService.showSuccess(`Downloaded: ${doc.docName}`);
        },
        error: () => {
          this.downloading.set(false);
          this.snackbarService.showError('Failed to download document');
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
