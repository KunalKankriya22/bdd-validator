import { Component, OnInit, OnDestroy, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { HealthHistoryService } from '../services/health-history.service';
import { HHResponseModel, HHResponseSearchParams, DropdownOption } from '../models/health-history.model';
import { AddEditResponse } from './add-edit-response/add-edit-response';
import { ResponseComments } from './response-comments/response-comments';

@Component({
  selector: 'app-hh-responses-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    DataTable,
    AddEditResponse
  ],
  templateUrl: './hh-responses.tab.html',
  styleUrls: ['./hh-responses.tab.scss']
})
export class HHResponsesTab implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hhService = inject(HealthHistoryService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);

  @Input() set active(isActive: boolean) {
    if (isActive) {
      this.loadQuestionCodes();
    }
  }

  // Search form
  searchForm!: FormGroup;
  questionCodes = signal<DropdownOption[]>([]);
  selectedQuestionDescription = '';
  hasRetrieved = false;

  // Question code search
  readonly questionCodeSearchCtrl = new FormControl('');
  private readonly questionCodeSearch = signal('');
  readonly filteredQuestionCodes = computed(() => {
    const search = this.questionCodeSearch();
    const codes = this.questionCodes();
    if (!search) return codes;
    const lower = search.toLowerCase();
    return codes.filter(q =>
      q.code.toLowerCase().includes(lower) ||
      q.description.toLowerCase().includes(lower)
    );
  });

  // Data
  dataSource: HHResponseModel[] = [];
  isLoading = false;
  totalRecords = 0;

  // Side panel
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: HHResponseModel | null = null;

  // Table config
  tableConfig: DataTableConfig<HHResponseModel> = {
    columns: this.getTableColumns(),
    rowActions: this.getRowActions(),
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'response',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter Search criteria to view Results.',
    loadingMessage: 'Loading responses...',
    showPagination: true
  };

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      questionCode: [null],
      searchFor: ['']
    });
    this.questionCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.questionCodeSearch.set(v || ''));
    this.loadQuestionCodes();
    this.subscribeToChapterChanges();
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.reset();
        this.selectedQuestionDescription = '';
        this.hasRetrieved = false;
        this.dataSource = [];
        this.totalRecords = 0;
        this.sidePanelOpen = false;
        this.sidePanelData = null;
        this.tableConfig = {
          ...this.tableConfig,
          pagination: { ...this.tableConfig.pagination!, pageIndex: 0, totalRecords: 0 }
        };
        this.loadQuestionCodes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getTableColumns(): TableColumn<HHResponseModel>[] {
    return [
      {
        key: 'response', header: 'Donor Response', sortable: true, width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value === 'U' ? 'Unanswered' : value
      },
      { key: 'answerCode', header: 'Answer Code', width: '100px' },
      { key: 'answerDescription', header: 'Answer Description', width: '150px', truncate: true, truncateLength: 30 },
      { key: 'groupCode', header: 'Group', width: '80px' },
      { key: 'interdictionCode', header: 'Interdiction', width: '100px' },
      { key: 'deferralPeriod', header: 'Deferral Period', width: '90px' },
      { key: 'periodType', header: 'Period Type', width: '80px' },
      {
        key: 'commentRequired', header: 'Comment Required', width: '110px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'manualAuditFlag', header: 'Manual Audit', width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'additionalDateFlag', header: 'Additional Date', width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'effectiveDate', header: 'Effective Date', width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate', header: 'Termination Date', width: '130px',
        valueFormatter: (value) => value ? this.formatDate(value) : ''
      }
    ];
  }

  private getRowActions(): RowAction<HHResponseModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit response',
        ariaLabel: 'Edit response',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'comment',
        label: 'Comments',
        ariaLabel: 'View comments',
        color: 'default',
        action: 'comments',
        visible: (row: HHResponseModel) => row.commentRequired === 'Y'
      }
    ];
  }

  private loadQuestionCodes(): void {
    this.hhService.searchQuestions({ activeOnly: false, excludeTerminatedToday: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const codes = result.data.map(q => ({
            code: q.questionCode,
            description: q.questionDescription
          })).sort((a, b) => a.code.localeCompare(b.code));
          this.questionCodes.set(codes);
        },
        error: (error) => {
          console.error('[HHResponsesTab] Error loading question codes:', error);
          this.questionCodes.set([]);
        }
      });
  }

  onRetrieve(): void {
    const questionCode = this.searchForm.get('questionCode')?.value;
    if (!questionCode) return;

    const selected = this.questionCodes().find(q => q.code === questionCode);
    this.selectedQuestionDescription = selected?.description || '';
    this.hasRetrieved = true;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadData();
  }

  private loadData(): void {
    const questionCode = this.searchForm.get('questionCode')?.value;
    if (!questionCode) return;

    this.isLoading = true;
    const pageSize = this.tableConfig.pagination!.pageSize;
    const skip = this.tableConfig.pagination!.pageIndex * pageSize;

    const params: HHResponseSearchParams = {
      questionCode
    };
    const searchFor = this.searchForm.get('searchFor')?.value?.trim();
    if (searchFor) {
      params.searchFor = searchFor;
    }

    const sortConfig = this.tableConfig.sortConfig;
    if (sortConfig && sortConfig.direction !== 'default' && sortConfig.column) {
      params.sortBy = sortConfig.column;
      params.sortDir = sortConfig.direction === 'A' ? 'asc' : 'desc';
    }

    this.hhService.searchAnswers(pageSize, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success === false) {
            this.dataSource = [];
            const errResp = response.errorResponse;
            const errorCode = errResp?.errorCode || response.errorCode || response.statusCode || '';
            const errMsg = errResp?.error || response.message || response.error || 'Error loading responses';
            const errorMessage = errorCode ? `Error: ${errorCode} ${errMsg}` : errMsg;
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
            });
            return;
          }
          this.dataSource = response.data || [];
          this.totalRecords = response.total || 0;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total || 0
            }
          };
        },
        error: (error) => {
          this.isLoading = false;
          this.dataSource = [];
          const body = error.error;
          const errResp = body?.errorResponse;
          const errorCode = errResp?.errorCode || body?.errorCode || body?.statusCode || error.status || '';
          const errMsg = errResp?.error || body?.message || body?.error || error.message || 'Error loading responses';
          const errorMessage = errorCode ? `Error: ${errorCode} ${errMsg}` : errMsg;
          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
          });
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize
      }
    };
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<HHResponseModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
      case 'comments':
        this.openComments(event.row);
        break;
    }
  }

  onAddNew(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: HHResponseModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(event: { response: HHResponseModel; keepOpen: boolean; message?: string }): void {
    this.snackBar.open(event.message || 'Response saved successfully', 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });

    if (!event.keepOpen) {
      this.closeSidePanel();
    }
    this.loadData();
  }

  openComments(row: HHResponseModel): void {
    this.dialog.open(ResponseComments, {
      width: '750px',
      height: '100vh',
      maxWidth: '750px',
      position: { top: '0', right: '0' },
      autoFocus: false,
      hasBackdrop: true,
      panelClass: ['comments-drawer-panel'],
      data: {
        questionCode: row.questionCode,
        answerCode: row.answerCode,
        response: row.response
      }
    });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }
}
