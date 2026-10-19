import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { TableColumnLink } from '../models/document-library.model';
import { DocumentLibraryApiService } from '../services/document-library-api.service';

/**
 * Dialog data interface
 */
export interface LinkDocumentsDialogData {
  currentLink?: TableColumnLink;
}

/**
 * Link Documents Dialog Component
 * Allows user to select a table/column combination to link the document
 */
@Component({
  selector: 'app-link-documents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
    SearchBar
  ],
  templateUrl: './link-documents-dialog.html',
  styleUrls: ['./link-documents-dialog.scss']
})
export class LinkDocumentsDialogComponent implements OnInit, OnDestroy {
  private apiService = inject(DocumentLibraryApiService);
  public dialogRef = inject(MatDialogRef<LinkDocumentsDialogComponent>);
  private destroy$ = new Subject<void>();

  searchText = '';
  selectedLink: TableColumnLink | null = null;
  availableLinks: TableColumnLink[] = [];
  filteredLinks: TableColumnLink[] = [];
  isLoading = false;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search link type, table, or ID...',
    minLength: 0,
    ariaLabel: 'Search table column links',
    debounceTime: 0,
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<TableColumnLink> = {
    columns: [
      { key: 'linkWith', header: 'Link With', sortable: false },
      { key: 'linkTable', header: 'Link Table', sortable: false },
      { key: 'linkColumn', header: 'Link Columns', sortable: false }
    ],
    stickyHeader: true,
    enableRowHighlight: true,
    emptyMessage: 'No link categories found',
    showTableOnEmpty: false
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: LinkDocumentsDialogData) {}

  ngOnInit(): void {
    this.loadLinkCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLinkCategories(): void {
    this.isLoading = true;
    this.apiService.getLinkCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (links) => {
          this.availableLinks = links;
          this.filteredLinks = [...links];
          this.isLoading = false;

          // Set current link as selected if provided
          if (this.data?.currentLink) {
            this.selectedLink = this.availableLinks.find(
              link => link.linkTable === this.data.currentLink?.linkTable &&
                      link.linkColumn === this.data.currentLink?.linkColumn
            ) || null;
          }
        }
      });
  }

  onSearch(searchTerm: string): void {
    this.filterLinks(searchTerm);
  }

  filterLinks(searchTerm: string): void {
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
    this.selectedLink = link;
  }

  onLink(): void {
    if (this.selectedLink) {
      this.dialogRef.close(this.selectedLink);
    }
  }

  onClose(): void {
    this.dialogRef.close(null);
  }
}
