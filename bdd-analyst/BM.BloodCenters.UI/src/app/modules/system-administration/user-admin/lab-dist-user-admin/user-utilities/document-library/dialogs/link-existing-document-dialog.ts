import { Component, OnInit, OnDestroy, Inject, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ValueChipsInputComponent, ValueValidationEvent } from '@shared/components/value-chips-input/value-chips-input';
import { DocumentLibraryApiService } from '../services/document-library-api.service';
import { TableColumnLink, DocumentDisplay } from '../models/document-library.model';

export interface LinkExistingDocumentDialogData {
  documents: DocumentDisplay[];
  selectedDocument?: DocumentDisplay;
}

export interface LinkExistingDocumentResult {
  document: DocumentDisplay;
  linkTable: string;
  linkColumn: string;
  linkWith: string;
  values: string[];
}

/**
 * Link Existing Document Dialog Component
 * Allows user to link an existing document to additional table values
 */
@Component({
  selector: 'app-link-existing-document-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DataTable,
    SearchBar,
    ValueChipsInputComponent
  ],
  templateUrl: './link-existing-document-dialog.html',
  styleUrl: './link-existing-document-dialog.scss'
})
export class LinkExistingDocumentDialogComponent implements OnInit, OnDestroy {
  private apiService = inject(DocumentLibraryApiService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<LinkExistingDocumentDialogComponent>);
  private destroy$ = new Subject<void>();

  @ViewChild('linkTable') linkTable!: DataTable<TableColumnLink>;
  @ViewChild('valueChipsInput') valueChipsInput!: ValueChipsInputComponent;

  availableDocuments: DocumentDisplay[] = [];
  selectedDocument: DocumentDisplay | null = null;

  searchText = '';
  selectedLink: TableColumnLink | null = null;
  availableLinks: TableColumnLink[] = [];
  filteredLinks: TableColumnLink[] = [];
  isLoadingLinks = false;
  selectedValues: string[] = [];
  valuesRequiredError = false;
  isUploading = false;

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

  constructor(@Inject(MAT_DIALOG_DATA) public data: LinkExistingDocumentDialogData) {
    // Get unique documents by sessionId
    const uniqueDocs = new Map<string, DocumentDisplay>();
    data.documents.forEach(doc => {
      if (!uniqueDocs.has(doc.sessionId)) {
        uniqueDocs.set(doc.sessionId, doc);
      }
    });
    this.availableDocuments = Array.from(uniqueDocs.values());

    // Set initial selection if provided
    if (data.selectedDocument) {
      this.selectedDocument = this.availableDocuments.find(
        d => d.sessionId === data.selectedDocument!.sessionId
      ) || null;
    }
  }

  ngOnInit(): void {
    this.loadLinkCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

          // Pre-select the link and populate values if document is already selected
          if (this.selectedDocument) {
            this.preselectLinkForDocument();
            this.populateLinkedValues();

            // Visually select the preselected link in the table
            if (this.selectedLink) {
              setTimeout(() => this.enforceSingleSelection(this.selectedLink!), 0);
            }
          }
        },
        error: () => {
          this.isLoadingLinks = false;
        }
      });
  }

  onDocumentChange(): void {
    // Remove focus from dropdown
    this.removeFocus();

    // Clear and repopulate when document changes
    this.preselectLinkForDocument();
    this.populateLinkedValues();

    // Visually select the preselected link in the table
    if (this.selectedLink) {
      setTimeout(() => this.enforceSingleSelection(this.selectedLink!), 0);
    }
  }

  private preselectLinkForDocument(): void {
    if (!this.selectedDocument) {
      this.selectedLink = null;
      return;
    }

    // Find and select the link matching the document's table/column
    this.selectedLink = this.availableLinks.find(
      link => link.linkTable === this.selectedDocument!.docLinkedTable &&
              link.linkColumn === this.selectedDocument!.docLinkedColumn
    ) || null;
  }

  private populateLinkedValues(): void {
    if (!this.selectedDocument) {
      this.selectedValues = [];
      return;
    }

    // Extract all linked values for the selected document
    const documentValues = this.data.documents
      .filter(doc => doc.sessionId === this.selectedDocument!.sessionId)
      .map(doc => doc.linkedValue)
      .filter(value => value && value.trim() !== '');

    this.selectedValues = [...new Set(documentValues)]; // Remove duplicates
  }

  onSearch(searchTerm: string): void {
    this.filterAndSort(searchTerm);
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
    return !!this.selectedDocument &&
           !!this.selectedLink &&
           this.selectedValues.length > 0 &&
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

    if (!this.canUploadAndLink() || !this.selectedDocument || !this.selectedLink) {
      return;
    }

    this.isUploading = true;

    this.apiService.linkValues(this.selectedDocument.sessionId, this.selectedValues)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isUploading = false;
          this.showSuccess(`Successfully linked ${this.selectedValues.length} value(s) to the document`);
          const result: LinkExistingDocumentResult = {
            document: this.selectedDocument!,
            linkTable: this.selectedLink!.linkTable,
            linkColumn: this.selectedLink!.linkColumn,
            linkWith: this.selectedLink!.linkWith,
            values: this.selectedValues
          };
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isUploading = false;
          const errorMessage = error?.error?.message || 'Failed to link document';
          this.showError(errorMessage);
        }
      });
  }

  onClose(): void {
    // Remove focus from the close button
    this.removeFocus();
    this.dialogRef.close(null);
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
}
