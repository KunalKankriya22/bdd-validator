import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { NotationCodeApiService } from './services/notation-code-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  NotationCodeTableModel,
  NotationCodeFormValue,
  CreateNotationCodeDto,
  UpdateNotationCodeDto,
  NotationCodeQueryDto,
  NotationCode,
  LookUp,
  NOTATION_TYPE_DISPLAY,
  NOTATION_TYPE_FILTER_OPTIONS,
  NOTATION_TYPE_DESCRIPTION
} from './models/notation-code.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { AddEditNotationCodeComponent } from './add-edit-notation-code/add-edit-notation-code';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

@Component({
  selector: 'app-notation-code-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEditNotationCodeComponent
  ],
  templateUrl: './notation-code-configuration.html',
  styleUrls: ['./notation-code-configuration.scss']
})
export class NotationCodeConfigurationComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: []
  };

  tableConfig: DataTableConfig<NotationCodeTableModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No notation codes found for the selected filters',
    loadingMessage: 'Loading notation codes...',
    showPagination: true
  };

  dataSource: NotationCodeTableModel[] = [];
  currentPageSize = 25;
  currentPageIndex = 0;

  isLoading = false;
  hasError = false;
  errorMessage = '';

  panelOpen = false;
  panelMode: 'add' | 'edit' = 'add';
  panelData: NotationCodeTableModel | null = null;
  panelInstanceKey = 0;

  // Filter bar — initialized in constructor so it's available before ngOnInit
  filterForm: FormGroup;
  notationCodeOptions: LookUp[] = [];
  filteredNotationCodeOptions: LookUp[] = [];
  notationCodeSearchCtrl = new FormControl('');

  notationTypeFilterOptions = NOTATION_TYPE_FILTER_OPTIONS;
  filteredNotationTypeOptions = [...NOTATION_TYPE_FILTER_OPTIONS];
  notationTypeSearchCtrl = new FormControl('');

  notationTypeDescription = '';

  hasSearched = false;

  selectedRow: NotationCodeTableModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private service: NotationCodeApiService,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      notationCode: [null],
      notationType: [null]
    });

    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.initFilterForm();
    this.loadNotationCodeLookup();
    this.subscribeToChapterChanges();
  }

  private initFilterForm(): void {
    this.filterForm.get('notationCode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onFilterChange());

    this.filterForm.get('notationType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.notationTypeDescription = type ? (NOTATION_TYPE_DESCRIPTION[type] ?? '') : '';
        this.onFilterChange();
      });

    this.notationCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredNotationCodeOptions = t
          ? this.notationCodeOptions.filter(o => o.value.toLowerCase().includes(t))
          : [...this.notationCodeOptions];
      });

    this.notationTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredNotationTypeOptions = t
          ? this.notationTypeFilterOptions.filter(o => o.value.toLowerCase().includes(t))
          : [...this.notationTypeFilterOptions];
      });
  }

  private loadNotationCodeLookup(): void {
    this.service.getNotationCodeLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.notationCodeOptions = items.map(item => ({
            key: item.notationCode,
            value: item.notationCode
          }));
          this.filteredNotationCodeOptions = [...this.notationCodeOptions];
        },
        error: () => {
          this.notationCodeOptions = [];
          this.filteredNotationCodeOptions = [];
          this.snackbarService.showError('Failed to load notation code options');
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotationCodeLookup();
        if (this.hasSearched) {
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Notation Code Configuration', link: null }
      ],
      actions: [
        {
          label: 'ADD NEW NOTATION CODE',
          icon: 'add',
          onClick: () => this.openAddPanel(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No notation codes found for the selected filters',
      loadingMessage: 'Loading notation codes...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<NotationCodeTableModel>[] {
    return [
      {
        key: 'notationCodeValue',
        header: 'Notation Code',
        width: '140px'
      },
      {
        key: 'notationType',
        header: 'Notation Type',
        width: '140px',
        valueFormatter: (value) => NOTATION_TYPE_DISPLAY[value] || value
      },
      {
        key: 'testId',
        header: 'Test ID',
        width: '120px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'shortDesc',
        header: 'Notation Header',
        width: '200px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => value || '-'
      }
    ];
  }

  private getRowActions(): RowAction<NotationCodeTableModel>[] {
    return [
      {
        label: 'Edit',
        icon: 'edit',
        action: 'Edit'
      }
    ];
  }

  onFilterChange(): void {
    const notationCode = this.filterForm.get('notationCode')!.value;
    if (!notationCode) {
      this.hasSearched = false;
      this.dataSource = [];
      this.selectedRow = null;
      this.tableConfig.pagination!.totalRecords = 0;
      return;
    }

    this.currentPageIndex = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  loadData(): void {
    const notationCode = this.filterForm.get('notationCode')!.value;
    if (!notationCode) return;

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.hasSearched = true;

    const skip = this.currentPageIndex * this.currentPageSize;
    const take = this.currentPageSize;

    const queryDto: NotationCodeQueryDto = {
      notationCode: notationCode,
      notationType: this.filterForm.get('notationType')!.value || null,
      searchKeyword: null,
      sortColumn: 'NotationCode',
      sortOrder: 'ASC'
    };

    this.service.searchNotationCodes(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = this.transformToTableModel(response.data || []);
          this.tableConfig.pagination!.totalRecords = response.total || 0;
          this.isLoading = false;
          if (this.selectedRow) {
            const stillExists = this.dataSource.find(
              r => r.auditKey === this.selectedRow!.auditKey
            );
            if (!stillExists) this.selectedRow = null;
          }
        },
        error: (error) => {
          this.loggingService.error('Error loading notation codes', error);
          this.hasError = true;
          this.errorMessage = error?.error?.message || 'Failed to load notation codes';
          this.snackbarService.showError(this.errorMessage);
          this.isLoading = false;
        }
      });
  }

  onClearAll(): void {
    this.filterForm.reset({ notationCode: null, notationType: null });
    this.notationTypeDescription = '';
    this.hasSearched = false;
    this.dataSource = [];
    this.selectedRow = null;
    this.tableConfig.pagination!.totalRecords = 0;
  }

  onRowClick(row: NotationCodeTableModel): void {
    this.selectedRow = this.selectedRow?.auditKey === row.auditKey ? null : row;
  }

  closeDescPanel(): void {
    this.selectedRow = null;
  }

  private transformToTableModel(data: NotationCode[]): NotationCodeTableModel[] {
    return data.map(item => ({
      notationCodeValue: item.notationCode,
      notationType: item.notationType,
      testId: item.testId,
      shortDesc: item.shortDesc,
      notationDesc: item.notationDesc,
      effDate: this.formatDate(item.effDate),
      termDate: item.termDate ? this.formatDate(item.termDate) : null,
      auditKey: item.auditKey
    }));
  }

  private formatDate(dateValue: string): string {
    const m = moment.utc(dateValue);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateValue;
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<NotationCodeTableModel>): void {
    if (event.action === 'Edit') {
      this.openEditPanel(event.row);
    }
  }

  openAddPanel(): void {
    if (this.panelOpen) return;
    this.selectedRow = null;
    this.panelMode = 'add';
    this.panelData = null;
    this.panelOpen = true;
  }

  openEditPanel(row: NotationCodeTableModel): void {
    if (this.panelOpen) return;
    this.selectedRow = null;
    this.panelMode = 'edit';
    this.panelData = row;
    this.panelOpen = true;
  }

  onPanelSave(formValue: NotationCodeFormValue): void {
    if (this.panelMode === 'add') {
      this.handleCreate(formValue);
    } else {
      this.handleUpdate(this.panelData!.notationCodeValue, formValue);
    }
  }

  onPanelSaveAndCreateAnother(formValue: NotationCodeFormValue): void {
    this.handleCreate(formValue, true);
  }

  closeSidePanel(): void {
    this.panelOpen = false;
    this.panelData = null;
  }

  private handleCreate(formValue: NotationCodeFormValue, keepOpen = false): void {
    const dto: CreateNotationCodeDto = {
      notationCode: formValue.notationCode || '',
      notationType: formValue.notationType as 'S' | 'R',
      testId: formValue.testId,
      shortDesc: formValue.shortDesc,
      notationDesc: formValue.notationDesc || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) : null
    };

    this.service.createNotationCode(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Notation code created successfully');
          this.loadNotationCodeLookup();
          if (this.hasSearched) {
            this.loadData();
          }

          if (keepOpen) {
            this.panelInstanceKey++;
          } else {
            this.closeSidePanel();
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to create notation code';
          this.loggingService.error('Error creating notation code', error);
          this.snackbarService.showError(errorMsg);
        }
      });
  }

  private handleUpdate(notationCode: string, formValue: NotationCodeFormValue): void {
    const dto: UpdateNotationCodeDto = {
      notationType: formValue.notationType as 'S' | 'R',
      testId: formValue.testId,
      shortDesc: formValue.shortDesc,
      notationDesc: formValue.notationDesc || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) : null
    };

    this.service.updateNotationCode(notationCode, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Notation code updated successfully');
          this.closeSidePanel();
          if (this.hasSearched) {
            this.loadData();
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to update notation code';
          this.loggingService.error('Error updating notation code', error);
          this.snackbarService.showError(errorMsg);
        }
      });
  }

}
