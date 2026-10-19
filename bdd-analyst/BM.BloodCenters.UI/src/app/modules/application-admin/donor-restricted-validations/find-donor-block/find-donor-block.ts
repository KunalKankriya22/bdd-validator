import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Router } from '@angular/router';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FindDonorBlockService } from './services/find-donor-block.service';
import { AddEditProgramRuleComponent } from './components/add-edit-program-rule/add-edit-program-rule';
import {
  FindDonorBlockModel
} from './models/find-donor-block.model';

@Component({
  selector: 'app-find-donor-block',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    AddEditProgramRuleComponent
  ],
  templateUrl: './find-donor-block.html',
  styleUrls: ['./find-donor-block.scss']
})
export class FindDonorBlockComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard') tableCard!: ElementRef;

  // Configuration
  headerConfig!: PageHeaderConfig;
  searchConfig!: SearchBarConfig;

  // Pagination (currently not active - no mat-paginator in template)
  // This infrastructure exists for potential future implementation
  pagination = {
    pageIndex: 0,
    pageSize: 25,
    totalRecords: 0,
    pageSizeOptions: [10, 25, 50, 100]
  };

  // Data
  dataSource: FindDonorBlockModel[] = [];
  expandedRows: Set<number> = new Set();
  allRowsExpanded = false;

  // State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  currentChapterId = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  // Side Panel
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: FindDonorBlockModel | null = null;

  // Request State
  private requestState = {
    skip: 0,
    take: 10,
    sortColumn: 'programName',
    sortDirection: 'A',
    searchKeyword: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private findDonorBlockService: FindDonorBlockService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private router: Router
  ) {
    this.initializeConfigurations();

    // Reactively get chapterId from HeaderService
    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      const menuItem = this.pageHeaderService.getCurrentMenuItem();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title,
          subtitle: menuItem?.remarks || '',
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ]
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    const pageData = this.pageHeaderService.pageHeaderData();
    this.headerConfig = {
      title: pageData?.title || '',
      subtitle: pageData?.subtitle || '',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || '', link: null }
      ],
      actions: [
        {
          label: 'ADD NEW PROGRAM RULE',
          icon: 'add',
          onClick: () => this.openAddPanel()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Program Name',
      minLength: 2,
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };
  }

  loadData(showLoading: boolean = true): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.hasError = false;

    this.findDonorBlockService
      .getProgramRules(this.requestState.searchKeyword || undefined)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.dataSource = response;

          // Client-side fallback filter if server doesn't support search parameter
          if (this.requestState.searchKeyword) {
            this.dataSource = this.dataSource.filter(item =>
              item.programName.toLowerCase().includes(this.requestState.searchKeyword.toLowerCase())
            );
          }

          this.pagination.totalRecords = this.dataSource.length;
        },
        error: (error) => {
          this.hasError = true;
          this.errorMessage = error.error?.message || 'Failed to load program rules data';
        }
      });
  }

  onSearch(keyword: string): void {
    this.requestState.searchKeyword = keyword;
    this.requestState.skip = 0;
    this.pagination.pageIndex = 0;
    this.loadData();
  }

  toggleRow(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  toggleAllRows(): void {
    this.allRowsExpanded = !this.allRowsExpanded;
    if (this.allRowsExpanded) {
      this.dataSource.forEach((_, index) => this.expandedRows.add(index));
    } else {
      this.expandedRows.clear();
    }
  }

  openAddPanel(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: FindDonorBlockModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  viewFieldConfiguration(record: FindDonorBlockModel): void {
    this.router.navigate([
      '/application-administration/donor-restricted-validations/find-donor-block/field-configuration',
      record.programName
    ]);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.closeSidePanel();
    // Add small delay to ensure backend has processed the update
    setTimeout(() => {
      this.loadData(false);
    }, 300);
  }

  formatBoolean(value: boolean): string {
    return value ? 'Yes' : 'No';
  }

  formatBooleanOrOptional(value: boolean | string): string {
    if (typeof value === 'string') {
      return value; // Could be 'Optional'
    }
    return value ? 'Yes' : 'No';
  }

  formatFlag(value: string | boolean | undefined): string {
    if (value === undefined || value === null || value === '') {
      return 'No';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string') {
      const trimmed = value.trim().toUpperCase();
      return (trimmed === 'Y' || trimmed === 'YES' || trimmed === 'TRUE' || trimmed === '1') ? 'Yes' : 'No';
    }
    return 'No';
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
      this.loadData(false);
    } else {
      this.dataSource = [...this.dataSource].sort((a, b) => {
        const comparison = a.programName.localeCompare(b.programName);
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
